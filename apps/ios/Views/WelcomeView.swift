import CodyncKit
import CodyncUI
import SwiftUI

/// First launch, before any setup: who the bots are, a glimpse of talking to one, one way forward.
struct WelcomeView: View {
    let start: () -> Void
    @Environment(AccountSession.self) private var account
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    /// 0 = nothing yet … 4 = everything shown. Each beat enters in turn.
    @State private var beat = 0

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                content
                    .frame(minHeight: geometry.size.height)
            }
            .scrollBounceBehavior(.basedOnSize)
        }
        .background(Palette.background)
        .task {
            if reduceMotion { beat = 4; return }
            for next in 1...4 {
                try? await Task.sleep(for: .milliseconds(next == 1 ? 150 : 280))
                withAnimation(.spring(duration: 0.6, bounce: 0.25)) { beat = next }
            }
        }
    }

    private var content: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 24)

            Crew(shown: beat >= 1)
                .frame(maxWidth: .infinity)

            Color.clear.frame(height: 24)

            VStack(spacing: 18) {
                Text("Sidekicks")
                    .font(.system(size: 48, weight: .semibold))
                    .foregroundStyle(Palette.text)
                Text("A little crew.\nA lot done.")
                    .font(.system(size: 23, weight: .regular))
                    .tracking(-0.6)
                    .foregroundStyle(Palette.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .rise(beat >= 3)

            Color.clear.frame(height: 32)

            VStack(spacing: 10) {
                    Button {
                        Task { await account.signIn(provider: .google) }
                    } label: {
                        HStack(spacing: 10) {
                            Image("google")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 18, height: 18)
                            Text(account.isBusy ? "Signing in…" : "Continue with Google")
                        }
                        .font(.system(size: 18))
                        .frame(maxWidth: 360, minHeight: 44)
                        .foregroundStyle(Palette.text)
                        .background(Palette.bubbleUser, in: Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(!account.isConfigured || account.isBusy)
                // Signed in, the computers on the account show up without scanning a code.
                if let message = account.errorMessage {
                    Text(message).font(.footnote).foregroundStyle(Palette.danger)
                        .transition(.opacity)
                }
            }
            .rise(beat >= 4)
            Spacer(minLength: 24)
        }
        .multilineTextAlignment(.center)
        .padding(.horizontal, 24)
        .padding(.bottom, 12)
    }
}

/// Five bots bobbing out of step: the "persistent, named" part of the pitch, without words.
private struct Crew: View {
    let shown: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let members: [(shape: String, color: String, size: CGFloat, x: CGFloat, y: CGFloat, mood: CharacterAvatar.Mood)] = [
        ("blob", "blue", 92, 0, 0, .working),
        ("squircle", "orange", 64, -104, -34, .idle),
        ("teardrop", "violet", 58, 100, -46, .working),
        ("hex", "green", 48, -76, 64, .idle),
        ("cloud", "magenta", 52, 84, 58, .needsInput),
        ("star", "orange", 44, -150, 40, .idle),
        ("cat", "violet", 46, 148, 0, .idle),
        ("flower", "green", 38, 38, -85, .idle),
        ("ghost", "blue", 36, -40, -84, .idle),
    ]

    var body: some View {
        TimelineView(.animation(paused: reduceMotion || !shown)) { context in
            let t = context.date.timeIntervalSinceReferenceDate
            ZStack {
                ForEach(members.indices, id: \.self) { i in
                    let m = members[i]
                    CharacterAvatar(shape: m.shape, color: m.color, size: m.size, mood: m.mood)
                        .rotationEffect(.degrees(reduceMotion ? 0 : sin(t * (0.7 + Double(i) * 0.08) + Double(i)) * 6))
                        .offset(x: m.x + (reduceMotion ? 0 : cos(t * 0.65 + Double(i)) * 3), y: m.y + (reduceMotion ? 0 : sin(t * (0.9 + Double(i) * 0.09) + Double(i) * 1.7) * 5))
                        .scaleEffect(shown ? 1 : 0.3)
                        .opacity(shown ? 1 : 0)
                        .animation(.spring(duration: 0.7, bounce: 0.4).delay(Double(i) * 0.07), value: shown)
                }
            }
        }
        .frame(height: 220)
    }
}

/// One exchange, played once: you ask, a bot works, a bot answers.
private struct ChatGlimpse: View {
    let shown: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var replied = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Fix the flaky login test")
                .bubble(Palette.bubbleUser)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .rise(shown)

            HStack(alignment: .bottom, spacing: 8) {
                CharacterAvatar(shape: "blob", color: "blue", size: 28, mood: replied ? .idle : .working)
                if replied {
                    Text("Done. It raced the session refresh; tests pass on fix/login.")
                        .bubble(Palette.bubbleAgent)
                        .transition(.opacity.combined(with: .scale(scale: 0.92, anchor: .bottomLeading)))
                } else {
                    Text("Working…")
                        .font(.subheadline)
                        .foregroundStyle(Palette.tertiary)
                        .transition(.opacity)
                }
            }
            .rise(shown)
        }
        .accessibilityElement(children: .combine)
        .onChange(of: shown) { _, shown in
            guard shown else { return }
            Task {
                try? await Task.sleep(for: .seconds(reduceMotion ? 0 : 1.6))
                withAnimation(Motion.reduced(.spring(duration: 0.45, bounce: 0.2), reduceMotion)) { replied = true }
            }
        }
    }
}

/// Opens a short recording of the app in use on YouTube, for anyone who can't pair a computer yet.
struct DemoButton: View {
    var body: some View {
        Link(destination: URL(string: "https://youtube.com/shorts/xtZ5WeyOewU")!) {
            Label("Watch the demo", systemImage: "play.circle.fill")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(Palette.text)
        }
    }
}

private extension View {
    func bubble(_ fill: Color) -> some View {
        font(.subheadline)
            .foregroundStyle(Palette.text)
            .padding(.horizontal, 14)
            .padding(.vertical, 9)
            .background(fill, in: RoundedRectangle(cornerRadius: 18))
    }

    /// Fades up into place once `shown`.
    func rise(_ shown: Bool) -> some View {
        opacity(shown ? 1 : 0).offset(y: shown ? 0 : 14)
    }
}
