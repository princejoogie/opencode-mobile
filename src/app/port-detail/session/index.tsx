import { Alert, ScrollView, View } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { api, type Message, type MessagePart, type ToolPart } from "@/lib/api";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedInput } from "@/components/ui/themed-input";
import { useQuery } from "@tanstack/react-query";
import { useGlobal } from "@/store/global";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

export default function SessionScreen() {
  const { port, sessionId, title } = useLocalSearchParams<{
    port: string;
    sessionId: string;
    title: string;
  }>();
  const { serverUrl } = useGlobal();

  const { data: messages = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ["session-messages", serverUrl, port, sessionId],
    queryFn: async () => {
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

      return detailedMessages;
    },
    enabled: !!(sessionId && port),
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Handle error state
  if (error) {
    Alert.alert("Error", `Failed to load messages: ${error}`);
  }

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
      case "complete": return '#00ff00';
      case "error": return '#ff0000';
      case "streaming": return '#ffff00';
      default: return '#666666';
    }
  };



  const decodedTitle = title ? decodeURIComponent(title) : "Untitled Session";

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      setIsSending(true);
      // TODO: Implement actual message sending API call
      // For now, just clear the input and show a placeholder
      Alert.alert("Info", "Message sending not yet implemented");
      setInputMessage("");
      // After sending, refetch messages to show the new message
      refetch();
    } catch (error) {
      Alert.alert("Error", `Failed to send message: ${error}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView className="flex-1 bg-terminal-bg p-4">
        <ThemedView className="flex-1">
          <ThemedView className="my-4 flex-row justify-between items-center">
            <View className="flex flex-row items-center">
              <ThemedButton
                variant="ghost"
                className="w-10 p-0 m-0"
                disabled={!router.canGoBack()}
                onPress={() => router.back()}
              >
                {"<"}
              </ThemedButton>
              <ThemedText type="subtitle">{decodedTitle}</ThemedText>
            </View>
          </ThemedView>

          <ThemedView
            variant="transparent"
            className="flex-1"
            style={{ padding: 0 }}
          >
            <ThemedView variant="transparent" className="mb-4">
              <View className="flex-row gap-2 mb-1">
                <ThemedText type="muted">Session ID:</ThemedText>
                <ThemedText type="info">{sessionId}</ThemedText>
              </View>
              <View className="flex-row gap-2 mb-1">
                <ThemedText type="muted">Port:</ThemedText>
                <ThemedText type="info">{port}</ThemedText>
              </View>
            </ThemedView>

            {loading ? (
              <View className="p-8 items-center">
                <ThemedText type="muted">Loading messages...</ThemedText>
              </View>
            ) : messages.length === 0 ? (
              <View className="p-8 items-center gap-2">
                <ThemedText type="muted">No messages in this session</ThemedText>
                <ThemedText type="dim">Messages will appear here when the session is active</ThemedText>
              </View>
            ) : (
              <ScrollView className="flex-1" nestedScrollEnabled>
                {messages.map((message) => {
                  const status = getMessageStatus(message);
                  const isUser = message.info.role === "user";

                  return (
                    <View key={message.info.id} className="mb-4">
                      <ThemedView
                        variant={isUser ? "code-block" : "transparent"}
                        className="p-3"
                      >
                        <ThemedText className="font-mono text-sm leading-[20px] text-terminal-text mb-2">
                          {getMessagePreview(message.parts)}
                        </ThemedText>
                        <View className="flex-row justify-between items-center">
                          <ThemedText type="dim" className="text-[10px]">
                            {formatTime(message.info.time.created)}
                          </ThemedText>
                          <ThemedText
                            type="dim"
                            style={{ color: getStatusColor(status), fontSize: 10 }}
                          >
                            {status}
                          </ThemedText>
                        </View>
                      </ThemedView>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Message Input */}
            <ThemedView variant="transparent" className="mt-4">
              <View className="flex-row gap-2 items-center">
                <ThemedInput
                  className="flex-1 rounded-none"
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  placeholder="Type a message..."
                  onSubmitEditing={sendMessage}
                />
                <ThemedButton
                  variant="primary"
                  className={`min-w-16 ${isSending ? "opacity-50" : "opacity-100"}`}
                  onPress={sendMessage}
                  disabled={isSending || !inputMessage.trim()}
                >
                  {isSending ? "..." : "Send"}
                </ThemedButton>
              </View>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}



