export function proprietaireDisplayName(proprietaire = {}) {
  if (proprietaire.type && proprietaire.type !== 'physique') {
    return proprietaire.raisonSociale || 'Personne morale';
  }
  return (
    [proprietaire.prenom, proprietaire.nom].filter(Boolean).join(' ') ||
    proprietaire.raisonSociale ||
    'Propriétaire'
  );
}

export function proprietaireInitials(proprietaire = {}) {
  const name = proprietaireDisplayName(proprietaire);
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const PROPRIETAIRE_TYPES = [
  'physique',
  'sci',
  'sarl',
  'sas',
  'indivision'
];
