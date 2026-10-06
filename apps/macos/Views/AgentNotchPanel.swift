import AppKit
import CodyncKit
import CodyncUI
import SwiftUI

/// A Mac-only companion surface; the roster and actions stay on the shared account store.
@MainActor
final class AgentNotchController {
    static let shared = AgentNotchController()
    private var panel: NSPanel?
    private var screenObserver: NSObjectProtocol?

    func show(host: HostController, openChat: @escaping @MainActor () -> Void) {
        if panel == nil {
            let window = AgentNotchWindow(contentRect: .zero,
                styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
            window.isFloatingPanel = true
            window.level = .floating
            window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
            window.isOpaque = false
            window.backgroundColor = .clear
            window.hasShadow = true
            window.hidesOnDeactivate = false
            window.isReleasedWhenClosed = false
            window.contentView = NSHostingView(rootView: AgentNotchView(host: host,
                openChat: openChat, resize: { [weak self] expanded in self?.position(expanded: expanded) }))
            panel = window
            screenObserver = NotificationCenter.default.addObserver(
                forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main
            ) { [weak self] _ in
                MainActor.assumeIsolated { self?.position(expanded: (self?.panel?.frame.height ?? 0) > 100) }
            }
            position(expanded: false)
        }
        panel?.orderFrontRegardless()
    }

    func hide() { panel?.orderOut(nil) }

    private func position(expanded: Bool) {
        guard let panel, let screen = panel.screen ?? NSScreen.main else { return }
        let size = NSSize(width: expanded ? 380 : 240, height: expanded ? 420 : 54)
        // Stay below the menu bar/camera cutout, including on displays without a notch.
        let frame = NSRect(x: screen.visibleFrame.midX - size.width / 2,
            y: screen.visibleFrame.maxY - size.height - 6, width: size.width, height: size.height)
        panel.setFrame(frame, display: true)
    }
}

private final class AgentNotchWindow: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

private struct AgentNotchView: View {
    let host: HostController
    let openChat: @MainActor () -> Void
    let resize: (Bool) -> Void
    @State private var expanded = false
    @State private var picked: BotReference?
    @State private var message = ""
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var roster: [RosterItem] {
        host.roster.filter { !$0.bot.hidden }.sorted {
            let lhs = $0.bot.needsInput ? 0 : $0.bot.isWorking ? 1 : 2
            let rhs = $1.bot.needsInput ? 0 : $1.bot.isWorking ? 1 : 2
            return lhs == rhs ? $0.bot.lastAt > $1.bot.lastAt : lhs < rhs
        }
    }
    private var selected: RosterItem? { roster.first { $0.ref == picked } ?? roster.first }

    var body: some View {
        VStack(spacing: 12) {
            Button {
                withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.2)) { expanded.toggle() }
                resize(expanded)
            } label: {
                HStack(spacing: 10) {
                    if let item = selected { CharacterAvatar(bot: item.bot, size: 30) }
                    else { CharacterAvatar(shape: "flower", color: "#f65baa", size: 30) }
                    Text("Sidekicks").font(.callout.weight(.semibold))
                    Spacer()
                    Text("\(roster.filter { $0.bot.isWorking }.count) active").font(.caption)
                    Image(systemName: roster.contains { $0.bot.needsInput } ? "exclamationmark.circle.fill" : expanded ? "chevron.up" : "chevron.down")
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(expanded ? "Collapse agent panel" : "Expand agent panel")
            if expanded {
                ScrollView {
                    VStack(spacing: 8) {
                        if roster.isEmpty {
                            Text("Create a sidekick in the app to track its work here.")
                                .font(.callout).foregroundStyle(Palette.secondary).padding(.vertical)
                        }
                        ForEach(roster) { item in
                            Button { picked = item.ref; message = "" } label: {
                                HStack(spacing: 10) {
                                    CharacterAvatar(bot: item.bot, size: 32)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(item.bot.name).font(.callout.weight(.semibold))
                                        Text(item.bot.needsInput ? "Needs your approval" : item.bot.activity.isEmpty ? item.bot.status : item.bot.activity)
                                            .font(.caption).foregroundStyle(Palette.secondary).lineLimit(2)
                                    }
                                    Spacer()
                                    if selected?.ref == item.ref { Image(systemName: "checkmark").foregroundStyle(Palette.accent) }
                                }.padding(8).frame(maxWidth: .infinity, alignment: .leading)
                                    .background(selected?.ref == item.ref ? Color.white.opacity(0.08) : .clear, in: RoundedRectangle(cornerRadius: 12))
                            }.buttonStyle(.plain)
                        }
                    }
                }
                if let item = selected {
                    HStack {
                        TextField("Give \(item.bot.name) a task…", text: $message).textFieldStyle(.plain).onSubmit { send(item) }
                        Button("Send", systemImage: "arrow.up") { send(item) }
                            .buttonStyle(SecondaryButtonStyle()).labelStyle(.iconOnly).disabled(message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }.padding(10).background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
                    HStack {
                        Button(item.bot.needsInput ? "Review approval" : "Open conversation") { open(item) }.buttonStyle(SecondaryButtonStyle())
                        Spacer()
                        if item.bot.isWorking { Button("Stop") { host.accounts.store(for: item.ref.computerId)?.stop(item.bot.id) }.buttonStyle(SecondaryButtonStyle()) }
                    }.font(.caption)
                }
                Button("Instructions, memory & routines in the app") {
                    if let item = selected { open(item) } else { openChat() }
                }.font(.caption).foregroundStyle(Palette.secondary)
            }
        }
        .padding(12).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .foregroundStyle(Palette.text)
        .background(Color(red: 0.05, green: 0.04, blue: 0.05), in: RoundedRectangle(cornerRadius: expanded ? 22 : 18))
        .preferredColorScheme(.dark)
        .onChange(of: host.contextID) { _, _ in picked = nil; message = "" }
    }

    private func open(_ item: RosterItem) {
        host.accounts.selection = item.ref
        openChat()
    }
    private func send(_ item: RosterItem) {
        let text = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, let store = host.accounts.store(for: item.ref.computerId) else { return }
        store.send(text, to: item.bot.id)
        message = ""
    }
}
