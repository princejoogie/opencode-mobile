import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { proxy } from "hono/proxy";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/ping", (c) => c.json({ ok: true }));

app.get("/ports", async (c) => {
  const { stdout } = await execAsync(
    "netstat -p tcp -van | grep '^Proto\\|LISTEN' | grep opencode",
  );

  const lines = stdout
    .trim()
    .split("\n")
    .filter((line) => line.trim());
  const ports: number[] = [];

  lines.forEach((line) => {
    const match = line.match(/127\.0\.0\.1\.(\d+)/);
    if (match) {
      const port = parseInt(match[1]);
      if (!isNaN(port)) {
        ports.push(port);
      }
    }
  });

  return c.json({ ports });
});

app.all("/opencode/:port/:path{.+}", async (c) => {
  const port = c.req.param("port");
  const path = c.req.param("path");
  return proxy(`http://localhost:${port}/${path}`);
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
  },
);
