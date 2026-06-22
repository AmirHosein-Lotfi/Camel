#!/usr/bin/env bash
set -euo pipefail

REPO_TARBALL="https://github.com/AmirHosein-Lotfi/Camel/archive/refs/heads/main.tar.gz"
SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
SKILLS=(camel camel-dam camel-pro)

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "Downloading camel..."
curl -fsSL "$REPO_TARBALL" | tar -xz -C "$TMP_DIR" --strip-components=1

mkdir -p "$SKILLS_DIR"
for skill in "${SKILLS[@]}"; do
  rm -rf "$SKILLS_DIR/$skill"
  cp -r "$TMP_DIR/$skill" "$SKILLS_DIR/$skill"
  echo "Installed $skill -> $SKILLS_DIR/$skill"
done

echo "Done. Restart Claude Code, then try /camel, /camel-dam, or /camel-pro."
