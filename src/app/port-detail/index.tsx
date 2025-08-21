import { View, Alert, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { api } from "@/lib/api";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedView } from "@/components/ui/themed-view";
import { useState, useEffect } from "react";
import { TerminalColors } from "@/constants/Colors";

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

    loadSessions();
  }, [port]);

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

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + " " + 
           new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSessionId = (id: string) => {
    return id.length > 8 ? id.substring(0, 8) + "..." : id;
  };

  const renderSessionItem = (session: SessionInfo, index: number) => (
    <ThemedButton
      key={session.id}
      variant="ghost"
      style={[
        styles.sessionItem,
        { minHeight: 0, paddingVertical: 0 },
        index === sessions.length - 1 && { borderBottomWidth: 0 }
      ]}
      onPress={() => navigateToSession(session)}
    >
      <View style={styles.sessionContent}>
        <View style={styles.sessionHeader}>
          <ThemedText type="line-number">{(index + 1).toString().padStart(3, ' ')}</ThemedText>
          <ThemedText type="muted" style={styles.sessionPrefix}>+</ThemedText>
          <View style={styles.sessionInfo}>
            <ThemedText style={styles.sessionTitle}>
              {session.title || "Untitled Session"}
            </ThemedText>
            <View style={styles.sessionDetails}>
              <ThemedText type="muted">ID: </ThemedText>
              <ThemedText type="info">{formatSessionId(session.id)}</ThemedText>
              {session.shared && (
                <>
                  <ThemedText type="muted"> • </ThemedText>
                  <ThemedText type="success">shared</ThemedText>
                </>
              )}
            </View>
            <ThemedText type="dim">{formatTime(session.time.updated)}</ThemedText>
          </View>
        </View>
        <ThemedText type="muted">›</ThemedText>
      </View>
    </ThemedButton>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: `# Port ${port}`,
          headerShown: true,
          headerStyle: {
            backgroundColor: TerminalColors.bg,
          },
          headerTintColor: TerminalColors.green,
          headerTitleStyle: {
            fontFamily: "monospace",
            fontSize: 16,
          },
        }}
      />
      <ThemedView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <ThemedView variant="panel">
            <ThemedView variant="panel-header">
              <View style={styles.headerContent}>
                <ThemedText type="subtitle">Sessions</ThemedText>
                <ThemedText type="muted">{sessions.length} active</ThemedText>
              </View>
            </ThemedView>
            <ThemedView variant="panel-content" style={{ padding: 0 }}>
              {loading ? (
                <View style={styles.loadingState}>
                  <ThemedText type="muted">Loading sessions...</ThemedText>
                </View>
              ) : sessions.length > 0 ? (
                <ScrollView style={styles.sessionsList} nestedScrollEnabled>
                  {sessions.map(renderSessionItem)}
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <ThemedText type="muted">No active sessions found</ThemedText>
                  <ThemedText type="dim">Start a new session to see it here</ThemedText>
                </View>
              )}
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TerminalColors.bg,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionsList: {
    maxHeight: 500,
  },
  sessionItem: {
    borderBottomWidth: 1,
    borderBottomColor: TerminalColors.border,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'transparent',
    alignItems: 'stretch',
    marginVertical: 0,
    minHeight: 0,
  },
  sessionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  sessionHeader: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
    gap: 8,
  },
  sessionPrefix: {
    marginTop: 1,
  },
  sessionInfo: {
    flex: 1,
    gap: 1,
  },
  sessionTitle: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: TerminalColors.text,
  },
  sessionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
});
