import { Alert, ScrollView, View } from "react-native";
import { useState } from "react";
import { router, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedInput } from "@/components/ui/themed-input";
import { api } from "@/lib/api";
import { useGlobal } from "@/store/global";
import { SafeAreaView } from "react-native-safe-area-context";
import { OPENCODE_LOGO } from "@/constants";

export default function HomeScreen() {
  const { serverUrl, setServerUrl } = useGlobal();
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
    return rootPath.split("/").pop() || "Unknown Project";
  };

  const renderAppItem = (app: any, index: number) => (
    <ThemedButton
      key={app.port}
      variant="ghost"
      className={`border-b border-terminal-border rounded-none px-4 py-3 bg-transparent ${index === apps.length - 1 ? "border-b-0" : ""}`}
      onPress={() => navigateToPortDetail(app.port)}
    >
      <View className="flex-row justify-between items-center w-full">
        <View className="flex-row items-center gap-3">
          <ThemedText
            type="dim"
            className="font-mono text-xs min-w-10 text-right"
          >
            {String(app.port).padStart(4, " ")}
          </ThemedText>
          <ThemedText>{getProjectName(app.path.root)}</ThemedText>
        </View>
        <ThemedText type="muted">›</ThemedText>
      </View>
    </ThemedButton>
  );

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView className="flex-1 bg-bg">
        <ScrollView className="flex-1 px-4 py-4">
          <ThemedView className="mb-4 justify-center items-center">
            <ThemedText
              style={{ fontFamily: "GeistMono" }}
              className="font-mono text-xs text-center text-terminal-text"
            >
              {OPENCODE_LOGO}
            </ThemedText>
          </ThemedView>
          <ThemedView variant="panel" className="mb-4">
            <ThemedView variant="panel-header">
              <View className="flex-row justify-between items-center">
                <ThemedText type="subtitle">Connection</ThemedText>
                {isConnected !== null && (
                  <ThemedText type={isConnected ? "success" : "error"}>
                    {isConnected ? "✓ Connected" : "✗ Failed"}
                  </ThemedText>
                )}
              </View>
            </ThemedView>
            <ThemedView variant="panel-content" className="p-4">
              <ThemedText type="muted" className="mb-2">
                Server URL:
              </ThemedText>
                <View className="flex-row gap-3">
                  <ThemedInput
                    className="flex-1"
                    value={serverUrl}
                    onChangeText={setServerUrl}
                    placeholder="Enter server URL"
                  />
                  <ThemedButton
                   variant="primary"
                   className={`min-w-24 ${pingMutation.isPending ? "opacity-50" : "opacity-100"}`}
                   onPress={connectToServer}
                   disabled={pingMutation.isPending}
                 >
                   {pingMutation.isPending ? "Connecting..." : "Connect"}
                 </ThemedButton>
               </View>
            </ThemedView>
          </ThemedView>

          {isConnected && (
            <ThemedView className="flex-1 p-4">
              <ThemedView className="mb-4">
                <ThemedText>Active Sessions</ThemedText>
                <ThemedText type="muted">{apps.length} found</ThemedText>
              </ThemedView>
              <ThemedView variant="panel-content" style={{ padding: 0 }}>
                {isLoadingPorts ? (
                  <View className="p-8 items-center">
                    <ThemedText type="muted">Scanning ports...</ThemedText>
                  </View>
                ) : apps.length > 0 ? (
                  <ScrollView className="max-h-[300px]" nestedScrollEnabled>
                    {apps.map(renderAppItem)}
                  </ScrollView>
                ) : (
                  <View className="p-8 items-center gap-2">
                    <ThemedText type="muted">
                      No active sessions found
                    </ThemedText>
                    <ThemedText type="dim">
                      Start a development server to see it here
                    </ThemedText>
                  </View>
                )}
              </ThemedView>
            </ThemedView>
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}
