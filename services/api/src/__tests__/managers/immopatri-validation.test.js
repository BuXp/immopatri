import {
  computeQuotePart,
  repartirCharges,
  validateImmeuble,
  validateProprietaire,
  validateSite
} from '../../managers/validation.js';

describe('ImmoPatri validation — sites', () => {
  it('accepts a site with a name', () => {
    expect(validateSite({ nom: 'Vendôme' })).toEqual([]);
  });

  it('requires a name', () => {
    expect(validateSite({})).toContain('nom is required');
    expect(validateSite({ nom: '   ' })).toContain('nom is required');
  });

  it('rejects a non-numeric taxeFonciere', () => {
    expect(validateSite({ nom: 'Pau', taxeFonciere: '1200' })).toContain(
      'taxeFonciere must be a number'
    );
  });

  it('rejects an out-of-range ownership percentage', () => {
    const errors = validateSite({
      nom: 'Pau',
      proprietaires: [{ proprietaireId: 'x', pourcentage: 150 }]
    });
    expect(errors).toContain(
      'proprietaires.pourcentage must be a number between 0 and 100'
    );
  });
});

describe('ImmoPatri validation — immeubles', () => {
  it('accepts a valid immeuble', () => {
    expect(
      validateImmeuble({
        nom: 'Bat A',
        siteId: 'site1',
        modeDetention: { type: 'copropriete' }
      })
    ).toEqual([]);
  });

  it('requires nom and siteId', () => {
    const errors = validateImmeuble({});
    expect(errors).toContain('nom is required');
    expect(errors).toContain('siteId is required');
  });

  it('rejects an invalid detention mode', () => {
    const errors = validateImmeuble({
      nom: 'Bat A',
      siteId: 'site1',
      modeDetention: { type: 'leasing' }
    });
    expect(errors).toContain('modeDetention.type is invalid');
  });

  it('accepts valid appels de charges', () => {
    expect(
      validateImmeuble({
        nom: 'Bat A',
        siteId: 'site1',
        appelsCharges: [{ periode: '2026-T1', montant: 1200, statut: 'appele' }]
      })
    ).toEqual([]);
  });

  it('rejects a non-numeric charge call amount', () => {
    const errors = validateImmeuble({
      nom: 'Bat A',
      siteId: 'site1',
      appelsCharges: [{ periode: '2026-T1', montant: '1200' }]
    });
    expect(errors).toContain('appelsCharges.montant must be a number');
  });

  it('rejects an invalid charge call status', () => {
    const errors = validateImmeuble({
      nom: 'Bat A',
      siteId: 'site1',
      appelsCharges: [{ montant: 100, statut: 'unknown' }]
    });
    expect(errors).toContain('appelsCharges.statut is invalid');
  });
});

describe('ImmoPatri validation — proprietaires', () => {
  it('requires nom for a physical person', () => {
    expect(validateProprietaire({ type: 'physique' })).toContain(
      'nom is required for a physical person'
    );
  });

  it('requires raisonSociale for a legal entity', () => {
    expect(validateProprietaire({ type: 'sci' })).toContain(
      'raisonSociale is required for a legal entity'
    );
  });

  it('rejects an invalid email', () => {
    expect(
      validateProprietaire({ type: 'physique', nom: 'Doe', email: 'nope' })
    ).toContain('email is invalid');
  });

  it('accepts a valid SCI owner', () => {
    expect(
      validateProprietaire({ type: 'sci', raisonSociale: 'SCI Patri' })
    ).toEqual([]);
  });
});

describe('ImmoPatri — computeQuotePart', () => {
  it('computes the quote-part from tantiemes (base 10000)', () => {
    expect(computeQuotePart(500, 2000)).toBe(100);
  });

  it('returns 0 for non-numeric inputs', () => {
    expect(computeQuotePart('500', 2000)).toBe(0);
  });
});

describe('ImmoPatri — repartirCharges', () => {
  it('distributes a charge call proportionally to tantiemes', () => {
    const lots = [
      { _id: 'a', name: 'Lot 1', tantiemes: 300 },
      { _id: 'b', name: 'Lot 2', tantiemes: 700 }
    ];
    const lignes = repartirCharges(lots, 1000);
    expect(lignes[0].quotePart).toBe(300);
    expect(lignes[1].quotePart).toBe(700);
  });

  it('absorbs the rounding remainder on the last lot so parts sum exactly', () => {
    const lots = [
      { _id: 'a', tantiemes: 1 },
      { _id: 'b', tantiemes: 1 },
      { _id: 'c', tantiemes: 1 }
    ];
    const lignes = repartirCharges(lots, 100);
    const total = lignes.reduce((sum, l) => sum + l.quotePart, 0);
    expect(Math.round(total * 100) / 100).toBe(100);
  });

  it('returns zero parts when no lot has tantiemes', () => {
    const lignes = repartirCharges([{ _id: 'a' }, { _id: 'b' }], 500);
    expect(lignes.every((l) => l.quotePart === 0)).toBe(true);
  });

  it('returns an empty array for an invalid montant', () => {
    expect(repartirCharges([{ _id: 'a', tantiemes: 10 }], 'x')).toEqual([]);
  });
});
