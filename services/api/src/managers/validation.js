// Pure, side-effect-free validators shared by the ImmoPatri managers.
// Each returns an array of human-readable error strings (empty === valid),
// which keeps them trivially unit-testable without a database.

const MODE_DETENTION = [
  'monopropriete',
  'copropriete',
  'indivision',
  'sci',
  'sas',
  'sarl',
  'autre'
];

const PROPRIETAIRE_TYPES = ['physique', 'sci', 'sarl', 'sas', 'indivision'];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function validateProprietaireLinks(links, errors) {
  if (links === undefined) {
    return;
  }
  if (!Array.isArray(links)) {
    errors.push('proprietaires must be an array');
    return;
  }
  for (const link of links) {
    if (
      link.pourcentage !== undefined &&
      (typeof link.pourcentage !== 'number' ||
        link.pourcentage < 0 ||
        link.pourcentage > 100)
    ) {
      errors.push('proprietaires.pourcentage must be a number between 0 and 100');
    }
  }
}

export function validateSite(body = {}) {
  const errors = [];
  if (isBlank(body.nom)) {
    errors.push('nom is required');
  }
  if (body.taxeFonciere !== undefined && typeof body.taxeFonciere !== 'number') {
    errors.push('taxeFonciere must be a number');
  }
  validateProprietaireLinks(body.proprietaires, errors);
  return errors;
}

export function validateImmeuble(body = {}) {
  const errors = [];
  if (isBlank(body.nom)) {
    errors.push('nom is required');
  }
  if (isBlank(body.siteId)) {
    errors.push('siteId is required');
  }
  const modeType = body.modeDetention && body.modeDetention.type;
  if (modeType !== undefined && !MODE_DETENTION.includes(modeType)) {
    errors.push('modeDetention.type is invalid');
  }
  validateProprietaireLinks(body.proprietaires, errors);
  return errors;
}

export function validateProprietaire(body = {}) {
  const errors = [];
  if (body.type !== undefined && !PROPRIETAIRE_TYPES.includes(body.type)) {
    errors.push('type is invalid');
  }
  if (body.type === 'physique') {
    if (isBlank(body.nom)) {
      errors.push('nom is required for a physical person');
    }
  } else if (body.type !== undefined) {
    if (isBlank(body.raisonSociale)) {
      errors.push('raisonSociale is required for a legal entity');
    }
  }
  if (!isBlank(body.email) && !EMAIL_RE.test(body.email)) {
    errors.push('email is invalid');
  }
  return errors;
}

// Quote-part by lot from copro tantiemes (base 10000) for a charge call.
export function computeQuotePart(tantiemes, montant) {
  if (typeof tantiemes !== 'number' || typeof montant !== 'number') {
    return 0;
  }
  return Math.round((tantiemes / 10000) * montant * 100) / 100;
}
