import { RefreshControl, ScrollView, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NativeButton } from "@/components/native-control";
import { AppText, EmptyState, LoadingState, Pill, Row, SectionHeader, useTheme } from "@/components/surface";
import { createOpencodeSdk, serverName } from "@/lib/opencode-client";
import { formatRelativeTime, projectDisplayName } from "@/lib/opencode-format";
import { opencodeKeys } from "@/lib/opencode-queries";
import { encodeRouteValue } from "@/lib/route-params";
import { useServers } from "@/store/servers";

export default function ServerProjectsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { serverId } = useLocalSearchParams<{ serverId: string }>();
  const { getServer } = useServers();
  const server = getServer(serverId);

  const health = useQuery({
    queryKey: opencodeKeys.health(serverId),
    enabled: !!server,
    queryFn: () => createOpencodeSdk(server!).global.health().then((result) => result.data),
    refetchInterval: 10_000,
  });
  const projects = useQuery({
    queryKey: opencodeKeys.projects(serverId),
    enabled: !!server,
    queryFn: () => createOpencodeSdk(server!).project.list().then((result) => result.data ?? []),
  });

  if (!server) return <LoadingState title="Opening server" />;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: opencodeKeys.all(server.id) });
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={projects.isRefetching || health.isRefetching} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }}
      >
        <Row>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="headline">{serverName(server)}</AppText>
              <AppText variant="caption" color={theme.muted} selectable>
                {server.url}
              </AppText>
            </View>
            {health.data?.healthy ? <Pill tone="success">{health.data.version}</Pill> : <Pill tone="danger">Offline</Pill>}
          </View>
          <AppText color={theme.muted}>Projects and sessions are loaded through `@opencode-ai/sdk/v2/client` with opencode directory scoping.</AppText>
        </Row>

        <SectionHeader title="Projects" detail={`${projects.data?.length ?? 0}`} />
        {projects.isPending ? (
          <LoadingState title="Loading projects" />
        ) : projects.error ? (
          <EmptyState title="Could not load projects" detail={projects.error instanceof Error ? projects.error.message : "The server returned an error."} />
        ) : projects.data?.length ? (
          <View style={{ gap: 12 }}>
            {projects.data.map((project) => (
              <Row
                key={project.id}
                onPress={() =>
                  router.push({
                    pathname: "/server/[serverId]/project/[projectKey]",
                    params: { serverId: server.id, projectKey: encodeRouteValue(project.worktree) },
                  })
                }
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      borderCurve: "continuous",
                      backgroundColor: project.icon?.color ? project.icon.color : `${theme.accent}22`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AppText variant="headline" color={theme.accent}>
                      {projectDisplayName(project).slice(0, 1).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <AppText variant="headline">{projectDisplayName(project)}</AppText>
                    <AppText variant="caption" color={theme.muted} selectable>
                      {project.worktree}
                    </AppText>
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      {project.vcs ? <Pill>{project.vcs}</Pill> : null}
                      {project.sandboxes.length ? <Pill tone="accent">{`${project.sandboxes.length} sandboxes`}</Pill> : null}
                      <Pill>{formatRelativeTime(project.time.updated)}</Pill>
                    </View>
                  </View>
                </View>
              </Row>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No projects"
            detail="Open a project in opencode on the server, then pull to refresh."
          />
        )}
      </ScrollView>
      <Stack.Screen
        options={{
          title: serverName(server),
          headerRight: () => <NativeButton title="Refresh" icon="refresh" variant="plain" onPress={refresh} />,
        }}
      />
    </>
  );
}
