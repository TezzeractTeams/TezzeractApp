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

rm -rf content
mkdir -p content
cp -R ../docs/. content/

echo "Assembled docs into ./content ($(find content -name '*.md' | wc -l | tr -d ' ') markdown files)"
