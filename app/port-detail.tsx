import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function PortDetailScreen() {
  const { port } = useLocalSearchParams<{ port: string }>();

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `Port ${port}`,
          headerShown: true 
        }} 
      />
      <ThemedView className="flex-1 p-4">
        <ThemedView className="gap-6">
          <ThemedText type="title">Port Details</ThemedText>
          <ThemedView className="p-4 rounded-lg items-center gap-2">
            <ThemedText type="subtitle">Port Number:</ThemedText>
            <ThemedText className="text-3xl font-bold">{port}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </>
  );
}