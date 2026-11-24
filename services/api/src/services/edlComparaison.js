// Comparison helpers for Module 16 — EDL (DAT v1.1 §16.7).
//
// The actual OpenAI Vision call is intentionally decoupled: the caller feeds
// `compareImagePair` with an injectable `callAi` function so the pure parser
// / validation rules below remain fully unit-testable without a network key.
// In production, wire `callAi = openaiCompare` where `openaiCompare` POSTs
// the two image URLs to the GPT-4o vision endpoint with the system prompt
// recommended by the spec.

const SIGNALEMENT_TYPES = new Set([
  'tache',
  'rayure',
  'trou',
  'casse',
  'salissure',
  'element_manquant',
  'changement_equipement',
  'autre'
]);

export const AI_SYSTEM_PROMPT = [
  'Tu es un expert en états des lieux immobiliers.',
  'Analyse ces deux photos (entrée et sortie) du même élément.',
  'Identifie uniquement les différences visuelles objectives.',
  'Ne conclus JAMAIS sur la responsabilité, la vétusté ou tout montant financier.',
  'Format de réponse JSON strict.'
].join(' ');

function clampConfiance(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  if (n < 0) {
    return 0;
  }
  if (n > 100) {
    return 100;
  }
  return Math.round(n);
}

function normaliseType(raw) {
  const value = String(raw || '').toLowerCase();
  return SIGNALEMENT_TYPES.has(value) ? value : 'autre';
}

// Parses the AI JSON reply into the storage shape (resultats[] + statutGlobal).
// Tolerates minor shape drift (missing keys, unknown types) rather than
// throwing — a resilient parser is safer than a strict one when third-party
// models occasionally bend their format.
export function parseAiResponse(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return {
        statut: 'comparaison_impossible',
        raisonImpossible: 'format de réponse IA invalide',
        resultats: []
      };
    }
  }
  const differences = Array.isArray(data?.differences) ? data.differences : [];
  const resultats = differences.map((diff) => ({
    typeSignalement: normaliseType(diff?.type),
    descriptionFactuelle: String(diff?.description || '').trim(),
    niveauConfiance: clampConfiance(diff?.niveauConfiance),
    statutValidation: 'en_attente',
    zoneSignalee: diff?.zoneApproximative
      ? {
          x: Number(diff.zoneApproximative.x) || 0,
          y: Number(diff.zoneApproximative.y) || 0,
          largeur: Number(diff.zoneApproximative.largeur) || 0,
          hauteur: Number(diff.zoneApproximative.hauteur) || 0
        }
      : undefined
  }));
  const statut =
    data?.statutComparaison === 'comparaison_impossible'
      ? 'comparaison_impossible'
      : resultats.length === 0
        ? 'pas_de_difference_notable'
        : 'differences_detectees';
  const out = { statut, resultats };
  if (statut === 'comparaison_impossible' && data?.raisonImpossible) {
    out.raisonImpossible = String(data.raisonImpossible);
  }
  return out;
}

// ALWAYS true — the CDC and DAT are explicit: "Validation humaine obligatoire"
// and "Aucun montant imputé automatiquement". This is kept as a function so
// the intent is readable in the route layer.
// eslint-disable-next-line no-unused-vars
export function requiresHumanReview(resultat) {
  return true;
}

// Visual confidence tier for the UI badge. Does NOT drive any auto-decision.
// <40 → cadrage/lumière (faible), 40–60 → à examiner (moyen), >60 → écart
// probable (eleve).
export function confidenceCategory(level) {
  const n = clampConfiance(level);
  if (n < 40) {
    return 'faible';
  }
  if (n <= 60) {
    return 'moyen';
  }
  return 'eleve';
}

// Validates the owner's decision on a single comparison line.
export function validateComparaisonDecision({ action, commentaire } = {}) {
  const allowed = ['confirme', 'ecarte', 'complement_demande'];
  if (!allowed.includes(action)) {
    return {
      ok: false,
      errors: [`action doit être ${allowed.join(' | ')}`]
    };
  }
  if (action === 'complement_demande' && !String(commentaire || '').trim()) {
    return {
      ok: false,
      errors: ['un commentaire est requis pour demander un complément']
    };
  }
  return { ok: true };
}

// High-level comparator used by the manager: pass pre-fetched images (as
// base64 or URLs) and an injectable `callAi` function (openai client, test
// mock, …). Keeps every side-effect out of this module.
export async function compareImagePair({
  imageEntree,
  imageSortie,
  elementNom,
  callAi
}) {
  if (typeof callAi !== 'function') {
    throw new Error('callAi function is required');
  }
  if (!imageEntree || !imageSortie) {
    return {
      statut: 'comparaison_impossible',
      raisonImpossible: 'image manquante',
      resultats: []
    };
  }
  const raw = await callAi({
    systemPrompt: AI_SYSTEM_PROMPT,
    imageEntree,
    imageSortie,
    elementNom
  });
  return parseAiResponse(raw);
}
