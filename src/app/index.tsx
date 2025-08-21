import {
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
} from "react-native";
import { useState } from "react";
import { router, Stack } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";

export default function HomeScreen() {
  const [serverUrl, setServerUrl] = useState("http://palkia:3000");
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [ports, setPorts] = useState<number[]>([]);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);

  const fetchPorts = async () => {
    setIsLoadingPorts(true);
    try {
      const response = await fetch(`${serverUrl}/ports`);
      const data = await response.json();
      setPorts(data.ports || []);
    } catch {
      Alert.alert("Error", "Failed to fetch ports");
      setPorts([]);
    } finally {
      setIsLoadingPorts(false);
    }
  };

  const connectToServer = async () => {
    if (!serverUrl.trim()) {
      Alert.alert("Error", "Please enter a server URL");
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`${serverUrl}/ping`, {
        method: "GET",
      });

      const data = await response.json();
      const connected = data.ok === true;
      setIsConnected(connected);

      if (connected) {
        Alert.alert("Success", "Server is reachable!");
        // Fetch ports after successful ping
        await fetchPorts();
      } else {
        Alert.alert("Failed", "Server did not respond with { ok: true }");
        setPorts([]);
      }
    } catch {
      setIsConnected(false);
      setPorts([]);
      Alert.alert("Error", "Failed to reach server");
    } finally {
      setIsChecking(false);
    }
  };

  const navigateToPortDetail = (port: number) => {
    router.push(`/port-detail?port=${port}`);
  };

  const renderPortItem = (port: number) => (
    <TouchableOpacity
      key={port}
      className="flex-row justify-between items-center p-3 my-1"
      onPress={() => navigateToPortDetail(port)}
    >
      <ThemedText>Port {port}</ThemedText>
      <ThemedText>›</ThemedText>
    </TouchableOpacity>
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
                <TouchableOpacity
                  className={`flex items-cente justify-center px-4 rounded bg-green-700 items-center ${isChecking ? "opacity-50" : ""}`}
                  onPress={connectToServer}
                  disabled={isChecking}
                >
                  <ThemedText>
                    {isChecking ? "Connecting..." : "Connect"}
                  </ThemedText>
                </TouchableOpacity>
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
                <ThemedText>OpenCode Ports</ThemedText>
                {isLoadingPorts ? (
                  <ThemedText>Loading ports...</ThemedText>
                ) : ports.length > 0 ? (
                  <View className="max-h-48">{ports.map(renderPortItem)}</View>
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
