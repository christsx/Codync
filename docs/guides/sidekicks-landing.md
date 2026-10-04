# Sidekicks landing and welcome palette

The website in `web/` is a dark landing page for usesidekicks.com, using the
existing orange plush logo and Libraries.dev React avatars. It includes a
responsive illustrative app preview, agent and integration logos, workflow,
iPhone preview, FAQ, and honest private-beta download status. The public Mac
installer has not been released; download links point to the owned release page.
The domain is configured in metadata and CNAME; hosting/DNS is not yet published.

Only the title character animates, with offscreen, hidden-page, and reduced
motion pauses. Other character renders are paused. No RGB glow or animated
background is introduced. Onboarding in iOS and macOS uses orange and gray
characters, preserving silhouettes and motion. Shared avatars and user-selected
character colors are unchanged. Linux and terminal clients have no equivalent
Clerk welcome character scene and need no palette change.

Validation: website production export, lint, and diff check passed. Browser checks
at 390px showed no horizontal overflow; Sidekick selection and FAQ disclosure
worked. macOS Debug build and signed iOS build 28 archive passed. Native visual
inspection and TestFlight device verification remain pending.

The landing page has no invented character names or introductions. Product
preview rows use the actual agent names. Build 2.3.1 (28) is uploaded and Testing
in Sidekicks Internal Pilot, with onboarding test instructions saved.

The landing page now uses the x.ai/bot page as a layout reference: compact
centered title, pill actions, a prominent app preview, and simple feature panels.
The characters retain orange, purple, and blue colors. The website change does
not alter native app onboarding or TestFlight build 28.
