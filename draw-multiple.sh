#!/usr/bin/env bash
# Raffle draw — one person CAN win multiple prizes.
# Each prize is an independent ticket-weighted draw from the full pool.
#
# Usage: ./draw-multiple.sh [NUM_PRIZES] [CSV_FILE]
#   NUM_PRIZES  number of prizes to draw (default: 3)
#   CSV_FILE    entrants file, "Name,Tickets" per row (default: entrants.csv)

set -euo pipefail

NUM_PRIZES="${1:-3}"
CSV_FILE="${2:-entrants.csv}"

if [ ! -f "$CSV_FILE" ]; then
  echo "Error: entrants file '$CSV_FILE' not found." >&2
  exit 1
fi

if command -v shuf >/dev/null; then S=shuf; elif command -v gshuf >/dev/null; then S=gshuf; else S=""; fi

for prize in $(seq 1 "$NUM_PRIZES"); do
  if [ -n "$S" ]; then
    w=$(awk -F, '{ for(i=0;i<$2;i++) print $1 }' "$CSV_FILE" | $S -n 1)
  else
    w=$(awk -F, '{ for(i=0;i<$2;i++) print $1 }' "$CSV_FILE" | sort -R | head -n 1)
  fi
  echo "Prize $prize: $w"
done
