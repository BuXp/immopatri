import { CollectionTypes } from '@immopatri/types';
import mongoose from 'mongoose';
import Realm from './realm.js';
import Site from './site.js';

const ImmeubleSchema = new mongoose.Schema<CollectionTypes.Immeuble>({
  realmId: { type: String, ref: Realm },
  siteId: { type: String, ref: Site },

  nom: String,
  adresse: String,
  refCadastrale: String,
  type: String,
  modeDetention: {
    _id: false,
    // `type: { type: String }` so Mongoose treats modeDetention as a nested
    // object with a `type` field, instead of collapsing it to a plain String.
    type: { type: String }, // monopropriete | copropriete | indivision | sci | sas | sarl | autre
    syndic: String,
    contactSyndic: String,
    emailSyndic: String,
    numLotCopro: String,
    tantiemes: Number,
    chargesCoproAnnuelles: Number,
    reglementCopro: String,
    chargesCommunes: Number,
    repartitionParLot: Boolean
  },
  appelsCharges: [
    {
      _id: false,
      periode: String,
      montant: Number,
      dateEnvoi: Date,
      datePaiement: Date,
      statut: String,
      document: String
    }
  ],
  proprietaires: [
    {
      _id: false,
      proprietaireId: String,
      pourcentage: Number
    }
  ],
  assuranceImmeuble: {
    _id: false,
    assureur: String,
    numero: String,
    expiration: Date
  },
  banque: String,
  iban: String,
  taxeFonciere: Number,
  travaux: [
    {
      _id: false,
      description: String,
      budget: Number,
      datePrevu: Date,
      statut: String
    }
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
ImmeubleSchema.index({ realmId: 1, siteId: 1 });

export default mongoose.model<CollectionTypes.Immeuble>(
  'Immeuble',
  ImmeubleSchema
);
