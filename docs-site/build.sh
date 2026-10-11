#!/usr/bin/env bash
# Assembles the docs-site static output from the repo's source-of-truth markdown.
#
# Docs-site holds ONLY the viewer (index.html, css, fonts). The actual content — including
# every module's README.md and _sidebar.md — lives once, in ../docs/, read by both this
# site (rendered) and Claude/AI tooling (raw markdown). This script copies that single
# source into ./content, which is the only thing Vercel serves alongside the viewer shell.
#
# Requires the Vercel project setting "Include files outside of the Root Directory
# in the Build Step" to be enabled, since ../docs lives outside docs-site/.
set -euo pipefail
cd "$(dirname "$0")"

if [ -d ../docs ]; then
  rm -rf content
  mkdir -p content
  cp -R ../docs/. content/
  # Vault-only material — never published. discussions/ holds pricing and strategy notes;
  # graph/ is ~800 generated notes; .obsidian is per-user config; Home.md links into the
  # two above. See docs/Home.md.
  rm -rf content/.obsidian content/graph content/discussions content/Home.md
  echo "Assembled docs into ./content ($(find content -name '*.md' | wc -l | tr -d ' ') markdown files)"
elif [ -d content ] && [ "$(find content -name '*.md' 2>/dev/null | wc -l | tr -d ' ')" != "0" ]; then
  echo "Using prebuilt ./content ($(find content -name '*.md' | wc -l | tr -d ' ') markdown files)"
else
  echo "ERROR: No ../docs directory and ./content is empty." >&2
  echo "For Git deploys: enable 'Include files outside of the Root Directory in the Build Step' in Vercel." >&2
  echo "For CLI deploys: run ./build.sh locally, then npx vercel --prod --force" >&2
  exit 1
fi
