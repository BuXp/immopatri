import {
  compareImagePair,
  parseAiResponse,
  validateComparaisonDecision
} from '../services/edlComparaison.js';
import { Collections } from '@immopatri/common';

// Stub AI call used when no OPENAI_API_KEY is configured. Returns a resilient
// "comparaison_impossible" payload so downstream code path is always
// exercised without accidentally fabricating fake differences in production.
async function stubCallAi() {
  return {
    statutComparaison: 'comparaison_impossible',
    raisonImpossible:
      'Aucun fournisseur IA configuré. Branchez OPENAI_API_KEY pour activer la comparaison.'
  };
}

export async function creer(req, res) {
  const { dossierEntreeId, dossierSortieId } = req.body;
  if (!dossierEntreeId || !dossierSortieId) {
    return res.status(422).json({
      errors: ['dossierEntreeId and dossierSortieId are required']
    });
  }
  const [entree, sortie] = await Promise.all([
    Collections.DossierEdl.findOne({
      _id: dossierEntreeId,
      realmId: req.realm._id
    }).lean(),
    Collections.DossierEdl.findOne({
      _id: dossierSortieId,
      realmId: req.realm._id
    }).lean()
  ]);
  if (!entree || !sortie) {
    return res.status(404).json({ errors: ['dossier introuvable'] });
  }
  if (entree.type !== 'entree' || sortie.type !== 'sortie') {
    return res.status(422).json({
      errors: [
        'le premier dossier doit être une entrée et le second une sortie'
      ]
    });
  }
  if (String(entree.lotId) !== String(sortie.lotId)) {
    return res.status(409).json({
      errors: ['les deux dossiers doivent porter sur le même lot']
    });
  }

  // Build element pairs (entrée photo ↔ sortie photo) per (pieceId, elementId).
  const sortiePhotosByKey = new Map();
  for (const piece of sortie.pieces || []) {
    for (const photo of piece.photos || []) {
      const key = `${piece.pieceId}|${photo.elementId}`;
      if (!sortiePhotosByKey.has(key)) {
        sortiePhotosByKey.set(key, []);
      }
      sortiePhotosByKey.get(key).push(photo.cheminMinio);
    }
  }

  const resultats = [];
  for (const piece of entree.pieces || []) {
    for (const photoEntree of piece.photos || []) {
      const key = `${piece.pieceId}|${photoEntree.elementId}`;
      const photosSortie = sortiePhotosByKey.get(key);
      if (!photosSortie || photosSortie.length === 0) {
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const comparaison = await compareImagePair({
        imageEntree: photoEntree.cheminMinio,
        imageSortie: photosSortie[0],
        elementNom: photoEntree.elementNom,
        callAi: stubCallAi
      });
      for (const r of comparaison.resultats) {
        resultats.push({
          ...r,
          pieceId: piece.pieceId,
          elementId: photoEntree.elementId,
          photosEntree: [photoEntree.cheminMinio],
          photosSortie
        });
      }
    }
  }

  const doc = new Collections.ComparaisonEdl({
    realmId: req.realm._id,
    dossierEntreeId,
    dossierSortieId,
    statut: 'en_cours',
    statutGlobal:
      resultats.length === 0 ? 'pas_de_difference_notable' : 'a_valider',
    dateAnalyseIA: new Date(),
    resultats
  });
  await doc.save();
  return res.status(201).json(doc.toObject());
}

// Re-usable for dev / tests: parse an AI JSON blob provided directly in the
// body and return the normalised resultats without persisting.
export async function dryRun(req, res) {
  return res.json(parseAiResponse(req.body?.raw));
}

export async function list(req, res) {
  const query = { realmId: req.realm._id };
  if (req.query.dossierSortieId) {
    query.dossierSortieId = req.query.dossierSortieId;
  }
  const comparaisons = await Collections.ComparaisonEdl.find(query)
    .sort({ dateAnalyseIA: -1 })
    .lean();
  return res.json(comparaisons);
}

export async function one(req, res) {
  const comp = await Collections.ComparaisonEdl.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();
  if (!comp) {
    return res.sendStatus(404);
  }
  return res.json(comp);
}

// PATCH /edl/comparaisons/:id/items/:index — owner decision (confirme / ecarte /
// complement_demande). Mandatory human validation — no amount is ever
// computed here.
export async function validerItem(req, res) {
  const { action, commentaire } = req.body;
  const validation = validateComparaisonDecision({ action, commentaire });
  if (!validation.ok) {
    return res.status(422).json({ errors: validation.errors });
  }
  const comp = await Collections.ComparaisonEdl.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  });
  if (!comp) {
    return res.sendStatus(404);
  }
  const idx = Number(req.params.index);
  if (!Number.isInteger(idx) || !comp.resultats[idx]) {
    return res.status(404).json({ errors: ['item introuvable'] });
  }
  comp.resultats[idx].statutValidation = action;
  if (commentaire) {
    comp.resultats[idx].commentaireProprietaire = commentaire;
  }
  const encore = comp.resultats.some((r) => r.statutValidation === 'en_attente');
  if (!encore) {
    comp.statut = 'termine';
    comp.dateValidationHumaine = new Date();
  }
  await comp.save();
  return res.json(comp.toObject());
}
