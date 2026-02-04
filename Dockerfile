FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Install default apt packages for skills
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      tmux \
      ffmpeg \
      jq \
      ripgrep \
      pipx \
      python3-venv \
      python3-full && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Install 1Password CLI
RUN curl -sS https://downloads.1password.com/linux/keys/1password.asc | gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg && \
    echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/amd64 stable main' > /etc/apt/sources.list.d/1password.list && \
    apt-get update && \
    apt-get install -y 1password-cli && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && \
    apt-get install -y gh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Install himalaya email CLI
RUN curl -sL https://github.com/pimalaya/himalaya/releases/download/v1.1.0/himalaya.x86_64-linux.tgz | tar xz -C /usr/local/bin

# Install openhue CLI (Philips Hue control)
RUN curl -sL "https://api.github.com/repos/openhue/openhue-cli/releases/latest" | \
    sed -n 's/.*"browser_download_url": "\([^"]*Linux_x86_64\.tar\.gz\)".*/\1/p' | \
    head -1 | xargs -I {} curl -sL {} | tar xz -C /usr/local/bin openhue

# Install spotify_player CLI
RUN curl -sL "https://api.github.com/repos/aome510/spotify-player/releases/latest" | \
    sed -n 's/.*"browser_download_url": "\([^"]*x86_64-unknown-linux-gnu\.tar\.gz\)".*/\1/p' | \
    head -1 | xargs -I {} curl -sL {} | tar xz -C /usr/local/bin

# Install npm-based CLIs
RUN npm install -g clawdhub obsidian-cli mcporter

ARG AIPRO_DOCKER_APT_PACKAGES=""
RUN if [ -n "$AIPRO_DOCKER_APT_PACKAGES" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $AIPRO_DOCKER_APT_PACKAGES && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
    fi

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY patches ./patches
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN AIPRO_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV AIPRO_PREFER_PNPM=1
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# Install uv (Python package manager) for node user
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/home/node/.local/bin:${PATH}"

# Install Python tools via pipx for node user
RUN pipx install openai-whisper && \
    pipx install nano-pdf

# Note: The following CLIs are proprietary and require manual installation or purchase:
# - bird (bird.fast) - X/Twitter CLI
# - blu (blucli.sh) - BluOS CLI
# - camsnap (camsnap.ai) - Camera CLI
# - eightctl (eightctl.sh) - Eight Sleep CLI
# - gog (gogcli.sh) - Google Workspace CLI
# - oracle (askoracle.dev) - AI CLI
# - ordercli (ordercli.sh) - Food delivery CLI
# - sag (sag.sh) - ElevenLabs TTS CLI
# - sonos (sonoscli.sh) - Sonos CLI
# - summarize (summarize.sh) - Summarization CLI
# - wacli (wacli.sh) - WhatsApp CLI
# - gemini - Google Gemini CLI
# - gifgrep (gifgrep.com) - GIF search CLI
# - goplaces - Google Places CLI

CMD ["node", "dist/index.js"]
