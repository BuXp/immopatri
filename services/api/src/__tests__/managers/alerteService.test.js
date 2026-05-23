import {
  addYears,
  checkDiagnosticExpiration,
  evaluateExpiration
} from '../../services/alerteService.js';

const NOW = new Date('2026-05-21T00:00:00Z');

describe('evaluateExpiration', () => {
  it('returns null when no date is provided', () => {
    expect(evaluateExpiration(undefined, 'dpe', NOW)).toBeNull();
  });

  it('flags an expired date as rouge', () => {
    expect(evaluateExpiration(new Date('2026-01-01'), 'erp', NOW)).toBe(
      'rouge'
    );
  });

  it('flags an ERP expiring within a month as orange', () => {
    expect(evaluateExpiration(new Date('2026-06-10'), 'erp', NOW)).toBe(
      'orange'
    );
  });

  it('does not flag an ERP expiring in three months', () => {
    expect(evaluateExpiration(new Date('2026-08-21'), 'erp', NOW)).toBeNull();
  });

  it('uses a 6-month window for the DPE', () => {
    expect(evaluateExpiration(new Date('2026-09-01'), 'dpe', NOW)).toBe(
      'orange'
    );
    expect(evaluateExpiration(new Date('2026-12-01'), 'dpe', NOW)).toBeNull();
  });
});

describe('checkDiagnosticExpiration', () => {
  it('returns no alert for a lot without diagnostics', () => {
    expect(checkDiagnosticExpiration({ _id: 'a' }, NOW)).toEqual([]);
  });

  it('derives the DPE expiry from realisation date + 10 years', () => {
    const lot = {
      _id: 'lot1',
      dpe: { note: 'C', dateRealisation: new Date('2016-06-01') }
    };
    const alertes = checkDiagnosticExpiration(lot, NOW);
    const dpe = alertes.find((a) => a.type === 'dpe');
    expect(dpe).toBeDefined();
    expect(dpe.niveau).toBe('orange');
    expect(addYears(lot.dpe.dateRealisation, 10).getFullYear()).toBe(2026);
  });

  it('raises a Loi Climat alert for an F/G rated dwelling', () => {
    const lot = {
      _id: 'lot2',
      dpe: { note: 'F', dateRealisation: new Date('2024-01-01') }
    };
    const types = checkDiagnosticExpiration(lot, NOW).map((a) => a.type);
    expect(types).toContain('dpe_loi_climat');
  });

  it('flags an expired diagnostic as rouge', () => {
    const lot = {
      _id: 'lot3',
      diagnostics: [
        { type: 'amiante', dateExpiration: new Date('2025-01-01') }
      ]
    };
    const alertes = checkDiagnosticExpiration(lot, NOW);
    expect(alertes).toHaveLength(1);
    expect(alertes[0].niveau).toBe('rouge');
    expect(alertes[0].lotId).toBe('lot3');
  });
});
