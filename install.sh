#!/usr/bin/env bash
# One-command install of the Reels kit on a Mac — no Homebrew, no admin password, no GitHub login, no git.
#
#   curl -fsSL https://raw.githubusercontent.com/Timi-Kr/reels-kit/main/install.sh | bash
#
# Downloads the kit to ~/Documents/reels-kit (or updates it there, keeping your projects), puts Node, Python
# (via uv) and ffmpeg into reels-kit/.tools, tells Claude Code where they are (.claude/settings.local.json),
# then runs setup.sh (npm packages, Python packages, whisper model, a test render).
# Run it again any time to update the kit. Takes 10–30 min the first time (~3 GB of downloads).
set -euo pipefail

REPO="Timi-Kr/reels-kit"
NODE_VERSION="22.12.0"
FFMPEG_TAG="b6.0"

ok() { printf '\033[32m✓\033[0m %s\n' "$1"; }
step() { printf '\n\033[1m→ %s\033[0m\n' "$1"; }
fail() { printf '\033[31m✗ %s\033[0m\n' "$1"; exit 1; }

[ "$(uname -s)" = "Darwin" ] || fail "Ovaj kit radi samo na Macu."
case "$(uname -m)" in
  arm64) ARCH=arm64 ;;
  x86_64) ARCH=x64 ;;
  *) fail "Nepoznat procesor: $(uname -m)" ;;
esac

# --- 1. the kit itself -------------------------------------------------------------------------------------
SELF="${BASH_SOURCE[0]:-}"
if [ -n "$SELF" ] && [ -f "$(dirname "$SELF")/setup.sh" ] && [ -f "$(dirname "$SELF")/package.json" ]; then
  DEST="$(cd "$(dirname "$SELF")" && pwd)"
  ok "Kit je već ovdje: $DEST"
else
  DEST="${REELS_KIT_DIR:-$HOME/Documents/reels-kit}"
  step "Skidam Reels kit u $DEST"
  TMP="$(mktemp -d)"
  curl -fsSL "https://github.com/$REPO/archive/refs/heads/main.tar.gz" | tar xz -C "$TMP"
  mkdir -p "$DEST"
  # copy over: updates the kit's own files, keeps your projects, renders and installed tools
  rsync -a "$TMP/reels-kit-main/" "$DEST/"
  rm -rf "$TMP"
  ok "Kit skinut"
fi
cd "$DEST"
TOOLS="$DEST/.tools"
mkdir -p "$TOOLS/bin"

# --- 2. tools, all inside .tools (nothing system-wide) -----------------------------------------------------
if [ ! -x "$TOOLS/node/bin/node" ]; then
  step "Skidam Node $NODE_VERSION"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-darwin-$ARCH.tar.gz" | tar xz -C "$TOOLS"
  rm -rf "$TOOLS/node"
  mv "$TOOLS/node-v$NODE_VERSION-darwin-$ARCH" "$TOOLS/node"
fi
ok "Node $("$TOOLS/node/bin/node" -v)"

for bin in ffmpeg ffprobe; do
  if [ ! -x "$TOOLS/bin/$bin" ]; then
    step "Skidam $bin"
    curl -fsSL "https://github.com/eugeneware/ffmpeg-static/releases/download/$FFMPEG_TAG/$bin-darwin-$ARCH.gz" | gunzip > "$TOOLS/bin/$bin"
    chmod +x "$TOOLS/bin/$bin"
  fi
done
ok "ffmpeg + ffprobe"

if [ ! -x "$TOOLS/bin/uv" ]; then
  step "Skidam uv (Python)"
  curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="$TOOLS/bin" UV_NO_MODIFY_PATH=1 INSTALLER_NO_MODIFY_PATH=1 sh -s -- --quiet
fi
export UV_PYTHON_INSTALL_DIR="$TOOLS/python"
if [ ! -x .venv/bin/python ]; then
  step "Postavljam Python 3.11"
  "$TOOLS/bin/uv" venv --quiet --python 3.11 --seed .venv
fi
ln -sf "$DEST/.venv/bin/python" "$TOOLS/bin/python3"
ok "Python $(.venv/bin/python --version | cut -d' ' -f2)"

export PATH="$TOOLS/bin:$TOOLS/node/bin:$PATH"

# --- 3. tell Claude Code where the tools are ----------------------------------------------------------------
mkdir -p .claude
"$TOOLS/node/bin/node" -e '
  const fs = require("fs"), f = ".claude/settings.local.json";
  let s = {}; try { s = JSON.parse(fs.readFileSync(f, "utf8")); } catch {}
  s.env = Object.assign({}, s.env, {PATH: process.argv[1]});
  fs.writeFileSync(f, JSON.stringify(s, null, 2) + "\n");
' "$TOOLS/bin:$TOOLS/node/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
ok "Claude Code zna gdje su alati"

# --- 4. packages, whisper model, test render ----------------------------------------------------------------
./setup.sh

printf '\n\033[1mSve je spremno.\033[0m Otvori NOVU sesiju u Claude Codeu u folderu:\n  %s\ni napiši: "Napravi viral edit od ovog videa" (pa povuci video u chat).\n' "$DEST"
