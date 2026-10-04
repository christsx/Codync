# Sidekicks private mobile pilot QA — 2026-10-03

Status: build 2.3.1 (25) is Testing in the internal TestFlight pilot, with the account holder invited. Correct Sidekicks icon verified in the App Store Connect header. Changes are pushed on the pilot branch, not merged. External testing and live functional QA remain incomplete.

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

## Follow-up: Apple signing resolved

Christian Garcia team 9S7MDN3QVL is signed into Xcode. Replaced upstream-only iOS bundle IDs with com.christsx.Sidekicks.ios and its two extension IDs, and replaced the App Group with group.com.christsx.Sidekicks in every participating target and SharedStore. Shared Swift tests passed (73). Signed Release archive succeeded at /tmp/sidekicks-testflight.xcarchive; App Store Connect distribution export succeeded at /tmp/sidekicks-testflight-ipa/Sidekicks.ipa. Version 2.3.1, build 24. These temporary local artifacts should be preserved outside /tmp if retained long term.

The earlier missing-account blocker is resolved. Upload and tester distribution are still pending App Store Connect browser login and creation/verification of the Sidekicks app record. No build uploaded. Native Apple sign-in and the own-team APNs relay remain unverified. Signing configuration changes are pushed on codex/sidekicks-testflight.

## Follow-up: TestFlight upload and pilot setup

Created App Store Connect app 6818920368, named Sidekicks - AI Employees (the plain Sidekicks store name was unavailable). iOS home-screen name remains Sidekicks. Upload of 2.3.1 (24) succeeded and Apple processing completed. Created Sidekicks Internal Pilot with manual build distribution, added the account holder, assigned build 24, and saved beta description, feedback contact and What to Test instructions. External beta review/contact details and tester emails remain pending.

Deployed the tested cloud relay-presence fix to sidekicks-cloud-dev; Worker version e0e33ab3-af75-4ad0-9459-af9d1a7daaa1. Live /v1/health returned ok. Uploaded build has a non-blocking missing WebRTC dSYM warning, limiting symbols for that framework.

User spotted the upstream iOS icon in build 24. Replaced it with the existing desktop furry-orange mascot, packaged as an opaque 1024x1024 iOS icon using scripts/design/package-ios-icon.swift; raised build number to 25. Icon-only iOS packaging change: desktop, Linux and TUI rendering are unaffected.

Build 25 signed archive and upload succeeded. Apple TestFlight lists 2.3.1 (25) as Processing. The archive metadata confirms build 25; iOS icon source is opaque 1024x1024, using the desktop mascot. The missing WebRTC dSYM warning remains non-blocking. Await processing before moving the internal pilot to build 25.

Build 25 processing completed. Assigned it to Sidekicks Internal Pilot, saved its test instructions, and removed the group from build 24. Group Builds now shows one build: 2.3.1 (25), Testing. Account holder status is Invited. App Store draft version changed to 2.3.1 with build 25 selected; visually verified furry orange icon beside the app name. No public App Store review submission or release performed. External tester emails, review-contact phone, privacy policy URL, and review access remain missing.
