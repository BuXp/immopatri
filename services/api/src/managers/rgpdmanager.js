import {
  anonymizeProprietaire,
  buildProprietairePersonalData
} from '../services/rgpdservice.js';
import { Collections } from '@immopatri/common';

// GDPR data access / portability: exports an owner's personal data as JSON.
export async function exportProprietaire(req, res) {
  const realm = req.realm;
  const proprietaire = await Collections.Proprietaire.findOne({
    _id: req.params.id,
    realmId: realm._id
  }).lean();
  if (!proprietaire) {
    return res.sendStatus(404);
  }
  const lots = await Collections.Property.find({
    realmId: realm._id,
    'proprietaires.proprietaireId': req.params.id
  }).lean();
  const data = buildProprietairePersonalData(proprietaire, lots);
  const safeId = String(req.params.id).replace(/[^a-zA-Z0-9_-]/g, '');
  res.header('Content-Type', 'application/json');
  res.header(
    'Content-Disposition',
    `attachment; filename="rgpd-proprietaire-${safeId}.json"`
  );
  return res.send(JSON.stringify(data, null, 2));
}

// GDPR right to erasure: overwrites the owner's identifying personal data.
export async function anonymiser(req, res) {
  const realm = req.realm;
  const proprietaire = await Collections.Proprietaire.findOne({
    _id: req.params.id,
    realmId: realm._id
  }).lean();
  if (!proprietaire) {
    return res.sendStatus(404);
  }
  const updated = await Collections.Proprietaire.findOneAndUpdate(
    { _id: req.params.id, realmId: realm._id },
    { ...anonymizeProprietaire(proprietaire), updatedAt: new Date() },
    { new: true }
  ).lean();
  return res.json(updated);
}
