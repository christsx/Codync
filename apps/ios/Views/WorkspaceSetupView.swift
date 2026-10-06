import CodyncKit
import CodyncUI
import SwiftUI

/// Enable the optional Daytona workspace after normal computer pairing.
struct WorkspaceSetupView: View {
    var inModal = false
    var complete: () -> Void
    @Environment(AppStore.self) private var app
    @Environment(AccountStore.self) private var accounts
    @Environment(AccountSession.self) private var account
    @Environment(\.dismissModal) private var dismissModal
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 24) {
            ScreenHeader { AccountSwitcherButton() } title: { Text("Daytona workspace") } trailing: {
                if inModal { IconButton("Close", systemImage: "xmark") { dismissModal() } }
            }
            Spacer()
            Image(systemName: "cloud.fill")
                .font(.system(size: 72)).foregroundStyle(Palette.accent)
            Text("Keep working\nwith your laptop closed.")
                .font(.system(size: 32, weight: .semibold)).multilineTextAlignment(.center)
            Text("Enable your Daytona workspace, then connect a coding agent and repository. Switch back to your laptop from Computers & settings.")
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
                Text(busy ? "Connecting to Daytona…" : "Enable Daytona")
                    .font(.headline).frame(maxWidth: .infinity, minHeight: 50)
            }
            .buttonStyle(.primary).disabled(busy || !account.isSignedIn)
        }
        .padding(.horizontal, 24)
        .background(Palette.background)
        .task(id: busy) {
            guard busy else { return }
            defer { busy = false }
            do {
                let firstSetup = accounts.storage.workspaceComputerId == nil
                try await accounts.connectWorkspace(deviceName: UIDevice.current.name, platform: "ios")
                let workspaceId = accounts.storage.workspaceComputerId
                complete()
                // Allow a settings sheet to dismiss before presenting the workspace marketplace.
                if firstSetup, let workspaceId {
                    Task { @MainActor in
                        try? await Task.sleep(for: .milliseconds(450))
                        app.marketplace = workspaceId
                    }
                }
            } catch is CancellationError {
            } catch { self.error = error.localizedDescription }
        }
    }
}
