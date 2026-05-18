import { useEffect, useState } from "react";
import { Text, View, Pressable, Modal, Image, ScrollView, StyleSheet } from "react-native";
import { SymbolView } from "expo-symbols";
import { BlurView } from "expo-blur";
import type { Message, Part, Provider, ToolState, FilePart } from "@opencode-ai/sdk/v2/client";
import { NativeButton } from "./native-control";
import { AppText, Card, Pill, useTheme } from "./surface";

function FilePartView({ part }: { part: FilePart }) {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);

  const sourcePath = part.source && "path" in part.source ? part.source.path : undefined;
  const fileName = part.filename || sourcePath || "File";
  const isImage = part.mime.startsWith("image/");
  const iconName = isImage ? "photo" : "doc.text";

  useEffect(() => {
    if (modalVisible && !isImage && part.url) {
      if (part.url.startsWith("data:")) {
        try {
          const base64Data = part.url.split(",")[1];
          if (base64Data) {
            // Very naive base64 decode for text, might not handle utf-8 perfectly but enough for basic preview
            const decoded = atob(base64Data);
            setTextContent(decoded);
          }
        } catch {
          setTextContent("Failed to decode file content.");
        }
      } else {
        fetch(part.url)
          .then((res) => res.text())
          .then(setTextContent)
          .catch(() => setTextContent("Failed to fetch file content."));
      }
    }
  }, [modalVisible, isImage, part.url]);

  return (
    <>
      <Pressable 
        onPress={() => setModalVisible(true)}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.card, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignSelf: "flex-start" }}
      >
        <SymbolView name={iconName} size={14} tintColor={theme.muted} />
        <AppText variant="caption" style={{ fontSize: 13, color: theme.text }} numberOfLines={1}>{fileName}</AppText>
      </Pressable>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setModalVisible(false)} />
          <BlurView intensity={90} tint={theme.dark ? "dark" : "light"} style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', padding: 24, paddingBottom: 48, minHeight: 300, maxHeight: '85%' }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <AppText variant="headline" numberOfLines={1} style={{ flex: 1, marginRight: 16 }}>{fileName}</AppText>
              <Pressable onPress={() => setModalVisible(false)} style={{ padding: 6, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                <SymbolView name="xmark" size={14} tintColor={theme.text} />
              </Pressable>
            </View>
            
            {isImage ? (
              <Image source={{ uri: part.url }} style={{ width: '100%', height: 400, resizeMode: 'contain', borderRadius: 12 }} />
            ) : (
              <ScrollView style={{ backgroundColor: theme.card, borderRadius: 12, padding: 12, borderColor: theme.border, borderWidth: 1 }}>
                <AppText style={{ fontSize: 13, fontFamily: "GeistMono" }}>{textContent || "Loading..."}</AppText> 
              </ScrollView>
            )}
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

function compactJSON(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function statusTone(status: ToolState["status"]) {
  if (status === "completed") return "success" as const;
  if (status === "error") return "danger" as const;
  if (status === "running") return "warning" as const;
  return "neutral" as const;
}

function PartView({ part, isUser }: { part: Part; isUser?: boolean }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(part.type === "text");

  if (part.type === "text") {
    if (isUser) {
      return (
        <AppText selectable style={{ fontSize: 15, lineHeight: 23 }}>
          {part.text || " "}
        </AppText>
      );
    }
    return (
      <AppText selectable style={{ fontSize: 15, lineHeight: 23 }}>
        {part.text || " "}
      </AppText>
    );
  }

  if (part.type === "reasoning") {
    return (
      <Card style={{ backgroundColor: theme.elevated, padding: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AppText variant="headline" color={theme.purple}>
              Thinking
            </AppText>
          </View>
          <NativeButton title={expanded ? "Hide" : "Show"} icon={expanded ? "collapse" : "expand"} variant="plain" onPress={() => setExpanded((value) => !value)} />
        </View>
        {expanded ? (
          <AppText selectable color={theme.muted} style={{ fontSize: 14, lineHeight: 21 }}>
            {part.text || "Thinking..."}
          </AppText>
        ) : null}
      </Card>
    );
  }

  if (part.type === "tool") {
    const state = part.state;
    const input = "input" in state ? compactJSON(state.input) : "";
    const output = state.status === "completed" ? state.output : state.status === "error" ? state.error : "";
    const title = ("title" in state && state.title) || part.tool;

    return (
      <Card style={{ backgroundColor: theme.elevated, padding: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="headline">{title}</AppText>
            <AppText variant="caption" color={theme.muted}>
              {part.tool}
            </AppText>
          </View>
          <Pill tone={statusTone(state.status)}>{state.status}</Pill>
        </View>
        {input ? (
          <Text selectable style={{ color: theme.muted, fontFamily: "GeistMono", fontSize: 12, lineHeight: 17 }} numberOfLines={expanded ? undefined : 4}>
            {input}
          </Text>
        ) : null}
        {output ? (
          <Text selectable style={{ color: state.status === "error" ? theme.danger : theme.text, fontFamily: "GeistMono", fontSize: 12, lineHeight: 17 }} numberOfLines={expanded ? undefined : 6}>
            {output}
          </Text>
        ) : null}
        {(input || output) ? <NativeButton title={expanded ? "Hide tool call" : "Show full tool call"} icon={expanded ? "collapse" : "expand"} variant="plain" onPress={() => setExpanded(!expanded)} /> : null}
      </Card>
    );
  }

  if (part.type === "file") {
    return <FilePartView part={part} />;
  }

  if (part.type === "subtask") {
    return (
      <Card style={{ padding: 12 }}>
        <AppText variant="headline">Subtask: {part.description}</AppText>
        <AppText color={theme.muted}>{part.prompt}</AppText>
      </Card>
    );
  }

  if (part.type === "step-finish" || part.type === "step-start" || part.type === "agent" || part.type === "retry" || part.type === "compaction" || part.type === "snapshot" || part.type === "patch") {
    return null;
  }

  return null;
}

export function MessageBubble({ message, parts, providers, showThinking, showToolCalls }: { message: Message; parts: Part[]; providers?: Provider[]; showThinking?: boolean; showToolCalls?: boolean }) {
  const theme = useTheme();
  const visibleParts = parts.filter((part) => {
    if (part.type === "reasoning" && !showThinking) return false;
    if (part.type === "tool" && !showToolCalls) return false;
    if (part.type !== "text" && part.type !== "reasoning" && part.type !== "tool" && part.type !== "file" && part.type !== "subtask") return false;
    return true;
  });

  if (message.role === "user") {
    return (
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={{ maxWidth: "88%" }}>
          <Card
            style={{
              backgroundColor: `${theme.accent}22`,
              borderColor: `${theme.accent}55`,
            }}
          >
            {visibleParts.length === 0 ? (
              <AppText color={theme.muted}>No content</AppText>
            ) : (
              <View style={{ gap: 10 }}>
                {visibleParts.map((part) => (
                  <PartView key={part.id} part={part} isUser />
                ))}
              </View>
            )}
          </Card>
        </View>
      </View>
    );
  }

  if (visibleParts.length === 0 && !message.error) return null;

  return (
    <View style={{ alignItems: "stretch", gap: 8 }}>
      {visibleParts.length > 0 ? (
        <View style={{ gap: 10 }}>
          {visibleParts.map((part) => (
            <PartView key={part.id} part={part} />
          ))}
        </View>
      ) : null}
      {message.error ? (
        <View style={{ alignSelf: "flex-start" }}>
          <Pill tone="danger">{message.error.name}</Pill>
        </View>
      ) : null}
    </View>
  );
}
