# Bot avatars

Apple clients render bot characters with the vendored MIT-licensed BotAvatarsKit.
Source: https://github.com/Jakubantalik/Libraries.dev/tree/d06640864eb4adc2fe240f899a44ee6210779782/packages/bot-avatars/ports/ios/BotAvatarsKit

The local package is in `packages/bot-avatars/ports/ios/BotAvatarsKit`.
Local adaptations add macOS 14 support, AppKit color resolution, and a shared
main-run-loop animation timer supported on both Apple platforms.
A local `fabric` material adds cached combed fibers, matte shading, and a fuzzy
fringe to the native rig. This is a native approximation of the React plush
material, not a full port of its fur controls. All Apple bot avatars use fabric.

`CharacterAvatar` remains the shared entry point for rosters, chats, groups,
settings, widgets, and notification images. Existing stored shapes map to the
new renderer: squircle → square, tablet → pill, wedge → triangle,
hex → hexagon, teardrop → drop; cloud and pebble retain their names.
Bot colors are preserved. Working bots use the working pose; idle and
needs-input bots use the default pose. The roster retains its needs-input badge.
Static images and reduced-motion views pause animation. Avatars do not intercept
row or button taps.

All 18 Libraries.dev types are offered by the Apple grid picker, Linux picker,
and terminal picker. Linux uses generated Cairo paths from the same upstream
Swift outlines; it retains its native dotted material. The terminal retains
its text avatars. SwiftUI fur rendering has no GTK or terminal port.
Stored legacy shape values and status behavior remain supported across clients. This change does not alter agent backends or account profile pictures.
