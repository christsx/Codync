"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BotAvatar, type BotAvatarType } from "bot-avatars";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Cloud,
  Command,
  Desktop,
  GithubLogo,
  PaperPlaneTilt,
  Plus,
  ShieldCheck,
  Sparkle,
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
    color: "#a59b8d",
    task: "Give the homepage a little personality",
    reply:
      "A quieter layout, a warmer palette, and a little movement. I put together a fresh direction for the homepage. Take a look.",
  },
  {
    name: "Cursor",
    role: "Coding agent",
    type: "blob" as BotAvatarType,
    color: "#929b97",
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
        saturation={color === "#d99154" ? 0.8 : 0.1}
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
            <a href="#meet">Meet the crew</a>
            <a href="#workflow">How it works</a>
            <a href="#faq">FAQ</a>
          </div>
          <a className="button small" href="#download">
            Get Sidekicks <ArrowDown size={14} />
          </a>
        </nav>
      </header>
      <main>
        <section className="hero-section">
          <div className="hero-crew">
            <div className="hero-pal left">
              <Avatar {...crew[2]} size={144} animated />
            </div>
            <div className="hero-pal middle">
              <Avatar {...crew[0]} size={208} animated />
            </div>
            <div className="hero-pal right">
              <Avatar {...crew[1]} size={138} animated />
            </div>
          </div>
          <div className="eyebrow">
            <span className="status-dot" /> A LITTLE CREW. A LOT DONE.
          </div>
          <h1>
            Your sidekicks.
            <br />
            <span>Ready to build with you.</span>
          </h1>
          <p className="hero-copy">
            Your coding agents, together in one clean workspace.
            <br className="desktop-break" /> Give them real work. Stay in the
            loop. Make something great.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#download">
              <Desktop size={19} /> Get Sidekicks for Mac
            </a>
            <a className="text-link" href="#preview">
              Take a look <ArrowDown size={16} />
            </a>
          </div>
          <p className="availability">
            Made for Mac. Take your crew with you on iPhone.
          </p>
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
                    <span>
                      {pal.name}
                    </span>
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
        <section className="meet-section container" id="meet">
          <Reveal>
            <div className="section-heading">
              <span className="eyebrow">MEET YOUR SIDEKICKS</span>
              <h2>Built around the way you work.</h2>
              <p>
                Connect the coding agents you already use.
                <br />
                Keep tasks, conversations, and approvals together.
              </p>
            </div>
          </Reveal>
          <div className="crew-cards">
            {crew.map((member, i) => (
              <Reveal key={member.name} delay={i * 0.07}>
                <div className={`crew-card crew-${i}`}>
                  <Avatar {...member} size={154} />
                  <div>
                    <h3>{["Build", "Create", "Plan"][i]}</h3>
                    <p>
                      {
                        [
                          "From a rough idea to a working feature. One conversation at a time.",
                          "A fresh set of eyes for the details that make your work feel right.",
                          "For the fixes, plans, and little things that keep a project moving.",
                        ][i]
                      }
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="crew-caption">Choose your own characters in the app.</p>
        </section>
        <section className="workflow-section container" id="workflow">
          <Reveal>
            <div className="section-heading">
              <span className="eyebrow">LESS SETUP. MORE MAKING.</span>
              <h2>Good work starts with a hello.</h2>
            </div>
          </Reveal>
          <div className="steps">
            {[
              [
                Command,
                "01",
                "Bring your favorite agent",
                "Choose your coding agent and sign into your own account. Your tools, your choice.",
              ],
              [
                Sparkle,
                "02",
                "Make it your Sidekick",
                "Choose a character and a task. Keep each conversation easy to find.",
              ],
              [
                ShieldCheck,
                "03",
                "Build together",
                "Send a task, follow the conversation, and review approvals when your Sidekick needs you.",
              ],
            ].map(([Icon, number, title, description]) => {
              const StepIcon = Icon as typeof Command;
              return (
                <div className="step" key={String(number)}>
                  <div className="step-top">
                    <StepIcon size={23} />
                    <span>{String(number)}</span>
                  </div>
                  <h3>{String(title)}</h3>
                  <p>{String(description)}</p>
                </div>
              );
            })}
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
            alt="Orange plush Sidekicks clover"
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
