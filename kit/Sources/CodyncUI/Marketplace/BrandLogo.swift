import CodyncKit
import SwiftUI

/// Downloaded Brandfetch marks; original agent artwork covers unlisted brands.
struct BrandLogo: View {
    @Environment(\.colorScheme) private var colorScheme
    let name: String
    var size: CGFloat = 46

    private var asset: String? {
        let key = name.lowercased().filter { $0.isLetter || $0.isNumber }
        let aliases = ["googledrive": "googledrive", "googlecalendar": "googlecalendar", "gmail": "gmail", "slack": "slack", "hubspot": "hubspot", "github": "github", "notion": "notion", "linear": "linear", "google": "google", "openai": "openai", "codex": "openai", "claude": "claude", "cursor": "cursor", "gemini": "gemini"]
        return aliases[key].map { "brand-\($0)" }
    }

    var body: some View {
        Group {
            if let asset {
                Image(asset, bundle: .module).resizable().scaledToFit()
                    .padding(size * 0.17)
                    .background(asset == "brand-hubspot" ? Color.clear : (colorScheme == .dark ? Palette.bubbleAgent : .white))
            } else {
                Image(systemName: "puzzlepiece.extension.fill")
                    .font(.system(size: size * 0.4))
                    .foregroundStyle(Palette.secondary)
                    .frame(width: size, height: size)
                    .background(Palette.bubbleAgent)
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: size * 0.26, style: .continuous))
    }

    static func agentAsset(_ registry: String) -> String? {
        let brands = ["codex-acp": "openai", "claude-acp": "claude", "cursor": "cursor", "gemini": "gemini", "antigravity-acp": "google", "github-copilot-cli": "github", "amp-acp": "ampcode", "auggie": "augmentcode", "codebuddy-code": "codebuddy", "deepagents": "langchain", "devin": "devin", "factory-droid": "factory", "grok-build": "x", "junie": "jetbrains", "kilo": "kilo", "minimax-code": "minimax", "mistral-vibe": "mistral", "poolside": "poolside", "qwen-code": "qwen"]
        return brands[registry].map { "brand-\($0)" }
    }
}
