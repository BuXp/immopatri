// Pure, dependency-free business rules for Module 16 — États des lieux
// (DAT v1.1). Kept isolated from Mongo/MinIO/OpenAI so every @critique
// scenario can be covered by unit tests without a running backend.

// ─────────────────────── Observations / "réponse manquante ≠ bon état" ───

const ETATS_BONS = new Set(['tres_bon', 'bon']);
const ETATS_MAUVAIS = new Set(['use', 'degrade']);

// Evaluates a single tenant observation. A missing answer NEVER maps to
// "bon état" — it stays `non_renseigne`, raising an alert for the owner.
// (CDC §5 "Une réponse manquante ne signifie jamais bon état", @critique
//  BDD scenario "Réponse manquante différente de bon état".)
export function evaluateObservation(observation = {}) {
  const { etat, reponseSpeciale } = observation;
  if (reponseSpeciale) {
    return { statut: 'reponse_speciale', alerte: false, detail: reponseSpeciale };
  }
  if (etat === undefined || etat === null || etat === '') {
    return { statut: 'non_renseigne', alerte: true };
  }
  if (ETATS_BONS.has(etat)) {
    return { statut: 'bon', alerte: false, detail: etat };
  }
  if (ETATS_MAUVAIS.has(etat)) {
    return { statut: 'mauvais', alerte: true, detail: etat };
  }
  if (etat === 'non_verifiable') {
    return { statut: 'non_verifiable', alerte: false };
  }
  return { statut: 'non_renseigne', alerte: true };
}

// Summarises observations for a whole dossier and counts un-answered items.
export function summariseObservations(dossier = {}) {
  let renseignees = 0;
  let nonRenseignees = 0;
  let alertes = 0;
  for (const piece of dossier.pieces || []) {
    for (const obs of piece.observations || []) {
      const { statut, alerte } = evaluateObservation(obs);
      if (statut === 'non_renseigne') {
        nonRenseignees += 1;
      } else {
        renseignees += 1;
      }
      if (alerte) {
        alertes += 1;
      }
    }
  }
  return { renseignees, nonRenseignees, alertes };
}

// ─────────────────────────── Colocation — isolation & historique ────────

// Which pieces a given tenant (assigned to `chambreId`) is allowed to see:
// common spaces (estPrivative=false|undefined) + their own private rooms
// (estPrivative=true AND chambreId matches). Core of the @critique isolation
// scenario "aucune photo ni information de la chambre de l'autre n'est accessible".
export function filterPiecesForLocataire(pieces = [], chambreId) {
  return pieces.filter((piece) => {
    if (!piece.estPrivative) {
      return true;
    }
    return piece.chambreId && piece.chambreId === chambreId;
  });
}

// Appends a new series to the shared-space history WITHOUT overwriting any
// previous series — the DAT's "historique immuable" invariant (@critique).
export function appendSerieCommun(historique = { seriesPhotos: [] }, serie) {
  if (!serie || !serie.dossierEdlId) {
    return historique;
  }
  return {
    ...historique,
    seriesPhotos: [...(historique.seriesPhotos || []), serie]
  };
}

// Picks the right entry series for a sortie comparison in a colocation:
// the one from the departing tenant (CDC "la comparaison principale de juin
// utilise l'entrée de janvier du locataire concerné"). Intermediate series
// from other tenants are returned separately as "observations intermédiaires".
export function selectEntreeSerieForSortie(
  historique = { seriesPhotos: [] },
  departingLocataireId
) {
  const series = historique.seriesPhotos || [];
  const ownEntries = series.filter(
    (s) => s.type === 'entree' && s.locataireId === departingLocataireId
  );
  ownEntries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const entreeDeReference = ownEntries[0] || null;
  const observationsIntermediaires = series.filter(
    (s) => s !== entreeDeReference && s.locataireId !== departingLocataireId
  );
  return { entreeDeReference, observationsIntermediaires };
}

// ─────────────────────────── Minio / storage keys ────────────────────────

export const EDL_BUCKET = 'immopatri-edl';

function safeSegment(value, fallback = 'inconnu') {
  const text = String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
  return text || fallback;
}

