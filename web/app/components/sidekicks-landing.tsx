"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BotAvatar, type BotAvatarType } from "bot-avatars";
import {
  ArrowDown,
  ArrowRight,
  Desktop,
  GithubLogo,
  MagnifyingGlass,
  SquaresFour,
  CaretDown,
  UserCircle,
  Plus,
} from "@phosphor-icons/react";
import Reveal from "./reveal";
import { GITHUB } from "../links";

const crew = [
  {
    name: "Codex",
    role: "Coding agent",
    type: "flower" as BotAvatarType,
    color: "#f65baa",
    task: "Polish the onboarding flow",
    reply:
      "The onboarding is simpler now. I tightened the spacing, cleaned up the buttons, and kept the dark theme. Ready for your review.",
  },
  {
    name: "Claude Code",
    role: "Coding agent",
    type: "star" as BotAvatarType,
    color: "#a78be8",
    task: "Give the homepage a little personality",
    reply:
      "A quieter layout, a warmer palette, and a little movement. I put together a fresh direction for the homepage. Take a look.",
  },
  {
    name: "Cursor",
    role: "Coding agent",
    type: "blob" as BotAvatarType,
    color: "#70bce3",
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
  expressive = false,
}: {
  type: BotAvatarType;
  color: string;
  size?: number;
  animated?: boolean;
  expressive?: boolean;
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
        saturation={type === "clover" || type === "flower" ? 1.6 : 1.15}
        brightness={type === "clover" || type === "flower" ? 1.05 : 1}
        shadow={type === "clover" || type === "flower" ? 0.6 : 1.15}
        lightFront={type === "clover" || type === "flower" ? 45 : 32}
        highlight={type === "clover" || type === "flower" ? 1.7 : 1.45}
        shine={type === "clover" || type === "flower" ? 0.3 : 0}
        furDensity={0.65}
        paused={!active}
        speed={0.85}
        seed={expressive ? 0.4 : Math.min(size / 120, 0.9)}
        turn={1}
        jumpEvery={8}
        interactive={size >= 80}
        theme="dark"
        whirl={0}
      />
    </div>
  );
}

export default function SidekicksLanding() {
  const [dashboardStarted, setDashboardStarted] = useState(true);
  return (
    <>
      <header className="site-header">
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#" className="wordmark">
            <Avatar type="clover" color="#f58632" size={36} />
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
          <p className="release-label">MAC & IPHONE · PRIVATE BETA</p>
          <h1 className="meet-title">
            Meet <Avatar {...crew[0]} size={86} animated /> Sidekicks
          </h1>
          <p className="hero-copy">
            A home for your coding agents.
            <br /> Start a task on Mac. Follow the work from iPhone.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#download">
              <Desktop size={18} /> View Mac releases
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
            <div className="desktop-dashboard">
              <aside className="desktop-sidebar">
                <div className="desktop-sidebar-top">
                  <div className="traffic">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>
                    1 connected <CaretDown size={12} />
                  </span>
                  <button
                    aria-label="New Sidekick"
                    onClick={() => setDashboardStarted(true)}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="desktop-search">
                  <MagnifyingGlass size={17} />
                  <span>Search</span>
                </div>
                <div className="desktop-sidekicks">
                  {dashboardStarted ? (
                    crew.map((member) => (
                      <div className="desktop-member" key={member.name}>
                        <Avatar {...member} size={40} />
                        <span>
                          {member.name}
                          <small>{member.role}</small>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="desktop-empty">
                      <strong>No sidekicks yet</strong>
                      <p>Use + to start a new chat.</p>
                    </div>
                  )}
                </div>
                <div className="desktop-sidebar-footer">
                  <span>
                    <SquaresFour size={20} /> Marketplace
                  </span>
                  <span>
                    <UserCircle size={24} /> Account
                  </span>
                </div>
              </aside>
              {dashboardStarted ? (
                <div className="product-conversation">
                  <div className="product-chat-header">
                    <span>
                      <Avatar {...crew[0]} size={30} /> Codex
                    </span>
                    <small>EXAMPLE CONVERSATION</small>
                  </div>
                  <div className="product-chat-body">
                    <div className="product-request">
                      Simplify onboarding. Keep account connections optional and
                      take people straight to their workspace.
                    </div>
                    <div className="product-response">
                      <Avatar {...crew[0]} size={35} />
                      <div>
                        <strong>Codex</strong>
                        <p>
                          I’ve shortened the flow to two steps and added a skip
                          option for connections.
                        </p>
                        <div className="product-change">
                          <span>OnboardingView.swift</span>
                          <small>+24 −61</small>
                        </div>
                        <div className="product-change">
                          <span>AccountConnections.swift</span>
                          <small>+12 −8</small>
                        </div>
                        <p className="product-result">Ready for your review.</p>
                      </div>
                    </div>
                  </div>
                  <div className="product-input">
                    <Plus size={16} />
                    <span>Message Codex…</span>
                    <ArrowRight size={16} />
                  </div>
                  <button
                    className="preview-reset"
                    onClick={() => setDashboardStarted(false)}
                  >
                    View welcome screen
                  </button>
                </div>
              ) : (
                <div className="desktop-welcome">
                  <div className="desktop-roster">
                    <Avatar type="blob" color="#70bce3" size={70} />
                    <Avatar type="square" color="#f58632" size={70} />
                    <Avatar type="drop" color="#a78be8" size={70} />
                  </div>
                  <h2>Your sidekicks, ready to build with you.</h2>
                  <p>
                    Pick a sidekick, or create one for each kind of work and
                    point it at a project.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => setDashboardStarted(true)}
                  >
                    Explore a conversation
                  </button>
                </div>
              )}
            </div>
          </Reveal>
        </section>
        <section
          className="agent-strip container"
          aria-label="Choose your coding agent"
        >
          <p>Works with the coding agents you already use.</p>
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
              <h2>Less switching. More building.</h2>
              <p>
                Your agents, conversations, and account connections in one app.
              </p>
            </div>
          </Reveal>
          <div className="workflow-lines">
            <article>
              <span>01</span>
              <div>
                <h3>Give each task its own space.</h3>
                <p>
                  Keep a feature, a fix, and a review in separate conversations.
                  Pick the coding agent for each one.
                </p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>See the work. Decide what’s next.</h3>
                <p>
                  Follow progress and review permission requests in the same
                  conversation.
                </p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Choose where it runs.</h3>
                <p>
                  Work on your computer, or use a Cloud Workspace in the private
                  beta.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section className="mobile-editorial container">
          <span className="editorial-label">AWAY FROM YOUR DESK</span>
          <div>
            <h2>
              The same workspace.
              <br />A smaller screen.
            </h2>
            <p>
              Read updates and review requests on iPhone. Cloud Workspace runs
              independently of your Mac; connecting your computer remains an
              option.
            </p>
            <a href="#download" className="text-link">
              About the iPhone beta <ArrowRight size={16} />
            </a>
          </div>
        </section>
        <section className="tools-section container">
          <div>
            <span className="eyebrow">CONNECTIONS</span>
            <h2>Your accounts, connected.</h2>
            <p>
              Connect the services your work depends on. Each user connects
              their own accounts.
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
            <span className="eyebrow">DETAILS</span>
            <h2>Before you install.</h2>
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
          <span className="eyebrow">AVAILABILITY</span>
          <h2>Sidekicks is in private beta.</h2>
          <p>Sidekicks for Mac. iPhone access in the private beta.</p>
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
          <Avatar type="clover" color="#f58632" size={29} />
          Sidekicks
        </a>
        <p>Built for Mac. Connected to iPhone.</p>
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
