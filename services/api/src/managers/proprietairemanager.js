import { Collections } from '@immopatri/common';
import { validateProprietaire } from './validation.js';

export async function all(req, res) {
  const realm = req.realm;
  const proprietaires = await Collections.Proprietaire.find({
    realmId: realm._id
  })
    .sort({ raisonSociale: 1, nom: 1 })
    .lean();
  return res.json(proprietaires);
}

export async function one(req, res) {
  const realm = req.realm;
  const proprietaire = await Collections.Proprietaire.findOne({
    _id: req.params.id,
    realmId: realm._id
  }).lean();
  if (!proprietaire) {
    return res.sendStatus(404);
  }
  return res.json(proprietaire);
}

export async function add(req, res) {
  const realm = req.realm;
  const errors = validateProprietaire(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }
  const now = new Date();
  const proprietaire = new Collections.Proprietaire({
    ...req.body,
    realmId: realm._id,
    createdAt: now,
    updatedAt: now
  });
  await proprietaire.save();
  return res.status(201).json(proprietaire.toObject());
}

export async function update(req, res) {
  const realm = req.realm;
  const errors = validateProprietaire(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }
  const proprietaire = await Collections.Proprietaire.findOneAndUpdate(
    { _id: req.params.id, realmId: realm._id },
    { ...req.body, realmId: realm._id, updatedAt: new Date() },
    { new: true }
  ).lean();
  if (!proprietaire) {
    return res.sendStatus(404);
  }
  return res.json(proprietaire);
}

export async function remove(req, res) {
  const realm = req.realm;
  const ids = req.params.ids.split(',');
  await Collections.Proprietaire.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });
  return res.sendStatus(204);
}

// Consolidated holdings for a single owner: every site / immeuble / lot the
// owner is linked to, with the expected monthly rent rolled up (DAT 2.8).
export async function patrimoine(req, res) {
  const realm = req.realm;
  const proprietaireId = req.params.id;

  const proprietaire = await Collections.Proprietaire.findOne({
    _id: proprietaireId,
    realmId: realm._id
  }).lean();
  if (!proprietaire) {
    return res.sendStatus(404);
  }

  const link = { 'proprietaires.proprietaireId': proprietaireId };
  const [sites, immeubles, lots] = await Promise.all([
    Collections.Site.find({ realmId: realm._id, ...link }).lean(),
    Collections.Immeuble.find({ realmId: realm._id, ...link }).lean(),
    Collections.Property.find({ realmId: realm._id, ...link }).lean()
  ]);

  const loyerTotalMensuel = lots.reduce(
    (sum, lot) => sum + (lot.loyerTotal || lot.price || 0),
    0
  );

  return res.json({
    proprietaire,
    sites,
    immeubles,
    lots,
    stats: {
      nbSites: sites.length,
      nbImmeubles: immeubles.length,
      nbLots: lots.length,
      loyerTotalMensuel,
      valeurEstimePatrimoine: proprietaire.valeurEstimePatrimoine || 0
    }
  });
}
