import CodyncKit
import SwiftUI

// Hosted account connections use the Sidekicks backend; no project key is entered here.

/// The Marketplace's "Apps" section.
struct ComposioSection: View {
    let query: String
    /// Bumped by the Marketplace when the user submits a search.
    let searchToken: Int
    @Environment(BotStore.self) private var model
    @State private var status: ComposioStatus?
    @State private var apps = MarketplacePage<ComposioApp>()
    @State private var loadRequest = UUID()
    @State private var loading = true
    @State private var error: String?
        @State private var connecting: ComposioApp?

    var body: some View {
        MarketSection(title: "Apps") {
            VStack(alignment: .leading, spacing: 10) {
                if loading {
                    SkeletonGrid()
                } else if status?.configured != true {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Connect your apps").font(.headline)
                        Text("Sign in to Sidekicks and connect your computer. Then choose an app and sign in to its account.")
                            .foregroundStyle(Palette.secondary)
                        Button("Try again") { Task { await load() } }
                            .buttonStyle(SecondaryButtonStyle())
                    }
                } else if apps.isEmpty {
                    Text(query.isEmpty ? "Couldn't load apps." : "No apps match “\(query)”.")
                        .foregroundStyle(Palette.secondary)
                } else {
                    ItemGrid {
                        ForEach(apps.visible) { app in
                            MarketRow(
                                title: app.name,
                                subtitle: app.description ?? app.slug,
                                added: app.connected,
                                addLabel: "Connect"
                            ) {
                                AppLogo(url: app.logo, name: app.name)
                            } add: {
                                withAnimation(Motion.layout) { connecting = app }
                            }
                        }
                    }
                }
                if !loading, apps.hasHiddenItems, status?.configured == true {
                    Button("Load more apps") {
                        withAnimation(Motion.fade) { apps.revealMore() }
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    .frame(maxWidth: .infinity)
                }
                if let error {
                    Text(error).font(.footnote).foregroundStyle(Palette.danger)
                }
            }
        }
        .task(id: searchToken) { await load() }
        .onChange(of: model.connection) { _, connection in
            if connection == .online { Task { await load() } }
        }
        .codyncSheet(item: $connecting) { app in
            ComposioConnectSheet(app: app) { Task { await load(); await model.refreshPlugins() } }
        }
    }

    private func load() async {
        guard let client = model.client else { return }
        let request = UUID()
        loadRequest = request
        let search = query
        loading = true
        defer { if loadRequest == request { loading = false } }
        do {
            let s = try await client.composioStatus()
            let page = s.configured ? try await client.composioApps(search: search) : []
            guard !Task.isCancelled, loadRequest == request else { return }
            status = s
            apps.replace(with: page)
            error = nil
        } catch {
            guard !Task.isCancelled, loadRequest == request else { return }
            self.error = error.localizedDescription
        }
    }

}

/// An app's logo from Composio, a letter tile until it loads.
public struct AppLogo: View {
    let url: String?
    let name: String
    var size: CGFloat = 46

    public init(url: String?, name: String, size: CGFloat = 46) {
        self.url = url
        self.name = name
        self.size = size
    }

    public var body: some View {
        BrandLogo(name: name, size: size)
            .accessibilityHidden(true)
    }
}

