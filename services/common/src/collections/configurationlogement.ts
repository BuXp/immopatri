import { CollectionTypes } from '@immopatri/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const ConfigurationLogementSchema =
  new mongoose.Schema<CollectionTypes.ConfigurationLogement>({
    realmId: { type: String, ref: Realm },
    lotId: String,

    typeLocation: String, // entier | colocation
    modeleDepartId: String,

    pieces: [
      {
        _id: false,
        id: String,
        nom: String,
        nomPersonnalise: String,
        // Wrapped so Mongoose keeps pieces[] as a subdocument array with a
        // `type` field, instead of collapsing it to an array of String.
        type: { type: String },
        estPrivative: Boolean,
        chambreId: String,
        equipements: [
          {
            _id: false,
            id: String,
            nom: String,
            // Same subdoc-with-type workaround.
            type: { type: String },
            quantite: Number,
            notes: String
          }
        ]
      }
    ],
    annexes: [
      {
        _id: false,
        id: String,
        // Same subdoc-with-type workaround.
        type: { type: String },
        nom: String
      }
    ],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
ConfigurationLogementSchema.index({ realmId: 1, lotId: 1 }, { unique: true });

export default mongoose.model<CollectionTypes.ConfigurationLogement>(
  'ConfigurationLogement',
  ConfigurationLogementSchema
);
