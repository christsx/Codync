# Mobile Cloud Workspace

Mobile onboarding starts with Cloud Workspace; connecting a physical computer is
secondary and explicit. Existing users can open setup from Settings. A failed
cloud task must not be rerouted to a laptop.

## Implementation

`POST /v1/workspace` requires a Clerk session and a registered, signed device.
The account identity comes from Clerk, never the request body. D1 has one
workspace per account and a short provisioning lock. A deterministic sandbox
name reconciles a lost create response without creating another workspace.
The private sandbox starts the existing Rust host, signs the account claim, and
returns a short-lived pairing offer. Mobile connects over the existing encrypted
relay; agent credentials remain inside that account's sandbox.

The backend is part of the trust boundary for managed cloud provisioning. Unlike
a personally paired computer, it can request pairing offers through Daytona.
No laptop credentials or database are copied into the image. Each coding agent
must be installed and authenticated in the new workspace before it can run tasks.

## Activation and remaining verification

This is implemented locally, not activated in TestFlight build 25. Snapshot
`sidekicks-host-2-3-1-v4` was built in the Personal Daytona organization.
Before release:

1. Build a Daytona snapshot from `packaging/workspace/Dockerfile`, with only `host`
   and `packaging/workspace` plus `packaging/updates/host-public-key.txt` in a
   staged build context; omit `host/target` and use `daytona snapshot create` with
   `-c .` from that staging directory to preserve relative paths.
2. Set server secret `DAYTONA_API_KEY`, snapshot name `DAYTONA_SNAPSHOT`, and the
   comma-separated Clerk user IDs in `WORKSPACE_USERS` for the private pilot.
3. Apply D1 migration `0002_workspaces.sql` and deploy the cloud worker.
4. Test create, interrupted create, resume, concurrent requests, two-account
   isolation, cloud-only pairing, agent installation/login and a real task with
   the laptop shut down. Then upload a new iOS build.

Auto-stop is 30 minutes; files persist and automatic deletion is disabled.
Long-running tasks need lifecycle monitoring to prevent stopping during a run;
background processes alone do not reset Daytona's inactivity timer. Do not claim
unattended long-running tasks are supported before that monitoring is implemented.

This setup UI is iOS-only because desktop, Linux and the TUI already run the host
on their own machine. Their local execution and pairing screens are unchanged.
Shared Swift clients gain cloud provisioning without changing existing routing.

## Verified on October 3, 2026

- Cloud: 105 tests passed, including registered-device enforcement, private
  creation, account admission, and concurrent/repeated creation deduplication;
  TypeScript checks and Worker bundle dry run passed.
- Shared Swift: 73 tests passed, including account-isolated workspace preference
  storage and erasure.
- iOS Release simulator build passed. The new setup screen still needs a visual
  check in a signed-in mobile session before upload.
- Live private Daytona sandbox: the Linux host booted, signed a claim, produced
  a v3 pairing offer pointing to the Sidekicks backend, and could not see
  `/Users/chris`. Repeated setup left exactly one host process.
- The first bootstrap smoke test found a lock conflict with the host's own lock.
  The bootstrap now uses `workspace-start.lock`; the corrected live test passed.
- The smoke sandbox has a 10-minute TTL and automatic deletion on stop. No user
  credentials were copied in, and its pairing offer was not printed or shared.

Server activation, full mobile pairing, coding-agent authentication, an actual
agent task with the laptop offline, and a new TestFlight upload remain pending.
