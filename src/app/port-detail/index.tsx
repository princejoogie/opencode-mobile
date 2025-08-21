import { View, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { api } from "@/lib/api";
import { ThemedText } from "@/components/ui/themed-text";

export default function PortDetailScreen() {
  const { port } = useLocalSearchParams<{ port: string }>();

  const sendTestToast = async () => {
    try {
      const serverUrl = "http://palkia:3000";
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

  return (
    <>
      <Stack.Screen
        options={{
          title: `Port ${port}`,
          headerShown: true,
        }}
      />
      <View className="flex-1">
        <View className="flex-1 p-4">
          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg items-center"
            onPress={sendTestToast}
          >
            <ThemedText className="font-semibold">Send Test Toast</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
