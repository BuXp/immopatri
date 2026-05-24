// Pure, dependency-free row builders for the Excel exports (DAT Sprint 5).
// Kept separate from exportmanager.js so they stay unit-testable without
// loading the exceljs library.

export function buildEtatLocatifRows(
  lots = [],
  immeublesById = {},
  sitesById = {}
) {
  return lots.map((lot) => {
    const immeuble = immeublesById[String(lot.immeubleId)] || {};
    const site = sitesById[String(immeuble.siteId)] || {};
    return {
      site: site.nom || '',
      immeuble: immeuble.nom || '',
      lot: lot.name || '',
      numero: lot.numero || '',
      surface: lot.surface ?? '',
      statut: lot.statut || '',
      loyerHC: lot.loyerHC ?? '',
      charges: lot.charges ?? '',
      loyerTotal: lot.loyerTotal ?? lot.price ?? '',
      tantiemes: lot.tantiemes ?? '',
      nbProprietaires: (lot.proprietaires || []).length
    };
  });
}

function proprietaireLabel(proprietaire) {
  return (
    proprietaire.raisonSociale ||
    `${proprietaire.prenom || ''} ${proprietaire.nom || ''}`.trim()
  );
}

export function buildPatrimoineRows(proprietaires = [], lots = []) {
  const agg = new Map(
    proprietaires.map((proprietaire) => [
      String(proprietaire._id),
      { nbLots: 0, loyerMensuel: 0 }
    ])
  );
  for (const lot of lots) {
    for (const link of lot.proprietaires || []) {
      const entry = agg.get(String(link.proprietaireId));
      if (!entry) {
        continue;
      }
      const part = (link.pourcentage ?? 100) / 100;
      entry.nbLots += 1;
      entry.loyerMensuel += (lot.loyerTotal ?? lot.price ?? 0) * part;
    }
  }
  return proprietaires.map((proprietaire) => {
    const entry = agg.get(String(proprietaire._id)) || {
      nbLots: 0,
      loyerMensuel: 0
    };
    return {
      proprietaire: proprietaireLabel(proprietaire),
      type: proprietaire.type || '',
      nbLots: entry.nbLots,
      loyerMensuel: Math.round(entry.loyerMensuel * 100) / 100,
      valeurEstimePatrimoine: proprietaire.valeurEstimePatrimoine ?? ''
    };
  });
}
