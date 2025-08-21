interface PingResponse {
  ok: boolean;
}

interface PortsResponse {
  ports: number[];
}

interface AppWithPort extends AppResponse {
  port: number;
}

interface AppResponse {
  hostname: string;
  time: Record<string, any>;
  git: boolean;
  path: {
    config: string;
    state: string;
    data: string;
    root: string;
    cwd: string;
  };
}

export const api = {
  ping: async (serverUrl: string): Promise<PingResponse> => {
    const response = await fetch(`${serverUrl}/ping`, {
      method: "GET",
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return response.json();
  },

  getPorts: async (serverUrl: string): Promise<AppWithPort[]> => {
    const response = await fetch(`${serverUrl}/ports`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const portsData: PortsResponse = await response.json();
    const ports = portsData.ports || [];

    const appDataPromises = ports.map(async (port) => {
      try {
        const appData = await api.getApp(serverUrl, port);
        return { ...appData, port };
      } catch (error) {
        throw new Error(`Failed to fetch app data for port ${port}: ${error}`);
      }
    });

    return Promise.all(appDataPromises);
  },

  getApp: async (serverUrl: string, port: number): Promise<AppResponse> => {
    const url = new URL(serverUrl);
    const host = url.hostname;
    const protocol = url.protocol;

    const apiUrl = `${protocol}//${host}:${port}/app`;

    console.log(`fetching app info: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};
