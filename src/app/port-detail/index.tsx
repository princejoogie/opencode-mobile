import { Text, View } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";

export default function PortDetailScreen() {
  const { port } = useLocalSearchParams<{ port: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: `Port ${port}`,
          headerShown: true,
        }}
      />
      <View className="flex-1 p-4">
        <View className="gap-6">
          <Text>Port Details</Text>
          <View className="p-4 rounded-lg items-center gap-2">
            <Text>Port Number:</Text>
            <Text className="text-3xl font-bold">{port}</Text>
          </View>
        </View>
      </View>
    </>
  );
}
