import { StyleSheet } from 'react-native';
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
      <ThemedView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedText type="title">Port Details</ThemedText>
          <ThemedView style={styles.portContainer}>
            <ThemedText type="subtitle">Port Number:</ThemedText>
            <ThemedText style={styles.portNumber}>{port}</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    gap: 24,
  },
  portContainer: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  portNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});