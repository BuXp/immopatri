import {
  anonymizeProprietaire,
  buildProprietairePersonalData
} from '../../services/rgpdservice.js';

describe('buildProprietairePersonalData', () => {
  it('collects identity, contact, bank and linked lots', () => {
    const data = buildProprietairePersonalData(
      {
        type: 'physique',
        nom: 'Doe',
        prenom: 'Jane',
        email: 'jane@example.com',
        telephone: '0102030405',
        banques: [{ banque: 'BNP', iban: 'FR76...' }],
        valeurEstimePatrimoine: 250000
      },
      [{ _id: 'l1', name: 'Lot 1' }]
    );
    expect(data.identite.nom).toBe('Doe');
    expect(data.contact.email).toBe('jane@example.com');
    expect(data.coordonneesBancaires[0].iban).toBe('FR76...');
    expect(data.lotsAssocies).toEqual([{ id: 'l1', nom: 'Lot 1' }]);
    expect(data.valeurEstimePatrimoine).toBe(250000);
  });

  it('tolerates a sparse owner', () => {
    const data = buildProprietairePersonalData({});
    expect(data.identite.nom).toBe('');
    expect(data.coordonneesBancaires).toEqual([]);
    expect(data.lotsAssocies).toEqual([]);
  });
});

describe('anonymizeProprietaire', () => {
  it('clears identifying personal data and sets the flag', () => {
    const result = anonymizeProprietaire({
      nom: 'Doe',
      prenom: 'Jane',
      email: 'jane@example.com',
      telephone: '0102030405',
      siren: '123456789',
      banques: [{ iban: 'FR76...' }]
    });
    expect(result.nom).toBe('ANONYMISÉ');
    expect(result.prenom).toBe('');
    expect(result.email).toBe('');
    expect(result.telephone).toBe('');
    expect(result.siren).toBe('');
    expect(result.banques).toEqual([]);
    expect(result.anonymise).toBe(true);
  });

  it('anonymises the company name only when present', () => {
    expect(anonymizeProprietaire({ raisonSociale: 'SCI Patri' }).raisonSociale).toBe(
      'ANONYMISÉ'
    );
    expect(anonymizeProprietaire({}).raisonSociale).toBe('');
  });
});
