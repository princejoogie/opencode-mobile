import { useMemo, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { router, Stack } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { NativeButton, NativeTextField } from "@/components/native-control";
import { AppText, Card, EmptyState, LoadingState, Pill, Row, SectionHeader, useTheme } from "@/components/surface";
import { createOpencodeSdk, serverName } from "@/lib/opencode-client";
import { opencodeKeys } from "@/lib/opencode-queries";
import { useServers, type ServerConnection } from "@/store/servers";

function ServerHealth({ server }: { server: ServerConnection }) {
  const theme = useTheme();
  const health = useQuery({
    queryKey: opencodeKeys.health(server.id),
    queryFn: () => createOpencodeSdk(server).global.health().then((result) => result.data),
    refetchInterval: 10_000,
  });

  if (health.isPending) return <Pill>Checking</Pill>;
  if (health.error || !health.data?.healthy) return <Pill tone="danger">Offline</Pill>;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Pill tone="success">Online</Pill>
      <AppText variant="caption" color={theme.muted}>
        {health.data.version}
      </AppText>
    </View>
  );
}

function ServerRow({ server, onRemove }: { server: ServerConnection; onRemove: () => void }) {
  const theme = useTheme();

  return (
    <Row onPress={() => router.push({ pathname: "/server/[serverId]", params: { serverId: server.id } })}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="headline">{serverName(server)}</AppText>
          <AppText variant="caption" color={theme.muted} selectable>
            {server.url}
          </AppText>
        </View>
        <ServerHealth server={server} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <AppText variant="caption" color={theme.subtle}>
          {server.password ? "Basic auth configured" : "No auth"}
        </AppText>
        <NativeButton title="Remove" icon="remove" variant="destructive" onPress={onRemove} />
      </View>
    </Row>
  );
}

export default function ServersScreen() {
  const theme = useTheme();
  const { ready, servers, addServer, removeServer } = useServers();
  const [url, setUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formKey, setFormKey] = useState(0);

  const sortedServers = useMemo(
    () => servers.slice().sort((a, b) => b.updatedAt - a.updatedAt),
    [servers],
  );

  const connect = useMutation({
    mutationFn: async () => {
      const candidate = await addServer({ url, displayName, username, password });
      await createOpencodeSdk(candidate).global.health();
      return candidate;
    },
    onSuccess: (server) => {
      setUrl("");
      setDisplayName("");
      setUsername("");
      setPassword("");
      setFormKey((key) => key + 1);
      router.push({ pathname: "/server/[serverId]", params: { serverId: server.id } });
    },
    onError: (error) => {
      Alert.alert("Could not connect", error instanceof Error ? error.message : "The opencode server did not respond.");
    },
  });

  if (!ready) {
    return <LoadingState title="Loading servers" />;
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }}
      >
        <Card>
          <View style={{ gap: 4 }}>
            <AppText variant="headline">Connect to opencode</AppText>
            <AppText color={theme.muted}>Add a running opencode server. The SDK talks directly to the server; no mobile proxy is used.</AppText>
          </View>
          <NativeTextField
            key={`url-${formKey}`}
            defaultValue={url}
            placeholder="http://host:4096"
            kind="url"
            autoFocus={servers.length === 0}
            onValueChange={setUrl}
            style={{ alignSelf: "stretch", minHeight: 46 }}
          />
          <NativeTextField
            key={`name-${formKey}`}
            defaultValue={displayName}
            placeholder="Display name (optional)"
            onValueChange={setDisplayName}
            style={{ alignSelf: "stretch", minHeight: 46 }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <NativeTextField
              key={`username-${formKey}`}
            defaultValue={username}
            placeholder="Username"
            kind="username"
            onValueChange={setUsername}
              style={{ flex: 1, minHeight: 46 }}
            />
            <NativeTextField
              key={`password-${formKey}`}
            defaultValue={password}
            placeholder="Password"
            kind="password"
            secure
            onValueChange={setPassword}
              style={{ flex: 1, minHeight: 46 }}
            />
          </View>
          <NativeButton
            title={connect.isPending ? "Connecting" : "Add Server"}
            icon="add"
            variant="primary"
            disabled={connect.isPending || !url.trim()}
            onPress={() => connect.mutate()}
            style={{ alignSelf: "flex-start" }}
          />
        </Card>

        <SectionHeader title="Servers" detail={`${sortedServers.length}`} />
        {sortedServers.length === 0 ? (
          <EmptyState title="No servers yet" detail="Run `opencode serve --hostname 0.0.0.0` on your machine, then add the URL here." />
        ) : (
          <View style={{ gap: 12 }}>
            {sortedServers.map((server) => (
              <ServerRow
                key={server.id}
                server={server}
                onRemove={() => {
                  Alert.alert("Remove server", `Remove ${serverName(server)}?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => removeServer(server.id) },
                  ]);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <Stack.Screen options={{ title: "Servers" }} />
    </>
  );
}
