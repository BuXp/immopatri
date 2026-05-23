import { CollectionTypes } from '@immopatri/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const ProprietaireSchema = new mongoose.Schema<CollectionTypes.Proprietaire>({
  realmId: { type: String, ref: Realm },

  nom: String,
  prenom: String,
  raisonSociale: String,
  type: String, // physique | sci | sarl | sas | indivision
  siren: String,
  adresse: String,
  email: String,
  telephone: String,
  banques: [
    {
      _id: false,
      banque: String,
      iban: String
    }
  ],
  assurances: [
    {
      _id: false,
      type: String,
      assureur: String,
      numero: String,
      expiration: Date
    }
  ],
  documents: [String],
  valeurEstimePatrimoine: Number,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
ProprietaireSchema.index({ realmId: 1 });

export default mongoose.model<CollectionTypes.Proprietaire>(
  'Proprietaire',
  ProprietaireSchema
);
