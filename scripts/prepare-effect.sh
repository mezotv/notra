#!/usr/bin/env sh

set -eu

if [ "${VERCEL:-}" = "1" ] || [ "${CI:-}" = "true" ] || [ "${NODE_ENV:-}" = "production" ]; then
  exit 0
fi

repo_dir=".repos/effect"
repo_url="https://github.com/Effect-TS/effect-smol"

if [ -d "$repo_dir/.git" ]; then
  exit 0
fi

mkdir -p ".repos"
git clone "$repo_url" "$repo_dir"
