import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/ping", (c) => {
  return c.json({ ok: true });
});

app.get("/ports", async (c) => {
  try {
    const { stdout } = await execAsync("netstat -tulpn | grep opencode");

    // Parse the output to extract port numbers
    const lines = stdout
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const ports: number[] = [];

    lines.forEach((line) => {
      // Split by whitespace and find the local address column
      const columns = line.trim().split(/\s+/);
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        // Look for pattern like 127.0.0.1:37609 or 0.0.0.0:37609
        if (
          column.includes(":") &&
          (column.startsWith("127.0.0.1:") || column.startsWith("0.0.0.0:"))
        ) {
          const port = column.split(":")[1];
          if (port && !isNaN(Number(port))) {
            ports.push(parseInt(port));
          }
          break;
        }
      }
    });

    return c.json({ ports: [...new Set(ports)] });
  } catch (error: any) {
    return c.json(
      { error: "Failed to execute command", details: error.message },
      500,
    );
  }
});

// Handle proxy requests with path
app.all("/opencode/:port/:path{.+}", async (c) => {
  const port = c.req.param("port");
  const path = c.req.param("path") || "";

  console.log(`[PROXY] ${c.req.method} /opencode/${port}/${path}`);

  if (!port || isNaN(Number(port))) {
    console.log(`[PROXY ERROR] Invalid port: ${port}`);
    return c.json({ error: "Invalid port number" }, 400);
  }

  try {
    const targetUrl = `http://localhost:${port}/${path}`;
    const queryString = c.req.url.split("?")[1];
    const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
    
    console.log(`[PROXY] Forwarding to: ${finalUrl}`);

    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((value, key) => {
      if (!["host", "connection"].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    let body: any = undefined;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) {
      const contentType = c.req.header("content-type");
      if (contentType?.includes("application/json")) {
        body = JSON.stringify(await c.req.json());
      } else if (contentType?.includes("text/")) {
        body = await c.req.text();
      } else {
        body = await c.req.arrayBuffer();
      }
    }

    const response = await fetch(finalUrl, {
      method: c.req.method,
      headers,
      body,
    });

    console.log(`[PROXY] Response: ${response.status} ${response.statusText}`);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (
        !["connection", "content-encoding", "transfer-encoding"].includes(
          key.toLowerCase(),
        )
      ) {
        responseHeaders[key] = value;
      }
    });

    const responseBody = await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.log(`[PROXY ERROR] ${error.message}`);
    return c.json(
      { error: "Proxy request failed", details: error.message },
      502,
    );
  }
});

// Handle proxy requests without path (root)
app.all("/opencode/:port", async (c) => {
  const port = c.req.param("port");

  console.log(`[PROXY] ${c.req.method} /opencode/${port}`);

  if (!port || isNaN(Number(port))) {
    console.log(`[PROXY ERROR] Invalid port: ${port}`);
    return c.json({ error: "Invalid port number" }, 400);
  }

  try {
    const targetUrl = `http://localhost:${port}/`;
    const queryString = c.req.url.split("?")[1];
    const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;
    
    console.log(`[PROXY] Forwarding to: ${finalUrl}`);

    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((value, key) => {
      if (!["host", "connection"].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    let body: any = undefined;
    if (["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) {
      const contentType = c.req.header("content-type");
      if (contentType?.includes("application/json")) {
        body = JSON.stringify(await c.req.json());
      } else if (contentType?.includes("text/")) {
        body = await c.req.text();
      } else {
        body = await c.req.arrayBuffer();
      }
    }

    const response = await fetch(finalUrl, {
      method: c.req.method,
      headers,
      body,
    });

    console.log(`[PROXY] Response: ${response.status} ${response.statusText}`);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (
        !["connection", "content-encoding", "transfer-encoding"].includes(
          key.toLowerCase(),
        )
      ) {
        responseHeaders[key] = value;
      }
    });

    const responseBody = await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.log(`[PROXY ERROR] ${error.message}`);
    return c.json(
      { error: "Proxy request failed", details: error.message },
      502,
    );
  }
});

const PORT = process.env.PORT || 3000;

serve(
  {
    fetch: app.fetch,
    port: Number(PORT),
    hostname: "0.0.0.0",
  },
  () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`GET /ping - Health check`);
    console.log(`GET /ports - Returns opencode port numbers`);
    console.log(`ALL /opencode/:port/:path{.+} - Proxy to localhost:port/path`);
    console.log(`ALL /opencode/:port - Proxy to localhost:port/`);
  },
);
