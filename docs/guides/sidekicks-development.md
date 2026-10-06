# Sidekicks development services

Debug and Release pilot Apple builds use the Algility-owned Sidekicks Clerk development instance
(`ultimate-chow-8201.clerk.accounts.dev`) and the Cloudflare Worker at
`https://sidekicks-cloud-dev.christiangarci6.workers.dev`.

Deploy with `cd cloud && npx wrangler deploy --config wrangler.sidekicks.jsonc`.
D1 migrations use the same config and the `sidekicks-dev` database.
The Worker verifies Clerk session JWTs with the instance's public signing key.
If Clerk rotates that signing key, refresh `CLERK_JWT_KEY` from its JWKS and redeploy.
No Clerk administrator secret is stored in the repository.

Mac OAuth callback: `com.pokai.Codync://callback`.
iOS OAuth callback: `com.pokai.Codync.ios://callback`.
Both callbacks are saved in Clerk's native redirect allowlist. Google sign-in was verified in the Mac development app on 2026-10-02. Apple developer registration and Apple sign-in require
our own Apple developer account before production. Release now uses our Sidekicks development environment for the private pilot.
A production Clerk instance and backend configuration are still required for a public release.

Chats and sidekick settings remain in the local SQLite database. D1 stores
account, computer, and device access records; Durable Objects hold the encrypted
relay mailbox. Clerk deletion webhooks are not yet configured for this instance.

Debug Apple builds use an instance-specific Keychain service separate from the
installed release app, avoiding its code-signing access prompts. Sessions remain
in the system Keychain. The mobile menu wording is “Get Sidekicks for mobile” on
Mac and Linux; iOS and TUI have no corresponding mobile download menu item.

Signing out on Mac or iOS returns to the Sidekicks welcome/sign-in screen with
plush avatars. Local mode/pairing is still an explicit option. Linux and TUI
have no Clerk account session or app account sign-out UI; they use host pairing
and agent CLI authentication, so this Clerk sign-out screen does not apply.

The local Mac development app is signed with Christian Garcia’s installed Apple
Development certificate instead of ad hoc signing. Its Clerk Keychain namespace
is `.development.signed.<publishable key>`; keep that certificate for subsequent
builds so Keychain sessions remain accessible. The first launch in this namespace
requires signing in again.

The welcome layout centers the Sidekicks name and tagline below nine plush
characters. A single Sign in button reveals provider choices. The extra shapes
are star, cat, flower and ghost, with distinct phase, speed and gentle tilt;
Reduce Motion disables their movement.

Welcome copy: “A little crew. A lot done.” Authentication buttons use a wide,
slim capsule layout. The welcome screen no longer offers local-mode or local
pairing continuation; existing paired-computer data remains intact.

The welcome screen currently offers Google directly via “Continue with Google”,
with loading/disabled states during authentication. Provider selection is hidden.

The Google welcome button includes the existing multicolor Google asset, a slim
capsule shape, and no arrow, on both Mac and iOS.

The macOS desktop product is Sidekicks.app, with Sidekicks window/menu naming
and a blue plush blob icon rendered from the vendored BotAvatarsKit. Re-render
the source mascot with scripts/design/render-sidekicks-icon.swift. The bundle
identifier stays stable for existing account sessions and local data. iOS,
Linux and TUI product names are unchanged because this request is desktop Mac
branding; the shared in-app characters are unchanged.

The desktop icon mascot renders at 930 points on a 1024-point canvas, keeping
a safe margin while filling more of the Dock icon.

The icon master renders at 2× (2048 pixels), with lighter shadows and lower
highlight intensity to keep the plush silhouette and dark eyes clear.

The desktop icon now uses a coral-orange fuzzy circle instead of the blue blob.
It fills almost the full icon canvas while keeping the dark eyes prominent.

The final desktop icon uses `sidekicks-furry-hd.png`, generated with the built-in
image tool rather than the Canvas renderer. Prompt: retain the coral circular
mascot and two dark oval eyes, replace flat fabric with detailed fluffy 3D fur,
soft studio lighting, transparent background, nearly full icon framing, no
text or extra features. The Swift renderer is retained as the earlier source
variation; rebuilding it does not update the final generated artwork.

The Mac desktop icon now uses `sidekicks-furry-round.png`. Built-in image edit prompt: preserve coral fur and two dark eyes; round the silhouette, add transparent clearance and a small asymmetric tuft, keep all fur inside the canvas. This Mac desktop asset change does not alter in-app characters or other clients.

Current Mac icon master: `sidekicks-furry-soft.png`, built-in image edit. Prompt: preserve coral plush ball and two eyes, shorten and tidy fur, remove pointed tuft, soften lighting, balance smaller matte eyes, retain transparent margins. Icon Composer layer scale 0.8 keeps the entire silhouette visible. Other clients retain their existing assets because this change is to the installed Mac desktop icon.

