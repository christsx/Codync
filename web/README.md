# Sidekicks landing page

Dark, responsive marketing site for https://usesidekicks.com. Uses the app's
orange plush logo, Libraries.dev bot avatars, restrained animations, an
interactive illustrative app preview, native FAQ disclosure, and local brand
assets. Only three hero avatars animate; animation pauses offscreen, when the
page is hidden, and for reduced-motion preferences.

Run `npm ci`, then `npm run dev`. Validate with `npm run lint` and `npm run build`.
The Next.js static export is written to `out/`. Deploy that export or connect the
`web` directory to a Next.js hosting project. `public/CNAME` and metadata identify
usesidekicks.com; DNS and hosting are separate and are not activated by this file.

The repository currently has no public Mac release. Calls to action lead to the
download section, where availability is stated and the owned GitHub release page
is linked. Replace that link with a verified signed installer URL when published.
iPhone beta is invite-only; no unverified TestFlight public link is advertised.

Product previews are illustrative, not live authenticated sessions. Website
privacy copy describes the current Clerk/Cloudflare/Daytona/Composio beta and
should be reviewed before public launch.
