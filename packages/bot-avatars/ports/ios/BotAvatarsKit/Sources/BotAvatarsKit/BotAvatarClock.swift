import Foundation
import QuartzCore
import Observation

/// One frame loop for every avatar on screen (the web's ticker): a
/// main-run-loop timer that advances each subscribed avatar's rig and then bumps
/// `frame`, which every avatar's canvas observes, so the whole screen
/// redraws in one pass. The link stops while nobody is subscribed.
@Observable
public final class BotAvatarClock {
    public static let shared = BotAvatarClock()

    /// Bumped once per display frame; a view that reads it redraws each frame.
    public private(set) var frame = 0
    /// Seconds between the last two frames.
    @ObservationIgnored public private(set) var dt = 0.0
    /// Frames per second over the last second, for the demo.
    @ObservationIgnored public private(set) var fps = 0.0

    @ObservationIgnored private var link: Timer?
    @ObservationIgnored private var last: CFTimeInterval = 0
    @ObservationIgnored private var subs: [ObjectIdentifier: (Double) -> Void] = [:]
    @ObservationIgnored private var fpsCount = 0
    @ObservationIgnored private var fpsSince: CFTimeInterval = 0

    private init() {}

    /// Called before each frame with the seconds since the last one.
    func subscribe(_ id: ObjectIdentifier, _ tick: @escaping (Double) -> Void) {
        subs[id] = tick
        start()
    }
    func unsubscribe(_ id: ObjectIdentifier) {
        subs.removeValue(forKey: id)
        if subs.isEmpty { stop() }
    }

    private func start() {
        if link != nil { return }
        let timer = Timer(timeInterval: 1.0 / 60, repeats: true) { [weak self] _ in
            self?.step()
        }
        RunLoop.main.add(timer, forMode: .common)
        link = timer
        last = 0
    }
    private func stop() {
        link?.invalidate()
        link = nil
    }

    private func step() {
        let now = CACurrentMediaTime()
        let dt = last > 0 ? min(0.1, now - last) : 0
        last = now
        self.dt = dt
        fpsCount += 1
        if fpsSince == 0 { fpsSince = now }
        if now - fpsSince >= 1 {
            fps = Double(fpsCount) / (now - fpsSince)
            fpsCount = 0
            fpsSince = now
        }
        for tick in subs.values { tick(dt) }
        frame &+= 1
    }

    /// Frame-cost bookkeeping for the demo: CPU seconds spent in the rigs
    /// and in canvas recording this frame, and how many avatars drew.
    @ObservationIgnored public var stats = BotAvatarStats()
}

/// CPU time the avatars took, accumulated by the views; read and reset by whoever measures.
public struct BotAvatarStats {
    public var tickSeconds = 0.0
    public var drawSeconds = 0.0
    public var draws = 0
    public var ticks = 0
    public mutating func reset() { self = BotAvatarStats() }
}

/// The pointer the avatars follow, in the global coordinate space (the
/// web's page pointer): nil while no finger is down. A `BotAvatar` sets it
/// from its own drag while `interactive`; `.botAvatarPointer()` on a larger
/// view sets it from a drag anywhere over that view.
public final class BotAvatarPointer {
    public static let shared = BotAvatarPointer()
    public var location: CGPoint? = nil
    private init() {}
}
