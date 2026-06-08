#!/usr/bin/env bash
# Raffle draw — a person can win only ONCE.
# The ticket pool is shuffled once, then deduplicated so every winner is distinct.
#
# Usage: ./draw-unique.sh [NUM_PRIZES] [CSV_FILE]
#   NUM_PRIZES  number of prizes to draw (default: 3)
#   CSV_FILE    entrants file, "Name,Tickets" per row (default: entrants.csv)

set -euo pipefail

NUM_PRIZES="${1:-3}"
CSV_FILE="${2:-entrants.csv}"

if [ ! -f "$CSV_FILE" ]; then
  echo "Error: entrants file '$CSV_FILE' not found." >&2
  exit 1
fi

DISTINCT=$(awk -F, '$1!=""' "$CSV_FILE" | wc -l | tr -d ' ')
if [ "$NUM_PRIZES" -gt "$DISTINCT" ]; then
  echo "Warning: $NUM_PRIZES prizes requested but only $DISTINCT entrants; drawing $DISTINCT." >&2
fi

if command -v shuf >/dev/null; then S=shuf; elif command -v gshuf >/dev/null; then S=gshuf; else S="sort -R"; fi

awk -F, '{ for(i=0;i<$2;i++) print $1 }' "$CSV_FILE" \
  | $S \
  | awk '!seen[$0]++' \
  | head -n "$NUM_PRIZES" \
  | nl -w1 -s'. '
