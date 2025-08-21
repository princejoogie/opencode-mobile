import { View, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { api } from "@/lib/api";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedView } from "@/components/ui/themed-view";
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
       className={`border-b border-terminal-border rounded-none px-3 py-1 bg-transparent items-stretch my-0 min-h-0 ${index === sessions.length - 1 ? 'border-b-0' : ''}`}
       onPress={() => navigateToSession(session)}
     >
       <View className="flex-row justify-between items-start w-full">
         <View className="flex-row flex-1 items-start gap-2">
          <ThemedText type="line-number">{(index + 1).toString().padStart(3, ' ')}</ThemedText>
           <ThemedText type="muted" className="mt-0.5">+</ThemedText>
           <View className="flex-1 gap-0.5">
             <ThemedText className="font-mono text-sm text-terminal-text">
               {session.title || "Untitled Session"}
             </ThemedText>
             <View className="flex-row items-center">
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
             backgroundColor: '#1a1a1a',
           },
           headerTintColor: '#00ff00',
          headerTitleStyle: {
            fontFamily: "monospace",
            fontSize: 16,
          },
        }}
      />
      <ThemedView className="flex-1 bg-terminal-bg">
        <ScrollView className="flex-1 px-4 py-4">
          <ThemedView variant="panel">
            <ThemedView variant="panel-header">
               <View className="flex-row justify-between items-center">
                <ThemedText type="subtitle">Sessions</ThemedText>
                <ThemedText type="muted">{sessions.length} active</ThemedText>
              </View>
            </ThemedView>
            <ThemedView variant="panel-content" style={{ padding: 0 }}>
              {loading ? (
                 <View className="p-8 items-center">
                   <ThemedText type="muted">Loading sessions...</ThemedText>
                 </View>
              ) : sessions.length > 0 ? (
                 <ScrollView className="max-h-[500px]" nestedScrollEnabled>
                  {sessions.map(renderSessionItem)}
                </ScrollView>
              ) : (
                 <View className="p-8 items-center gap-2">
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

