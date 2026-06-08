# Raffle

A simple ticket-weighted raffle driven by a CSV of entrants and a one-line shell command.

## 1. Populate the template

Edit `entrants.csv`. One row per entrant, no header:

```
Name,Tickets
```

- **Column 1** — the entrant's name (must be unique per person).
- **Column 2** — how many tickets they purchased (a whole number).

Example:

```
Alan,3
Violet,10
Sam,2
Barbara,14
```

More tickets = proportionally higher odds. Above, Barbara holds 14 of 29 tickets, so she wins any single draw ~48% of the time.

## 2. Run the raffle

Two scripts are provided, one per scenario. Both use ticket-weighted odds: internally they expand the CSV into one line per ticket, then shuffle and pick from that expanded pool.

> **macOS note:** `shuf` isn't installed by default. The scripts auto-fall back to `gshuf` (from `brew install coreutils`) or BSD `sort -R`. No change needed on your part.

### Scenario 1 — one person can win multiple prizes

Each prize is an independent draw from the full pool, so a heavy ticket-holder can win more than once.

```bash
./draw-multiple.sh
```

### Scenario 2 — a person can win only once

The pool is shuffled once, then deduplicated, so each winner is distinct.

```bash
./draw-unique.sh
```

## 3. Adjust the number of prizes

Pass the number of prizes as the first argument to either script (default is 3):

```bash
./draw-multiple.sh 1     # single winner
./draw-unique.sh 5       # five distinct winners
```

You can also point at a different entrants file with a second argument:

```bash
./draw-multiple.sh 3 other-entrants.csv
```
