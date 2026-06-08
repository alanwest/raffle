/**
 * Self-contained weighted raffle for Google Sheets.
 *
 * Sheet layout (first sheet):
 *   A1: "Name"     B1: "Tickets"   <- header row
 *   A2: Alan       B2: 3
 *   A3: Susan      B3: 6
 *   ...            ...
 *
 * Install: Extensions -> Apps Script, paste this file, Save, then reload
 * the spreadsheet. A "🎟 Raffle" menu appears. Use it to draw winners.
 * Results are written to columns D/E and an audit log to columns G/H.
 */

const NAME_COL = 1;   // column A
const TICKET_COL = 2; // column B
const FIRST_DATA_ROW = 2;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎟 Raffle')
    .addItem('Draw winners…', 'drawWinners')
    .addItem('Clear results', 'clearResults')
    .addToUi();
}

function readEntrants_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < FIRST_DATA_ROW) return [];
  const rows = sheet
    .getRange(FIRST_DATA_ROW, NAME_COL, lastRow - FIRST_DATA_ROW + 1, 2)
    .getValues();

  const entrants = [];
  rows.forEach((r, i) => {
    const name = String(r[0]).trim();
    const tickets = Number(r[1]);
    if (name === '') return; // skip blank rows
    if (!Number.isFinite(tickets) || tickets <= 0) {
      throw new Error(
        'Row ' + (FIRST_DATA_ROW + i) + ' ("' + name + '") has an invalid ' +
        'ticket count. Tickets must be a positive number.'
      );
    }
    entrants.push({ name: name, tickets: Math.floor(tickets) });
  });
  return entrants;
}

/** Pick one entrant from `pool` weighted by ticket count. */
function pickWeighted_(pool) {
  const total = pool.reduce((sum, e) => sum + e.tickets, 0);
  let r = Math.floor(Math.random() * total) + 1; // 1..total
  for (let i = 0; i < pool.length; i++) {
    r -= pool[i].tickets;
    if (r <= 0) return i;
  }
  return pool.length - 1; // fallback (shouldn't happen)
}

function drawWinners() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  let entrants;
  try {
    entrants = readEntrants_(sheet);
  } catch (err) {
    ui.alert('Cannot draw', err.message, ui.ButtonSet.OK);
    return;
  }
  if (entrants.length === 0) {
    ui.alert('Cannot draw', 'No entrants found. Add names in column A and ' +
      'ticket counts in column B, starting at row 2.', ui.ButtonSet.OK);
    return;
  }

  // How many prizes?
  const prizeResp = ui.prompt(
    'Draw winners',
    'How many prizes are you drawing?',
    ui.ButtonSet.OK_CANCEL
  );
  if (prizeResp.getSelectedButton() !== ui.Button.OK) return;
  const numPrizes = Math.floor(Number(prizeResp.getResponseText()));
  if (!Number.isFinite(numPrizes) || numPrizes < 1) {
    ui.alert('Invalid number', 'Please enter a whole number of prizes (1 or more).',
      ui.ButtonSet.OK);
    return;
  }

  // Repeats allowed?
  const repeatResp = ui.alert(
    'Winner rules',
    'Can one person win more than one prize?\n\n' +
      'Yes  = independent draws, repeats allowed.\n' +
      'No   = each winner is distinct.',
    ui.ButtonSet.YES_NO
  );
  const allowRepeats = repeatResp === ui.Button.YES;

  // Draw.
  const winners = [];
  if (allowRepeats) {
    for (let p = 0; p < numPrizes; p++) {
      winners.push(entrants[pickWeighted_(entrants)].name);
    }
  } else {
    const pool = entrants.slice(); // shallow copy we can splice from
    const target = Math.min(numPrizes, pool.length);
    for (let p = 0; p < target; p++) {
      const idx = pickWeighted_(pool);
      winners.push(pool[idx].name);
      pool.splice(idx, 1); // remove so they can't win again
    }
    if (numPrizes > entrants.length) {
      ui.alert('Heads up',
        'You asked for ' + numPrizes + ' distinct winners but there are only ' +
        entrants.length + ' entrants. Drew ' + entrants.length + '.',
        ui.ButtonSet.OK);
    }
  }

  writeResults_(sheet, winners, allowRepeats);
  ui.alert('Done', 'Drew ' + winners.length + ' winner(s). See column E.',
    ui.ButtonSet.OK);
}

function writeResults_(sheet, winners, allowRepeats) {
  // Results block in D/E.
  sheet.getRange('D1:E1').setValues([['Place', 'Winner']]).setFontWeight('bold');
  const lastResultRow = Math.max(sheet.getLastRow(), winners.length + 1);
  sheet.getRange(2, 4, lastResultRow, 2).clearContent(); // clear old D/E results
  const out = winners.map((w, i) => [i + 1, w]);
  if (out.length) sheet.getRange(2, 4, out.length, 2).setValues(out);

  // Append an audit log entry in G/H so past draws aren't lost.
  if (sheet.getRange('G1').getValue() === '') {
    sheet.getRange('G1:H1').setValues([['Drawn at', 'Result']])
      .setFontWeight('bold');
  }
  const stamp = new Date();
  const summary = (allowRepeats ? '[repeats] ' : '[unique] ') + winners.join(', ');
  const logRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(logRow, 7, 1, 2).setValues([[stamp, summary]]);
}

function clearResults() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = Math.max(sheet.getLastRow(), 2);
  sheet.getRange(2, 4, lastRow, 2).clearContent(); // D/E winners only
  SpreadsheetApp.getUi().alert('Cleared current results (audit log in G/H kept).');
}
