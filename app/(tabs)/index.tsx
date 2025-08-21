import { Platform, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [serverUrl, setServerUrl] = useState('http://palkia:3000');
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
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch ports');
      setPorts([]);
    } finally {
      setIsLoadingPorts(false);
    }
  };

  const pingServer = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`${serverUrl}/ping`, {
        method: 'GET',
      });
      
      const data = await response.json();
      const connected = data.ok === true;
      setIsConnected(connected);
      
      if (connected) {
        Alert.alert('Success', 'Server is reachable!');
        // Fetch ports after successful ping
        await fetchPorts();
      } else {
        Alert.alert('Failed', 'Server did not respond with { ok: true }');
        setPorts([]);
      }
    } catch (error) {
      setIsConnected(false);
      setPorts([]);
      Alert.alert('Error', 'Failed to reach server');
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
    <SafeAreaView className="flex-1">
      <ThemedView className="flex-1">
        <ScrollView className="flex-1 p-8">
          <ThemedView className="gap-4">
            <ThemedView className="flex-row items-center gap-2">
              <ThemedText type="title">OpenCode Server</ThemedText>
            </ThemedView>
            
            <ThemedView className="gap-2 mb-2">
              <ThemedText type="subtitle">Server Connection</ThemedText>
              <TextInput
                className="border border-gray-300 p-0 m-0 rounded-lg text-base text-white"
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="Enter server URL"
              />
              <TouchableOpacity
                className={`p-3 rounded-lg items-center ${isChecking ? 'opacity-50' : ''}`}
                onPress={pingServer}
                disabled={isChecking}
              >
                <ThemedText>
                  {isChecking ? 'Checking...' : 'Ping Server'}
                </ThemedText>
              </TouchableOpacity>
              {isConnected !== null && (
                <ThemedView className="p-2 items-center">
                  <ThemedText>
                    {isConnected ? '✓ Connected' : '✗ Not Connected'}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
            
            {isConnected && (
              <ThemedView className="gap-2 mb-2">
                <ThemedText type="subtitle">OpenCode Ports</ThemedText>
                {isLoadingPorts ? (
                  <ThemedText>Loading ports...</ThemedText>
                ) : ports.length > 0 ? (
                  <ThemedView className="max-h-48">
                    {ports.map(renderPortItem)}
                  </ThemedView>
                ) : (
                  <ThemedText>No OpenCode ports found</ThemedText>
                )}
              </ThemedView>
            )}
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}