Destructive controls now use standard vivid red: light #FF3B30 and dark #FF453A. Shared SwiftUI covers Mac/iOS, and Linux/TUI palettes match; filled confirmation buttons retain white text. Rust checks require cargo, which is unavailable on this machine.

Destructive confirmation fills use #D92D20 with white text (approximately 4.83:1 contrast); bright red text stays unchanged. SwiftUI and TUI share that fill. Linux native destructive dialog buttons get the same CSS fill.

Manual creation displays New Sidekick even with older bundled hosts: the shared Swift decoder translates only the legacy New Bot placeholder when autoName is true, preserving user names and automatic naming. TUI creation headings use sidekick; Linux creation controls already do.

Avatar variation tiles now use actual buttons with rectangular hit regions around noninteractive previews. This fixes shape selection in the shared Mac/iOS settings picker. Linux already uses GTK buttons and TUI uses keyboard shape selection, so they require no corresponding input change.

Current Mac desktop icon: `sidekicks-plush-clover.png`, built-in image generation. Prompt: compact coral four-lobed plush clover, short soft fur, two small charcoal eyes, even studio light, transparent clearance, no extra features. Scale 0.8 keeps all lobes visible. Mac desktop branding only; in-app shapes and other platform assets are unchanged.

Current Mac icon master: `sidekicks-plush-clover-big-eyes.png`. Built-in image edit prompt: enlarge both eyes by 60 percent, preserve coral plush clover, framing and transparency. Mac desktop icon only.

New sidekicks default to Codex in shared Apple drafts and Linux when installed. Existing configured sidekicks keep their backend; unavailable Codex falls back to an installed backend. TUI already explicitly asks the user to choose an agent.

Remaining user-facing Sidekicks strings replaced with Sidekicks across native clients, widgets, and host messages, including Personal · managed by Sidekicks. Existing module/bundle/service identifiers and real repository URLs stay stable. Mac/iOS builds verified; changed Rust text requires a rebuilt host/Linux client and cargo is unavailable locally.

Desktop first-account onboarding now gates the dashboard: local computer online, verified Codex auth, optional apps using the existing Marketplace, then create a sidekick or enter dashboard. Completion is scoped to the Clerk user ID, so returning accounts skip setup. Reuses settings/auth flows without collecting credentials in onboarding. Mac-only per user request; iOS pairing and Linux/TUI setup remain unchanged.

Desktop onboarding now requires an explicit coding-agent choice from supported agents, rather than preselecting Codex. Connect opens that agent’s existing setup screen; auth checks and first-sidekick creation use the selected backend. The choice is saved per account alongside setup progress.

Mac desktop icon matches the desktop onboarding CharacterAvatar: native BotAvatarsKit clover, orange #FF6700, fabric shading, shadow 1.15, highlight 1.45. Master `sidekicks-onboarding-clover.png` rendered at 2048px by `scripts/design/render-sidekicks-icon.swift`. This replaces the generated mascot for consistent branding. Other clients unaffected by this desktop-icon request.

The onboarding clover is the main desktop logo; retain its approved layer scale 0.45.

Restored the approved furry coral clover with bigger eyes (`sidekicks-plush-clover-big-eyes.png`, layer scale 0.8) as the Mac desktop icon. The native onboarding character remains unchanged.

Desktop setup onboarding now displays the exact furry coral clover with bigger eyes from the desktop icon, via SidekicksLogo.imageset. The welcome character animations remain intact. Mac-only as requested.

Desktop icon and onboarding use `sidekicks-dashboard-orange.png`. Built-in image edit prompt: recolor fur toward dashboard orange #FF6700, lower pastel highlights, preserve clover, big eyes and transparency. Mac branding assets only.

Current desktop/onboarding master is `sidekicks-orange-light.png`. Built-in image edit prompt: lift orange fur brightness about 12 percent with warmer midtones around #FF7B24, preserve clover, big eyes, framing and alpha. Icon layer scale stays 0.8.

Removed the desktop Get Sidekicks for mobile menu item until a Sidekicks mobile destination is available.

### Account-first connections

Apps no longer ask users for a Composio project key. The Sidekicks development Worker stores `COMPOSIO_API_KEY` as a server secret. Claimed computers use signed `/v1/host/apps/request` requests; the server derives the Composio user from the active owner and computer, replaces caller identity filters, checks ownership before reading/deleting/executing a connection, and strips account credential state from responses. Sign-in links use Composio-managed OAuth; the hosted route rejects custom credential configuration. Slack, GitHub, Gmail, Google Drive, Google Calendar, Notion and Linear form the default catalog. Developer MCP registry connectors remain under Advanced connectors.

