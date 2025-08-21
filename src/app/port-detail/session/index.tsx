import { Alert, ScrollView, View } from "react-native";
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
             backgroundColor: '#1a1a1a',
           },
           headerTintColor: '#00ff00',
          headerTitleStyle: {
            fontFamily: "monospace",
            fontSize: 16,
          },
        }}
      />
       <ThemedView className="flex-1 bg-terminal-bg">
         <ScrollView className="flex-1 p-4">
           <ThemedView variant="panel" className="flex-1">
            <ThemedView variant="panel-header">
              <ThemedText type="subtitle">Session Log</ThemedText>
              <ThemedText type="muted">{messages.length} messages</ThemedText>
            </ThemedView>
            <ThemedView variant="panel-content" style={{ padding: 0 }}>
               <ThemedView variant="code-block" className="mb-4">
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
                 <ScrollView className="max-h-[600px]" nestedScrollEnabled>
                  {messages.map((message, index) => {
                    const status = getMessageStatus(message);
                    const isUser = message.info.role === "user";
                    
                    return (
                       <View key={message.info.id} className="mb-4">
                         <View className="flex-row justify-between items-center mb-1">
                           <View className="flex-row items-center gap-2">
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
                           <View className="px-2 py-1">
                            <ThemedText 
                              type="dim" 
                              style={{ color: getStatusColor(status), fontSize: 10 }}
                            >
                              [{status}]
                            </ThemedText>
                          </View>
                        </View>
                        
                         <ThemedView variant="code-block" className="pl-14">
                           <ThemedText className="font-mono text-xs leading-[18px] text-terminal-text mb-2">
                             {getMessagePreview(message.parts)}
                           </ThemedText>
                           <ThemedText type="dim" className="text-[10px]">
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



