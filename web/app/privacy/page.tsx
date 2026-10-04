export default function Privacy() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16">
      <article className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-neutral-400 text-sm">
          Last updated: October 3, 2026
        </p>

        <Section title="Overview">
          Sidekicks lets you work with coding agents from Mac and iPhone. This
          policy describes the current private beta.
        </Section>
        <Section title="Your account and workspace">
          Sign-in is provided by Clerk. Sidekicks uses Cloudflare to store
          account, device, and workspace records and to relay encrypted device
          traffic. Conversations and agent settings live on the host running
          your Sidekicks, with a cache on your device.
        </Section>
        <Section title="Cloud Workspace">
          If you use Cloud Workspace, your host runs in a private Daytona
          sandbox associated with your account. Workspace files, conversations,
          and coding-agent credentials may be stored there. Cloud infrastructure
          providers process data needed to operate that workspace. A cloud
          workspace is separate from your personal computer.
        </Section>
        <Section title="Connected agents and apps">
          Coding agents run using the accounts you connect, under their
          providers’ terms. App connections are managed through Composio and the
          services you authorize. Review the permissions before connecting an
          app or approving a task.
        </Section>
        <Section title="Notifications">
          Notifications use Apple’s notification service and a relay. Your host
          encrypts notification content for your device. Notification delivery
          depends on the current beta configuration.
        </Section>
        <Section title="Signing out">
          Signing out removes the account’s local device keys and cached
          computer data from that device. Signing out does not delete the
          workspace or files held by your host or third-party providers.
        </Section>
        <Section title="Contact">
          For questions or account-data requests during the private beta,
          contact the person who invited you to Sidekicks.
        </Section>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <div className="text-neutral-400 leading-relaxed">{children}</div>
    </section>
  );
}
