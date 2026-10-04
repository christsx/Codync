import Link from "next/link";

export default function Terms() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16">
      <article className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-white">Terms of Use</h1>
        <p className="text-neutral-400 text-sm">
          Last updated: October 3, 2026
        </p>

        <Section title="1. Acceptance of Terms">
          By using Sidekicks you agree to these terms. If you don&apos;t agree,
          don&apos;t use the app.
        </Section>

        <Section title="2. The service">
          Sidekicks is software that lets you message coding agents running on
          your own computer or in an enrolled Cloud Workspace. It is currently
          in private beta. Connected providers may require paid accounts or
          incur usage costs.
        </Section>

        <Section title="3. Your responsibility">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Agents act in your computer or cloud workspace with your
              permissions. Review approval requests before allowing them;
              &quot;Approve automatically&quot; lets agents act without asking.
            </li>
            <li>
              Keep your pairing code private. Anyone with it can run agents on
              your computer; reset it with <code>codync-host reset-token</code>.
            </li>
            <li>
              You are responsible for complying with the terms of the agents and
              services you connect.
            </li>
          </ul>
        </Section>

        <Section title="4. Intellectual property">
          The source code is provided under the MIT license. Names and logos of third-party agents belong to their
          owners.
        </Section>

        <Section title="5. Disclaimer of warranties">
          Sidekicks is provided &quot;as is&quot;, without warranties of any
          kind. We don&apos;t guarantee that agents will behave as intended or
          that the service will be uninterrupted.
        </Section>

        <Section title="6. Limitation of liability">
          To the maximum extent permitted by law, we are not liable for any
          damages arising from your use of Sidekicks or of the agents it runs,
          including changes they make to your files.
        </Section>

        <Section title="7. Changes">
          We may update these terms. Continued use after changes means you
          accept them.
        </Section>

        <Section title="8. Contact">
          For questions during the private beta, contact the person who
          invited you to Sidekicks.
        </Section>

        <div className="pt-4">
          <p className="text-neutral-400">
            <Link href="/privacy" className="text-white underline">
              Privacy Policy
            </Link>
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
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
