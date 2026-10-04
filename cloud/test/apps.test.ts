import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { appRequest } from "../src/apps";
import { env } from "./helpers";
const config = { ...env, COMPOSIO_API_KEY: "server-only-key" };
afterEach(() => vi.restoreAllMocks());
describe("managed app isolation", () => {
  it("rejects unsigned client requests before reaching the provider", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const response = await worker.fetch(new Request("https://cloud.example/v1/host/apps/request", {
      method: "POST", body: JSON.stringify({ method: "GET", path: "/toolkits" }),
    }), config, {} as ExecutionContext);
    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("uses managed OAuth configuration and replaces the caller user", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).includes("/auth_configs/")
        ? Response.json({ is_composio_managed: true, toolkit: { slug: "slack" } })
        : Response.json({ redirect_url: "https://example.test/sign-in" }));
    await appRequest(config, "owner", { method: "POST", path: "/connected_accounts/link", body: { auth_config_id: "ac_test", user_id: "stranger" } });
    expect(JSON.parse(fetch.mock.calls[1]![1]!.body as string)).toEqual({ auth_config_id: "ac_test", user_id: "owner" });
    await expect(appRequest(config, "owner", { method: "POST", path: "/auth_configs", body: {
      toolkit: { slug: "slack" }, auth_config: { type: "use_custom_auth" },
    } })).rejects.toMatchObject({ status: 400 });
  });

  it("replaces user filters and strips credentials", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ items: [
      { id: "mine", user_id: "owner", status: "ACTIVE", state: { token: "private" } },
      { id: "other", user_id: "stranger" },
    ] }));
    const result = await appRequest(config, "owner", { method: "GET", path: "/connected_accounts", query: [["user_ids", "stranger"]] });
    expect(String(fetch.mock.calls[0]![0])).toContain("user_ids=owner");
    expect(result).toEqual({ items: [{ id: "mine", user_id: "owner", status: "ACTIVE", toolkit: undefined }] });
    expect(JSON.stringify(result)).not.toContain("private");
  });
  it("blocks cross-user reads, deletes and execution", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({ user_id: "stranger" }));
    for (const input of [
      { method: "GET", path: "/connected_accounts/other" },
      { method: "DELETE", path: "/connected_accounts/other" },
      { method: "POST", path: "/tools/execute/SLACK_SEND", body: { connected_account_id: "other" } },
    ]) await expect(appRequest(config, "owner", input)).rejects.toMatchObject({ status: 403 });
    expect(fetch.mock.calls.every(([, init]) => init?.method === "GET")).toBe(true);
  });
  it("rejects arbitrary routes and lists only popular integrations", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const slug = String(url).split("/").pop();
      return Response.json({ slug, name: slug });
    });
    await expect(appRequest(config, "owner", { method: "GET", path: "/../api_keys" })).rejects.toMatchObject({ status: 400 });
    await expect(appRequest(config, "owner", { method: "GET", path: "/api_keys" })).rejects.toMatchObject({ status: 403 });
    const result = await appRequest(config, "owner", { method: "GET", path: "/toolkits" }) as { items: { slug: string }[] };
    expect(result.items.map((t) => t.slug)).toEqual(["slack", "github", "gmail", "googledrive", "googlecalendar", "notion", "linear", "hubspot"]);
  });
});
