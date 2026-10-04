# Mobile sign-out

The mobile root uses the current authenticated session to choose the welcome
screen. Completing onboarding cannot bypass this gate. Account context changes
rebuild the root, so sign-out routing must not depend on a root-local state flag.
The account switcher is presented only while signed in; successful sign-out
clears its presentation, and account switches clear usage and computer modals.
Failed sign-out keeps the session and its error visible.

Regression checks for TestFlight build 27:

- With onboarding completed, sign out from Account. The sheet closes and the
  Sidekicks welcome screen with Continue with Google appears.
- Close and reopen the signed-out app. The welcome remains visible.
- Sign back in. Existing account setup and its workspace are restored.
- If sign-out fails, the current account remains usable and shows its error.

Platform scope: this fixes iOS account-context reconstruction and its account
sheet. macOS retains its root and already resets its welcome milestone when
sign-in changes. Shared SwiftUI has no app-level authentication router. Linux
and the TUI connect to a local host and have no Clerk account sign-out screen.
Their corresponding account/connections screens were inspected and require no
routing change.

Validation: the signed iOS Release archive passed and the diff check passed.
Build 27 upload and TestFlight distribution are in progress.
The authenticated phone sign-out flow still needs real-device verification;
this repository has no iOS UI-test target for Clerk session transitions.
