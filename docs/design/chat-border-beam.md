# Chat surface

The shared Apple conversation retains its 16-point rounded corners, header,
composer, and existing layout. The animated BorderBeam overlay was removed
because of reported lag. The app no longer links BorderBeamKit or runs its
Metal shader and animation timelines. The vendored package remains available
for reference, but is not part of the app build.

Linux GTK and terminal chat renderers were unaffected by this Apple-only effect.
