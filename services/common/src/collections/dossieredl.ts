import { CollectionTypes } from '@immopatri/types';
import mongoose from 'mongoose';
import Realm from './realm.js';

const DossierEdlSchema = new mongoose.Schema<CollectionTypes.DossierEdl>({
  realmId: { type: String, ref: Realm },
  lotId: String,
  locataireId: String,
  chambreId: String,

  // entree | sortie — wrapped (subdoc-with-type is not an issue here since
  // this is a top-level field, but we keep the simple form).
  type: String,
  statut: String, // a_envoyer | en_cours | transmis | a_completer | finalise | signe

  lienToken: String,
  lienExpiration: Date,

  dateCreation: { type: Date, default: Date.now },
  dateDernierAcces: Date,
  dateTransmission: Date,
  dateSignature: Date,

  pieces: [
    {
      _id: false,
      pieceId: String,
      nom: String,
      photos: [
        {
          _id: false,
          elementId: String,
          elementNom: String,
          cheminMinio: String,
          dateReception: Date,
          resolution: {
            _id: false,
            largeur: Number,
            hauteur: Number
          },
          hashSHA256: String,
          estOriginal: { type: Boolean, default: true },
          importeExternalement: Boolean
        }
      ],
      observations: [
        {
          _id: false,
          elementId: String,
          etat: String, // tres_bon | bon | use | degrade | non_verifiable
          proprete: String, // propre | traces_legeres | sale | non_verifiable
          fonctionnement: String, // fonctionne | partiellement | ne_fonctionne_pas | non_teste
          reponseSpeciale: String, // absent | non_concerne | inaccessible | non_teste | non_verifiable
          signalement: Boolean,
          commentaire: String,
          photos: [String]
        }
      ]
    }
  ],

  compteurs: [
    {
      _id: false,
      id: String,
      // Subdoc-with-type workaround.
      type: { type: String },
      index: Number,
      unite: String,
      photo: String
    }
  ],
  cles: [
    {
      _id: false,
      // Subdoc-with-type workaround.
      type: { type: String },
      quantite: Number
    }
  ],
  inventaire: [
    {
      _id: false,
      article: String,
      quantite: Number
    }
  ],
  detectionFumee: {
    _id: false,
    presente: Boolean,
    testEffectue: Boolean,
    resultat: String
  },
  versions: [
    {
      _id: false,
      numero: Number,
      date: Date,
      auteur: String,
      action: String
    }
  ]
});
DossierEdlSchema.index({ realmId: 1, lotId: 1, locataireId: 1 });
DossierEdlSchema.index({ lienToken: 1 });

export default mongoose.model<CollectionTypes.DossierEdl>(
  'DossierEdl',
  DossierEdlSchema
);
