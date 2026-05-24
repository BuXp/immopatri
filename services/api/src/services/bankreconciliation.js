// Pure, side-effect-free bank reconciliation helpers (DAT Sprint 6):
// parse a bank-statement CSV and match incoming transactions to tenants by
// label and expected rent amount. No database access here so the rules stay
// trivially unit-testable.

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parses an amount written in French (1.234,56) or English (1,234.56) form.
export function parseAmount(raw) {
  if (typeof raw === 'number') {
    return raw;
  }
  let text = String(raw ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/€/g, '');
  if (text === '') {
    return NaN;
  }
  const hasComma = text.indexOf(',') !== -1;
  const hasDot = text.indexOf('.') !== -1;
  if (hasComma && hasDot) {
    // The last separator is the decimal one.
    if (text.lastIndexOf(',') > text.lastIndexOf('.')) {
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      text = text.replace(/,/g, '');
    }
  } else if (hasComma) {
    text = text.replace(',', '.');
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : NaN;
}

function splitCsvLine(line, delimiter) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

const HEADER_HINTS = [
  'date',
  'libelle',
  'label',
  'montant',
  'credit',
  'debit',
  'amount',
  'description',
  'intitule'
];

// Parses a bank-statement CSV into [{ date, label, amount }]. Supports `;` or
// `,` delimiters, an optional header row, a single signed amount column or
// separate credit/debit columns.
export function parseBankCsv(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  if (!lines.length) {
    return [];
  }

  const semicolons = (lines[0].match(/;/g) || []).length;
  const commas = (lines[0].match(/,/g) || []).length;
  const delimiter = semicolons >= commas ? ';' : ',';

  let dateIdx = 0;
  let labelIdx = 1;
  let amountIdx = 2;
  let creditIdx = -1;
  let debitIdx = -1;
  let startRow = 0;

  const firstCells = splitCsvLine(lines[0], delimiter).map(normalize);
  const hasHeader = firstCells.some((cell) => HEADER_HINTS.includes(cell));
  if (hasHeader) {
    startRow = 1;
    firstCells.forEach((cell, index) => {
      if (cell === 'date') {
        dateIdx = index;
      } else if (['libelle', 'label', 'description', 'intitule'].includes(cell)) {
        labelIdx = index;
      } else if (['montant', 'amount'].includes(cell)) {
        amountIdx = index;
      } else if (cell === 'credit') {
        creditIdx = index;
      } else if (cell === 'debit') {
        debitIdx = index;
      }
    });
  }

  const rows = [];
  for (let r = startRow; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r], delimiter);
    let amount;
    if (creditIdx !== -1 || debitIdx !== -1) {
      const credit = creditIdx !== -1 ? parseAmount(cells[creditIdx]) : 0;
      const debit = debitIdx !== -1 ? parseAmount(cells[debitIdx]) : 0;
      amount =
        (Number.isFinite(credit) ? credit : 0) -
        (Number.isFinite(debit) ? debit : 0);
    } else {
      amount = parseAmount(cells[amountIdx]);
    }
    rows.push({
      date: cells[dateIdx] || '',
      label: cells[labelIdx] || '',
      amount: Number.isFinite(amount) ? amount : 0
    });
  }
  return rows;
}

// Matches incoming (credit) transactions to tenant candidates by name and
// expected amount. Each candidate: { _id, name, expectedAmount }. A tenant is
// matched at most once (greedy by score). Returns { matches, unmatched }.
export function reconcile(transactions = [], candidates = [], options = {}) {
  const tolerance = options.tolerance ?? 0.01;
  const indexed = candidates.map((candidate) => ({
    ...candidate,
    tokens: normalize(candidate.name)
      .split(' ')
      .filter((token) => token.length >= 3)
  }));

  const used = new Set();
  const matches = [];
  const unmatched = [];

  for (const transaction of transactions) {
    if (!(transaction.amount > 0)) {
      unmatched.push(transaction);
      continue;
    }
    const label = normalize(transaction.label);
    let best = null;
    for (const candidate of indexed) {
      if (used.has(candidate._id)) {
        continue;
      }
      let score = 0;
      const allTokensHit =
        candidate.tokens.length > 0 &&
        candidate.tokens.every((token) => label.includes(token));
      const anyTokenHit = candidate.tokens.some((token) =>
        label.includes(token)
      );
      if (allTokensHit) {
        score += 3;
      } else if (anyTokenHit) {
        score += 1;
      }
      if (Math.abs(transaction.amount - candidate.expectedAmount) <= tolerance) {
        score += 2;
      }
      if (!best || score > best.score) {
        best = { candidate, score };
      }
    }
    if (best && best.score >= 2) {
      used.add(best.candidate._id);
      matches.push({
        transaction,
        tenantId: best.candidate._id,
        tenantName: best.candidate.name,
        expectedAmount: best.candidate.expectedAmount,
        score: best.score
      });
    } else {
      unmatched.push(transaction);
    }
  }

  return { matches, unmatched };
}
