import { CollectionTypes } from '@immopatri/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const ComparaisonEdlSchema =
  new mongoose.Schema<CollectionTypes.ComparaisonEdl>({
    realmId: { type: String, ref: Realm },
    dossierEntreeId: String,
    dossierSortieId: String,
    proprietaireId: String,

    statut: String, // en_attente | en_cours | termine
    statutGlobal: String,
    dateAnalyseIA: Date,
    dateValidationHumaine: Date,

    resultats: [
      {
        _id: false,
        pieceId: String,
        elementId: String,
        // Subdoc-with-type workaround — `type` is the signalement category.
        typeSignalement: String, // tache | rayure | trou | casse | salissure | element_manquant | changement_equipement | autre
        descriptionFactuelle: String,
        niveauConfiance: Number, // 0..100
        statutValidation: String, // en_attente | confirme | ecarte | complement_demande
        commentaireProprietaire: String,
        photosEntree: [String],
        photosSortie: [String],
        zoneSignalee: {
          _id: false,
          x: Number,
          y: Number,
          largeur: Number,
          hauteur: Number
        }
      }
    ]
  });
ComparaisonEdlSchema.index({ realmId: 1, dossierSortieId: 1 });

export default mongoose.model<CollectionTypes.ComparaisonEdl>(
  'ComparaisonEdl',
  ComparaisonEdlSchema
);
