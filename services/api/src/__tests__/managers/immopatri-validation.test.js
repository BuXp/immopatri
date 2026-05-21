import {
  computeQuotePart,
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