// Private photo key: /{lotId}/{dossierEdlId}/{pieceId}/{elementId}/{ts}_{hash}.jpg
export function buildPrivatePhotoKey({
  lotId,
  dossierEdlId,
  pieceId,
  elementId,
  timestamp = Date.now(),
  hash = ''
}) {
  const h = String(hash).slice(0, 12) || 'nohash';
  return [
    safeSegment(lotId, 'lot'),
    safeSegment(dossierEdlId, 'dossier'),
    safeSegment(pieceId, 'piece'),
    safeSegment(elementId, 'element'),
    `${timestamp}_${safeSegment(h, 'nohash')}.jpg`
  ].join('/');
}

// Common photo key: /{lotId}/communs/{pieceId}/{seriesId}/{ts}_{hash}.jpg
export function buildCommonPhotoKey({
  lotId,
  pieceId,
  seriesId,
  timestamp = Date.now(),
  hash = ''
}) {
  const h = String(hash).slice(0, 12) || 'nohash';
  return [
    safeSegment(lotId, 'lot'),
    'communs',
    safeSegment(pieceId, 'piece'),
    safeSegment(seriesId, 'serie'),
    `${timestamp}_${safeSegment(h, 'nohash')}.jpg`
  ].join('/');
}

// ─────────────────────────── Modèles de départ ───────────────────────────

// Starter templates for a newly configured flat (CDC §2 "Modèles réutilisables").
// Values are deliberately minimal — the owner personalises from there.
export const MODELES_DEPART = Object.freeze({
  studio: {
    pieces: [
      { id: 'entree', nom: 'Entrée', type: 'entree' },
      { id: 'piece_principale', nom: 'Pièce principale', type: 'piece_principale' },
      { id: 'kitchenette', nom: 'Kitchenette', type: 'cuisine' },
      { id: 'sdb', nom: 'Salle de bains', type: 'salle_de_bains' }
    ]
  },
  'appart-vide': {
    pieces: [
      { id: 'entree', nom: 'Entrée', type: 'entree' },
      { id: 'salon', nom: 'Salon', type: 'salon' },
      { id: 'cuisine', nom: 'Cuisine', type: 'cuisine' },
      { id: 'chambre', nom: 'Chambre', type: 'chambre' },
      { id: 'sdb', nom: 'Salle de bains', type: 'salle_de_bains' },
      { id: 'wc', nom: 'WC', type: 'wc' }
    ]
  },
  'appart-meuble': {
    pieces: [
      { id: 'entree', nom: 'Entrée', type: 'entree' },
      { id: 'salon', nom: 'Salon', type: 'salon' },
      { id: 'cuisine', nom: 'Cuisine équipée', type: 'cuisine' },
      { id: 'chambre', nom: 'Chambre', type: 'chambre' },
      { id: 'sdb', nom: 'Salle de bains', type: 'salle_de_bains' },
      { id: 'wc', nom: 'WC', type: 'wc' }
    ]
  },
  maison: {
    pieces: [
      { id: 'entree', nom: 'Entrée', type: 'entree' },
      { id: 'salon', nom: 'Salon', type: 'salon' },
      { id: 'salle_a_manger', nom: 'Salle à manger', type: 'salle_a_manger' },
      { id: 'cuisine', nom: 'Cuisine', type: 'cuisine' },
      { id: 'chambre1', nom: 'Chambre 1', type: 'chambre' },
      { id: 'sdb', nom: 'Salle de bains', type: 'salle_de_bains' },
      { id: 'wc', nom: 'WC', type: 'wc' }
    ]
  },
  // Cergy starter template — colocation (CDC §3 "Modèle de départ pour Cergy").
  'chambre-coloc': {
    pieces: [
      {
        id: 'chambre_priv',
        nom: 'Chambre privative',
        type: 'chambre',
        estPrivative: true
      },
      {
        id: 'entree_couloir',
        nom: 'Entrée-couloir',
        type: 'entree',
        estPrivative: false
      },
      { id: 'wc', nom: 'WC séparés', type: 'wc', estPrivative: false },
      {
        id: 'sdb',
        nom: 'Salle de bains',
        type: 'salle_de_bains',
        estPrivative: false
      },
      {
        id: 'salon_cuisine',
        nom: 'Salon-cuisine',
        type: 'salon_cuisine',
        estPrivative: false
      }
    ]
  }
});

export function applyModeleDepart(modeleId, overrides = {}) {
  const modele = MODELES_DEPART[modeleId];
  if (!modele) {
    return null;
  }
  const pieces = modele.pieces.map((piece) => ({ ...piece }));
  return { modeleDepartId: modeleId, pieces, ...overrides };
}
