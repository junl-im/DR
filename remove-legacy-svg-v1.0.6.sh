#!/usr/bin/env sh
set -eu
find . -path './.git' -prune -o -path './node_modules' -prune -o -name '*.svg' -type f -print -delete
rm -rf public/assets/tiles
printf '%s\n' 'v1.0.6 legacy SVG cleanup complete.'
