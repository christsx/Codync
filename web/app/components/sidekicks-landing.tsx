"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BotAvatar, type BotAvatarType } from "bot-avatars";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Cloud,
  Desktop,
  GithubLogo,
  PaperPlaneTilt,
  Plus,
  ShieldCheck,
} from "@phosphor-icons/react";
import Reveal from "./reveal";
import { GITHUB } from "../links";

const crew = [
  {
    name: "Codex",
    role: "Coding agent",
    type: "clover" as BotAvatarType,
    color: "#d99154",
    task: "Polish the onboarding flow",
    reply:
      "The onboarding is simpler now. I tightened the spacing, cleaned up the buttons, and kept the dark theme. Ready for your review.",
  },
  {
    name: "Claude Code",
    role: "Coding agent",
    type: "star" as BotAvatarType,
    color: "#a48cda",
    task: "Give the homepage a little personality",
    reply:
      "A quieter layout, a warmer palette, and a little movement. I put together a fresh direction for the homepage. Take a look.",
  },
  {
    name: "Cursor",
    role: "Coding agent",
    type: "blob" as BotAvatarType,
    color: "#72b1d5",
    task: "Help me plan the next release",
    reply:
      "I drafted a release checklist with the remaining fixes and review steps. You can choose what to tackle first.",
  },
];

function Avatar({
  type,
  color,
  size = 64,
  animated = false,
}: {
  type: BotAvatarType;
  color: string;
  size?: number;
  animated?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () =>
      setActive(animated && visible && !document.hidden && !media.matches);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    media.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      media.removeEventListener("change", update);
    };
  }, [animated]);
  return (
    <div
      ref={ref}
      className="avatar"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <BotAvatar
        type={type}
        color={color}
        size={size}
        shading="fabric"
        saturation={1.15}
        furDensity={0.65}
        paused={!active}
        speed={0.55}
        theme="dark"
        whirl={0}
      />
    </div>
  );
}

