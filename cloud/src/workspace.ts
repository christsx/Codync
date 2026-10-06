import { ApiError, createClaim, completeClaim, type Ctx } from "./api";
import { sha256, b64url, utf8 } from "./auth";

const API = "https://app.daytona.io/api";
interface Sandbox { id: string; state: string; autoStopInterval?: number; }
interface Row { sandbox_id: string | null; }

/** One private, persistent sandbox per account. A lost creation response is reconciled by name,
 * never by starting another sandbox. Failed cloud runs never fall back to a personal computer. */
export async function workspace(c: Ctx, userId: string) {
  if (!c.env.DAYTONA_API_KEY || !c.env.DAYTONA_SNAPSHOT) {
    throw new ApiError("workspaceUnavailable", "Cloud Workspace is being set up. Please try again later.", 503);
  }
  if (!(c.env.WORKSPACE_USERS ?? "").split(",").map(s => s.trim()).includes(userId)) {
    throw new ApiError("workspaceUnavailable", "Cloud Workspace is not enabled for this account yet.", 403);
  }
  const provider = async <T>(path: string, method = "GET", body?: unknown): Promise<T> => {
    const res = await fetch(`${API}${path}`, {
      method, headers: { Authorization: `Bearer ${c.env.DAYTONA_API_KEY}`, "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000),
    });
    if (res.status === 404) throw new ApiError("sandboxNotFound", "Cloud workspace could not be found.", 404);
    if (!res.ok) throw new ApiError("workspaceUnavailable", "Cloud Workspace could not start. Please try again.", 502);
    return res.status === 204 ? {} as T : await res.json() as T;
  };
  await c.env.DB.prepare("INSERT OR IGNORE INTO workspaces(user_id, created_at) VALUES (?, ?)").bind(userId, c.now).run();
  const lock = crypto.randomUUID();
  const acquired = await c.env.DB.prepare("UPDATE workspaces SET lock_id = ?, locked_until = ? WHERE user_id = ? AND locked_until < ?")
    .bind(lock, c.now + 60000, userId, c.now).run();
  if (!acquired.meta.changes) return { state: "starting" };
  try {
    const row = await c.env.DB.prepare("SELECT sandbox_id FROM workspaces WHERE user_id = ?").bind(userId).first<Row>();
    const name = `sidekicks-${b64url(await sha256(utf8(userId))).slice(0, 24)}`;
    let sandbox: Sandbox;
    try { sandbox = await provider<Sandbox>(`/sandbox/${encodeURIComponent(row?.sandbox_id ?? name)}`); }
    catch (error) {
      if (!(error instanceof ApiError) || error.code !== "sandboxNotFound" || row?.sandbox_id) throw error;
      sandbox = await provider<Sandbox>("/sandbox", "POST", {
        name, snapshot: c.env.DAYTONA_SNAPSHOT, public: false,
        autoStopInterval: 0, autoArchiveInterval: 10080, autoDeleteInterval: -1,
        env: {
          CODYNC_CLOUD_URL: c.url.origin, CODYNC_HOME: "/home/daytona/.codync",
          CODYNC_VAULT_KEY_FILE: "/home/daytona/.codync/vault.key",
          NPM_CONFIG_PREFIX: "/home/daytona/.local",
          PATH: "/home/daytona/.local/bin:/usr/local/bin:/usr/bin:/bin",
        },
      });
    }
    if (!sandbox.id || !/^[A-Za-z0-9_-]+$/.test(sandbox.id)) throw new ApiError("internal");
    await c.env.DB.prepare("UPDATE workspaces SET sandbox_id = ? WHERE user_id = ? AND lock_id = ?")
      .bind(sandbox.id, userId, lock).run();
    // Apply the same unattended policy to already-created pilot workspaces.
    // Provider failure must surface rather than promise a job will survive auto-stop.
    if (sandbox.autoStopInterval !== 0) {
      await provider(`/sandbox/${sandbox.id}/autostop/0`, "POST");
    }
    if (sandbox.state === "stopped" || sandbox.state === "archived") {
      await provider(`/sandbox/${sandbox.id}/start`, "POST");
      return { state: "starting" };
    }
    if (sandbox.state !== "started") return { state: "starting" };
    const proxy = await provider<{ url: string }>(`/sandbox/${sandbox.id}/toolbox-proxy-url`);
    const base = new URL(proxy.url);
    // Credentials are only sent to Daytona's official toolbox proxy.
    if (base.protocol !== "https:" || !base.hostname.endsWith(".daytona.io")) throw new ApiError("internal");
    const challenge = await createClaim(c);
    const input = b64url(utf8(JSON.stringify({ ...challenge, userId })));
    const response = await fetch(`${base.href.replace(/\/$/, "")}/${sandbox.id}/process/execute`, {
      method: "POST", headers: { Authorization: `Bearer ${c.env.DAYTONA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ command: `CODYNC_VAULT_KEY_FILE=/home/daytona/.codync/vault.key python3 /opt/sidekicks/workspace.py ${input}`, timeout: 10 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new ApiError("workspaceUnavailable", "Your cloud workspace is starting. Try again shortly.", 503);
    const result = await response.json() as { exitCode: number; result: string };
    if (result.exitCode !== 0) throw new ApiError("workspaceUnavailable", "Your cloud workspace is starting. Try again shortly.", 503);
    const output = JSON.parse(result.result) as { claim: Record<string, unknown>; pairingUrl: string };
    await completeClaim({ ...c, raw: utf8(JSON.stringify(output.claim)) }, [challenge.claimId]);
    return Response.json({ state: "ready", pairingUrl: output.pairingUrl }, { headers: { "Cache-Control": "no-store" } });
  } finally {
    await c.env.DB.prepare("UPDATE workspaces SET lock_id = NULL, locked_until = 0 WHERE user_id = ? AND lock_id = ?")
      .bind(userId, lock).run();
  }
}
