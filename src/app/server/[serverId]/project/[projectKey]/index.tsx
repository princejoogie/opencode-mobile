import { useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project, SessionStatus } from "@opencode-ai/sdk/v2/client";
import { NativeButton, NativeTextField } from "@/components/native-control";
import { AppText, EmptyState, LoadingState, Pill, Row, SectionHeader, useTheme } from "@/components/surface";
import { createOpencodeSdk } from "@/lib/opencode-client";
import { filename, formatRelativeTime, projectDisplayName, sessionTitle, sessionWorking } from "@/lib/opencode-format";
import { opencodeKeys } from "@/lib/opencode-queries";
import { decodeRouteValue, encodeRouteValue } from "@/lib/route-params";
import { useServers } from "@/store/servers";

function ProjectRail({ serverId, currentDirectory, projects }: { serverId: string; currentDirectory: string; projects: Project[] }) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
      {projects.map((project) => {
        const selected = project.worktree === currentDirectory;

        return (
          <Row
            key={project.id}
            onPress={() =>
              router.replace({
                pathname: "/server/[serverId]/project/[projectKey]",
                params: { serverId, projectKey: encodeRouteValue(project.worktree) },
              })
            }
            style={{
              minWidth: 112,
              maxWidth: 160,
              padding: 12,
              gap: 6,
              borderRadius: 16,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: selected ? theme.accent : theme.border,
              backgroundColor: selected ? `${theme.accent}22` : theme.card,
            }}
          >
            <AppText variant="headline" numberOfLines={1} style={{ fontSize: 15 }}>
              {projectDisplayName(project)}
            </AppText>
            <AppText variant="caption" color={theme.muted} numberOfLines={1}>
              {filename(project.worktree)}
            </AppText>
          </Row>
        );
      })}
    </ScrollView>
  );
}

export default function ProjectSessionsScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { serverId, projectKey } = useLocalSearchParams<{ serverId: string; projectKey: string }>();
  const directory = decodeRouteValue(projectKey);
  const { getServer } = useServers();
  const server = getServer(serverId);
  const [search, setSearch] = useState("");
  const scopedClient = server ? createOpencodeSdk(server, { directory }) : undefined;

  const projects = useQuery({
    queryKey: opencodeKeys.projects(serverId),
    enabled: !!server,
    queryFn: () => createOpencodeSdk(server!).project.list().then((result) => result.data ?? []),
  });
  const sessions = useQuery({
    queryKey: opencodeKeys.sessions(serverId, directory),
    enabled: !!scopedClient && !!directory,
    queryFn: () => scopedClient!.session.list({ roots: true, limit: 120 }).then((result) => result.data ?? []),
  });
  const status = useQuery({
    queryKey: opencodeKeys.status(serverId, directory),
    enabled: !!scopedClient && !!directory,
    queryFn: () => scopedClient!.session.status().then((result) => result.data ?? ({} as Record<string, SessionStatus>)),
    refetchInterval: 4_000,
  });

  const project = projects.data?.find((item) => item.worktree === directory);
  const filteredSessions = useMemo(() => {
    const value = search.trim().toLowerCase();
    const list = (sessions.data ?? []).filter((session) => !session.time.archived);
    if (!value) return list;
    return list.filter((session) => sessionTitle(session).toLowerCase().includes(value));
  }, [search, sessions.data]);

  const createSession = useMutation({
    mutationFn: () => scopedClient!.session.create().then((result) => result.data!),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: opencodeKeys.sessions(serverId, directory) });
      router.push({
        pathname: "/server/[serverId]/project/[projectKey]/session/[sessionId]",
        params: { serverId, projectKey, sessionId: session.id },
      });
    },
    onError: (error) => Alert.alert("Could not create session", error instanceof Error ? error.message : "Request failed"),
  });

  if (!server || !directory) return <LoadingState title="Opening project" />;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: opencodeKeys.projects(server.id) });
    queryClient.invalidateQueries({ queryKey: opencodeKeys.sessions(server.id, directory) });
    queryClient.invalidateQueries({ queryKey: opencodeKeys.status(server.id, directory) });
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={sessions.isRefetching || projects.isRefetching} onRefresh={refresh} />}
        contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 48 }}
      >
        {projects.data?.length ? <ProjectRail serverId={server.id} currentDirectory={directory} projects={projects.data} /> : null}

        <Row>
          <View style={{ gap: 4 }}>
            <AppText variant="title">{project ? projectDisplayName(project) : filename(directory)}</AppText>
            <AppText variant="caption" color={theme.muted} selectable>
              {directory}
            </AppText>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {project?.vcs ? <Pill>{project.vcs}</Pill> : null}
            {project?.sandboxes.length ? <Pill tone="accent">{`${project.sandboxes.length} sandboxes`}</Pill> : null}
            <Pill>{`${sessions.data?.length ?? 0} sessions`}</Pill>
          </View>
        </Row>

        <NativeTextField placeholder="Search sessions" kind="search" onValueChange={setSearch} style={{ alignSelf: "stretch", minHeight: 46 }} />

        <SectionHeader title="Threads" detail={filteredSessions.length.toString()} />
        {sessions.isPending ? (
          <LoadingState title="Loading sessions" />
        ) : sessions.error ? (
          <EmptyState title="Could not load sessions" detail={sessions.error instanceof Error ? sessions.error.message : "Request failed"} />
        ) : filteredSessions.length ? (
          <View style={{ gap: 12 }}>
            {filteredSessions.map((session) => {
              const sessionStatus = status.data?.[session.id];
              const working = sessionWorking(sessionStatus);

              return (
                <Row
                  key={session.id}
                  onPress={() =>
                    router.push({
                      pathname: "/server/[serverId]/project/[projectKey]/session/[sessionId]",
                      params: { serverId: server.id, projectKey, sessionId: session.id },
                    })
                  }
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <AppText variant="headline">{sessionTitle(session)}</AppText>
                      <AppText variant="caption" color={theme.muted}>
                        Updated {formatRelativeTime(session.time.updated)}
                      </AppText>
                    </View>
                    {working ? <Pill tone="warning">Working</Pill> : <Pill>Idle</Pill>}
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {session.agent ? <Pill tone="accent">{session.agent}</Pill> : null}
                    {session.model?.id ? <Pill>{session.model.id}</Pill> : null}
                    {session.parentID ? <Pill>Child</Pill> : null}
                    {session.share?.url ? <Pill tone="success">Shared</Pill> : null}
                  </View>
                </Row>
              );
            })}
          </View>
        ) : (
          <EmptyState title="No sessions" detail="Start a new thread or prompt this project from opencode." />
        )}
      </ScrollView>
      <Stack.Screen
        options={{
          title: project ? projectDisplayName(project) : filename(directory),
          headerRight: () => (
            <NativeButton
              title={createSession.isPending ? "Creating" : "New"}
              icon="add"
              variant="plain"
              disabled={createSession.isPending}
              onPress={() => createSession.mutate()}
            />
          ),
        }}
      />
    </>
  );
}
