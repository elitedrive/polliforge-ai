import { Hono } from "hono";
import { cors } from "hono/cors";

interface Env {
  ASSETS: Fetcher;
  POLLINATIONS_APP_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Enable CORS on API routes
app.use("/api/*", cors());

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    app: "PolliForge",
    version: "1.0.0",
    engine: "Pollinations.ai (Flux + DeepSeek/OpenAI)",
    timestamp: new Date().toISOString(),
  });
});

// App configuration endpoint (exposes public publishable App Key if configured)
app.get("/api/config", (c) => {
  const appKey = c.env.POLLINATIONS_APP_KEY || "";
  return c.json({
    configured: !!appKey,
    appKey: appKey,
    pollinationsOauthUrl: "https://enter.pollinations.ai/authorize",
    tokenEndpoint: "https://enter.pollinations.ai/api/oauth/token",
  });
});

// Image proxy to avoid CORS/tainted canvas issues when generating .zip icon bundles
app.get("/api/proxy-image", async (c) => {
  const imageUrl = c.req.query("url");
  if (!imageUrl) {
    return c.json({ error: "Missing url parameter" }, 400);
  }

  try {
    const parsed = new URL(imageUrl);
    const allowedHosts = [
      "image.pollinations.ai",
      "pollinations.ai",
      "gen.pollinations.ai",
    ];

    if (!allowedHosts.includes(parsed.hostname) && !parsed.hostname.endsWith(".pollinations.ai")) {
      return c.json({ error: "Disallowed host. Only pollinations.ai domains are allowed." }, 403);
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "PolliForge/1.0",
        Accept: "image/*,*/*",
      },
    });

    if (!response.ok) {
      return c.json({ error: `Upstream failed with status ${response.status}` }, response.status as any);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const body = await response.arrayBuffer();

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to fetch image" }, 500);
  }
});

// Exchange OAuth code for token (convenience proxy to enter.pollinations.ai)
app.post("/api/oauth/token", async (c) => {
  try {
    const body = await c.req.json();
    const response = await fetch("https://enter.pollinations.ai/api/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return c.json(data, response.status as any);
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to exchange token" }, 500);
  }
});

// Fallback to static assets
app.all("*", async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Asset binding not found", 404);
});

export default app;
