import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message, Provider, SessionStatus } from "@opencode-ai/sdk/v2/client";
import { MessageBubble } from "@/components/message-part-view";
import { NativeButton, NativeTextField } from "@/components/native-control";
import { AppText, Card, EmptyState, LoadingState, Pill, useTheme } from "@/components/surface";
import { createAscendingId } from "@/lib/ids";
import { createOpencodeSdk } from "@/lib/opencode-client";
import {
  chooseDefaultAgent,
  chooseDefaultModel,
  errorMessage,
  filename,
  formatRelativeTime,
  sessionTitle,
  sessionWorking,
  type MessageWithParts,
} from "@/lib/opencode-format";
import { opencodeKeys, upsertMessage } from "@/lib/opencode-queries";
import { decodeRouteValue } from "@/lib/route-params";
import { useServers } from "@/store/servers";

export default function SessionThreadScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const { serverId, projectKey, sessionId } = useLocalSearchParams<{
    serverId: string;
    projectKey: string;
    sessionId: string;
  }>();
  const directory = decodeRouteValue(projectKey);
  const { getServer } = useServers();
  const server = getServer(serverId);
  const client = server ? createOpencodeSdk(server, { directory }) : undefined;
  const [prompt, setPrompt] = useState("");
  const [composerKey, setComposerKey] = useState(0);

  const session = useQuery({
    queryKey: opencodeKeys.session(serverId, directory, sessionId),
    enabled: !!client && !!sessionId,
    queryFn: () => client!.session.get({ sessionID: sessionId }).then((result) => result.data!),
  });
  const messages = useQuery({
    queryKey: opencodeKeys.messages(serverId, directory, sessionId),
    enabled: !!client && !!sessionId,
    queryFn: () => client!.session.messages({ sessionID: sessionId, limit: 160 }).then((result) => (result.data ?? []) as MessageWithParts[]),
  });
  const status = useQuery({
    queryKey: opencodeKeys.status(serverId, directory),
    enabled: !!client && !!directory,
    queryFn: () => client!.session.status().then((result) => result.data ?? ({} as Record<string, SessionStatus>)),
    refetchInterval: 4_000,
  });
  const providers = useQuery({
    queryKey: opencodeKeys.providers(serverId, directory),
    enabled: !!client && !!directory,
    queryFn: () => client!.config.providers().then((result) => result.data),
  });
  const agents = useQuery({
    queryKey: opencodeKeys.agents(serverId, directory),
    enabled: !!client && !!directory,
    queryFn: () => client!.app.agents().then((result) => result.data ?? []),
  });

  const sortedMessages = useMemo(
    () => (messages.data ?? []).slice().sort((a, b) => (a.info.id < b.info.id ? -1 : a.info.id > b.info.id ? 1 : 0)),
    [messages.data],
  );
  const sessionStatus = status.data?.[sessionId];
  const working = sessionWorking(sessionStatus);
  const providersList = providers.data?.providers as Provider[] | undefined;
  const contentVersion = sortedMessages
    .flatMap((item) => [item.info.id, String(item.info.time.created), ...item.parts.map((part) => `${part.id}:${part.type}:${"text" in part ? part.text.length : ""}`)])
    .join("|");

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [contentVersion, working]);

  const share = useMutation({
    mutationFn: async () => {
      const current = session.data;
      if (current?.share?.url) return client!.session.unshare({ sessionID: sessionId }).then((result) => result.data!);
      return client!.session.share({ sessionID: sessionId }).then((result) => result.data!);
    },
    onSuccess: (next) => queryClient.setQueryData(opencodeKeys.session(serverId, directory, sessionId), next),
    onError: (error) => Alert.alert("Share failed", errorMessage(error)),
  });

  const abort = useMutation({
    mutationFn: () => client!.session.abort({ sessionID: sessionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: opencodeKeys.status(serverId, directory) }),
    onError: (error) => Alert.alert("Abort failed", errorMessage(error)),
  });

  const send = useMutation({
    mutationFn: async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const currentAgent = session.data?.agent || chooseDefaultAgent(agents.data)?.name;
      const sessionModel = session.data?.model
        ? { providerID: session.data.model.providerID, modelID: session.data.model.id }
        : undefined;
      const currentModel = sessionModel ?? chooseDefaultModel(providers.data);
      const messageID = createAscendingId("message");
      const partID = createAscendingId("part");
      const optimistic: Message = {
        id: messageID,
        sessionID: sessionId,
        role: "user",
        time: { created: Date.now() },
        agent: currentAgent ?? "agent",
        model: currentModel ?? { providerID: "", modelID: "" },
      };

      queryClient.setQueryData<MessageWithParts[]>(opencodeKeys.messages(serverId, directory, sessionId), (current) =>
        upsertMessage(current, {
          info: optimistic,
          parts: [{ id: partID, sessionID: sessionId, messageID, type: "text", text: trimmed }],
        }),
      );

      await client!.session.promptAsync({
        sessionID: sessionId,
        messageID,
        agent: currentAgent,
        model: currentModel,
        parts: [{ id: partID, type: "text", text: trimmed }],
      });
    },
    onMutate: () => {
      setPrompt("");
      setComposerKey((key) => key + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opencodeKeys.sessions(serverId, directory) });
      queryClient.invalidateQueries({ queryKey: opencodeKeys.status(serverId, directory) });
    },
    onError: (error) => Alert.alert("Prompt failed", errorMessage(error)),
  });

  if (!server || !directory || !client) return <LoadingState title="Opening thread" />;

  const title = sessionTitle(session.data);

  return (
    <>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 20 }}
        >
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="headline">{title}</AppText>
                <AppText variant="caption" color={theme.muted} selectable>
                  {filename(directory)} / {sessionId}
                </AppText>
              </View>
              {working ? <Pill tone="warning">Working</Pill> : <Pill>Idle</Pill>}
            </View>
            {session.data ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <Pill>{`Updated ${formatRelativeTime(session.data.time.updated)}`}</Pill>
                {session.data.agent ? <Pill tone="accent">{session.data.agent}</Pill> : null}
                {session.data.share?.url ? <Pill tone="success">Shared</Pill> : null}
              </View>
            ) : null}
          </Card>

          {messages.isPending ? (
            <LoadingState title="Loading thread" />
          ) : messages.error ? (
            <EmptyState title="Could not load messages" detail={messages.error instanceof Error ? messages.error.message : "Request failed"} />
          ) : sortedMessages.length ? (
            <View style={{ gap: 14 }}>
              {sortedMessages.map((item) => (
                <MessageBubble key={item.info.id} message={item.info} parts={item.parts} providers={providersList} />
              ))}
            </View>
          ) : (
            <EmptyState title="Empty thread" detail="Send a prompt to start this session." />
          )}

          {working ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 4 }}>
              <ActivityIndicator color={theme.accent} />
              <AppText color={theme.muted}>opencode is thinking or running tools</AppText>
            </View>
          ) : null}
        </ScrollView>

        <View
          style={{
            borderTopWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: 18,
            gap: 10,
          }}
        >
          <NativeTextField
            key={composerKey}
            multiline
            placeholder="Message opencode"
            kind="message"
            onValueChange={setPrompt}
            style={{ alignSelf: "stretch", minHeight: 72 }}
          />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <AppText variant="caption" color={theme.muted}>
              {chooseDefaultAgent(agents.data)?.name ?? session.data?.agent ?? "Default agent"}
            </AppText>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {working ? <NativeButton title="Stop" icon="stop" variant="destructive" disabled={abort.isPending} onPress={() => abort.mutate()} /> : null}
              <NativeButton
                title={send.isPending ? "Sending" : "Send"}
                icon="send"
                variant="primary"
                disabled={send.isPending || (!prompt.trim() && !working)}
                onPress={() => {
                  if (!prompt.trim() && working) abort.mutate();
                  else send.mutate(prompt);
                }}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <NativeButton
              title={session.data?.share?.url ? "Unshare" : "Share"}
              icon={session.data?.share?.url ? "unshare" : "share"}
              variant="plain"
              disabled={share.isPending || !session.data}
              onPress={() => share.mutate()}
            />
          ),
        }}
      />
    </>
  );
}
