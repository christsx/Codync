//! `ChatGPT` sign-in through Codex's supported app-server account API.
//! Only the verification URL/code leave this process. Codex owns OAuth and refresh.
use super::acp::{Acp, Incoming};
use super::{backends, registry::shell_quote};
use anyhow::{Context, Result, bail};
use serde_json::{Value, json};
use std::time::Duration;

pub fn command() -> Result<String> {
    let host = std::env::current_exe()?;
    Ok(format!("{} chatgpt-login", shell_quote(&host.to_string_lossy())))
}

pub async fn login() -> Result<()> {
    let bin = backends::which("codex").context("Install Codex before signing in with ChatGPT")?;
    let mut command = format!("{} app-server", shell_quote(&bin.to_string_lossy()));
    // A headless workspace has no macOS Keychain or Linux Secret Service session.
    // Use Codex's supported owner-only credential file, shared with codex-acp.
    // This setting belongs to Codex; it does not disable Sidekicks' encrypted vault.
    if std::env::var_os("CODYNC_VAULT_KEY_FILE").is_some() {
        command.push_str(" -c 'cli_auth_credentials_store=\"file\"'");
    }
    let cwd = dirs::home_dir().context("No home directory for Codex credentials")?;
    let (server, mut inbox) = Acp::spawn(&command, &cwd.to_string_lossy(), &[])?;
    let result = tokio::time::timeout(Duration::from_secs(900), async {
        server.request("initialize", json!({
            "clientInfo": {"name": "sidekicks", "title": "Sidekicks", "version": env!("CARGO_PKG_VERSION")}
        })).await.context("Codex app-server could not initialize; update Codex and try again")?;
        server.notify("initialized", json!({})).await?;
        let account = server.request("account/read", json!({"refreshToken": false})).await?;
        if !account["account"].is_null() {
            println!("Codex is already signed in. Return to Sidekicks and choose Check again.");
            return Ok(());
        }
        let plan = server.request("account/login/start", json!({"type": "chatgptDeviceCode"})).await
            .context("Could not start ChatGPT device sign-in. Enable device code login in ChatGPT security settings, and make sure Codex is up to date")?;
        let (id, url, code) = device_plan(&plan)?;
        println!("Sign in with ChatGPT\n\nOpen this link on your phone or computer:\n{url}\n\nEnter this one-time code:\n{code}\n\nWaiting for OpenAI to confirm…\nKeep this screen open. If you leave for the browser, return here after approving.");
        while let Some(event) = inbox.recv().await {
            match event {
                Incoming::Notification { method, params } if method == "account/login/completed" => {
                    if completion(&params, id)? {
                        println!("\nChatGPT sign-in completed. Return to Sidekicks to use Codex.");
                        return Ok(());
                    }
                }
                Incoming::Request { id, .. } => {
                    server.respond_error(id, -32601, "Not supported during sign-in").await?;
                }
                Incoming::Closed { .. } => bail!("Codex stopped before sign-in completed. Start a fresh sign-in."),
                Incoming::Notification { .. } => {}
            }
        }
        bail!("Codex disconnected before sign-in completed. Start a fresh sign-in.")
    }).await;
    server.kill().await;
    result.context("ChatGPT sign-in expired. Start again to get a fresh code")?
}

fn device_plan(plan: &Value) -> Result<(&str, &str, &str)> {
    let id = plan["loginId"].as_str().filter(|s| !s.is_empty()).context("Codex did not return a login ID")?;
    let url = plan["verificationUrl"].as_str().context("Codex did not return a verification URL")?;
    let parsed = reqwest::Url::parse(url)?;
    if parsed.scheme() != "https"
        || parsed.host_str() != Some("auth.openai.com")
        || !parsed.username().is_empty()
        || parsed.password().is_some()
    {
        bail!("Codex returned an unexpected sign-in URL");
    }
    let code = plan["userCode"].as_str().filter(|s| !s.is_empty()).context("Codex did not return a one-time code")?;
    Ok((id, url, code))
}

fn completion(params: &Value, id: &str) -> Result<bool> {
    if params["loginId"].as_str() != Some(id) {
        return Ok(false);
    }
    match params["success"].as_bool() {
        Some(true) => Ok(true),
        Some(false) => bail!(
            "ChatGPT sign-in failed: {}",
            params["error"].as_str().unwrap_or("OpenAI did not approve this sign-in. Start again with a fresh code.")
        ),
        None => bail!("Codex returned an invalid sign-in result"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn device_sign_in_requires_an_openai_link_and_code() {
        let mut plan = json!({"loginId":"attempt", "verificationUrl":"https://auth.openai.com/codex/device", "userCode":"ABCD-1234"});
        assert!(device_plan(&plan).is_ok());
        for url in [
            "http://auth.openai.com/codex/device",
            "https://auth.openai.com.evil.test/",
            "https://user@auth.openai.com/",
        ] {
            plan["verificationUrl"] = json!(url);
            assert!(device_plan(&plan).is_err());
        }
        plan["verificationUrl"] = json!("https://auth.openai.com/codex/device");
        plan["userCode"] = json!("");
        assert!(device_plan(&plan).is_err());
    }

    #[test]
    fn only_the_matching_successful_login_completes() {
        assert!(!completion(&json!({"loginId":"other", "success":true}), "attempt").unwrap());
        assert!(completion(&json!({"loginId":"attempt", "success":true}), "attempt").unwrap());
        assert!(completion(&json!({"loginId":"attempt", "success":false, "error":"denied"}), "attempt").is_err());
        assert!(completion(&json!({"loginId":"attempt"}), "attempt").is_err());
    }
}
