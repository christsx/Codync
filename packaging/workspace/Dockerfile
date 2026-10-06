FROM rust:bookworm AS builder
WORKDIR /source
COPY host/ /source/host/
COPY packaging/updates/host-public-key.txt /source/packaging/updates/host-public-key.txt
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN cargo build --locked --release --manifest-path host/Cargo.toml

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y python3 git gh curl ca-certificates util-linux openssh-client && rm -rf /var/lib/apt/lists/*
COPY --from=builder /source/host/target/release/codync-host /usr/local/bin/codync-host
COPY packaging/workspace/workspace.py /opt/sidekicks/workspace.py
RUN useradd --create-home --shell /bin/bash daytona
USER daytona
ENV CODYNC_HOME=/home/daytona/.codync
ENV CODYNC_VAULT_KEY_FILE=/home/daytona/.codync/vault.key
WORKDIR /home/daytona
# The host starts on demand through workspace.py. This image contains no accounts,
# pairing keys, API credentials, local databases, or preauthenticated agents.
