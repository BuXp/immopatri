import { buildPatrimoineDashboard } from '../../managers/dashboardbuilders.js';

describe('buildPatrimoineDashboard', () => {
  it('counts entities, occupancy, rent and alerts', () => {
    const result = buildPatrimoineDashboard(
      [{ _id: 's1' }],
      [{ _id: 'i1' }, { _id: 'i2' }],
      [
        { statut: 'loue', loyerTotal: 800 },
        { statut: 'loue', loyerTotal: 700 },
        { statut: 'vacant', price: 0 },
        { statut: 'travaux', loyerTotal: 0 }
      ],
      [
        { niveau: 'rouge' },
        { niveau: 'orange' },
        { niveau: 'orange', acquittee: true }
      ]
    );
    expect(result.nbSites).toBe(1);
    expect(result.nbImmeubles).toBe(2);
    expect(result.nbLots).toBe(4);
    expect(result.occupation.loue).toBe(2);
    expect(result.occupation.vacant).toBe(1);
    expect(result.occupation.travaux).toBe(1);
    expect(result.loyerMensuelTotal).toBe(1500);
    expect(result.tauxOccupation).toBe(50);
    expect(result.alertes).toEqual({ rouge: 1, orange: 1 });
  });

  it('handles an empty patrimoine', () => {
    const result = buildPatrimoineDashboard();
    expect(result.nbLots).toBe(0);
    expect(result.tauxOccupation).toBe(0);
    expect(result.loyerMensuelTotal).toBe(0);
  });

  it('classifies unknown statuses as "autre"', () => {
    const result = buildPatrimoineDashboard([], [], [{ statut: 'reserve' }]);
    expect(result.occupation.autre).toBe(1);
  });
});