The shared Apple agent sheet and Linux/TUI agent setup put API-key alternatives under Advanced and retain provider-supported browser/terminal account sign-in. All supported coding agents remain available. The desktop and iOS share the same app connection sheet; Linux uses its existing hosted OAuth dialog. The TUI supports hosted connection requests and has no independent app catalog browser. Internal `Codync-Sig` wire headers retain their protocol spelling despite product branding.

This is a development deployment, not a TestFlight release. OAuth consent for each personal/workspace account still belongs to the user. The local `.env.local` is developer configuration only and is neither bundled into the app nor read by user onboarding.

Validation: development Worker deployed with its secret and app-request rate limit. Live desktop API returns the seven popular integrations; Slack Connect produces a browser OAuth sign-in link without a project-key prompt. Mac and iOS simulator builds passed, cloud typecheck and 96 existing plus 5 focused isolation tests passed, and host Clippy passed. Host unit tests passed (177; one OS-keyring test ignored); one parallel end-to-end startup test timed out, then passed when rerun alone. Linux formatting passed; Linux GTK execution/build is unavailable on this Mac. No Slack consent or TestFlight upload was completed.

### Bundled company marks (2026-10-03)

Downloaded company marks through Brandfetch's public brand-page Download all controls. Sources and selected archive members are recorded in `kit/Sources/CodyncUI/Resources/brand-logo-sources.json`; no third-party Logo API client ID or remote favicon requests are shipped. All seven popular app cards load their bundled marks immediately. Available coding-agent company marks are also bundled, while unlisted/small agents retain ACP registry artwork. Unknown advanced services show a connector symbol instead of an initial. Shared SwiftUI covers macOS and iOS. Linux Marketplace embeds the same downloaded marks; GTK validation requires Linux system libraries unavailable on this Mac. The terminal client retains names because it does not render raster logos.

Validation: macOS and iOS Simulator builds passed. Installed and reopened the signed Mac build, then visually checked all seven app marks and the retained ACP marks. Trimmed only Slack's transparent image margin to match the other icon sizes. Linux formatting passed; GTK runtime/build validation was unavailable on macOS.

Dark-background refinement: use downloaded dark variants for OpenAI, Cursor, GitHub, Linear and Devin. Remove imposed white tiles in dark appearance; retain colorful artwork. Render transparent monochrome Amp, Factory and Kilo marks in the foreground color. Apple asset appearances retain light versions for light mode; Linux embeds dark variants. Raster screenshots remain unsupported in the terminal UI.

Marketplace curation: show only Codex, Claude Code, Cursor, GitHub Copilot, Gemini CLI and OpenCode in Apple Marketplace/onboarding and Linux/TUI agent catalogs. Keep the seven managed app integrations; remove the unknown MCP connector catalog entry from the graphical Marketplace. Existing sidekick configurations are preserved. TUI's installed/custom connector management remains separate from the curated graphical account-connection catalog.

Expanded the curated agent list at user request with Z.ai (GLM Agent), Kimi Code and Factory Droid. The same nine-agent choice applies to shared Apple Marketplace/onboarding, Linux and TUI; the seven app integrations stay curated.

Agent selection updated: removed GitHub Copilot from the curated coding-agent choices; Kimi Code remains included. GitHub's app integration remains available.

HubSpot added to the curated managed-app allowlist. Composio documents managed OAuth support for HubSpot; app card uses the downloaded Brandfetch HubSpot symbol. Apple shared UI and Linux use the bundled mark. End-user HubSpot authorization is performed through the Connect flow; it has not been approved on the user's behalf.

HubSpot logo refined to the official orange transparent symbol (Brandfetch archive `HubSpot_Symbol_9.png`). Remove its tile background in shared Apple UI; Linux embeds the same transparent asset.

Desktop first-run setup simplified: one primary action per step, a single agent selector, automatic account verification, compact progress indicator, and quiet Back/Skip links. Closing app connections advances the optional app step. This Mac-specific setup manages the local host; iOS uses remote-computer onboarding and Linux/TUI have no equivalent first-login four-step screen. Shared app-logo visibility is unchanged outside the desktop setup.

Onboarding completion fix: track completion immediately for the current account and persist it without duplicates. Remove temporary preview launch arguments from normal app launch. The app step loads only this account/computer's connected apps, offers Continue and a quiet Manage apps link, and reloads after connection changes. Marketplace shows loading rather than a false signed-out state and reloads when the host comes online. Managed app list/read/delete/execute ownership remains enforced by the backend; account-isolation tests cover forged filters and cross-user access.

