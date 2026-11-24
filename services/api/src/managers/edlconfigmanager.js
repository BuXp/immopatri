import { applyModeleDepart, MODELES_DEPART } from '../services/edlService.js';
import { Collections } from '@immopatri/common';

// Owner-side configuration of a lot for the EDL journey (DAT v1.1 §16.1).
// One configuration per lot (upsert by `lotId`).

export async function one(req, res) {
  const config = await Collections.ConfigurationLogement.findOne({
    realmId: req.realm._id,
    lotId: req.params.lotId
  }).lean();
  if (!config) {
    return res.sendStatus(404);
  }
  return res.json(config);
}

export async function upsert(req, res) {
  const { lotId, typeLocation, pieces = [], annexes = [], modeleDepartId } =
    req.body;
  if (!lotId) {
    return res.status(422).json({ errors: ['lotId is required'] });
  }
  if (typeLocation && !['entier', 'colocation'].includes(typeLocation)) {
    return res.status(422).json({ errors: ['typeLocation is invalid'] });
  }
  const now = new Date();
  const config = await Collections.ConfigurationLogement.findOneAndUpdate(
    { realmId: req.realm._id, lotId },
    {
      realmId: req.realm._id,
      lotId,
      typeLocation: typeLocation || 'entier',
      modeleDepartId,
      pieces,
      annexes,
      updatedAt: now,
      $setOnInsert: { createdAt: now }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return res.json(config);
}

// Applies one of the starter templates (studio, appart-vide, appart-meuble,
// maison, chambre-coloc) to a lot, overwriting the current pieces.
export async function appliquerModele(req, res) {
  const { lotId, modeleDepartId, typeLocation } = req.body;
  if (!lotId) {
    return res.status(422).json({ errors: ['lotId is required'] });
  }
  const seed = applyModeleDepart(modeleDepartId);
  if (!seed) {
    return res.status(422).json({
      errors: [
        `modeleDepartId must be one of ${Object.keys(MODELES_DEPART).join(', ')}`
      ]
    });
  }
  const now = new Date();
  const config = await Collections.ConfigurationLogement.findOneAndUpdate(
    { realmId: req.realm._id, lotId },
    {
      realmId: req.realm._id,
      lotId,
      typeLocation:
        typeLocation || (modeleDepartId === 'chambre-coloc' ? 'colocation' : 'entier'),
      modeleDepartId,
      pieces: seed.pieces,
      updatedAt: now,
      $setOnInsert: { createdAt: now }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return res.json(config);
}
