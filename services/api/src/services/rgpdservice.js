// Pure, dependency-free GDPR (RGPD) helpers for owners (DAT Sprint 8):
// build a personal-data export and compute an anonymised record. No database
// access here so the rules stay unit-testable.

export function buildProprietairePersonalData(proprietaire = {}, lots = []) {
  return {
    exportDate: new Date().toISOString(),
    identite: {
      type: proprietaire.type || '',
      nom: proprietaire.nom || '',
      prenom: proprietaire.prenom || '',
      raisonSociale: proprietaire.raisonSociale || '',
      siren: proprietaire.siren || ''
    },
    contact: {
      adresse: proprietaire.adresse || '',
      email: proprietaire.email || '',
      telephone: proprietaire.telephone || ''
    },
    coordonneesBancaires: (proprietaire.banques || []).map((banque) => ({
      banque: banque.banque || '',
      iban: banque.iban || ''
    })),
    assurances: proprietaire.assurances || [],
    lotsAssocies: lots.map((lot) => ({
      id: String(lot._id),
      nom: lot.name || ''
    })),
    valeurEstimePatrimoine: proprietaire.valeurEstimePatrimoine ?? null
  };
}

// Returns the fields to overwrite so the owner no longer holds identifying
// personal data (right to erasure), while preserving non-PII structure.
export function anonymizeProprietaire(proprietaire = {}) {
  return {
    nom: 'ANONYMISÉ',
    prenom: '',
    raisonSociale: proprietaire.raisonSociale ? 'ANONYMISÉ' : '',
    siren: '',
    adresse: '',
    email: '',
    telephone: '',
    banques: [],
    documents: [],
    anonymise: true
  };
}
