#!/usr/bin/env bash
# One-time setup on a new Mac: Node deps, Python venv with faster-whisper, whisper model download.
# Run from the repo root:  ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"

ok() { printf '\033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '\033[31m✗ %s\033[0m\n' "$1"; exit 1; }

command -v node >/dev/null || fail "Node nije instaliran → brew install node"
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || fail "Treba Node 18+ (imaš $(node -v)) → brew upgrade node"
ok "Node $(node -v)"
command -v ffmpeg >/dev/null || fail "ffmpeg nije instaliran → brew install ffmpeg"
ok "ffmpeg"
command -v python3 >/dev/null || fail "Python 3 nije instaliran → brew install python"
python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' || fail "Treba Python 3.9+ → brew install python"
ok "Python $(python3 --version | cut -d' ' -f2)"

echo "→ npm ci (Remotion, ~1 GB, par minuta)…"
npm ci --no-audit --no-fund
ok "Remotion instaliran"

if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
fi
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt
ok "Python okruženje (.venv)"

echo "→ Skidam whisper model large-v3-turbo (~1.6 GB, samo prvi put)…"
.venv/bin/python -I -c "from faster_whisper import WhisperModel; WhisperModel('large-v3-turbo', device='cpu', compute_type='int8')"
ok "Whisper model"

echo "→ Provjera: render jednog framea demo projekta…"
mkdir -p out/stills
npx remotion still Edit out/stills/setup_check.png --frame=60 --props='{"slug":"demo"}' --scale=0.25 --log=error
ok "Render radi (out/stills/setup_check.png)"

printf '\n\033[1mGotovo.\033[0m Otvori ovaj folder u Claude Codeu i napiši:\n'
printf '  "Koristi viral talking head editor skill. Evo raw videa: <putanja>. Projekt nazovi <ime>."\n'
