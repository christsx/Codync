import { ApiError } from "./api";
import type { Env } from "./index";

const SLUG = /^[A-Za-z0-9_-]{1,100}$/;
const POPULAR = ["slack", "github", "gmail", "googledrive", "googlecalendar", "notion", "linear", "hubspot"];
const API = "https://backend.composio.dev/api/v3.1";
type Json = Record<string, any>;

/** Fixed provider, allowlisted routes, server-owned identity, and ownership checks. */
export async function appRequest(env: Env, userId: string, input: Json): Promise<unknown> {
  if (!env.COMPOSIO_API_KEY) throw new ApiError("appsUnavailable", "App connections are temporarily unavailable.", 503);
  const method = input.method;
  const path = input.path;
  if (typeof path !== "string" || !["GET", "POST", "DELETE"].includes(method)) throw new ApiError("badRequest");
  const parts = path.split("/").slice(1);
  if (!parts.length || parts.some((s: string) => !SLUG.test(s))) throw new ApiError("badRequest");
  const publicRead = method === "GET" && ["toolkits", "tools"].includes(parts[0]) && parts.length <= 2;
  const accounts = parts[0] === "connected_accounts";
  const configs = path === "/auth_configs" && ["GET", "POST"].includes(method);
  const execute = method === "POST" && parts.length === 3 && parts[0] === "tools" && parts[1] === "execute";
  const allowedAccounts = accounts && ((method === "GET" && parts.length <= 2)
    || (method === "DELETE" && parts.length === 2)
    || (method === "POST" && path === "/connected_accounts/link"));
  if (!publicRead && !configs && !execute && !allowedAccounts) throw new ApiError("forbidden");
  const query = new URLSearchParams();
  const allowedQuery = new Set(["limit", "cursor", "search", "toolkit_slug", "query", "toolkit_versions"]);
  if (input.query !== undefined && !Array.isArray(input.query)) throw new ApiError("badRequest");
  for (const pair of input.query ?? []) {
    if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== "string" || typeof pair[1] !== "string"
      || pair[1].length > 1000) throw new ApiError("badRequest");
    if (allowedQuery.has(pair[0])) query.set(pair[0], pair[1]);
  }
  query.set("limit", "30");
  const upstream = async (verb: string, route: string, payload?: Json, params?: URLSearchParams): Promise<Json> => {
    const response = await fetch(`${API}${route}${params?.size ? `?${params}` : ""}`, {
      method: verb, headers: { "x-api-key": env.COMPOSIO_API_KEY!, "Content-Type": "application/json" },
      ...(payload ? { body: JSON.stringify(payload) } : {}), signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new ApiError("appsUnavailable", "The app connection service could not complete this request. Try again.", 502);
    if (response.status === 204) return {};
    return await response.json() as Json;
  };
  const ownedAccount = async (id: unknown) => {
    if (typeof id !== "string" || !SLUG.test(id)) throw new ApiError("badRequest");
    const account = await upstream("GET", `/connected_accounts/${id}`);
    if (account.user_id !== userId) throw new ApiError("forbidden");
    return account;
  };
  const safeAccount = (a: Json) => ({ id: a.id, user_id: a.user_id, status: a.status, toolkit: a.toolkit });
  if (accounts && method === "GET") {
    if (parts.length === 2) return safeAccount(await ownedAccount(parts[1]));
    query.set("user_ids", userId);
    const page = await upstream(method, path, undefined, query);
    return { ...page, items: (page.items ?? []).filter((a: Json) => a.user_id === userId).map(safeAccount) };
  }
  if (accounts && method === "DELETE") {
    await ownedAccount(parts[1]);
    return upstream(method, path);
  }
  const payload = input.body;
  if (method === "POST" && (!payload || typeof payload !== "object" || Array.isArray(payload))) throw new ApiError("badRequest");
  if (execute) {
    await ownedAccount(payload.connected_account_id);
    return upstream(method, path, { ...payload, user_id: userId });
  }
  if (accounts && method === "POST") {
    if (typeof payload.auth_config_id !== "string" || !SLUG.test(payload.auth_config_id)) throw new ApiError("badRequest");
    const auth = await upstream("GET", `/auth_configs/${payload.auth_config_id}`);
    if (auth.is_composio_managed !== true || !POPULAR.includes(auth.toolkit?.slug?.toLowerCase())) throw new ApiError("forbidden");
    return upstream(method, path, { auth_config_id: payload.auth_config_id, user_id: userId });
  }
  if (configs && method === "POST") {
    if (!POPULAR.includes(payload.toolkit?.slug) || payload.auth_config?.type !== "use_composio_managed_auth") throw new ApiError("badRequest");
    return upstream(method, path, { toolkit: { slug: payload.toolkit.slug }, auth_config: { type: "use_composio_managed_auth", name: `Sidekicks ${payload.toolkit.slug}` } });
  }
  if (configs) {
    if (!SLUG.test(query.get("toolkit_slug") ?? "")) throw new ApiError("badRequest");
    const page = await upstream(method, path, undefined, query);
    return { items: (page.items ?? []).filter((a: Json) => a.is_composio_managed).map((a: Json) => ({ id: a.id, is_composio_managed: true, status: a.status })) };
  }
  if (method === "GET" && path === "/toolkits") {
    const results = await Promise.all(POPULAR.map((slug) => upstream("GET", `/toolkits/${slug}`).catch(() => null)));
    const search = (query.get("search") ?? "").toLowerCase();
    const items = results.filter((t): t is Json => t !== null)
      .filter((t) => !search || `${t.name} ${t.slug} ${t.description ?? ""}`.toLowerCase().includes(search));
    return { items, next_cursor: null };
  }
  return upstream(method, path, undefined, query);
}
