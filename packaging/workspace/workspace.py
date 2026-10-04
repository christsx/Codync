"""Sandbox-local bootstrap. No host token or agent credentials leave this process."""
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.request

home = Path(os.environ.get("CODYNC_HOME", "/home/daytona/.codync"))
home.mkdir(parents=True, exist_ok=True)


def call(method, body):
    token = (home / "token").read_text().strip()
    request = urllib.request.Request(
        "http://127.0.0.1:19222/api/" + method,
        data=json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=2) as response:
        result = json.load(response)
    if "error" in result:
        raise RuntimeError("Host refused workspace setup")
    return result


try:
    call("hello", {})
except (OSError, RuntimeError):
    # flock prevents repeated setup requests from launching duplicate host daemons.
    log = open(home / "host.log", "ab")
    subprocess.Popen(
        ["flock", "-n", str(home / "workspace-start.lock"), "codync-host", "serve"],
        stdout=log, stderr=log, start_new_session=True,
    )
    for attempt in range(20):
        try:
            call("hello", {})
            break
        except (OSError, RuntimeError):
            time.sleep(0.2)
    else:
        raise RuntimeError("Cloud host did not start")

challenge = json.loads(base64.urlsafe_b64decode(sys.argv[1] + "=" * (-len(sys.argv[1]) % 4)))
claim = call("claimSign", {key: challenge[key] for key in ("claimId", "nonce", "userId")})
claim["name"] = "Cloud Workspace"
pairing = call("pairing", {})
print(json.dumps({"claim": claim, "pairingUrl": pairing["pairingUrl"]}))
