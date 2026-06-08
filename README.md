# Raffle

A simple ticket-weighted raffle. Two implementations are included: a set of shell scripts driven by a CSV (sections 1–3), and a self-contained Google Sheet via Apps Script (section 4).

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
Susan,6
Sam,2
Barbara,9
```

More tickets = proportionally higher odds. Above, Barbara holds 9 of 20 tickets, so she wins any single draw ~45% of the time.

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

## 4. Alternative: Google Sheet (Apps Script)

`raffle.gs` is a self-contained version that lives entirely inside a Google Sheet — entrants, draw logic, and results all in one place, with a menu button instead of the command line.

### Setup

1. In a Google Sheet, put `Name` in **A1** and `Tickets` in **B1**, then list entrants from row 2 down (same shape as `entrants.csv`).
2. Open **Extensions → Apps Script**, delete the placeholder code, paste the contents of `raffle.gs`, and **Save**.
3. Reload the spreadsheet. A **🎟 Raffle** menu appears next to Help. (The first draw triggers a one-time Google authorization prompt — approve it.)

### Drawing

**🎟 Raffle → Draw winners…** asks two questions, covering both scenarios in one button:

- **How many prizes** — any whole number.
- **Can one person win more than once?** — *Yes* = independent weighted draws (repeats allowed, like `draw-multiple.sh`); *No* = distinct winners (like `draw-unique.sh`).

### Results

- Winners are written to columns **D/E** (`Place`, `Winner`).
- An append-only **audit log** in columns **G/H** records each draw with a timestamp, tagged `[repeats]` or `[unique]`.
- **🎟 Raffle → Clear results** wipes the D/E winners but keeps the audit log.

Unlike a spreadsheet `RANDBETWEEN` formula (which re-rolls on every edit), this only draws when you click the menu — no accidental re-rolls.
