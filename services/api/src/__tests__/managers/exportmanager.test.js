import {
  buildEtatLocatifRows,
  buildPatrimoineRows
} from '../../managers/exportbuilders.js';

describe('buildEtatLocatifRows', () => {
  it('joins a lot with its immeuble and site', () => {
    const lots = [
      {
        _id: 'l1',
        name: 'Lot 1',
        immeubleId: 'i1',
        loyerTotal: 800,
        tantiemes: 300,
        proprietaires: [{ proprietaireId: 'p1' }]
      }
    ];
    const rows = buildEtatLocatifRows(
      lots,
      { i1: { nom: 'Bat A', siteId: 's1' } },
      { s1: { nom: 'Vendôme' } }
    );
    expect(rows[0]).toMatchObject({
      site: 'Vendôme',
      immeuble: 'Bat A',
      lot: 'Lot 1',
      loyerTotal: 800,
      tantiemes: 300,
      nbProprietaires: 1
    });
  });

  it('falls back to price when loyerTotal is absent', () => {
    const rows = buildEtatLocatifRows([{ _id: 'l', price: 500 }]);
    expect(rows[0].loyerTotal).toBe(500);
  });
});

describe('buildPatrimoineRows', () => {
  it('aggregates lots and rent per owner, applying the ownership share', () => {
    const proprietaires = [
      { _id: 'p1', nom: 'Doe', prenom: 'Jane', type: 'physique' }
    ];
    const lots = [
      {
        _id: 'l1',
        loyerTotal: 1000,
        proprietaires: [{ proprietaireId: 'p1', pourcentage: 50 }]
      },
      { _id: 'l2', loyerTotal: 600, proprietaires: [{ proprietaireId: 'p1' }] }
    ];
    const rows = buildPatrimoineRows(proprietaires, lots);
    expect(rows[0].nbLots).toBe(2);
    expect(rows[0].loyerMensuel).toBe(1100);
    expect(rows[0].proprietaire).toBe('Jane Doe');
  });

  it('ignores links to unknown owners', () => {
    const rows = buildPatrimoineRows(
      [{ _id: 'p1' }],
      [{ _id: 'l', proprietaires: [{ proprietaireId: 'pX' }] }]
    );
    expect(rows[0].nbLots).toBe(0);
  });
});
