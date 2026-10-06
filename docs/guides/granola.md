# Granola integration

In Marketplace → Connectors, choose Granola, install the hosted connector, and
complete browser sign-in. Enable it in the sidekick's connector settings before
asking about meeting notes. Mobile uses the existing app OAuth callback; connect
on Cloud Workspace to access it while the Mac is closed. Credentials stay on the
selected host and are not shared between local and cloud workspaces.

The catalog uses Granola's official endpoint https://mcp.granola.ai/mcp, documented
at https://help.granola.ai/article/granola-mcp. It requires OAuth; no API key or
community package is used. It provides meeting context, not meeting recording.

All native clients use the host's connector catalog and existing install/sign-in
flows (shared Apple marketplace, Linux market, and TUI). No platform-specific UI
is added. This change needs a new host release/image to reach installed apps;
provider authorization and live note retrieval remain unverified until sign-in.
