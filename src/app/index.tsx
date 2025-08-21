import {
  TextInput,
  Alert,
  ScrollView,
  View,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { router, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedView } from "@/components/ui/themed-view";
import { api } from "@/lib/api";
import { TerminalColors } from "@/constants/Colors";

export default function HomeScreen() {
  const [serverUrl, setServerUrl] = useState("http://palkia:3000");
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const { data: appsData, isLoading: isLoadingPorts } = useQuery({
    queryKey: ["ports", serverUrl],
    queryFn: () => api.getPorts(serverUrl),
    enabled: isConnected === true,
  });

  const pingMutation = useMutation({
    mutationFn: () => api.ping(serverUrl),
    onSuccess: (data) => {
      const connected = data.ok === true;
      setIsConnected(connected);

      if (connected) {
        Alert.alert("Success", "Server is reachable!");
        queryClient.invalidateQueries({ queryKey: ["ports", serverUrl] });
      } else {
        Alert.alert("Failed", "Server did not respond with { ok: true }");
        setIsConnected(false);
      }
    },
    onError: () => {
      setIsConnected(false);
      Alert.alert("Error", "Failed to reach server");
    },
  });

  const connectToServer = async () => {
    if (!serverUrl.trim()) {
      Alert.alert("Error", "Please enter a server URL");
      return;
    }

    pingMutation.mutate();
  };

  const apps = appsData || [];

  const navigateToPortDetail = (port: number) => {
    router.push(`/port-detail?port=${port}`);
  };

  const getProjectName = (rootPath: string) => {
    return rootPath.split('/').pop() || 'Unknown Project';
  };

  const renderAppItem = (app: any, index: number) => (
    <ThemedButton
      key={app.port}
      variant="ghost"
      style={[
        styles.sessionItem,
        index === apps.length - 1 && { borderBottomWidth: 0 }
      ]}
      onPress={() => navigateToPortDetail(app.port)}
    >
      <View style={styles.sessionItemContent}>
        <View style={styles.sessionInfo}>
          <ThemedText type="dim" style={styles.lineNumber}>
            {String(app.port).padStart(4, ' ')}
          </ThemedText>
          <ThemedText>{getProjectName(app.path.root)}</ThemedText>
        </View>
        <ThemedText type="muted">›</ThemedText>
      </View>
    </ThemedButton>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "# OpenCode Terminal",
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
          <ThemedView variant="panel" style={styles.connectionPanel}>
            <ThemedView variant="panel-header">
              <ThemedText type="subtitle">Connection</ThemedText>
            </ThemedView>
            <ThemedView variant="panel-content">
              <ThemedText type="muted" style={styles.label}>Server URL:</ThemedText>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="Enter server URL"
                  placeholderTextColor={TerminalColors.textDim}
                />
                <ThemedButton
                  variant="primary"
                  style={[
                    styles.connectButton,
                    { opacity: pingMutation.isPending ? 0.5 : 1 }
                  ]}
                  onPress={connectToServer}
                  disabled={pingMutation.isPending}
                >
                  {pingMutation.isPending ? "Connecting..." : "Connect"}
                </ThemedButton>
              </View>
              {isConnected !== null && (
                <View style={styles.statusContainer}>
                  <ThemedText type={isConnected ? "success" : "error"}>
                    {isConnected ? "✓ Connected" : "✗ Connection Failed"}
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          </ThemedView>

          {isConnected && (
            <ThemedView variant="panel" style={styles.sessionsPanel}>
              <ThemedView variant="panel-header">
                <ThemedText type="subtitle">Active Sessions</ThemedText>
                <ThemedText type="muted">{apps.length} found</ThemedText>
              </ThemedView>
              <ThemedView variant="panel-content" style={{ padding: 0 }}>
                {isLoadingPorts ? (
                  <View style={styles.emptyState}>
                    <ThemedText type="muted">Scanning ports...</ThemedText>
                  </View>
                ) : apps.length > 0 ? (
                  <ScrollView style={styles.sessionsList} nestedScrollEnabled>
                    {apps.map(renderAppItem)}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyState}>
                    <ThemedText type="muted">No active sessions found</ThemedText>
                    <ThemedText type="dim">Start a development server to see it here</ThemedText>
                  </View>
                )}
              </ThemedView>
            </ThemedView>
          )}
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
  connectionPanel: {
    marginBottom: 16,
  },
  sessionsPanel: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: TerminalColors.bgTertiary,
    borderWidth: 1,
    borderColor: TerminalColors.border,
    color: TerminalColors.text,
    fontFamily: 'monospace',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
  },
  connectButton: {
    minWidth: 100,
  },
  statusContainer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  sessionsList: {
    maxHeight: 300,
  },
  sessionItem: {
    borderBottomWidth: 1,
    borderBottomColor: TerminalColors.border,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  sessionItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineNumber: {
    fontFamily: 'monospace',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'right',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
});
