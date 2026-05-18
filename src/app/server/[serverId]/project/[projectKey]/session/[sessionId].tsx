import { useMemo, useState } from "react";
import { GlassView } from "expo-glass-effect";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Host, Menu, Button } from "@expo/ui/swift-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message, Provider, SessionStatus } from "@opencode-ai/sdk/v2/client";
import { MessageBubble } from "@/components/message-part-view";
import { HeaderAction } from "@/components/header-action";
import { NativeButton, NativeTextField } from "@/components/native-control";
import { AppText, EmptyState, LoadingState, useTheme } from "@/components/surface";
import { createAscendingId } from "@/lib/ids";
import { createOpencodeSdk } from "@/lib/opencode-client";
import {
  chooseDefaultAgent,
  chooseDefaultModel,
  errorMessage,
  sessionTitle,
  sessionWorking,
  type MessageWithParts,
} from "@/lib/opencode-format";
import { opencodeKeys, upsertMessage } from "@/lib/opencode-queries";
import { decodeRouteValue } from "@/lib/route-params";
import { useServers } from "@/store/servers";

  export default function SessionThreadScreen() {
    const theme = useTheme();
    const router = useRouter();
    const queryClient = useQueryClient();
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
  const [showThinking, setShowThinking] = useState(false);
  const [showToolCalls, setShowToolCalls] = useState(false);

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
    () =>
      (messages.data ?? [])
        .slice()
        .sort((a, b) => a.info.time.created - b.info.time.created || (a.info.id < b.info.id ? -1 : a.info.id > b.info.id ? 1 : 0)),
    [messages.data],
  );
  const latestFirstMessages = useMemo(() => sortedMessages.slice().reverse(), [sortedMessages]);
  const sessionStatus = status.data?.[sessionId];
  const working = sessionWorking(sessionStatus);
  const providersList = providers.data?.providers as Provider[] | undefined;

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
  const headerFloat = (
    <View style={{ position: "absolute", top: 60, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", zIndex: 100 }}>
      {/* Top Left: Sidebar / Back Toggle */}
      <GlassView glassEffectStyle="regular" style={{ borderRadius: 24, overflow: "hidden" }}>
        <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
          <NativeButton
            title=""
            icon="chevronLeft"
            variant="plain"
            onPress={() => router.back()}
          />
        </View>
      </GlassView>

      {/* Top Right: New & Actions */}
      <GlassView glassEffectStyle="regular" style={{ borderRadius: 24, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 12 }}>
          <NativeButton
            title=""
            icon="add"
            variant="plain"
            onPress={() => router.replace("/")}
          />
          <Host matchContents>
            <Menu
              label=" "
              systemImage="ellipsis"
            >
              <Button
                label={session.data?.share?.url ? "Unshare" : "Share"}
                systemImage={session.data?.share?.url ? "xmark" : "square.and.arrow.up"}
                onPress={() => share.mutate()}
              />
              <Button
                label={showThinking ? "Hide thinking" : "Show thinking"}
                systemImage={showThinking ? "eye.slash" : "eye"}
                onPress={() => setShowThinking(!showThinking)}
              />
              <Button
                label={showToolCalls ? "Hide tool details" : "Show tool details"}
                systemImage={showToolCalls ? "hammer" : "hammer.fill"}
                onPress={() => setShowToolCalls(!showToolCalls)}
              />
              <Button
                label="Delete"
                systemImage="trash"
                role="destructive"
                onPress={() => Alert.alert("Not implemented")}
              />
            </Menu>
          </Host>
        </View>
      </GlassView>
    </View>
  );

  return (
    <>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ flex: 1 }}>
          <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <FlatList
          data={latestFirstMessages}
          inverted
          keyExtractor={(item) => item.info.id}
          renderItem={({ item }) => <MessageBubble message={item.info} parts={item.parts} providers={providersList} showThinking={showThinking} showToolCalls={showToolCalls} />}
          style={{ flex: 1 }}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 150, paddingTop: 180 }}
          ListHeaderComponent={working ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 4 }}>
              <ActivityIndicator color={theme.accent} />
              <AppText color={theme.muted}>opencode is thinking or running tools</AppText>
            </View>
          ) : null}
          ListEmptyComponent={
            messages.isPending ? (
              <LoadingState title="Loading thread" />
            ) : messages.error ? (
              <EmptyState title="Could not load messages" detail={messages.error instanceof Error ? messages.error.message : "Request failed"} />
            ) : (
              <EmptyState title="Empty thread" detail="Send a prompt to start this session." />
            )
          }
        />
        {headerFloat}
        <View style={{ position: "absolute", bottom: 40, left: 16, right: 16, zIndex: 100 }}>
          <GlassView
            style={{
              borderRadius: 28,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: `${theme.border}44`,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
            }}
            glassEffectStyle="regular"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
                gap: 8,
              }}
            >
              <NativeTextField
                key={composerKey}
                multiline
                variant="plain"
                placeholder="Message opencode"
                accessibilityLabel="Message opencode"
                testID="message-composer"
                kind="message"
                onValueChange={setPrompt}
                style={{ flex: 1 }}
              />
              {working ? (
                <NativeButton title="" icon="stop" variant="plain" disabled={abort.isPending} onPress={() => abort.mutate()} />
              ) : (
                <NativeButton
                  title=""
                  icon="send"
                  variant="plain"
                  testID="send-message"
                  disabled={send.isPending || (!prompt.trim() && !working)}
                  onPress={() => {
                    if (!prompt.trim() && working) abort.mutate();
                    else send.mutate(prompt);
                  }}
                />
              )}
            </View>
          </GlassView>
        </View>
        </View>
      </KeyboardAvoidingView>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <HeaderAction
              title={session.data?.share?.url ? "Unshare" : "Share"}
              icon={session.data?.share?.url ? "unshare" : "share"}
              disabled={share.isPending || !session.data}
              onPress={() => share.mutate()}
              testID={session.data?.share?.url ? "unshare-session-header-button" : "share-session-header-button"}
            />
          ),
        }}
      />
    </>
  );
}
