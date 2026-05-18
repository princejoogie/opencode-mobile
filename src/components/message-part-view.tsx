import { useState } from "react";
import { Text, View } from "react-native";
import type { Message, Part, Provider, ToolState } from "@opencode-ai/sdk/v2/client";
import { NativeButton } from "./native-control";
import { AppText, Card, Pill, useTheme } from "./surface";
import { formatDateTime, providerModelName } from "@/lib/opencode-format";

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

function PartView({ part }: { part: Part }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(part.type === "text");

  if (part.type === "text") {
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
          <AppText variant="headline" color={theme.purple}>
            Thinking
          </AppText>
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
        {(input || output) && !expanded ? <NativeButton title="Show full tool call" icon="expand" variant="plain" onPress={() => setExpanded(true)} /> : null}
      </Card>
    );
  }

  if (part.type === "file") {
    const sourcePath = part.source && "path" in part.source ? part.source.path : undefined;

    return (
      <Card style={{ padding: 12 }}>
        <AppText variant="headline">{part.filename || sourcePath || "File"}</AppText>
        <AppText variant="caption" color={theme.muted} selectable>
          {part.mime} {part.url}
        </AppText>
      </Card>
    );
  }

  if (part.type === "step-finish") {
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Pill>{part.reason}</Pill>
        <Pill>{`$${part.cost.toFixed(4)}`}</Pill>
        <Pill>{`${part.tokens.input + part.tokens.output} tokens`}</Pill>
      </View>
    );
  }

  if (part.type === "subtask") {
    return (
      <Card style={{ padding: 12 }}>
        <AppText variant="headline">Subtask: {part.description}</AppText>
        <AppText color={theme.muted}>{part.prompt}</AppText>
      </Card>
    );
  }

  if (part.type === "agent") return <Pill tone="accent">Agent {part.name}</Pill>;
  if (part.type === "retry") return <Pill tone="warning">Retry {part.attempt}</Pill>;
  if (part.type === "compaction") return <Pill tone="warning">Compaction</Pill>;
  if (part.type === "snapshot") return <Pill>Snapshot</Pill>;
  if (part.type === "patch") return <Pill>{`${part.files.length} changed files`}</Pill>;
  if (part.type === "step-start") return <Pill>Step started</Pill>;

  return null;
}

export function MessageBubble({ message, parts, providers }: { message: Message; parts: Part[]; providers?: Provider[] }) {
  const theme = useTheme();
  const isUser = message.role === "user";
  const modelName =
    message.role === "assistant"
      ? providerModelName(providers, message.providerID, message.modelID)
      : providerModelName(providers, message.model.providerID, message.model.modelID);

  return (
    <View style={{ alignItems: isUser ? "flex-end" : "stretch", gap: 6 }}>
      <View style={{ maxWidth: isUser ? "88%" : "100%", minWidth: isUser ? "40%" : undefined }}>
        <Card
          style={{
            backgroundColor: isUser ? `${theme.accent}22` : theme.card,
            borderColor: isUser ? `${theme.accent}55` : theme.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <Pill tone={isUser ? "accent" : "neutral"}>{isUser ? "You" : message.agent || "Assistant"}</Pill>
            <AppText variant="caption" color={theme.muted}>
              {formatDateTime(message.time.created)}
            </AppText>
          </View>
          {modelName ? (
            <AppText variant="caption" color={theme.subtle}>
              {modelName}
            </AppText>
          ) : null}
          {parts.length === 0 ? (
            <AppText color={theme.muted}>{message.role === "assistant" && !message.time.completed ? "Thinking..." : "No content"}</AppText>
          ) : (
            <View style={{ gap: 10 }}>
              {parts.map((part) => (
                <PartView key={part.id} part={part} />
              ))}
            </View>
          )}
          {message.role === "assistant" && message.error ? <Pill tone="danger">{message.error.name}</Pill> : null}
        </Card>
      </View>
    </View>
  );
}
