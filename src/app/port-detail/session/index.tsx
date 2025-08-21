import { Alert, ScrollView } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { api, type Message, type MessagePart, type ToolPart } from "@/lib/api";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { useState, useEffect, useCallback } from "react";

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
    return new Date(timestamp).toLocaleString();
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
            content.substring(0, 500) + (content.length > 500 ? "..." : "")
          );
        }
      }

      // Check for tool output that might have text content
      if (part.type === "tool" && part.state.status === "completed") {
        const content = part.state.output;
        if (content && content.trim()) {
          return (
            content.substring(0, 500) + (content.length > 500 ? "..." : "")
          );
        }
      }
    }

    // Show part types for debugging if no content found
    return `${parts.length} part(s): ${parts.map((p) => p.type).join(", ")}`;
  };

  const decodedTitle = title ? decodeURIComponent(title) : "Untitled Session";

  return (
    <>
      <Stack.Screen
        options={{
          title: decodedTitle,
          headerShown: true,
        }}
      />
      <ScrollView className="flex-1 p-4">
        <ThemedView style={{ gap: 16 }}>
          <ThemedView variant="card">
            <ThemedText style={{ fontWeight: "600", marginBottom: 8 }}>
              Session Details
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
              ID: {sessionId}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
              Port: {port}
            </ThemedText>
          </ThemedView>

          <ThemedView>
            <ThemedText
              style={{ fontSize: 18, fontWeight: "600", marginBottom: 16 }}
            >
              Messages ({messages.length})
            </ThemedText>

            {loading && <ThemedText>Loading messages...</ThemedText>}

            {!loading && messages.length === 0 && (
              <ThemedText
                style={{ opacity: 0.6, textAlign: "center", marginTop: 32 }}
              >
                No messages in this session
              </ThemedText>
            )}

            {messages.map((message) => {
              const status = getMessageStatus(message);
              return (
                <ThemedView
                  key={message.info.id}
                  lightColor={
                    message.info.role === "user" ? "#eff6ff" : "#f9fafb"
                  }
                  darkColor={
                    message.info.role === "user" ? "#1e3a8a" : "#374151"
                  }
                  style={{
                    padding: 16,
                    marginBottom: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      message.info.role === "user" ? "#dbeafe" : "#f3f4f6",
                  }}
                >
                  <ThemedView
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <ThemedText
                      style={{
                        fontWeight: "600",
                        color:
                          message.info.role === "user" ? "#1d4ed8" : "#374151",
                      }}
                    >
                      {message.info.role === "user" ? "User" : "Assistant"}
                    </ThemedText>
                    <ThemedView
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        backgroundColor:
                          status === "complete"
                            ? "#dcfce7"
                            : status === "error"
                              ? "#fee2e2"
                              : status === "streaming"
                                ? "#fef3c7"
                                : "#f3f4f6",
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 10,
                          fontWeight: "500",
                          color:
                            status === "complete"
                              ? "#166534"
                              : status === "error"
                                ? "#dc2626"
                                : status === "streaming"
                                  ? "#d97706"
                                  : "#6b7280",
                        }}
                      >
                        {status}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedText
                    style={{ fontSize: 14, marginBottom: 8, lineHeight: 20 }}
                  >
                    {getMessagePreview(message.parts)}
                  </ThemedText>

                  <ThemedText style={{ fontSize: 11, opacity: 0.6 }}>
                    {formatTime(message.info.time.created)}
                  </ThemedText>
                </ThemedView>
              );
            })}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </>
  );
}

