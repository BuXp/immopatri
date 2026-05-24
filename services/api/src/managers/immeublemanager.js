import { repartirCharges, validateImmeuble } from './validation.js';
import { Collections } from '@immopatri/common';

export async function all(req, res) {
  const realm = req.realm;
  const query = { realmId: realm._id };
  // Optional filtering by parent site (DAT Sprint 1).
  if (req.query.siteId) {
    query.siteId = req.query.siteId;
  }
  const immeubles = await Collections.Immeuble.find(query)
    .sort({ nom: 1 })
    .lean();
  return res.json(immeubles);
}

export async function one(req, res) {
  const realm = req.realm;
  const immeuble = await Collections.Immeuble.findOne({
    _id: req.params.id,
    realmId: realm._id
  }).lean();
  if (!immeuble) {
    return res.sendStatus(404);
  }
  return res.json(immeuble);
}

export async function add(req, res) {
  const realm = req.realm;
  const errors = validateImmeuble(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }
  const now = new Date();
  const immeuble = new Collections.Immeuble({
    ...req.body,
    realmId: realm._id,
    createdAt: now,
    updatedAt: now
  });
  await immeuble.save();
  return res.status(201).json(immeuble.toObject());
}

export async function update(req, res) {
  const realm = req.realm;
  const errors = validateImmeuble(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }
  const immeuble = await Collections.Immeuble.findOneAndUpdate(
    { _id: req.params.id, realmId: realm._id },
    { ...req.body, realmId: realm._id, updatedAt: new Date() },
    { new: true }
  ).lean();
  if (!immeuble) {
    return res.sendStatus(404);
  }
  return res.json(immeuble);
}

// Distributes a charge call across the immeuble's lots by tantiemes (copro).
// GET /immeubles/:id/repartition?montant=X
export async function repartition(req, res) {
  const realm = req.realm;
  const montant = Number(req.query.montant);
  if (!Number.isFinite(montant)) {
    return res.status(422).json({ errors: ['montant must be a number'] });
  }
  const immeuble = await Collections.Immeuble.findOne({
    _id: req.params.id,
    realmId: realm._id
  }).lean();
  if (!immeuble) {
    return res.sendStatus(404);
  }
  const lots = await Collections.Property.find({
    realmId: realm._id,
    immeubleId: req.params.id
  })
    .sort({ numero: 1, name: 1 })
    .lean();
  const lignes = repartirCharges(lots, montant);
  const totalTantiemes = lignes.reduce(
    (sum, ligne) => sum + (ligne.tantiemes || 0),
    0
  );
  return res.json({ montant, totalTantiemes, lignes });
}

export async function remove(req, res) {
  const realm = req.realm;
  const ids = req.params.ids.split(',');
  await Collections.Immeuble.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });
  return res.sendStatus(204);
}
