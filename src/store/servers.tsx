import * as SecureStore from "expo-secure-store";
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { normalizeServerUrl } from "@/lib/opencode-client";

const STORAGE_KEY = "opencode-mobile.servers.v1";

export type ServerConnection = {
  id: string;
  url: string;
  displayName?: string;
  username?: string;
  password?: string;
  createdAt: number;
  updatedAt: number;
};

type AddServerInput = {
  url: string;
  displayName?: string;
  username?: string;
  password?: string;
};

type ServerContextValue = {
  ready: boolean;
  servers: ServerConnection[];
  addServer: (input: AddServerInput) => Promise<ServerConnection>;
  removeServer: (id: string) => Promise<void>;
  updateServer: (id: string, patch: Partial<AddServerInput>) => Promise<void>;
  getServer: (id: string) => ServerConnection | undefined;
};

const ServerContext = createContext<ServerContextValue | null>(null);

function createServerID() {
  return `srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readStoredServers() {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) return [];

    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as ServerConnection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStoredServers(servers: ServerConnection[]) {
  const available = await SecureStore.isAvailableAsync();
  if (!available) return;
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(servers));
}

export function ServerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [servers, setServers] = useState<ServerConnection[]>([]);

  useEffect(() => {
    let alive = true;

    readStoredServers().then((stored) => {
      if (!alive) return;
      setServers(stored);
      setReady(true);
    });

    return () => {
      alive = false;
    };
  }, []);

  const commit = useCallback(async (next: ServerConnection[]) => {
    setServers(next);
    await writeStoredServers(next);
  }, []);

  const addServer = useCallback(
    async (input: AddServerInput) => {
      const url = normalizeServerUrl(input.url);
      if (!url) throw new Error("Enter an opencode server URL");

      const now = Date.now();
      const existing = servers.find((server) => server.url === url);
      const server: ServerConnection = {
        id: existing?.id ?? createServerID(),
        url,
        displayName: input.displayName?.trim() || undefined,
        username: input.username?.trim() || undefined,
        password: input.password || undefined,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      const next = existing
        ? servers.map((item) => (item.id === existing.id ? server : item))
        : [server, ...servers];

      await commit(next);
      return server;
    },
    [commit, servers],
  );

  const removeServer = useCallback(
    async (id: string) => {
      await commit(servers.filter((server) => server.id !== id));
    },
    [commit, servers],
  );

  const updateServer = useCallback(
    async (id: string, patch: Partial<AddServerInput>) => {
      const now = Date.now();
      await commit(
        servers.map((server) => {
          if (server.id !== id) return server;

          return {
            ...server,
            url: patch.url ? normalizeServerUrl(patch.url) : server.url,
            displayName: patch.displayName?.trim() || server.displayName,
            username: patch.username?.trim() || server.username,
            password: patch.password ?? server.password,
            updatedAt: now,
          };
        }),
      );
    },
    [commit, servers],
  );

  const getServer = useCallback(
    (id: string) => servers.find((server) => server.id === id),
    [servers],
  );

  const value = useMemo(
    () => ({ ready, servers, addServer, removeServer, updateServer, getServer }),
    [addServer, getServer, ready, removeServer, servers, updateServer],
  );

  return <ServerContext value={value}>{children}</ServerContext>;
}

export function useServers() {
  const context = use(ServerContext);
  if (!context) throw new Error("useServers must be used within ServerProvider");
  return context;
}
