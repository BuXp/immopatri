import { Collections } from '@immopatri/common';
import { validateSite } from './validation.js';

export async function all(req, res) {
  const realm = req.realm;
  const sites = await Collections.Site.find({ realmId: realm._id })
    .sort({ nom: 1 })
    .lean();
  return res.json(sites);
}

export async function one(req, res) {
  const realm = req.realm;
  const site = await Collections.Site.findOne({
    _id: req.params.id,
    realmId: realm._id
  }).lean();
  if (!site) {
    return res.sendStatus(404);
  }
  return res.json(site);
}

export async function add(req, res) {
  const realm = req.realm;
  const errors = validateSite(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }
  const now = new Date();
  const site = new Collections.Site({
    ...req.body,
    realmId: realm._id,
    createdAt: now,
    updatedAt: now
  });
  await site.save();
  return res.status(201).json(site.toObject());
}

export async function update(req, res) {
  const realm = req.realm;
  const errors = validateSite(req.body);
  if (errors.length) {
    return res.status(422).json({ errors });
  }
  const site = await Collections.Site.findOneAndUpdate(
    { _id: req.params.id, realmId: realm._id },
    { ...req.body, realmId: realm._id, updatedAt: new Date() },
    { new: true }
  ).lean();
  if (!site) {
    return res.sendStatus(404);
  }
  return res.json(site);
}

export async function remove(req, res) {
  const realm = req.realm;
  const ids = req.params.ids.split(',');
  await Collections.Site.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });
  return res.sendStatus(204);
}
