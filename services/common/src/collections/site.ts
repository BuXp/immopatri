import { CollectionTypes } from '@microrealestate/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const SiteSchema = new mongoose.Schema<CollectionTypes.Site>({
  realmId: { type: String, ref: Realm },

  nom: String,
  adresse: String,
  ville: String,
  codePostal: String,
  region: String,
  pays: String,
  banquePrincipale: String,
  assurance: {
    _id: false,
    assureur: String,
    numero: String,
    expiration: Date
  },
  taxeFonciere: Number,
  notes: String,
  proprietaires: [
    {
      _id: false,
      proprietaireId: String,
      pourcentage: Number
    }
  ],
  documents: [String],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
SiteSchema.index({ realmId: 1 });

export default mongoose.model<CollectionTypes.Site>('Site', SiteSchema);
