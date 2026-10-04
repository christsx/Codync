# Sidekicks private mobile pilot QA — 2026-10-03

Status: not ready for TestFlight upload. Local fixes have not been merged or deployed.

## Verified

- Cloud tests: 101 passed; TypeScript check passed.
- Shared Swift: 73 tests passed, including account-context separation and duplicate-send recovery.
- Host: 177 unit tests passed, one ignored. Full end-to-end run: ten passed, one host startup timeout; the failed authentication test passed alone. Formatting and Clippy passed.
- Push relay: ticket, push, Live Activity payload, request validation, and physical-device deduplication tests passed; TypeScript passed. Production dependency audit reports zero vulnerabilities. Installation reported six development dependency vulnerabilities; these remain to triage.
- iOS Release simulator build passed, including a rebuild with the corrected Sidekicks environment. Installed and launched on iPhone 17 Pro simulator; accessibility inspection confirmed the Sidekicks welcome page and Continue with Google button. Bundled cloudURL verified as our Sidekicks Worker.
- Earlier live Daytona agent smoke test: four tests passed inside a private, network-blocked cloud sandbox. Slack and HubSpot read-only integration tests previously succeeded.

## Fixes made

- Persist offline host presence before notifying devices, eliminating the observed stale online-state race. Existing regression test passes.
- Release pilot builds now select our Sidekicks development Clerk/backend configuration rather than upstream Codync production. Xcode project regenerated. This remains a private development environment, not public production configuration.

## Release blockers and outstanding validation

- Signed archive failed: Xcode has no account for team 7FUM8A8H72 and no profiles for the iOS app, Live Activity, and Notification Service. Confirm the owning team and bundle identifiers in App Store Connect, then archive/export/upload. No upload performed.
- Verify real-device Google login, onboarding, paired-host connection, background reconnect, push notifications, and sign-out/account switching.
- Run three distinct user accounts end-to-end. Automated ownership tests do not establish live user isolation.
- Mobile controls a paired computer; Daytona is currently an optional MCP tool and does not run the entire coding agent independently of that computer.
- Daytona credentials and local/SSH connections belong to the OS host, not the selected Sidekicks login. Do not share a host among untrusted pilot accounts. Use separate hosts and personal provider accounts until account-scoped execution is implemented.
- A mandatory single execution destination is not implemented; the agent can access local tools and Daytona. UI duplicate-send recovery tests do not prove exactly-once external sandbox execution.
- Cloud presence fix is local only and needs deployment before remote pilot validation. Public production auth/backend, release ownership, privacy disclosures, and App Store review metadata remain unverified.
- Linux/GTK execution was not tested on this Mac.

## Follow-up: mobile authentication

Unsigned simulator sign-in reproduced Keychain -34018 and Clerk fallback-endpoint failure. Rebuilt with ad hoc simulator signing; correct Sidekicks Clerk endpoint verified in logs, Google OAuth opened and reached a QR-code login step. Full callback and session completion remain pending the user completing Google sign-in. No backend Native API setting was changed.
