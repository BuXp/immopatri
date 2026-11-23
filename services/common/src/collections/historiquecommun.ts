import { CollectionTypes } from '@immopatri/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

// Common-space photo history for shared-tenancy (colocation) flats:
// each series of photos is pinned to its tenant and date, and new series
// never overwrite previous ones (DAT v1.1 §16.2).
const HistoriqueCommunSchema =
  new mongoose.Schema<CollectionTypes.HistoriqueCommun>({
    realmId: { type: String, ref: Realm },
    lotId: String,
    pieceId: String,

    seriesPhotos: [
      {
        _id: false,
        dossierEdlId: String,
        locataireId: String,
        // Subdoc-with-type workaround.
        type: { type: String }, // entree | sortie
        date: Date,
        photos: [String]
      }
    ]
  });
HistoriqueCommunSchema.index({ realmId: 1, lotId: 1, pieceId: 1 });

export default mongoose.model<CollectionTypes.HistoriqueCommun>(
  'HistoriqueCommun',
  HistoriqueCommunSchema
);
