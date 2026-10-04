import SwiftUI
import BotAvatarsKit

/// BotAvatarsKit characters shared by Apple apps, widgets, and notifications.
public struct CharacterAvatar: View {
    public enum Mood: Sendable { case idle, working, needsInput }

    let shape: String
    let color: Color
    let size: CGFloat
    let mood: Mood
    private var animated = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(shape: String, color: String, size: CGFloat = 40, mood: Mood = .idle) {
        self.init(shape: shape, tint: AvatarPalette.color(color), size: size, mood: mood)
    }

    public init(shape: String, tint: Color, size: CGFloat = 40, mood: Mood = .idle) {
        self.shape = shape
        self.color = tint
        self.size = size
        self.mood = mood
    }

    public init(bot: Bot, size: CGFloat = 40, animated: Bool = true) {
        self.init(
            shape: bot.avatarShape,
            color: bot.avatarColor,
            size: size,
            mood: !animated ? .idle : bot.needsInput ? .needsInput : bot.isWorking ? .working : .idle
        )
        self.animated = animated
    }

    private var avatarType: BotAvatarType {
        switch shape {
        case "squircle": .square
        case "tablet": .pill
        case "wedge": .triangle
        case "hex": .hexagon
        case "teardrop": .drop
        default: BotAvatarType(rawValue: shape) ?? .clover
        }
    }

    public var body: some View {
        BotAvatar(type: avatarType, state: mood == .working ? .working : .default,
                  size: Double(size), color: BotColor(color), paused: !animated || reduceMotion,
                  shading: .fabric, shadow: 1.15, highlight: 1.45,
                  interactive: false)
            .allowsHitTesting(false)
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}

/// The eight Grok Bot character silhouettes.
public struct CharacterShape: Shape {
    let kind: String

    public init(kind: String) { self.kind = kind }

    public func path(in r: CGRect) -> Path {
        let w = r.width, h = r.height
        switch kind {
        case "pebble":
            return Path(ellipseIn: r.insetBy(dx: 0, dy: h * 0.1))
        case "squircle":
            return Path(roundedRect: r.insetBy(dx: w * 0.04, dy: h * 0.04), cornerRadius: w * 0.3, style: .continuous)
        case "tablet":
            return Path(roundedRect: r.insetBy(dx: w * 0.14, dy: 0), cornerRadius: w * 0.22, style: .continuous)
        case "wedge":
            var p = Path()
            p.move(to: CGPoint(x: w * 0.5, y: h * 0.04))
            p.addQuadCurve(to: CGPoint(x: w * 0.98, y: h * 0.86), control: CGPoint(x: w * 0.9, y: h * 0.4))
            p.addQuadCurve(to: CGPoint(x: w * 0.02, y: h * 0.86), control: CGPoint(x: w * 0.5, y: h * 1.04))
            p.addQuadCurve(to: CGPoint(x: w * 0.5, y: h * 0.04), control: CGPoint(x: w * 0.1, y: h * 0.4))
            return p
        case "hex":
            var p = Path()
            for i in 0..<6 {
                let a = Double(i) * .pi / 3 - .pi / 2
                let pt = CGPoint(x: w / 2 + cos(a) * w * 0.49, y: h / 2 + sin(a) * h * 0.49)
                i == 0 ? p.move(to: pt) : p.addLine(to: pt)
            }
            p.closeSubpath()
            return p.strokedPath(.init(lineWidth: w * 0.08, lineJoin: .round)).union(p)
        case "cloud":
            var p = Path()
            p.addEllipse(in: CGRect(x: 0, y: h * 0.3, width: w * 0.55, height: h * 0.55))
            p.addEllipse(in: CGRect(x: w * 0.45, y: h * 0.3, width: w * 0.55, height: h * 0.55))
            p.addEllipse(in: CGRect(x: w * 0.18, y: h * 0.08, width: w * 0.64, height: h * 0.64))
            p.addRoundedRect(in: CGRect(x: w * 0.1, y: h * 0.5, width: w * 0.8, height: h * 0.35), cornerSize: CGSize(width: w * 0.15, height: w * 0.15))
            return p
        case "teardrop":
            var p = Path()
            p.move(to: CGPoint(x: w * 0.5, y: 0))
            p.addCurve(to: CGPoint(x: w * 0.94, y: h * 0.62), control1: CGPoint(x: w * 0.62, y: h * 0.2), control2: CGPoint(x: w * 0.94, y: h * 0.38))
            p.addArc(center: CGPoint(x: w * 0.5, y: h * 0.62), radius: w * 0.44, startAngle: .degrees(0), endAngle: .degrees(180), clockwise: false)
            p.addCurve(to: CGPoint(x: w * 0.5, y: 0), control1: CGPoint(x: w * 0.06, y: h * 0.38), control2: CGPoint(x: w * 0.38, y: h * 0.2))
            return p
        default: // blob
            var p = Path()
            let c = CGPoint(x: w / 2, y: h / 2)
            let steps = 64
            for i in 0...steps {
                let a = Double(i) / Double(steps) * 2 * .pi
                let rr = 0.46 + 0.035 * sin(a * 3 + 0.6)
                let pt = CGPoint(x: c.x + cos(a) * w * rr, y: c.y + sin(a) * h * rr)
                i == 0 ? p.move(to: pt) : p.addLine(to: pt)
            }
            p.closeSubpath()
            return p
        }
    }
}

/// A group chat's face, clustered like iMessage: two bots tucked diagonally,
/// three in a triangle, four in a 2×2 grid; past four the last cell counts the rest.
public struct GroupAvatar: View {
    let members: [Bot]
    let size: CGFloat
    let animated: Bool