/// Connects one app: Composio's sign-in page (opened here, finished anywhere),
/// or a form for apps that use a key.
struct ComposioConnectSheet: View {
    let app: ComposioApp
    var requestId: String? = nil
    let done: () -> Void
    @Environment(BotStore.self) private var model
    @Environment(\.dismissModal) private var dismiss
    @Environment(\.openURL) private var openURL
    @State private var plan: ComposioConnect?
    @State private var values: [String: String] = [:]
    @State private var connected = false
    @State private var waiting = false
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 0) {
            ModalHeader("Connect \(app.name)") {
                if connected {
                    IconButton("Done", systemImage: "checkmark") { dismiss() }
                } else if plan?.status == "needsFields" {
                    if saving {
                        Spinner()
                    } else {
                        IconButton("Connect", systemImage: "checkmark") { submit() }
                            .disabled(plan?.fields?.contains { $0.required && (values[$0.name] ?? "").isEmpty } ?? true)
                    }
                }
            }
            form
        }
        .background(Palette.background)
    }

    private var form: some View {
        CardForm {
            CardSection {
                HStack(spacing: 14) {
                    AppLogo(url: app.logo, name: app.name, size: 52)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(app.name).font(.title3.weight(.semibold))
                        if let d = app.description {
                            Text(d).font(.subheadline).foregroundStyle(Palette.secondary).lineLimit(3)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
            if connected {
                CardSection(footer: "Turn \(app.name) on for a sidekick in the sidekick's settings, under Connectors.") {
                    Label("Connected", systemImage: "checkmark.circle.fill").foregroundStyle(Palette.added)
                }
            } else if let plan, plan.status == "needsFields" {
                CardSection(footer: "Sent to Composio, which keeps it for \(app.name).") {
                    ForEach(plan.fields ?? [], id: \.name) { f in
                        VStack(alignment: .leading, spacing: 4) {
                            Group {
                                if f.secret {
                                    SecureField(f.label, text: binding(f.name))
                                } else {
                                    TextField(f.label, text: binding(f.name))
                                }
                            }
                            .plainTextInput()
                            if let d = f.description {
                                Text(d + (f.required ? "" : " (optional)")).font(.caption).foregroundStyle(Palette.secondary)
                            }
                        }
                    }
                }
            } else if let plan, plan.status == "redirect" {
                CardSection(footer: "Sign in on the page that opened. This updates by itself when you're done.") {
                    if let url = plan.url.flatMap(URL.init(string:)) {
                        Button("Open the sign-in page", systemImage: "safari") { openURL(url) }
                            .buttonStyle(.secondary)
                    }
                    HStack(spacing: 8) {
                        Spinner()
                        Text("Waiting for you to finish signing in…").foregroundStyle(Palette.secondary)
                    }
                }
            } else if error == nil {
                CardSection {
                    HStack(spacing: 8) {
                        Spinner()
                        Text("Asking Composio…").foregroundStyle(Palette.secondary)
                    }
                }
            }
            if let error {
                CardSection { Text(error).foregroundStyle(Palette.danger).textSelection(.enabled) }
            }
        }
        .textFieldStyle(.plain)
        .task { await start() }
        .onDisappear { values.removeAll(); if connected { done() } }
    }

    private func binding(_ name: String) -> Binding<String> {
        Binding(get: { values[name] ?? "" }, set: { values[name] = $0 })
    }

    private func start() async {
        guard let client = model.client else { return }
        do {
            let plan = try await client.composioConnect(app.slug)
            self.plan = plan
            guard plan.status == "redirect", let id = plan.connection else { return }
            if let url = plan.url.flatMap(URL.init(string:)) { openURL(url) }
            await wait(for: id, client: client)
        } catch {
            self.error = error.localizedDescription
        }
    }

    /// Polls until the sign-in finishes (or the sheet goes away).
    private func wait(for id: String, client: HostClient) async {
        waiting = true
        defer { waiting = false }
        for _ in 0..<300 {
            try? await Task.sleep(for: .seconds(2))
            if Task.isCancelled { return }
            guard let state = try? await client.composioConnection(id) else { continue }
            switch state.status {
            case "active":
                if let requestId {
                    do { try await client.finishConnectionRequest(requestId, connectorId: "composio-\(app.slug)") }
                    catch { self.error = error.localizedDescription; return }
                }
                values.removeAll()
                connected = true
                return
            case "failed", "expired":
                error = "Signing in to \(app.name) didn't work (\(state.status)). Close and try again."
                return
            default:
                continue
            }
        }
        error = "Timed out waiting for the sign-in."
    }

    private func submit() {
        guard let client = model.client, let mode = plan?.mode else { return }
        saving = true
        Task {
            defer { saving = false }
            do {
                let state = try await client.composioConnect(app.slug, mode: mode, fields: values.filter { !$0.value.isEmpty })
                if state.status == "active" {
                    if let requestId { try await client.finishConnectionRequest(requestId, connectorId: "composio-\(app.slug)") }
                    values.removeAll()
                    connected = true
                } else {
                    error = "\(app.name) says the connection is \(state.status)."
                }
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
