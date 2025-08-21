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

interface ToastRequest {
  title: string;
  message: string;
  variant: "info" | "success" | "warning" | "error";
}

interface SessionInfo {
  id: string;
  title: string;
  time: {
    created: number;
    updated: number;
  };
  parent?: string;
  shared?: boolean;
}

// Base message types from OpenAPI schema
interface UserMessage {
  id: string;
  sessionID: string;
  role: "user";
  time: {
    created: number;
  };
}

interface AssistantMessage {
  id: string;
  sessionID: string;
  role: "assistant";
  time: {
    created: number;
    completed?: number;
  };
  error?: {
    name: string;
    data: Record<string, any>;
  };
  system: string[];
  modelID: string;
  providerID: string;
  mode: string;
  path: {
    cwd: string;
    root: string;
  };
  summary?: boolean;
  cost: number;
  tokens: {
    input: number;
    output: number;
    reasoning: number;
    cache: {
      read: number;
      write: number;
    };
  };
}

type MessageInfo = UserMessage | AssistantMessage;

// Tool state types from OpenAPI schema
interface ToolStatePending {
  status: "pending";
}

interface ToolStateRunning {
  status: "running";
  input?: any;
  title?: string;
  metadata?: Record<string, any>;
  time: {
    start: number;
  };
}

interface ToolStateCompleted {
  status: "completed";
  input: Record<string, any>;
  output: string;
  title: string;
  metadata: Record<string, any>;
  time: {
    start: number;
    end: number;
  };
}

interface ToolStateError {
  status: "error";
  input: Record<string, any>;
  error: string;
  metadata?: Record<string, any>;
  time: {
    start: number;
    end: number;
  };
}

type ToolState = ToolStatePending | ToolStateRunning | ToolStateCompleted | ToolStateError;

// Part types from OpenAPI schema
interface TextPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "text";
  text: string;
  synthetic?: boolean;
  time?: {
    start: number;
    end?: number;
  };
}

interface ReasoningPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "reasoning";
  text: string;
  metadata?: Record<string, any>;
  time: {
    start: number;
    end?: number;
  };
}

interface FilePart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "file";
  mime: string;
  filename?: string;
  url: string;
  source?: {
    type: "file" | "symbol";
    path: string;
    text: {
      value: string;
      start: number;
      end: number;
    };
  };
}

interface ToolPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "tool";
  callID: string;
  tool: string;
  state: ToolState;
}

interface StepStartPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "step-start";
}

interface StepFinishPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "step-finish";
  cost: number;
  tokens: {
    input: number;
    output: number;
    reasoning: number;
    cache: {
      read: number;
      write: number;
    };
  };
}

interface SnapshotPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "snapshot";
  snapshot: string;
}

interface PatchPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "patch";
  hash: string;
  files: string[];
}

interface AgentPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "agent";
  name: string;
  source?: {
    value: string;
    start: number;
    end: number;
  };
}

type MessagePart = TextPart | ReasoningPart | FilePart | ToolPart | StepStartPart | StepFinishPart | SnapshotPart | PatchPart | AgentPart;

interface Message {
  info: MessageInfo;
  parts: MessagePart[];
}

export type { 
  MessageInfo, 
  MessagePart, 
  Message, 
  ToolState, 
  ToolPart,
  TextPart,
  ToolStateCompleted 
};

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
    const apiUrl = `${serverUrl}/opencode/${port}/app`;

    console.log(`fetching app info: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  showToast: async (serverUrl: string, port: number, toast: ToastRequest): Promise<boolean> => {
    const apiUrl = `${serverUrl}/opencode/${port}/tui/show-toast`;

    console.log(`showing toast: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toast),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  getSessions: async (serverUrl: string, port: number): Promise<SessionInfo[]> => {
    const apiUrl = `${serverUrl}/opencode/${port}/session`;

    console.log(`fetching sessions: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  getSessionMessages: async (serverUrl: string, port: number, sessionId: string): Promise<Message[]> => {
    const apiUrl = `${serverUrl}/opencode/${port}/session/${sessionId}/message`;

    console.log(`fetching messages: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  getSessionMessage: async (serverUrl: string, port: number, sessionId: string, messageId: string): Promise<Message> => {
    const apiUrl = `${serverUrl}/opencode/${port}/session/${sessionId}/message/${messageId}`;

    console.log(`fetching message details: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};
