import SwiftUI

/// A cached, combed pile over the same animated silhouette used by the native rig.
/// This native material supplements the upstream Swift port (which ships plastic).
private var fabricTextures: [BotColor: CGImage] = [:]

func drawFabricPile(_ context: inout GraphicsContext, silhouette: Path, color: BotColor) {
    let image: CGImage
    if let cached = fabricTextures[color] {
        image = cached
    } else {
        guard let texture = makeFabricTexture(color: color) else { return }
        // Keep the cache bounded when users repeatedly edit custom colors.
        if fabricTextures.count >= 32 { fabricTextures.removeAll(keepingCapacity: true) }
        fabricTextures[color] = texture
        image = texture
    }
    var pile = context
    // A soft fringe extends just past the body rather than ending at a hard vector edge.
    // Both subpaths use the nonzero fill rule. Append the fringe rather than
    // boolean-unioning the overlapping depth slices on every animation frame.
    var fringe = silhouette
    fringe.addPath(silhouette.strokedPath(.init(lineWidth: 2.4, lineCap: .round, lineJoin: .round)))
    pile.clip(to: fringe)
    pile.draw(Image(decorative: image, scale: 1), in: CGRect(x: -64, y: -64, width: 128, height: 128))
}

private func makeFabricTexture(color: BotColor) -> CGImage? {
    let pixels = 384
    guard let canvas = CGContext(data: nil, width: pixels, height: pixels, bitsPerComponent: 8,
                                bytesPerRow: pixels * 4, space: CGColorSpaceCreateDeviceRGB(),
                                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    canvas.scaleBy(x: 3, y: 3)
    canvas.translateBy(x: 64, y: 64)
    canvas.setLineCap(.round)
    var seed: UInt64 = 0xC10F_EE42
    func random() -> Double {
        seed = seed &* 6364136223846793005 &+ 1442695040888963407
        return Double(seed >> 32) / Double(UInt32.max)
    }
    // Dense, staggered fibers follow a central parting and gather into gentle locks.
    for row in 0..<150 {
        for column in 0..<150 {
            let x = -64 + (Double(column) + random()) * 128 / 150
            let y = -64 + (Double(row) + random()) * 128 / 150
            let wave = sin(x * 0.24 + y * 0.13) * 0.45
            let lean = x * 0.012 + wave
            let length = 1.4 + random() * 2.5
            let lit = max(0, 1 - hypot(x + 22, y - 25) / 110)
            let variation = 0.60 + lit * 0.48 + random() * 0.30
            canvas.setStrokeColor(CGColor(red: min(1, color.r / 255 * variation),
                                          green: min(1, color.g / 255 * variation),
                                          blue: min(1, color.b / 255 * variation), alpha: 0.76))
            canvas.setLineWidth(0.10 + random() * 0.15)
            canvas.move(to: CGPoint(x: x, y: y))
            canvas.addCurve(to: CGPoint(x: x + lean, y: y - length),
                            control1: CGPoint(x: x + lean * 0.8, y: y - length * 0.3),
                            control2: CGPoint(x: x + lean - wave * 0.5, y: y - length * 0.7))
            canvas.strokePath()
        }
    }
    return canvas.makeImage()
}
