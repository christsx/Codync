import { describe, expect, it, vi } from "vitest";
import { call, clerkToken, env } from "./helpers";
import * as ref from "./ref";
import { workspace } from "../src/workspace";
import type { Ctx } from "../src/api";
import { createExecutionContext } from "cloudflare:test";

describe("Cloud Workspace access", () => {
  it("rejects anonymous provisioning", async () => {
    expect((await call("POST", "/v1/workspace", { body: {} })).status).toBe(401);
  });

  it("requires a registered device before any provider request", async () => {
    const token = await clerkToken(`workspace_${crypto.randomUUID()}`);
    const key = ref.signKey();
    expect((await call("POST", "/v1/workspace", { token, key, body: {} })).status).toBe(404);
  });

  it("reports unavailable instead of pretending an unconfigured cloud workspace is ready", async () => {
    const token = await clerkToken(`workspace_${crypto.randomUUID()}`);
    const key = ref.signKey();
    expect((await call("POST", "/v1/devices", { token, key, body: { name: "iPhone", platform: "ios" } })).status).toBe(200);
    const response = await call("POST", "/v1/workspace", { token, key, body: {} });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("workspaceUnavailable");
  });

  it("reuses the account sandbox and keeps concurrent starts from creating duplicates", async () => {
    const userId = `workspace_${crypto.randomUUID()}`;
    const token = await clerkToken(userId);
    await call("GET", "/v1/me", { token });
    let creates = 0;
    let saved = false;
    const provider = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.method === "POST") {
        creates++;
        const input = JSON.parse(init.body as string);
        expect(input.public).toBe(false);
        expect(input.autoDeleteInterval).toBe(-1);
        expect(input.env).not.toHaveProperty("DAYTONA_API_KEY");
        expect(input.env.CODYNC_CLOUD_URL).toBe("https://cloud.test");
        saved = true;
      } else if (!saved) return new Response(null, { status: 404 });
      return Response.json({ id: "sandbox_one", state: "pending_build" });
    });
    vi.stubGlobal("fetch", provider);
    const context = {
      env: { ...env, DAYTONA_API_KEY: "test-only", DAYTONA_SNAPSHOT: "test-image", WORKSPACE_USERS: userId },
      now: Date.now(), url: new URL("https://cloud.test/v1/workspace"),
      req: new Request("https://cloud.test/v1/workspace"), raw: new Uint8Array(),
      exec: createExecutionContext(),
    } as Ctx;
    try {
      await Promise.all([workspace(context, userId), workspace(context, userId)]);
      await workspace(context, userId);
      expect(creates).toBe(1);
      const row = await env.DB.prepare("SELECT sandbox_id FROM workspaces WHERE user_id = ?").bind(userId).first();
      expect(row?.sandbox_id).toBe("sandbox_one");
      await expect(workspace(context, "another-account")).rejects.toMatchObject({ status: 403 });
      expect(creates).toBe(1);
    } finally { vi.unstubAllGlobals(); }
  });
});
