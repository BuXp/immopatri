import { Collections, logger, Service } from '@immopatri/common';
import axios from 'axios';
import { checkDiagnosticExpiration } from '../services/alerteService.js';

// Re-scans every lot of a realm, regenerates the non-acknowledged alerts and
// keeps the acknowledged ones untouched. Returns a summary. Reused by both the
// on-demand route and the optional daily cron (alertejob.js).
export async function scanAlertes(realm, now = new Date()) {
  const lots = await Collections.Property.find({ realmId: realm._id }).lean();
  const immeubles = await Collections.Immeuble.find({
    realmId: realm._id
  }).lean();
  const siteByImmeuble = new Map(
    immeubles.map((immeuble) => [String(immeuble._id), immeuble.siteId])
  );

  // Keep acknowledged alerts so we don't nag about them again.
  const acknowledged = await Collections.Alerte.find({
    realmId: realm._id,
    acquittee: true
  }).lean();
  const acknowledgedKeys = new Set(
    acknowledged.map((a) => `${a.lotId}|${a.type}`)
  );

  const detected = [];
  for (const lot of lots) {
    for (const alerte of checkDiagnosticExpiration(lot, now)) {
      if (acknowledgedKeys.has(`${alerte.lotId}|${alerte.type}`)) {
        continue;
      }
      detected.push({
        ...alerte,
        realmId: realm._id,
        siteId: alerte.immeubleId
          ? siteByImmeuble.get(String(alerte.immeubleId))
          : undefined,
        dateAlerte: now,
        envoyeEmail: false,
        acquittee: false
      });
    }
  }

  await Collections.Alerte.deleteMany({
    realmId: realm._id,
    acquittee: { $ne: true }
  });
  if (detected.length) {
    await Collections.Alerte.insertMany(detected);
  }

  return {
    scanned: lots.length,
    detected: detected.length,
    kept: acknowledged.length
  };
}

export async function scan(req, res) {
  const summary = await scanAlertes(req.realm);
  return res.json(summary);
}

export async function all(req, res) {
  const realm = req.realm;
  const query = { realmId: realm._id };
  if (req.query.niveau) {
    query.niveau = req.query.niveau;
  }
  if (req.query.type) {
    query.type = req.query.type;
  }
  if (req.query.lotId) {
    query.lotId = req.query.lotId;
  }
  if (req.query.siteId) {
    query.siteId = req.query.siteId;
  }
  if (req.query.acquittee !== undefined) {
    query.acquittee = req.query.acquittee === 'true';
  }

  const alertes = await Collections.Alerte.find(query)
    .sort({ niveau: 1, dateExpiration: 1 })
    .lean();
  return res.json(alertes);
}

export async function acknowledge(req, res) {
  const realm = req.realm;
  const alerte = await Collections.Alerte.findOneAndUpdate(
    { _id: req.params.id, realmId: realm._id },
    { acquittee: true },
    { new: true }
  ).lean();
  if (!alerte) {
    return res.sendStatus(404);
  }
  return res.json(alerte);
}

// Sends the compliance digest to the landlord via the emailer service. The
// emailer resolves the recipients from the organization's registered members.
export async function notify(req, res) {
  const realm = req.realm;
  const { EMAILER_URL } = Service.getInstance().envConfig.getValues();
  try {
    const response = await axios.post(
      EMAILER_URL,
      {
        templateName: 'alerte',
        recordId: String(realm._id),
        params: req.query.niveau ? { niveau: req.query.niveau } : {}
      },
      {
        headers: {
          authorization: req.headers.authorization,
          organizationid: req.headers.organizationid || String(realm._id),
          'Accept-Language': req.headers['accept-language']
        }
      }
    );
    await Collections.Alerte.updateMany(
      { realmId: realm._id, acquittee: { $ne: true } },
      { envoyeEmail: true }
    );
    return res.json({ sent: true, results: response.data });
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    logger.error(`alerte email failed: ${message}`);
    return res.status(502).json({ sent: false, error: message });
  }
}