export default function SidekicksLanding() {
  const [selected, setSelected] = useState(0);
  const pal = crew[selected];
  return (
    <>
      <header className="site-header">
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#" className="wordmark">
            <Image
              src="/sidekicks/logo.webp"
              width={36}
              height={36}
              alt=""
              priority
            />
            Sidekicks<span className="beta">BETA</span>
          </a>
          <div className="nav-links">
            <a href="#preview">Overview</a>
            <a href="#workflow">Features</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="button small" href="#download">
            Get Sidekicks <ArrowDown size={14} />
          </a>
        </nav>
      </header>
      <main>
        <section className="hero-section">
          <a className="launch-pill" href="#download">
            Sidekicks for Mac <span>Private beta</span>
            <ArrowRight size={13} />
          </a>
          <h1 className="meet-title">
            Meet <Avatar {...crew[0]} size={86} animated /> Sidekicks
          </h1>
          <p className="hero-copy">
            Your sidekicks, ready to build with you. Connect your coding agents,
            <br className="desktop-break" /> give them a task, and keep the work
            moving from Mac or iPhone.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#download">
              <Desktop size={18} /> Get Sidekicks for Mac
            </a>
            <a className="button secondary" href="#preview">
              Explore the app <ArrowDown size={15} />
            </a>
          </div>
        </section>
        <section
          className="preview-section container"
          id="preview"
          aria-label="Interactive product preview"
        >
          <Reveal>
            <div className="app-window">
              <div className="window-top">
                <div className="traffic">
                  <i />
                  <i />
                  <i />
                </div>
                <span>Sidekicks</span>
                <span className="preview-label">PRODUCT PREVIEW</span>
              </div>
              <div className="app-body">
                <aside className="app-sidebar">
                  <div className="workspace-label">
                    <Image
                      src="/sidekicks/logo.webp"
                      alt=""
                      width={28}
                      height={28}
                    />
                    Your workspace
                  </div>
                  <div className="sidebar-heading">
                    SIDEKICKS <Plus size={13} />
                  </div>
                  <div role="tablist" aria-label="Choose a Sidekick">
                    {crew.map((member, i) => (
                      <button
                        key={member.name}
                        role="tab"
                        id={`pal-tab-${i}`}
                        aria-controls="pal-panel"
                        aria-selected={selected === i}
                        onClick={() => setSelected(i)}
                        className={`pal-row ${selected === i ? "selected" : ""}`}
                      >
                        <Avatar {...member} size={43} />
                        <span>
                          <strong>{member.name}</strong>
                          <small>{member.role}</small>
                        </span>
                        <span className="online-dot" />
                      </button>
                    ))}
                  </div>
                  <div className="sidebar-bottom">
                    <Cloud size={15} /> Cloud Workspace{" "}
                    <span className="online-dot" />
                  </div>
                </aside>
                <div
                  className="chat-demo"
                  role="tabpanel"
                  id="pal-panel"
                  aria-labelledby={`pal-tab-${selected}`}
                >
                  <div className="chat-heading">
                    <span>{pal.name}</span>
                    <span className="ready">
                      <span className="status-dot" /> Ready
                    </span>
                  </div>
                  <div className="chat-content" key={selected}>
                    <div className="chat-date">TODAY</div>
                    <div className="user-message">{pal.task}</div>
                    <div className="agent-message">
                      <Avatar {...pal} size={46} />
                      <div>
                        <strong>{pal.name}</strong>
                        <p>{pal.reply}</p>
                        <div className="review-pill">
                          <Check size={13} /> Changes ready to review
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="demo-composer">
                    <Plus size={17} />
                    <span>Message {pal.name}…</span>
                    <span className="send-icon">
                      <PaperPlaneTilt size={16} weight="fill" />
                    </span>
                  </div>
                  <p className="demo-note">
                    A glimpse of your crew. Click a Sidekick to explore.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
        <section
          className="agent-strip container"
          aria-label="Choose your coding agent"
        >
          <p>Your favorite agents. A little more personal.</p>
          <div>
            {[
              ["openai", "Codex"],
              ["claude", "Claude Code"],
              ["cursor", "Cursor"],
            ].map(([logo, name]) => (
              <span key={name}>
                <Image
                  src={`/brands/${logo}.png`}
                  alt=""
                  width={22}
                  height={22}
                />
                {name}
              </span>
            ))}
            <span className="muted">& more</span>
          </div>
        </section>
        <section className="workflow-section container" id="workflow">
          <Reveal>
            <div className="section-heading">
              <h2>Give your agents a place to work.</h2>
              <p>
                One conversation for each Sidekick. A clear view of what’s
                happening.
                <br />
                Your favorite agents, with a little more personality.
              </p>
            </div>
          </Reveal>
          <div className="feature-grid">
            <Reveal>
              <article className="feature-panel">
                <div className="feature-visual">
                  <Avatar {...crew[0]} size={104} />
                </div>
                <h3>Start with a conversation</h3>
                <p>
                  Ask for a feature, hand off a fix, or work through an idea.
                  Keep the task and its updates in the same chat.
                </p>
                <div className="mini-message">
                  Can you clean up the onboarding?
                  <ArrowRight size={15} />
                </div>
              </article>
            </Reveal>
            <Reveal delay={0.06}>
              <article className="feature-panel">
                <div className="feature-visual feature-pair">
                  <Avatar {...crew[1]} size={98} />
                  <Avatar {...crew[2]} size={98} />
                </div>
                <h3>Make room for more work</h3>
                <p>
                  Create separate Sidekicks for different tasks. Choose the
                  agents you want and keep their conversations organized.
                </p>
                <div className="mini-status">
                  <span className="status-dot" /> Coding{" "}
                  <span className="status-dot" /> Reviewing{" "}
                  <span className="status-dot" /> Planning
                </div>
              </article>
            </Reveal>
            <Reveal>
              <article className="feature-panel compact">
                <ShieldCheck size={29} />
                <h3>Stay in control</h3>
                <p>
                  Review requests and approve actions when your agent needs
                  permission. See the work before deciding what comes next.
                </p>
              </article>
            </Reveal>
            <Reveal delay={0.06}>
              <article className="feature-panel compact">
                <Cloud size={29} />
                <h3>Choose where work runs</h3>
                <p>
                  Use your own computer, or a separate Cloud Workspace in the
                  private beta. Your workspace belongs to your account.
                </p>
              </article>
            </Reveal>
          </div>
        </section>
        <section className="everywhere-section container">
          <Reveal>
            <div className="everywhere-card">
              <div>
                <span className="eyebrow">YOUR CREW, WITH YOU</span>
                <h2>
                  Big ideas.
                  <br />
                  Small screen.
                </h2>
                <p>
                  Start on your Mac. Check in from your iPhone.
                  <br />
                  Cloud Workspace is available in the private beta, with the
                  option to connect your computer.
                </p>
                <a href="#download" className="text-link">
                  Explore the beta <ArrowRight size={16} />
                </a>
              </div>
              <div className="phone">
                <div className="phone-island" />
                <div className="phone-top">
                  9:41 <span>•••</span>
                </div>
                <h3>
                  Your Sidekicks <Plus size={18} />
                </h3>
                {crew.map((member) => (
                  <div className="phone-pal" key={member.name}>
                    <Avatar {...member} size={55} />
                    <span>
                      <strong>{member.name}</strong>
                      <small>{member.role}</small>
                    </span>
                    <span className="online-dot" />
                  </div>
                ))}
                <div className="phone-cloud">
                  <Cloud size={15} /> Cloud Workspace
                </div>
                <div className="phone-home" />
              </div>
            </div>
          </Reveal>
        </section>
        <section className="tools-section container">
          <div>
            <span className="eyebrow">AT HOME IN YOUR WORKFLOW</span>
            <h2>
              Your tools.
              <br />
              Meet your crew.
            </h2>
            <p>
              Connect the apps you already work in.
              <br />
              Keep each account’s connections its own.
            </p>
          </div>
          <div className="tool-grid">
            {[
              ["slack", "Slack"],
              ["github", "GitHub"],
              ["notion", "Notion"],
              ["linear", "Linear"],
              ["hubspot", "HubSpot"],
            ].map(([logo, name]) => (
              <div key={name}>
                <Image
                  src={`/brands/${logo}.png`}
                  alt=""
                  width={34}
                  height={34}
                />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="faq-section container" id="faq">
          <div className="section-heading">
            <span className="eyebrow">A FEW THINGS TO KNOW</span>
            <h2>Before you meet.</h2>
          </div>
          <div className="faq-list">
            {[
              [
                "What is Sidekicks?",
                "A native app that turns coding agents into named work companions. Chat with your Sidekicks, give them tasks, and review their work from Mac or iPhone.",
              ],
              [
                "Do I need a new AI subscription?",
                "Sidekicks uses the coding agents you connect. Their account requirements, usage limits, and any subscription or API costs still apply.",
              ],
              [
                "Does my computer need to stay on?",
                "For work running on your computer, yes. The private mobile beta also offers Cloud Workspace, so enrolled accounts can run a separate workspace without keeping a laptop connected.",
              ],
              [
                "Can I download it now?",
                "Sidekicks is in private beta. iPhone testing is invite-only through TestFlight. A public Mac installer is coming; the release page will list it when it is ready.",
              ],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <Plus size={17} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="download-section container" id="download">
          <Image
            src="/sidekicks/logo.webp"
            alt="Orange plush Sidekicks character"
            width={106}
            height={106}
          />
          <span className="eyebrow">LET’S MAKE SOMETHING</span>
          <h2>
            Your next idea
            <br />
            deserves a Sidekick.
          </h2>
          <p>Same tools. A friendlier way to work.</p>
          <a href={`${GITHUB}/releases`} className="button primary">
            <Desktop size={19} /> View Mac releases <ArrowRight size={16} />
          </a>
          <p className="download-status">
            Public Mac download coming soon · macOS 14+
          </p>
          <span className="beta-note">
            iPhone beta is currently invite-only.
          </span>
        </section>
      </main>
      <footer className="site-footer container">
        <a className="wordmark" href="#">
          <Image src="/sidekicks/logo.webp" alt="" width={29} height={29} />
          Sidekicks
        </a>
        <p>A little crew. A lot done.</p>
        <div>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href={GITHUB} aria-label="Sidekicks on GitHub">
            <GithubLogo size={19} />
          </a>
        </div>
      </footer>
    </>
  );
}
