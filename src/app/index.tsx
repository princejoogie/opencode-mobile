import {
  TextInput,
  Alert,
  ScrollView,
  View,
} from "react-native";
import { useState } from "react";
import { router, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedButton } from "@/components/ui/themed-button";
import { api } from "@/lib/api";

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

  const renderAppItem = (app: any) => (
    <ThemedButton
      key={app.port}
      variant="ghost"
      style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 }}
      onPress={() => navigateToPortDetail(app.port)}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <ThemedText>{getProjectName(app.path.root)}</ThemedText>
        <ThemedText>›</ThemedText>
      </View>
    </ThemedButton>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "OpenCode",
          headerShown: true,
        }}
      />
      <View className="flex-1">
        <ScrollView className="flex-1 p-4">
          <View className="gap-4">
            <View className="gap-2 mb-2">
              <ThemedText className="text-white">Server Url</ThemedText>
              <View className="flex flex-row gap-2">
                <TextInput
                  className="border border-blue-300 px-4 rounded text-base text-white pb-4 pt-2 flex-1"
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="Enter server URL"
                />
                <ThemedButton
                  variant="primary"
                  style={{ opacity: pingMutation.isPending ? 0.5 : 1 }}
                  onPress={connectToServer}
                  disabled={pingMutation.isPending}
                >
                  {pingMutation.isPending ? "Connecting..." : "Connect"}
                </ThemedButton>
              </View>
              {isConnected !== null && (
                <View className="p-2 items-center">
                  <ThemedText>
                    {isConnected ? "✓ Connected" : "✗ Not Connected"}
                  </ThemedText>
                </View>
              )}
            </View>

            {isConnected && (
              <View className="gap-2 mb-2">
                <ThemedText>Available sessions</ThemedText>
                {isLoadingPorts ? (
                  <ThemedText>Loading ports...</ThemedText>
                 ) : apps.length > 0 ? (
                   <View className="max-h-48">{apps.map(renderAppItem)}</View>
                ) : (
                  <ThemedText>No OpenCode ports found</ThemedText>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
