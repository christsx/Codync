//! Exercise the actual CLI and JSON-RPC sign-in without an `OpenAI` account.
#![cfg(unix)]
use std::{fs, os::unix::fs::PermissionsExt, process::Command};

#[test]
fn managed_chatgpt_login_reports_success_denial_and_existing_auth() {
    let dir = std::env::temp_dir().join(format!("sidekicks-login-{}", uuid::Uuid::new_v4()));
    fs::create_dir_all(&dir).unwrap();
    let binary = dir.join("codex");
    fs::write(&binary, r#"#!/bin/sh
if [ "$1" != app-server ] || [ "$2" != -c ] || [ "$3" != 'cli_auth_credentials_store="file"' ]; then exit 9; fi
while IFS= read -r line; do
 case "$line" in
  *'"method":"initialize"'*) printf '%s\n' '{"id":1,"result":{}}' ;;
  *'"method":"account/read"'*)
    if [ "$TEST_LOGIN" = already ]; then
      printf '%s\n' '{"id":2,"result":{"account":{"type":"chatgpt"}}}'
    else printf '%s\n' '{"id":2,"result":{"account":null}}'; fi ;;
  *'"method":"account/login/start"'*)
    printf '%s\n' '{"id":3,"result":{"type":"chatgptDeviceCode","loginId":"attempt","verificationUrl":"https://auth.openai.com/codex/device","userCode":"ABCD-1234"}}'
    printf '%s\n' '{"method":"account/login/completed","params":{"loginId":"other","success":true}}'
    if [ "$TEST_LOGIN" = denied ]; then
      printf '%s\n' '{"method":"account/login/completed","params":{"loginId":"attempt","success":false,"error":"Access denied"}}'
    else printf '%s\n' '{"method":"account/login/completed","params":{"loginId":"attempt","success":true}}'; fi ;;
 esac
done
"#).unwrap();
    fs::set_permissions(&binary, fs::Permissions::from_mode(0o700)).unwrap();
    for mode in ["success", "denied", "already"] {
        let output = Command::new(env!("CARGO_BIN_EXE_codync-host"))
            .arg("chatgpt-login")
            .env("PATH", format!("{}:/usr/bin:/bin", dir.display()))
            .env("CODYNC_VAULT_KEY_FILE", dir.join("unused-key"))
            .env("TEST_LOGIN", mode)
            .output()
            .unwrap();
        let text = format!("{}{}", String::from_utf8_lossy(&output.stdout), String::from_utf8_lossy(&output.stderr));
        assert_eq!(output.status.success(), mode != "denied", "{mode}: {text}");
        match mode {
            "success" => assert!(text.contains("ChatGPT sign-in completed"), "{text}"),
            "denied" => assert!(text.contains("Access denied") && !text.contains("sign-in completed"), "{text}"),
            _ => assert!(text.contains("already signed in") && !text.contains("ABCD-1234"), "{text}"),
        }
    }
    fs::remove_dir_all(dir).unwrap();
}