    public init(members: [Bot], size: CGFloat = 40, animated: Bool = true) {
        self.members = members
        self.size = size
        self.animated = animated
    }

    public var body: some View {
        ZStack {
            switch members.count {
            case 0:
                Image(systemName: "person.2")
                    .font(.system(size: size * 0.4))
                    .foregroundStyle(.secondary)
            case 1:
                CharacterAvatar(bot: members[0], size: size, animated: animated)
            case 2:
                place(members[1], size * 0.66, .topTrailing)
                place(members[0], size * 0.66, .bottomLeading)
            case 3:
                place(members[0], size * 0.55, .top)
                place(members[1], size * 0.55, .bottomLeading)
                place(members[2], size * 0.55, .bottomTrailing)
            default:
                place(members[0], size * 0.5, .topLeading)
                place(members[1], size * 0.5, .topTrailing)
                place(members[2], size * 0.5, .bottomLeading)
                if members.count == 4 {
                    place(members[3], size * 0.5, .bottomTrailing)
                } else {
                    Text("+\(members.count - 3)")
                        .font(.system(size: size * 0.24, weight: .bold, design: .rounded))
                        .foregroundStyle(.secondary)
                        .frame(width: size * 0.5, height: size * 0.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                }
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }

    private func place(_ bot: Bot, _ side: CGFloat, _ corner: Alignment) -> some View {
        CharacterAvatar(bot: bot, size: side, animated: animated)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: corner)
    }
}

/// Avatar with the roster status dot: lime = unread, orange = needs you.
/// A group shows its `members`.
public struct AvatarWithStatus: View {
    let bot: Bot
    let members: [Bot]
    let size: CGFloat

    public init(bot: Bot, members: [Bot] = [], size: CGFloat = 44) {
        self.bot = bot
        self.members = members
        self.size = size
    }

    public var body: some View {
        Group {
            if bot.isGroup { GroupAvatar(members: members, size: size) } else { CharacterAvatar(bot: bot, size: size) }
        }
            .overlay(alignment: .bottomTrailing) {
                if bot.needsInput {
                    Image(systemName: "exclamationmark")
                        .font(.system(size: size * 0.2, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: size * 0.36, height: size * 0.36)
                        .background(Palette.warning, in: Circle())
                        .overlay(Circle().stroke(Palette.background, lineWidth: 2))
                } else if bot.unread > 0 {
                    Circle()
                        .fill(Palette.accentFill)
                        .frame(width: size * 0.28, height: size * 0.28)
                        .overlay(Circle().stroke(Palette.background, lineWidth: 2))
                }
            }
    }
}
