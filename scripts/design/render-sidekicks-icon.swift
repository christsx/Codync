import SwiftUI
import AppKit

// Compile with the vendored BotAvatarsKit sources to render the exact in-app mascot.
@main struct SidekicksIcon {
    @MainActor static func main() throws {
        let mascot = BotAvatar(type: .clover, size: 880, color: BotColor("#FF6700"), paused: true, seed: 0.3, shading: .fabric, shadow: 1.15, highlight: 1.45, interactive: false)
        let renderer = ImageRenderer(content: mascot.frame(width: 1024, height: 1024))
        renderer.scale = 2
        guard let image = renderer.nsImage, let tiff = image.tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff), let png = bitmap.representation(using: .png, properties: [:]) else { return }
        try png.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
    }
}
