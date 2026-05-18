import type { Agent, ConfigProvidersResponse, Message, Part, Provider, Session, SessionStatus } from "@opencode-ai/sdk/v2/client";

export type MessageWithParts = {
  info: Message;
  parts: Part[];
};

export function projectDisplayName(project: { name?: string; worktree: string }) {
  if (project.name?.trim()) return project.name.trim();
  return filename(project.worktree);
}

export function filename(path: string) {
  return path.replace(/\/+$/, "").split("/").filter(Boolean).at(-1) || path || "Unknown";
}

export function formatRelativeTime(timestamp?: number) {
  if (!timestamp) return "Never";

  const delta = timestamp - Date.now();
  const abs = Math.abs(delta);
  const past = delta < 0;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const unit =
    abs < minute
      ? [Math.max(1, Math.round(abs / 1000)), "second"]
      : abs < hour
        ? [Math.round(abs / minute), "minute"]
        : abs < day
          ? [Math.round(abs / hour), "hour"]
          : [Math.round(abs / day), "day"];
  const value = unit[0] as number;
  const label = `${unit[1]}${value === 1 ? "" : "s"}`;

  if (value <= 1 && unit[1] === "second") return past ? "just now" : "now";
  return past ? `${value} ${label} ago` : `in ${value} ${label}`;
}

export function formatDateTime(timestamp?: number) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function sessionTitle(session?: Pick<Session, "title">) {
  return session?.title?.trim() || "New session";
}

export function sessionWorking(status?: SessionStatus) {
  return !!status && status.type !== "idle";
}

export function providerModelName(providers: Provider[] | undefined, providerID?: string, modelID?: string) {
  if (!providerID || !modelID) return undefined;
  const provider = providers?.find((item) => item.id === providerID);
  return provider?.models[modelID]?.name || modelID;
}

export function chooseDefaultAgent(agents: Agent[] | undefined) {
  return agents?.find((agent) => !agent.hidden && agent.mode !== "subagent") ?? agents?.find((agent) => !agent.hidden);
}

export function chooseDefaultModel(providers: ConfigProvidersResponse | undefined) {
  if (!providers) return undefined;

  for (const [providerID, modelID] of Object.entries(providers.default)) {
    const provider = providers.providers.find((item) => item.id === providerID);
    if (provider?.models[modelID]) return { providerID, modelID };
  }

  for (const provider of providers.providers) {
    const model = Object.values(provider.models).find((item) => item.status === "active") ?? Object.values(provider.models)[0];
    if (model) return { providerID: provider.id, modelID: model.id };
  }

  return undefined;
}

export function messageText(parts: Part[] | undefined) {
  return (parts ?? [])
    .filter((part): part is Extract<Part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function messagePreview(message: MessageWithParts) {
  const text = messageText(message.parts);
  if (text) return text.length > 140 ? `${text.slice(0, 140)}...` : text;

  const tool = message.parts.find((part): part is Extract<Part, { type: "tool" }> => part.type === "tool");
  if (tool) return `${tool.tool} ${tool.state.status}`;

  const reasoning = message.parts.find((part): part is Extract<Part, { type: "reasoning" }> => part.type === "reasoning");
  if (reasoning?.text) return reasoning.text.length > 140 ? `${reasoning.text.slice(0, 140)}...` : reasoning.text;

  return message.info.role === "assistant" ? "Assistant response" : "Prompt";
}

export function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }

  if (error instanceof Error) return error.message;
  return "Request failed";
}
