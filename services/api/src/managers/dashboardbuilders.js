// Pure, dependency-free aggregation for the ImmoPatri patrimoine dashboard
// (DAT Sprint 7). Kept separate so it stays unit-testable without a database.

export function buildPatrimoineDashboard(
  sites = [],
  immeubles = [],
  lots = [],
  alertes = []
) {
  const occupation = { loue: 0, vacant: 0, travaux: 0, preavis: 0, autre: 0 };
  let loyerMensuelTotal = 0;

  for (const lot of lots) {
    const statut = lot.statut || 'autre';
    if (occupation[statut] !== undefined) {
      occupation[statut] += 1;
    } else {
      occupation.autre += 1;
    }
    loyerMensuelTotal += lot.loyerTotal ?? lot.price ?? 0;
  }

  const alertesByNiveau = { rouge: 0, orange: 0 };
  for (const alerte of alertes) {
    if (alerte.acquittee) {
      continue;
    }
    if (alerte.niveau === 'rouge') {
      alertesByNiveau.rouge += 1;
    } else if (alerte.niveau === 'orange') {
      alertesByNiveau.orange += 1;
    }
  }

  const tauxOccupation = lots.length
    ? Math.round((occupation.loue / lots.length) * 100)
    : 0;

  return {
    nbSites: sites.length,
    nbImmeubles: immeubles.length,
    nbLots: lots.length,
    occupation,
    tauxOccupation,
    loyerMensuelTotal: Math.round(loyerMensuelTotal * 100) / 100,
    alertes: alertesByNiveau
  };
}
