import { View, ScrollView } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { api } from "@/lib/api";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedView } from "@/components/ui/themed-view";
import { useGlobal } from "@/store/global";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

interface SessionInfo {
  id: string;
  title: string;
  time: {
    created: number;
    updated: number;
  };
  parent?: string;
  shared?: boolean;
}

export default function PortDetailScreen() {
  const { port } = useLocalSearchParams<{ port: string }>();
  const { serverUrl } = useGlobal();
  const sessions = useQuery({
    queryKey: ["sessions", { port, serverUrl }],
    queryFn: () => api.getSessions(serverUrl, Number(port)),
  });

  const navigateToSession = (session: SessionInfo) => {
    router.push({
      pathname: "/port-detail/session",
      params: {
        port: port!,
        sessionId: session.id,
        title: session.title || "Untitled Session",
      },
    });
  };

  const formatTime = (timestamp: number) => {
    return (
      new Date(timestamp).toLocaleDateString() +
      " " +
      new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView className="flex-1 bg-terminal-bg p-4">
        <ThemedView className="flex-1">
          <ThemedView className="my-4 flex-row justify-between items-center">
            <View className="flex flex-row items-center">
            <ThemedButton
              variant="ghost"
              className="w-10 p-0 m-0"
              disabled={!router.canGoBack()}
              onPress={() => router.back()}
            >
              {"<"}
            </ThemedButton>
            <ThemedText type="subtitle">Sessions</ThemedText>
            </View>
            <ThemedText type="muted">{sessions.data?.length} active</ThemedText>
          </ThemedView>
          <ThemedView
            variant="transparent"
            className="flex-1"
            style={{ padding: 0 }}
          >
            {sessions.isPending ? (
              <View className="p-8 items-center">
                <ThemedText type="muted">Loading sessions...</ThemedText>
              </View>
            ) : !sessions.data ? (
              <View className="p-8 items-center gap-2">
                <ThemedText type="muted">No active sessions found</ThemedText>
                <ThemedText type="dim">
                  Start a new session to see it here
                </ThemedText>
              </View>
            ) : sessions.data.length > 0 ? (
              <ScrollView className="flex-1" nestedScrollEnabled>
                {sessions.data.map((session) => (
                  <ThemedButton
                    variant="ghost"
                    key={session.id}
                    className="border-b mb-2 border-terminal-border rounded-none py-1 bg-transparent items-stretch my-0 min-h-0"
                    onPress={() => navigateToSession(session)}
                  >
                    <View className="flex-row justify-between items-start w-full">
                      <View className="flex-row flex-1 items-start gap-2">
                        <View className="flex-1 gap-0.5">
                          <ThemedText className="font-mono text-sm text-terminal-text">
                            {session.title || "Untitled Session"}
                          </ThemedText>
                          <View className="flex-row items-center">
                            {session.shared && (
                              <>
                                <ThemedText type="muted"> • </ThemedText>
                                <ThemedText type="success">shared</ThemedText>
                              </>
                            )}
                          </View>
                          <ThemedText type="dim">
                            {formatTime(session.time.updated)}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </ThemedButton>
                ))}
              </ScrollView>
            ) : (
              <View className="p-8 items-center gap-2">
                <ThemedText type="muted">No active sessions found</ThemedText>
                <ThemedText type="dim">
                  Start a new session to see it here
                </ThemedText>
              </View>
            )}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}
