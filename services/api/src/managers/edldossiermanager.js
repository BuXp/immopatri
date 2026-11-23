import { Collections, Service } from '@immopatri/common';
import {
  filterPiecesForLocataire,
  summariseObservations
} from '../services/edlService.js';
import { generateEdlToken } from '../services/edlTokens.js';

function edlSecret() {
  const env = Service.getInstance().envConfig.getValues();
  return env.EDL_TOKEN_SECRET || env.ACCESS_TOKEN_SECRET;
}

// Build the initial `pieces` snapshot of the dossier from the lot's config:
// for a colocation tenant, private pieces are filtered to their chambre.
function initialDossierPieces(configPieces = [], chambreId) {
  const visible = chambreId
    ? filterPiecesForLocataire(configPieces, chambreId)
    : configPieces;
  return visible.map((piece) => ({
    pieceId: piece.id,
    nom: piece.nomPersonnalise || piece.nom,
    photos: [],
    observations: []
  }));
}

export async function creer(req, res) {
  const { lotId, locataireId, chambreId, type, expiresInDays = 30 } = req.body;
  if (!lotId || !locataireId || !type) {
    return res
      .status(422)
      .json({ errors: ['lotId, locataireId and type are required'] });
  }
  if (!['entree', 'sortie'].includes(type)) {
    return res.status(422).json({ errors: ['type must be entree or sortie'] });
  }
  const config = await Collections.ConfigurationLogement.findOne({
    realmId: req.realm._id,
    lotId
  }).lean();
  if (!config) {
    return res.status(409).json({
      errors: ['configure the lot before generating an EDL dossier']
    });
  }
  if (config.typeLocation === 'colocation' && !chambreId) {
    return res
      .status(422)
      .json({ errors: ['chambreId is required for colocation lots'] });
  }

  const now = new Date();
  const dossier = new Collections.DossierEdl({
    realmId: req.realm._id,
    lotId,
    locataireId,
    chambreId,
    type,
    statut: 'a_envoyer',
    pieces: initialDossierPieces(config.pieces, chambreId),
    dateCreation: now,
    versions: [{ numero: 1, date: now, action: 'creation' }]
  });
  await dossier.save();

  const secret = edlSecret();
  if (!secret) {
    return res.status(500).json({
      errors: ['EDL_TOKEN_SECRET or ACCESS_TOKEN_SECRET must be configured']
    });
  }
  const { token, expiration } = generateEdlToken({
    dossierEdlId: String(dossier._id),
    secret,
    expiresInDays
  });
  dossier.lienToken = token;
  dossier.lienExpiration = expiration;
  await dossier.save();
  return res.status(201).json(dossier.toObject());
}

export async function list(req, res) {
  const query = { realmId: req.realm._id };
  if (req.query.lotId) {
    query.lotId = req.query.lotId;
  }
  if (req.query.statut) {
    query.statut = req.query.statut;
  }
  const dossiers = await Collections.DossierEdl.find(query)
    .sort({ dateCreation: -1 })
    .lean();
  const augmented = dossiers.map((d) => ({
    ...d,
    resume: summariseObservations(d)
  }));
  return res.json(augmented);
}

export async function one(req, res) {
  const dossier = await Collections.DossierEdl.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();
  if (!dossier) {
    return res.sendStatus(404);
  }
  return res.json({ ...dossier, resume: summariseObservations(dossier) });
}

export async function signer(req, res) {
  const dossier = await Collections.DossierEdl.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  });
  if (!dossier) {
    return res.sendStatus(404);
  }
  if (dossier.statut !== 'finalise' && dossier.statut !== 'transmis') {
    return res.status(409).json({
      errors: ['dossier must be finalised before signing']
    });
  }
  dossier.statut = 'signe';
  dossier.dateSignature = new Date();
  dossier.versions = [
    ...(dossier.versions || []),
    { numero: (dossier.versions?.length || 0) + 1, date: new Date(), action: 'signature' }
  ];
  await dossier.save();
  return res.json(dossier.toObject());
}

// Returns the structured data for the rapport PDF. Rendering to PDF is
// delegated to the pdfgenerator service (template to be added in a follow-up).
export async function rapport(req, res) {
  const dossier = await Collections.DossierEdl.findOne({
    _id: req.params.id,
    realmId: req.realm._id
  }).lean();
  if (!dossier) {
    return res.sendStatus(404);
  }
  return res.json({
    dossier,
    resume: summariseObservations(dossier),
    _format: 'json',
    _note:
      'Rapport PDF à générer via pdfgenerator — template rapport_edl.hbs à ajouter'
  });
}
