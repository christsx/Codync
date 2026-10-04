import Foundation
import Testing
@testable import CodyncKit

@Test func legacyUnnamedSidekickUsesCurrentName() throws {
    let bot = try JSONDecoder().decode(Bot.self, from: Data(#"{"id":"one","name":"New Bot","autoName":true}"#.utf8))
    #expect(bot.name == "New Sidekick")
    #expect(bot.autoName)
}

@Test func manuallyChosenLegacyNameIsPreserved() throws {
    let bot = try JSONDecoder().decode(Bot.self, from: Data(#"{"id":"one","name":"New Bot","autoName":false}"#.utf8))
    #expect(bot.name == "New Bot")
}

@Test func newSidekickDefaultsToCodex() {
    #expect(BotDraft().backend == "codex")
}
