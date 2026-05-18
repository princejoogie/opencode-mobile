import type { MessageWithParts } from "./opencode-format";

export const opencodeKeys = {
  all: (serverID: string) => ["opencode", serverID] as const,
  health: (serverID: string) => ["opencode", serverID, "health"] as const,
  projects: (serverID: string) => ["opencode", serverID, "projects"] as const,
  providers: (serverID: string, directory: string) => ["opencode", serverID, "providers", directory] as const,
  agents: (serverID: string, directory: string) => ["opencode", serverID, "agents", directory] as const,
  sessions: (serverID: string, directory: string) => ["opencode", serverID, "sessions", directory] as const,
  session: (serverID: string, directory: string, sessionID: string) =>
    ["opencode", serverID, "session", directory, sessionID] as const,
  status: (serverID: string, directory: string) => ["opencode", serverID, "status", directory] as const,
  messages: (serverID: string, directory: string, sessionID: string) =>
    ["opencode", serverID, "messages", directory, sessionID] as const,
};

function compareIDs(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function upsertMessage(list: MessageWithParts[] | undefined, item: MessageWithParts) {
  const current = list ? [...list] : [];
  const index = current.findIndex((message) => message.info.id === item.info.id);

  if (index === -1) {
    current.push(item);
  } else {
    current[index] = {
      info: item.info,
      parts: item.parts.length > 0 ? item.parts : current[index].parts,
    };
  }

  current.sort((a, b) => compareIDs(a.info.id, b.info.id));
  return current;
}
