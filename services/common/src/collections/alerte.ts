import { CollectionTypes } from '@immopatri/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const AlerteSchema = new mongoose.Schema<CollectionTypes.Alerte>({
  realmId: { type: String, ref: Realm },

  lotId: String,
  immeubleId: String,
  siteId: String,
  type: String,
  niveau: String, // orange | rouge
  message: String,
  dateExpiration: Date,
  dateAlerte: { type: Date, default: Date.now },
  envoyeEmail: { type: Boolean, default: false },
  acquittee: { type: Boolean, default: false }
});
AlerteSchema.index({ realmId: 1, niveau: 1 });
AlerteSchema.index({ realmId: 1, lotId: 1 });

export default mongoose.model<CollectionTypes.Alerte>('Alerte', AlerteSchema);
