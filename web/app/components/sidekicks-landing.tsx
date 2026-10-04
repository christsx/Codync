"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BotAvatar, type BotAvatarType } from "bot-avatars";
import {
  Gear,
  CaretDoubleRight,
  Export,
  Power,
  Folder,
  ChatText,
  ArrowUp,
  ArrowRight,
  Cloud,
  Desktop,
  MagnifyingGlass,
  SquaresFour,
  CaretDown,
  UserCircle,
  Plus,
} from "@phosphor-icons/react";
import Reveal from "./reveal";

const crew = [
  {
    name: "Pip",
    role: "Codex",
    type: "flower" as BotAvatarType,
    color: "#f65baa",
    task: "Polish the onboarding flow",
    reply:
      "The onboarding is simpler now. I tightened the spacing, cleaned up the buttons, and kept the dark theme. Ready for your review.",
  },
  {
    name: "Aster",
    role: "Claude Code",
    type: "star" as BotAvatarType,
    color: "#a78be8",
    task: "Give the homepage a little personality",
    reply:
      "A quieter layout, a warmer palette, and a little movement. I put together a fresh direction for the homepage. Take a look.",
  },
  {
    name: "Mochi",
    role: "Cursor",
    type: "blob" as BotAvatarType,
    color: "#70bce3",
    task: "Help me plan the next release",
    reply:
      "I drafted a release checklist with the remaining fixes and review steps. You can choose what to tackle first.",
  },
  {
    name: "Bramble",
    role: "OpenCode",
    type: "clover" as BotAvatarType,
    color: "#8abf9e",
    task: "Review the latest changes",
    reply: "The review is ready.",
  },
  {
    name: "Tiko",
    role: "Kimi",
    type: "square" as BotAvatarType,
    color: "#e9ad67",
    task: "Fix the sign-in flow",
    reply: "Sign-in is ready to test.",
  },
  {
    name: "Rue",
    role: "Gemini CLI",
    type: "drop" as BotAvatarType,
    color: "#95a7e8",
    task: "Check the next release",
    reply: "The release checklist is ready.",
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
            <Avatar type="flower" color="#f65baa" size={36} />
            Sidekicks<span className="beta">BETA</span>
          </a>
          <div className="nav-links">
            <a href="#preview">Overview</a>
            <a href="#workflow">Features</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="button small" href="#download">
            Get Sidekicks
          </a>
        </nav>
      </header>
      <main>
        <section className="hero-section">
          <h1 className="meet-title">
            Meet <Avatar {...crew[0]} size={86} animated /> Sidekicks
          </h1>
          <p className="hero-copy">
            Your coding agents, together in one native app.
            <br className="desktop-break" /> Give them work. Review what comes
            back. Keep going from Mac or iPhone.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#download">
              <Desktop size={18} /> Get Sidekicks for Mac
            </a>
            <a className="button secondary" href="#preview">
              Explore the app
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
                      <Avatar {...crew[0]} size={30} /> Pip
                    </span>
                    <small className="chat-connected">
                      <Desktop size={12} /> Connected
                    </small>
                    <Export className="chat-export" size={20} />
                  </div>
                  <div className="product-chat-body">
                    <div className="conversation-date">Today 9:41 AM</div>
                    <div className="product-request">
                      Simplify onboarding. Make account connections optional.
                    </div>
                    <div className="message-time sent-time">9:41 AM</div>
                    <div className="native-reply">
                      I’ve shortened the flow to two steps and added a skip
                      option for connections.
                      <br />
                      <br />
                      The changes are ready for your review.
                    </div>
                    <div className="message-time">9:42 AM</div>
                  </div>
                  <div className="product-input">
                    <span className="composer-add" aria-hidden="true">
                      <Plus size={18} />
                    </span>
                    <div className="composer-field">
                      <span>Ask Pip</span>
                      <span className="composer-send" aria-hidden="true">
                        <ArrowUp size={18} weight="bold" />
                      </span>
                    </div>
                  </div>
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
              {dashboardStarted && (
                <aside className="dashboard-details">
                  <div className="details-heading"><strong>Details</strong><Gear size={19} /><CaretDoubleRight size={19} /></div>
                  <div className="details-computer">
                    <div><Desktop size={24} /><span><strong>My Mac</strong><small>Remote screen</small></span></div>
                    <p><Power size={17} /> Remote screen is off</p>
                  </div>
                  <div className="details-routines">
                    <h4>Routines <ChatText size={18} /><Plus size={18} /></h4>
                    <p>No routines yet. Ask the sidekick for one, or set it up yourself with +.</p>
                  </div>
                  <div className="details-agent">
                    <h4>Agent</h4>
                    <p><span>Runtime</span><strong>Codex</strong></p>
                    <small><Folder size={15} /> Workspace</small>
                    <div>Personal · managed by Sidekicks</div>
                  </div>
                </aside>
              )}
            </div>
            <button className="preview-reset" onClick={() => setDashboardStarted(!dashboardStarted)}>
              {dashboardStarted ? "View welcome screen" : "View conversation"}
            </button>
          </Reveal>
        </section>
        <section
          className="agent-strip container"
          aria-label="Choose your coding agent"
        >
          <p>Works with the coding agents you already use.</p>
          <div>
            {[
              ["openai.png", "Codex"],
              ["claude.png", "Claude Code"],
              ["cursor.png", "Cursor"],
              ["opencode.png", "OpenCode"],
              ["kimi.svg", "Kimi"],
              ["zai.svg", "Z.ai"],
              ["gemini.png", "Gemini CLI"],
              ["cline.svg", "Cline"],
            ].map(([logo, name]) => (
              <span key={name}>
                <Image
                  src={`/brands/${logo}`} 
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
              <h2>One place for the work you hand off.</h2>
              <p>
                Your agents, conversations, and account connections in one app.
              </p>
            </div>
          </Reveal>
          <div className="workflow-lines">
            <article>
              <div>
                <h3>A conversation for every project.</h3>
                <p>
                  Keep a feature, a fix, and a review in separate conversations.
                  Pick the coding agent for each one.
                </p>
              </div>
            </article>
            <article>
              <div>
                <h3>Progress and approvals, together.</h3>
                <p>
                  Follow progress and review permission requests in the same
                  conversation.
                </p>
              </div>
            </article>
            <article>
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
        <section className="everywhere-section container">
          <Reveal>
            <div className="everywhere-card">
              <div>
                <h2>
                  Your workspace,
                  <br />
                  wherever you are.
                </h2>
                <p>
                  Check progress and review requests from iPhone. Use Cloud
                  Workspace in the private beta, or connect your Mac to run work
                  locally.
                </p>
              </div>
              <div className="phone">
                <div className="phone-island" />
                <div className="phone-top">
                  9:41 <span>•••</span>
                </div>
                <h3>
                  Your Sidekicks <Plus size={18} />
                </h3>
                {crew.slice(0, 3).map((member) => (
                  <div className="phone-pal" key={member.name}>
                    <Avatar {...member} size={55} />
                    <span>
                      <strong>{member.name}</strong>
                      <small>{member.role}</small>
                    </span>
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
            <h2>Connect the accounts you work in.</h2>
            <p>
              GitHub for code. Slack for conversations. Your connections stay
              tied to your account.
            </p>
          </div>
          <div className="tool-grid">
            {[
              ["slack", "Slack"],
              ["github", "GitHub"],
              ["linear", "Linear"],
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
            <h2>A few practical details.</h2>
          </div>
          <div className="faq-list">
            {[
              [
                "What is Sidekicks?",
                "A native app that brings your coding agents together. Chat with your Sidekicks, give them tasks, and review their work from Mac or iPhone.",
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
                "Sidekicks is in private beta. iPhone testing is invite-only through TestFlight. A public Mac installer is coming soon.",
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
          <Avatar type="flower" color="#f65baa" size={106} />
          <h2>A little crew. A lot done.</h2>
          <p>Sidekicks for Mac. iPhone access in the private beta.</p>
          <p className="download-status">
            Public Mac download coming soon · macOS 14+
          </p>
          <span className="beta-note">
            iPhone beta is currently invite-only.
          </span>
        </section>
      </main>
      <footer className="site-footer container">
        <div className="footer-brand">
          <a className="wordmark" href="#">
            <Avatar type="flower" color="#f65baa" size={36} />
            Sidekicks
          </a>
          <p>© 2026 Sidekicks</p>
        </div>
        <nav className="footer-group" aria-label="Product links">
          <h3>Sidekicks</h3>
          <a href="#preview">The app</a>
          <a href="#workflow">How it works</a>
          <a href="#faq">Questions</a>
        </nav>
        <nav className="footer-group" aria-label="Download links">
          <h3>Get Sidekicks</h3>
          <a href="#download">iPhone beta</a>
        </nav>
        <nav className="footer-group" aria-label="Legal links">
          <h3>Legal</h3>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </footer>
    </>
  );
}
