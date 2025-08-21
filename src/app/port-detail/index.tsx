import { View, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { api } from "@/lib/api";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { useState, useEffect } from "react";

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
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const serverUrl = "http://palkia:3000";

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionList = await api.getSessions(serverUrl, Number(port));
      setSessions(sessionList);
    } catch (error) {
      Alert.alert("Error", `Failed to load sessions: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateToSession = (session: SessionInfo) => {
    router.push({
      pathname: "/port-detail/session",
      params: {
        port: port!,
        sessionId: session.id,
        title: session.title || "Untitled Session"
      }
    });
  };

  const sendTestToast = async () => {
    try {
      await api.showToast(serverUrl, Number(port), {
        title: "Test Toast",
        message: "test toast from mobile app",
        variant: "info",
      });
      Alert.alert("Success", "Toast sent successfully!");
    } catch (error) {
      Alert.alert("Error", `Failed to send toast: ${error}`);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: `Port ${port}`,
          headerShown: true,
        }}
      />
      <ScrollView className="flex-1 p-4">
        <View className="gap-6">
          <View>
            <ThemedText className="text-xl font-bold mb-4">Sessions ({sessions.length})</ThemedText>
            {loading && <ThemedText>Loading...</ThemedText>}
            {sessions.map((session) => (
              <ThemedButton
                key={session.id}
                variant="ghost"
                style={{ marginBottom: 8, alignItems: "flex-start" }}
                onPress={() => navigateToSession(session)}
              >
                <View>
                  <ThemedText style={{ fontWeight: "600" }}>
                    {session.title || "Untitled Session"}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                    ID: {session.id}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                    Updated: {formatTime(session.time.updated)}
                  </ThemedText>
                  {session.shared && (
                    <ThemedText style={{ fontSize: 12, color: "#22c55e" }}>
                      Shared
                    </ThemedText>
                  )}
                </View>
              </ThemedButton>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
