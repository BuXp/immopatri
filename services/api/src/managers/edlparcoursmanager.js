import { Collections, Service } from '@immopatri/common';
import { EdlTokenError, verifyEdlToken } from '../services/edlTokens.js';
import { evaluateObservation } from '../services/edlService.js';

function edlSecret() {
  const env = Service.getInstance().envConfig.getValues();
  return env.EDL_TOKEN_SECRET || env.ACCESS_TOKEN_SECRET;
}

// Resolves the dossier from a JWT in `req.params.token`. Attaches it as
// `req.edlDossier` so individual route handlers stay small.
async function withDossier(req, res, next) {
  try {
    const { dossierEdlId } = verifyEdlToken(req.params.token, edlSecret());
    const dossier = await Collections.DossierEdl.findById(dossierEdlId);
    if (!dossier) {
      return res.status(404).json({ errors: ['dossier introuvable'] });
    }
    dossier.dateDernierAcces = new Date();
    if (dossier.statut === 'a_envoyer') {
      dossier.statut = 'en_cours';
    }
    await dossier.save();
    req.edlDossier = dossier;
    return next();
  } catch (error) {
    if (error instanceof EdlTokenError) {
      const status = error.code === 'expired' ? 410 : 401;
      return res.status(status).json({ code: error.code, error: error.message });
    }
    throw error;
  }
}

export const middleware = withDossier;

// GET /edl/parcours/:token — returns the configuration view the tenant needs.
export async function getParcours(req, res) {
  const dossier = req.edlDossier.toObject();
  const config = await Collections.ConfigurationLogement.findOne({
    realmId: dossier.realmId,
    lotId: dossier.lotId
  }).lean();
  return res.json({
    dossier: {
      _id: dossier._id,
      type: dossier.type,
      statut: dossier.statut,
      lotId: dossier.lotId,
      chambreId: dossier.chambreId
    },
    pieces: dossier.pieces,
    config: config
      ? { pieces: config.pieces, annexes: config.annexes || [] }
      : null,
    consignesInitiales: [
      "Nettoyez l'objectif de l'appareil photo",
      'Éclairez bien les pièces',
      'Évitez les personnes et documents personnels dans les images'
    ]
  });
}

function ensurePiece(dossier, pieceId, nom) {
  let piece = dossier.pieces.find((p) => p.pieceId === pieceId);
  if (!piece) {
    piece = { pieceId, nom: nom || pieceId, photos: [], observations: [] };
    dossier.pieces.push(piece);
  }
  return piece;
}

// POST /edl/parcours/:token/photo — registers a photo already uploaded to
// MinIO (via /documents/upload). Keeps this service purely metadata to avoid
// bundling multer here and reuses the existing upload infrastructure.
export async function registerPhoto(req, res) {
  const dossier = req.edlDossier;
  const {
    pieceId,
    pieceNom,
    elementId,
    elementNom,
    cheminMinio,
    hashSHA256,
    resolution
  } = req.body;
  if (!pieceId || !elementId || !cheminMinio) {
    return res.status(422).json({
      errors: ['pieceId, elementId and cheminMinio are required']
    });
  }
  const piece = ensurePiece(dossier, pieceId, pieceNom);
  piece.photos.push({
    elementId,
    elementNom,
    cheminMinio,
    dateReception: new Date(),
    resolution,
    hashSHA256,
    estOriginal: true
  });
  await dossier.save();
  return res.status(201).json({ ok: true });
}

// PUT /edl/parcours/:token/observation — stores état / propreté / fonctionnement
// for an element. A missing answer is persisted as-is so the owner's dashboard
// can display "Non renseigné" (never silently mapped to "bon").
export async function saveObservation(req, res) {
  const dossier = req.edlDossier;
  const {
    pieceId,
    pieceNom,
    elementId,
    etat,
    proprete,
    fonctionnement,
    reponseSpeciale,
    signalement,
    commentaire,
    photos
  } = req.body;
  if (!pieceId || !elementId) {
    return res
      .status(422)
      .json({ errors: ['pieceId and elementId are required'] });
  }
  const piece = ensurePiece(dossier, pieceId, pieceNom);
  const existing = piece.observations.find((o) => o.elementId === elementId);
  const next = {
    elementId,
    etat,
    proprete,
    fonctionnement,
    reponseSpeciale,
    signalement: !!signalement,
    commentaire,
    photos: photos || []
  };
  if (existing) {
    Object.assign(existing, next);
  } else {
    piece.observations.push(next);
  }
  await dossier.save();
  return res.json({ ok: true, evaluation: evaluateObservation(next) });
}

export async function saveCompteur(req, res) {
  const dossier = req.edlDossier;
  const { id, type, index, unite, photo } = req.body;
  if (!id || !type) {
    return res.status(422).json({ errors: ['id and type are required'] });
  }
  const existing = (dossier.compteurs || []).find((c) => c.id === id);
  const next = { id, type, index, unite, photo };
  if (existing) {
    Object.assign(existing, next);
  } else {
    dossier.compteurs = [...(dossier.compteurs || []), next];
  }
  await dossier.save();
  return res.json({ ok: true });
}

export async function transmettre(req, res) {
  const dossier = req.edlDossier;
  if (dossier.statut === 'signe') {
    return res.status(409).json({ errors: ['dossier déjà signé'] });
  }
  dossier.statut = 'transmis';
  dossier.dateTransmission = new Date();
  dossier.versions = [
    ...(dossier.versions || []),
    {
      numero: (dossier.versions?.length || 0) + 1,
      date: new Date(),
      action: 'transmission'
    }
  ];
  await dossier.save();
  return res.json({ ok: true, statut: dossier.statut });
}
