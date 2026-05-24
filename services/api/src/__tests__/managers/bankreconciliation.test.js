import {
  parseAmount,
  parseBankCsv,
  reconcile
} from '../../services/bankreconciliation.js';

describe('parseAmount', () => {
  it('parses French decimals with thousands separator', () => {
    expect(parseAmount('1 234,56')).toBe(1234.56);
    expect(parseAmount('1.234,56')).toBe(1234.56);
  });

  it('parses English decimals', () => {
    expect(parseAmount('1,234.56')).toBe(1234.56);
    expect(parseAmount('650')).toBe(650);
  });

  it('returns NaN for empty input', () => {
    expect(Number.isNaN(parseAmount(''))).toBe(true);
  });
});

describe('parseBankCsv', () => {
  it('parses a headed statement with French amounts and a debit', () => {
    const csv = [
      'Date;Libelle;Montant',
      '01/02/2026;VIREMENT Dupont loyer;1 200,50',
      '02/02/2026;PRLV EDF;-80,00'
    ].join('\n');
    const rows = parseBankCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: '01/02/2026',
      label: 'VIREMENT Dupont loyer',
      amount: 1200.5
    });
    expect(rows[1].amount).toBe(-80);
  });

  it('supports separate credit/debit columns', () => {
    const csv = [
      'date;libelle;credit;debit',
      '01/02/2026;Loyer Martin;650,00;',
      '03/02/2026;Frais;;12,00'
    ].join('\n');
    const rows = parseBankCsv(csv);
    expect(rows[0].amount).toBe(650);
    expect(rows[1].amount).toBe(-12);
  });

  it('falls back to positional columns without a header', () => {
    const rows = parseBankCsv('01/02/2026,Loyer,800');
    expect(rows[0]).toEqual({ date: '01/02/2026', label: 'Loyer', amount: 800 });
  });

  it('returns an empty array for blank input', () => {
    expect(parseBankCsv('')).toEqual([]);
  });
});

describe('reconcile', () => {
  const candidates = [
    { _id: 't1', name: 'Frédéric Dupont', expectedAmount: 1200.5 },
    { _id: 't2', name: 'Sophie Martin', expectedAmount: 650 }
  ];

  it('matches by full name and amount (high score)', () => {
    const { matches } = reconcile(
      [{ date: '', label: 'VIR Frederic DUPONT', amount: 1200.5 }],
      candidates
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].tenantId).toBe('t1');
    expect(matches[0].score).toBe(5);
  });

  it('ignores debit transactions', () => {
    const { matches, unmatched } = reconcile(
      [{ date: '', label: 'PRLV EDF', amount: -80 }],
      candidates
    );
    expect(matches).toHaveLength(0);
    expect(unmatched).toHaveLength(1);
  });

  it('does not match on a single weak name token alone', () => {
    const { matches } = reconcile(
      [{ date: '', label: 'VIR Sophie cadeau', amount: 999 }],
      candidates
    );
    expect(matches).toHaveLength(0);
  });

  it('matches each tenant at most once', () => {
    const { matches } = reconcile(
      [
        { date: '', label: 'Martin', amount: 650 },
        { date: '', label: 'Martin', amount: 650 }
      ],
      candidates
    );
    expect(matches).toHaveLength(1);
  });
});
