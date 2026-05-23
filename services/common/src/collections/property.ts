import { CollectionTypes } from '@immopatri/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const PropertySchema = new mongoose.Schema<CollectionTypes.Property>({
  realmId: { type: String, ref: Realm },

  type: String,
  name: String,
  description: String,
  surface: Number,
  phone: String,
  digicode: String,
  address: {
    _id: false,
    street1: String,
    street2: String,
    zipCode: String,
    city: String,
    state: String,
    country: String
  },

  price: Number,

  // ── ImmoPatri lot extensions (DAT Partie 2.5 / 3.5) ──
  immeubleId: String,
  numero: String,
  etage: Number,
  nombrePieces: Number,
  meuble: Boolean,
  loyerHC: Number,
  charges: Number,
  loyerTotal: Number,
  depotGarantie: Number,
  statut: String, // loue | vacant | travaux | preavis | reserve
  assurancePNO: {
    _id: false,
    assureur: String,
    numero: String,
    expiration: Date
  },
  dpe: {
    _id: false,
    note: String, // A | B | C | D | E | F | G
    dateRealisation: Date,
    dateExpiration: Date,
    fichier: String,
    loiClimatAlerte: Boolean
  },
  diagnostics: [
    {
      _id: false,
      type: String,
      dateRealisation: Date,
      dateExpiration: Date,
      resultat: String,
      fichier: String,
      alerte: Boolean
    }
  ],
  photos: [String],
  documents: [String],
  proprietaires: [
    {
      _id: false,
      proprietaireId: String,
      pourcentage: Number
    }
  ]
});
PropertySchema.index({ realmId: 1, immeubleId: 1 });

export default mongoose.model<CollectionTypes.Property>(
  'Property',
  PropertySchema
);
