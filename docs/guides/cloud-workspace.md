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

## Headless credential storage

Cloud Workspace hosts explicitly set `CODYNC_VAULT_KEY_FILE` to
`/home/daytona/.codync/vault.key`. This removes the dependency on an unlocked
Linux desktop Secret Service session. The host generates a random 32-byte key
with owner-only permissions (0600) and keeps credential records encrypted with
XChaCha20-Poly1305 in SQLite. The key stays inside the account’s private persistent
workspace; it is not included in the image or sent to the phone or cloud worker.
Backups must retain both the database and this key. Workspace filesystem access
can expose both, so this is a headless storage alternative rather than OS keychain
isolation. Missing keys, invalid key files and insecure permissions fail closed;
existing encrypted records are never silently replaced.

Mac and normal Linux desktop hosts continue using the OS keychain unless this
backend is explicitly selected. iPhone uses the remote host’s credential vault;
no new mobile build is needed for this server-side fix. Existing workspaces need
the updated host and environment, not just a new snapshot setting.

Validation: 202 host tests passed (one OS-keychain test intentionally ignored),
format and strict Clippy passed, five workspace provisioning tests and cloud
TypeScript checks passed.

Deployment on October 6, 2026: snapshot `sidekicks-host-2-4-0-vault-v4` and
pilot cloud version `b348f584-eaf6-4241-8811-59d6a74a724a`. The existing pilot
workspace received the updated host in its user-local bin directory and was
restarted with the file backend. Live credential unlock and encrypted temporary
login save/remove passed twice, including after restarting with the persisted
key. No real provider sign-in was performed. The temporary transfer sandbox was
deleted. Desktop host behavior and mobile binaries are unchanged by this fix.

## ChatGPT sign-in from a phone

Cloud Codex setup exposes **Sign in with ChatGPT** as a setup terminal running
`codex login --device-auth`. Open the newly generated link and enter the one-time
code on the phone. Enable device-code login in ChatGPT security settings (or ask
the workspace administrator) when required. The bare OpenAI consent URL is not
a reusable login link; it requires the session created by an active auth flow.
Cloud setup retains advertised API-key options and leaves desktop/other agent
sign-in methods unchanged. The shared mobile terminal already supports this
method, so installing another iPhone build is unnecessary.

Deployed October 6, 2026: device-login snapshot `sidekicks-host-2-4-0-device-v5`,
cloud version `95121395-f155-4b12-b68e-f0a15831aefe`, and an updated host in the
existing workspace. Live `agentAuth` returned `sidekicks-device-auth` with terminal
kind, replacing `chat-gpt` with agent kind. All 203 host tests, formatting and
strict Clippy passed. Credential smoke checks passed after deployment. Completion
of the user's OpenAI authorization remains user-operated and was not verified.

### ChatGPT sign-in in a cloud workspace

Sidekicks uses Codex app-server's managed `chatgptDeviceCode` account API for
cloud Codex sign-in. In the agent's setup screen, select **Sign in with ChatGPT**,
open the displayed `https://auth.openai.com/codex/device` link on your phone or
computer, and enter the fresh code. Return to the setup screen after approving.
The host waits for the matching `account/login/completed` notification and
reports a rejection or expiration instead of assuming that opening a browser
completed authentication. The generic Codex **Sign in** action uses the same flow.
Enable device code login in ChatGPT security settings if OpenAI asks for it.

Codex owns token storage and refresh. Headless sign-in explicitly selects Codex's
supported `cli_auth_credentials_store="file"` backend so an unavailable Linux
keyring cannot block persistence. Codex stores these credentials in its private
credential file under `CODEX_HOME` (normally `~/.codex`); they are not encrypted
by the Sidekicks vault. Restrict workspace access and protect backups of this
file. Sidekicks' own connector/API credentials remain encrypted in its vault.
The app receives only the verification URL, one-time code and completion state,
not access or refresh tokens. Desktop sign-in keeps its existing storage behavior.

The iPhone, Mac, Linux and terminal clients all use the existing shared setup
terminal API, so this host change does not require a client UI update. It uses
the [official Codex account API](https://learn.chatgpt.com/docs/app-server#authentication-endpoints),
not an identity-only website OAuth flow or a standalone consent-page link.

### Laptop first, optional Daytona switching

New iPhone setup uses the existing install-and-scan computer pairing flow.
After pairing, open **Computers & settings → Where new work runs**. Choose
**Use [computer name]** while your laptop is available, or **Enable Daytona cloud
workspace** when you want cloud execution. New Sidekicks prefer the selected
online destination; an unavailable destination falls back to an online host.
Existing conversations keep their original execution host. Switching does not
copy repositories, credentials or conversation history between hosts.

The iPhone only automatically resumes a saved Daytona workspace when it is the
selected destination. Selecting a laptop does not stop or delete Daytona; cloud
usage continues while it is running. QR onboarding and Daytona provisioning are
iPhone-specific; Mac, Linux and terminal clients retain their local setup.
All clients now show provider-specific authentication methods without the generic
manual terminal sign-in fallback. API-key-only providers keep their key forms.
