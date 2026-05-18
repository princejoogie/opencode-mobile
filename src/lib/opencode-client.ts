import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import type { OpencodeClient, OpencodeClientConfig } from "@opencode-ai/sdk/v2/client";
import type { ServerConnection } from "@/store/servers";

function toBinary(value: string) {
  return encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

function base64(value: string) {
  if (typeof btoa === "function") return btoa(value);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let i = 0; i < value.length; i += 3) {
    const a = value.charCodeAt(i);
    const b = value.charCodeAt(i + 1);
    const c = value.charCodeAt(i + 2);
    const triplet = (a << 16) | ((b || 0) << 8) | (c || 0);

    output += chars[(triplet >> 18) & 63];
    output += chars[(triplet >> 12) & 63];
    output += Number.isNaN(b) ? "=" : chars[(triplet >> 6) & 63];
    output += Number.isNaN(c) ? "=" : chars[triplet & 63];
  }

  return output;
}

export function normalizeServerUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function serverName(server: Pick<ServerConnection, "url" | "displayName">) {
  if (server.displayName?.trim()) return server.displayName.trim();
  return server.url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export function createOpencodeSdk(
  server: ServerConnection,
  options: Omit<OpencodeClientConfig, "baseUrl" | "headers"> & { directory?: string } = {},
): OpencodeClient {
  const auth = server.password
    ? { Authorization: `Basic ${base64(toBinary(`${server.username || "opencode"}:${server.password}`))}` }
    : undefined;

  return createOpencodeClient({
    ...options,
    baseUrl: server.url,
    headers: {
      ...auth,
    },
    throwOnError: true,
  });
}
