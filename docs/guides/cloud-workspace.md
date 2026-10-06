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

The backend is deployed and TestFlight build 26 includes this setup. Snapshot
`sidekicks-host-2-3-1-v4` was built in the Personal Daytona organization.
Release checklist:

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

Auto-stop is disabled for new workspaces and reconciled on the next setup of an
existing workspace. Files persist and automatic deletion is disabled. This avoids
inactivity interrupting jobs, but compute usage continues until the workspace is
stopped in Daytona. The pilot backend now applies this policy; a full provider task with the Mac closed
is still awaiting account sign-in and verification.

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
  check in a signed-in mobile session.
- Live private Daytona sandbox: the Linux host booted, signed a claim, produced
  a v3 pairing offer pointing to the Sidekicks backend, and could not see
  `/Users/chris`. Repeated setup left exactly one host process.
- The first bootstrap smoke test found a lock conflict with the host's own lock.
  The bootstrap now uses `workspace-start.lock`; the corrected live test passed.
- The smoke sandbox has a 10-minute TTL and automatic deletion on stop. No user
  credentials were copied in, and its pairing offer was not printed or shared.

The server key was created with Sandboxes permissions and saved only as a Worker
secret. The existing three active pilot accounts are enabled through the
`WORKSPACE_USERS` secret; additional pilot accounts must be enrolled explicitly.
Migration `0002_workspaces.sql` was applied to the remote D1 database. Worker
deployment `6c0c459a-da3a-4317-98c4-437cb1d78caa` passed a health check and rejects
anonymous workspace creation with HTTP 401.

The new server key passed a real REST creation/start/toolbox/pairing test. This
test found that Daytona's raw REST payload uses `env`, while its SDK uses
`envVars`. The backend now sends `env`; the corrected live pairing offer points
to the Sidekicks backend. Regression coverage checks that payload explicitly.

Build 26 was archived, uploaded, and processed successfully. App Store Connect
shows 2.3.1 (26) as Testing in Sidekicks Internal Pilot, with test instructions
saved. Full mobile pairing, coding-agent
authentication, an actual agent task with the laptop offline, and visual review
still need verification in TestFlight.

### Provider setup from iPhone

After starting a Cloud Workspace, iPhone opens that workspace's marketplace.
Install and sign in to Z.ai (GLM) or Kimi there before creating the sidekick.
Z.ai uses the community GLM ACP adapter and a Z.ai Coding Plan key through
`glm-acp-agent --setup`; Kimi uses its CLI login flow. Setup runs on the selected
workspace, so credentials and code remain there rather than depending on the Mac.
Existing Mac sidekicks are not migrated automatically. Cloud access is still
restricted to accounts enrolled in `WORKSPACE_USERS`. Returning to iPhone wakes
an existing stopped cloud workspace; the revised unattended policy must be deployed before relying on long jobs.

### Mobile repository setup and verification

Settings → Cloud Workspace now offers provider setup and GitHub repository setup.
GitHub setup uses the CLI device/browser flow, configures Git credentials, validates
an OWNER/REPO name, and clones into `~/projects`. Select the resulting folder when
creating a cloud sidekick. The workspace image includes `gh`; existing snapshots
must be rebuilt with the new host and selected in `DAYTONA_SNAPSHOT` before this
command is available. Personal Mac databases, provider credentials, and chats are
not copied to the cloud. Existing Mac agents must be recreated there deliberately.

Cloud onboarding and its checklist are iOS-only: Mac/Linux/TUI are host-local
clients and do not provision Daytona. The shared setup terminal and host command
work on the selected host; their existing agent setup behavior is unchanged.

Before calling the workflow verified: sign in on iPhone, start the workspace,
authenticate a provider and GitHub, clone a test repository, create a cloud agent,
close the Mac, and request a file edit. Confirm the reply, the actual file change,
and repository access. Provider secrets must be entered only in the app's setup.

### October 5 implementation and release

- Cloud: 106 tests and TypeScript checks passed. Existing workspace auto-stop
  reconciliation and concurrent provisioning are covered.
- Host: 178 unit tests passed (one ignored), integration suites passed, formatting
  and Clippy passed. GitHub setup runs through a real shell with fixture credentials
  and checks valid cloning plus invalid-input rejection.
- Shared Swift: 73 tests passed. Mac build and signed iOS archive passed.
- Snapshot `sidekicks-host-2-4-0-v1` is active. A temporary private sandbox confirmed
  host 2.4.0, GitHub CLI availability, and no `/Users/chris` filesystem access; it
  was stopped with automatic deletion enabled.
- Pilot Worker deployed as `5c0b9eb0-4f9b-4982-9923-4cb0c3634dbd`, selecting that
  snapshot. Health passed and anonymous provisioning returned 401.
- iOS 2.4.0 build 30 uploaded successfully to App Store Connect. Apple processing
  and assignment to the internal TestFlight group remain unverified. Upload reports
  the existing missing WebRTC framework dSYM warning.
- Account enrollment, actual provider/GitHub login, and Mac-closed file-edit testing
  remain pending the user's account and interactive authorization. Existing
  sandboxes retain their original image; changing the snapshot does not migrate
  their files or upgrade their host. New workspaces receive the new image.
