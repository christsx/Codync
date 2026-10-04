import CodyncKit
import CodyncUI
import SwiftUI

/// Mobile starts in the cloud. Physical computer pairing is an explicit secondary path.
struct WorkspaceSetupView: View {
    var inModal = false
    var complete: () -> Void
    @Environment(AccountStore.self) private var accounts
    @Environment(AccountSession.self) private var account
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dismissModal) private var dismissModal
    @State private var connectsComputer = false
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        if connectsComputer {
            PairingView(inModal: inModal, onSkip: complete) {
                BackButton { withAnimation(Motion.reduced(Motion.layout, reduceMotion)) { connectsComputer = false } }
            }
        } else {
            VStack(spacing: 24) {
                ScreenHeader { AccountSwitcherButton() } title: { Text("Your workspace") } trailing: {
                    if inModal { IconButton("Close", systemImage: "xmark") { dismissModal() } }
                }
                Spacer()
                Image(systemName: "cloud.fill")
                    .font(.system(size: 72)).foregroundStyle(Palette.accent)
                Text("Your sidekicks.\nAnywhere you are.")
                    .font(.system(size: 32, weight: .semibold)).multilineTextAlignment(.center)
                Text("Run your sidekicks in your own Cloud Workspace. No laptop needed. Connect your coding agent after setup.")
                    .foregroundStyle(Palette.secondary).multilineTextAlignment(.center)
                if let error {
                    Text(error).font(.subheadline).foregroundStyle(Palette.secondary)
                        .multilineTextAlignment(.center).accessibilityAddTraits(.updatesFrequently)
                }
                Spacer()
                Button {
                    busy = true
                    error = nil
                } label: {
                    Text(busy ? "Starting Cloud Workspace…" : "Start Cloud Workspace")
                        .font(.headline).frame(maxWidth: .infinity, minHeight: 50)
                }
                .buttonStyle(.primary).disabled(busy || !account.isSignedIn)
                Button("Connect a computer instead") {
                    withAnimation(Motion.reduced(Motion.layout, reduceMotion)) { connectsComputer = true }
                }
                .buttonStyle(.secondary).disabled(busy)
                .padding(.bottom, 12)
            }
            .padding(.horizontal, 24)
            .background(Palette.background)
            .task(id: busy) {
                guard busy else { return }
                defer { busy = false }
                do {
                    try await accounts.connectWorkspace(deviceName: UIDevice.current.name, platform: "ios")
                    complete()
                } catch is CancellationError {
                } catch { self.error = error.localizedDescription }
            }
        }
    }
}
