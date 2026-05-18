import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Event, GlobalEvent, Message, Part, Session, SessionStatus } from "@opencode-ai/sdk/v2/client";
import { createOpencodeSdk } from "@/lib/opencode-client";
import type { MessageWithParts } from "@/lib/opencode-format";
import { opencodeKeys, upsertMessage } from "@/lib/opencode-queries";
import type { ServerConnection } from "@/store/servers";

function updateSession(list: Session[] | undefined, session: Session, action: "upsert" | "remove") {
  const current = list ? [...list] : [];
  const index = current.findIndex((item) => item.id === session.id);

  if (action === "remove" || session.time.archived) {
    if (index !== -1) current.splice(index, 1);
    return current;
  }

  if (index === -1) current.push(session);
  else current[index] = session;

  current.sort((a, b) => b.time.updated - a.time.updated);
  return current;
}

function upsertPart(list: MessageWithParts[] | undefined, part: Part) {
  if (!list) return list;

  return list.map((message) => {
    if (message.info.id !== part.messageID) return message;

    const parts = [...message.parts];
    const index = parts.findIndex((item) => item.id === part.id);
    if (index === -1) parts.push(part);
    else parts[index] = part;

    parts.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return { ...message, parts };
  });
}

function removePart(list: MessageWithParts[] | undefined, messageID: string, partID: string) {
  if (!list) return list;

  return list.map((message) => {
    if (message.info.id !== messageID) return message;
    return { ...message, parts: message.parts.filter((part) => part.id !== partID) };
  });
}

function appendPartDelta(list: MessageWithParts[] | undefined, messageID: string, partID: string, field: string, delta: string) {
  if (!list) return list;

  return list.map((message) => {
    if (message.info.id !== messageID) return message;

    return {
      ...message,
      parts: message.parts.map((part) => {
        if (part.id !== partID) return part;

        const current = (part as unknown as Record<string, unknown>)[field];
        if (typeof current !== "string") return part;
        return { ...part, [field]: current + delta } as Part;
      }),
    };
  });
}

export function useOpencodeEvents(server: ServerConnection | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!server) return;

    const currentServer = server;
    const abort = new AbortController();
    const client = createOpencodeSdk(currentServer, { signal: abort.signal } as never);

    async function run() {
      while (!abort.signal.aborted) {
        try {
          const events = await client.global.event({ signal: abort.signal } as never);

          for await (const item of events.stream as AsyncIterable<GlobalEvent>) {
            if (abort.signal.aborted) return;
            const directory = item.directory || "global";
            const event = item.payload as Event;

            if (directory === "global") {
              if (event.type === "project.updated" || event.type === "server.connected" || event.type === "global.disposed") {
                queryClient.invalidateQueries({ queryKey: opencodeKeys.projects(currentServer.id) });
              }
              continue;
            }

            switch (event.type) {
              case "project.updated":
                queryClient.invalidateQueries({ queryKey: opencodeKeys.projects(currentServer.id) });
                break;

              case "session.created":
              case "session.updated": {
                const info = (event.properties as { info?: Session }).info;
                if (!info) break;
                queryClient.setQueryData<Session[]>(opencodeKeys.sessions(currentServer.id, directory), (current) =>
                  updateSession(current, info, "upsert"),
                );
                queryClient.setQueryData(opencodeKeys.session(currentServer.id, directory, info.id), info);
                break;
              }

              case "session.deleted": {
                const info = (event.properties as { info?: Session }).info;
                if (!info) break;
                queryClient.setQueryData<Session[]>(opencodeKeys.sessions(currentServer.id, directory), (current) =>
                  updateSession(current, info, "remove"),
                );
                queryClient.removeQueries({ queryKey: opencodeKeys.messages(currentServer.id, directory, info.id) });
                break;
              }

              case "session.status": {
                const props = event.properties as { sessionID?: string; status?: SessionStatus };
                if (!props.sessionID || !props.status) break;
                queryClient.setQueryData<Record<string, SessionStatus>>(opencodeKeys.status(currentServer.id, directory), (current) => ({
                  ...(current ?? {}),
                  [props.sessionID!]: props.status!,
                }));
                break;
              }

              case "message.updated": {
                const info = (event.properties as { info?: Message }).info;
                if (!info) break;
                queryClient.setQueryData<MessageWithParts[]>(opencodeKeys.messages(currentServer.id, directory, info.sessionID), (current) =>
                  upsertMessage(current, { info, parts: current?.find((item) => item.info.id === info.id)?.parts ?? [] }),
                );
                break;
              }

              case "message.removed": {
                const props = event.properties as { sessionID?: string; messageID?: string };
                if (!props.sessionID || !props.messageID) break;
                queryClient.setQueryData<MessageWithParts[]>(opencodeKeys.messages(currentServer.id, directory, props.sessionID), (current) =>
                  current?.filter((item) => item.info.id !== props.messageID) ?? current,
                );
                break;
              }

              case "message.part.updated": {
                const part = (event.properties as { part?: Part }).part;
                if (!part) break;
                queryClient.setQueryData<MessageWithParts[]>(opencodeKeys.messages(currentServer.id, directory, part.sessionID), (current) =>
                  upsertPart(current, part),
                );
                break;
              }

              case "message.part.removed": {
                const props = event.properties as { sessionID?: string; messageID?: string; partID?: string };
                if (!props.sessionID || !props.messageID || !props.partID) break;
                queryClient.setQueryData<MessageWithParts[]>(opencodeKeys.messages(currentServer.id, directory, props.sessionID), (current) =>
                  removePart(current, props.messageID!, props.partID!),
                );
                break;
              }

              case "message.part.delta": {
                const props = event.properties as {
                  sessionID?: string;
                  messageID?: string;
                  partID?: string;
                  field?: string;
                  delta?: string;
                };
                if (!props.sessionID || !props.messageID || !props.partID || !props.field || !props.delta) break;
                queryClient.setQueryData<MessageWithParts[]>(opencodeKeys.messages(currentServer.id, directory, props.sessionID), (current) =>
                  appendPartDelta(current, props.messageID!, props.partID!, props.field!, props.delta!),
                );
                break;
              }
            }
          }
        } catch (error) {
          if (abort.signal.aborted) return;
          console.warn("[opencode-events] reconnecting after event stream failure", error);
          await new Promise((resolve) => setTimeout(resolve, 750));
        }
      }
    }

    run();

    return () => {
      abort.abort();
    };
  }, [queryClient, server]);
}