## Daytona desktop connection

The local test Sidekick uses the official Daytona CLI MCP server (`daytona mcp start`), installed through `brew install daytonaio/cli/daytona` and authenticated with `daytona login` browser OAuth. The active organization is Personal. Credentials remain in the local Daytona CLI profile; none are embedded in app builds or shared with other app users. The installed host connector is `daytona`, enabled only for the test Sidekick. Connector verification discovered 39 tools.

This gives the Sidekick cloud execution tools; it does not automatically redirect or isolate the coding agent’s ordinary local terminal. Request Daytona explicitly for cloud tasks. Other clients can use the same connector through this host; a separate computer requires its own CLI installation and sign-in. No native UI source changes were required.

Verification: a fresh Codex session invoked `mcp.daytona.create_sandbox` and `mcp.daytona.execute_command`. Sandbox `c3fc062d-5fa2-4ab8-8ed1-f9d91e474921` ran three slugify checks plus a path-isolation unittest (4 tests total), exit code 0. The Mac canary and `/Users/chris` were absent. Private sandbox, US region, network blocked, auto-stop 1 minute, TTL 10 minutes. The CLI independently confirmed the sandbox existed. Existing agent sessions may need New Session to load newly added MCP servers.

## Mobile dark appearance

iOS now explicitly uses the shared desktop dark palette throughout the app, including navigation, sheets, onboarding and authentication presentation. The SwiftUI root prefers dark and the iOS Info.plist sets UIUserInterfaceStyle to Dark. This is an iOS appearance-policy change only: desktop, Linux and terminal rendering remain unchanged; no shared colors or controls changed.

## Simulator authentication builds

Use ad hoc code signing for mobile authentication QA. `CODE_SIGNING_ALLOWED=NO` builds compile and launch, but Clerk configuration failed in our simulator with Keychain OSStatus -34018 and fell back to clerk.clerk.dev, producing a misleading native_api_disabled response. Do not enable Native API on an unrelated fallback instance.

Verified build command:

```sh
xcodebuild -project apps/Codync.xcodeproj -scheme iOS -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/sidekicks-qa-ios CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- build
```

Terminate the old simulator app, install the signed build, and relaunch. On 2026-10-03 this reached the correct ultimate-chow-8201 Clerk endpoint and opened Google authentication successfully. Google credential completion and the callback/session still require live verification. Physical-device/TestFlight signing remains blocked by the missing owning Apple Developer account.

## Sidekicks Apple signing ownership

Xcode now uses Christian Garcia team 9S7MDN3QVL. iOS distribution bundle IDs are com.christsx.Sidekicks.ios, com.christsx.Sidekicks.ios.LiveActivity, and com.christsx.Sidekicks.ios.NotificationService. The app, widgets, notification extension and SharedStore use group.com.christsx.Sidekicks; the former Sidekicks identifiers belong to another team and cannot be provisioned by ours. This shared-storage namespace starts fresh; old development caches are not migrated. The registered Google callback remains com.pokai.Codync.ios://callback and is independent of the distribution bundle ID. Native Apple sign-in configuration and our own APNs relay credentials still need verification for this new App ID.


### Mac floating agent panel

The menu bar’s **Floating agent panel** toggle opens a persistent, top-center companion panel below the menu bar and camera cutout. It works on screens without a notch. Expand it to select visible account agents, inspect activity, send a task, stop work, or open the existing conversation for approvals, instructions, memory and routines. It uses the shared account roster; no separate agent runtime or permissions are introduced. The preference persists across launches. Display changes reposition the panel.

This is a Mac window-management feature. iOS already exposes the shared agent actions plus widgets, Live Activities and Dynamic Island; Linux and TUI retain their roster and actions because they have no macOS panel/window API. No shared capability or protocol changed. The web landing page describes the existing mobile and configuration surfaces; the notch preview was removed at the user’s request.

Validation: macOS Debug build (code signing disabled) passed; web ESLint, TypeScript and production build passed. Browser checked notch expansion and the 390px mobile viewport (no horizontal overflow). Native live-agent interactions and installation were not exercised; the installed app was not replaced.

Sign-out now immediately excludes the successfully removed Clerk session in the
shared Apple account model, including during session restoration. The Mac's
explicit local-use choice is no longer persisted as completed authentication.
Mobile already routes signed-out users to Welcome. Linux/TUI use host-local
execution and have no Clerk account welcome gate, so their UI is unaffected.

Each welcome sidekick now uses a distinct supported color on iPhone and Mac:
magenta, blue, violet, cyan, green, orange, red, yellow and brown. Linux and TUI do not render this
Apple account welcome crew; the shared avatar palette and agent color choices
remain available on their existing screens.
