import { Image } from 'expo-image';
import { Platform, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
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
      style={styles.portItem}
      onPress={() => navigateToPortDetail(port)}
    >
      <ThemedText>Port {port}</ThemedText>
      <ThemedText>›</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Server Connection</ThemedText>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="Enter server URL"
        />
        <TouchableOpacity
          style={[styles.button, isChecking && styles.buttonDisabled]}
          onPress={pingServer}
          disabled={isChecking}
        >
          <ThemedText>
            {isChecking ? 'Checking...' : 'Ping Server'}
          </ThemedText>
        </TouchableOpacity>
        {isConnected !== null && (
          <ThemedView style={styles.statusContainer}>
            <ThemedText>
              {isConnected ? '✓ Connected' : '✗ Not Connected'}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
      
      {isConnected && (
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">OpenCode Ports</ThemedText>
          {isLoadingPorts ? (
            <ThemedText>Loading ports...</ThemedText>
          ) : ports.length > 0 ? (
            <ThemedView style={styles.portsList}>
              {ports.map(renderPortItem)}
            </ThemedView>
          ) : (
            <ThemedText>No OpenCode ports found</ThemedText>
          )}
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  input: {
    color: "#fff",
    borderColor: "#fff",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  statusContainer: {
    padding: 8,
    alignItems: 'center',
  },
  portsList: {
    maxHeight: 200,
  },
  portItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
  },
});
