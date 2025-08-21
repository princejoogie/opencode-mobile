import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { api, type Message, type MessagePart, type ToolPart } from "@/lib/api";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useState, useEffect, useCallback } from "react";
import { TerminalColors } from "@/constants/Colors";

export default function SessionScreen() {
  const { port, sessionId, title } = useLocalSearchParams<{
    port: string;
    sessionId: string;
    title: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const serverUrl = "http://palkia:3000";

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);

      const messageList = await api.getSessionMessages(
        serverUrl,
        Number(port),
        sessionId!,
      );

      // Then fetch detailed content for each message
      const detailedMessages = await Promise.all(
        messageList.map(async (message) => {
          try {
            const detailedMessage = await api.getSessionMessage(
              serverUrl,
              Number(port),
              sessionId!,
              message.info.id,
            );
            return detailedMessage;
          } catch (error) {
            console.warn(
              `Failed to load details for message ${message.info.id}:`,
              error,
            );
            return message; // Fallback to basic message info
          }
        }),
      );

      setMessages(detailedMessages);
    } catch (error) {
      Alert.alert("Error", `Failed to load messages: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [port, sessionId]);
  
  useEffect(() => {
    if (sessionId && port) {
      loadMessages();
    }
  }, [sessionId, port, loadMessages]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + " " + 
           new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatus = (
    message: Message,
  ): "pending" | "streaming" | "complete" | "error" => {
    if (!message.parts || message.parts.length === 0) return "pending";

    // Check if there are any tool calls that are not completed
    const toolParts = message.parts.filter(
      (p) => p.type === "tool",
    ) as ToolPart[];
    const hasRunningTools = toolParts.some(
      (p) => p.state.status === "running" || p.state.status === "pending",
    );

    if (hasRunningTools) return "streaming";

    // Check if any tool failed
    const hasErrorTools = toolParts.some((p) => p.state.status === "error");
    if (hasErrorTools) return "error";

    // If message has a completion time, it's complete
    if (message.info.role === "assistant" && message.info.time.completed)
      return "complete";

    return "pending";
  };

  const getMessagePreview = (parts: MessagePart[]) => {
    if (!parts || parts.length === 0) return "No content";

    // Look for text content in parts
    for (const part of parts) {
      if (part.type === "text" && part.text) {
        const content = part.text;
        if (content && content.trim()) {
          return (
            content.substring(0, 300) + (content.length > 300 ? "..." : "")
          );
        }
      }

      // Check for tool output that might have text content
      if (part.type === "tool" && part.state.status === "completed") {
        const content = part.state.output;
        if (content && content.trim()) {
          return (
            content.substring(0, 300) + (content.length > 300 ? "..." : "")
          );
        }
      }
    }

    // Show part types for debugging if no content found
    return `${parts.length} part(s): ${parts.map((p) => p.type).join(", ")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return TerminalColors.green;
      case "error": return TerminalColors.red;
      case "streaming": return TerminalColors.yellow;
      default: return TerminalColors.textMuted;
    }
  };

  const getRolePrefix = (role: string) => {
    return role === "user" ? ">" : "$";
  };

  const decodedTitle = title ? decodeURIComponent(title) : "Untitled Session";

  return (
    <>
      <Stack.Screen
        options={{
          title: `# ${decodedTitle}`,
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
          <ThemedView variant="panel" style={styles.sessionPanel}>
            <ThemedView variant="panel-header">
              <ThemedText type="subtitle">Session Log</ThemedText>
              <ThemedText type="muted">{messages.length} messages</ThemedText>
            </ThemedView>
            <ThemedView variant="panel-content" style={{ padding: 0 }}>
              <ThemedView variant="code-block" style={styles.sessionInfo}>
                <View style={styles.infoRow}>
                  <ThemedText type="muted">Session ID:</ThemedText>
                  <ThemedText type="info">{sessionId}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText type="muted">Port:</ThemedText>
                  <ThemedText type="info">{port}</ThemedText>
                </View>
              </ThemedView>

              {loading ? (
                <View style={styles.loadingState}>
                  <ThemedText type="muted">Loading messages...</ThemedText>
                </View>
              ) : messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText type="muted">No messages in this session</ThemedText>
                  <ThemedText type="dim">Messages will appear here when the session is active</ThemedText>
                </View>
              ) : (
                <ScrollView style={styles.messagesList} nestedScrollEnabled>
                  {messages.map((message, index) => {
                    const status = getMessageStatus(message);
                    const isUser = message.info.role === "user";
                    
                    return (
                      <View key={message.info.id} style={styles.messageContainer}>
                        <View style={styles.messageHeader}>
                          <View style={styles.messageHeaderLeft}>
                            <ThemedText type="line-number">
                              {String(index + 1).padStart(3, ' ')}
                            </ThemedText>
                            <ThemedText type={isUser ? "info" : "success"}>
                              {getRolePrefix(message.info.role)}
                            </ThemedText>
                            <ThemedText type={isUser ? "info" : "success"}>
                              {isUser ? "user" : "assistant"}
                            </ThemedText>
                          </View>
                          <View style={styles.statusBadge}>
                            <ThemedText 
                              type="dim" 
                              style={{ color: getStatusColor(status), fontSize: 10 }}
                            >
                              [{status}]
                            </ThemedText>
                          </View>
                        </View>
                        
                        <ThemedView variant="code-block" style={styles.messageContent}>
                          <ThemedText style={styles.messageText}>
                            {getMessagePreview(message.parts)}
                          </ThemedText>
                          <ThemedText type="dim" style={styles.messageTime}>
                            {formatTime(message.info.time.created)}
                          </ThemedText>
                        </ThemedView>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </ThemedView>
          </ThemedView>
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
  sessionPanel: {
    flex: 1,
  },
  sessionInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  messagesList: {
    maxHeight: 600,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  messageContent: {
    paddingLeft: 56, // Align with message content
  },
  messageText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: TerminalColors.text,
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 10,
  },
  loadingState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
});

