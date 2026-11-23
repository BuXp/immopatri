import { LeaseTimeRange, Locale, PaymentMethod, UserRole } from './index.js';

export type MongooseDocument<T> = {
  __v: number;
  save: () => Promise<T>;
  toObject: () => T;
} & T;

/* eslint-disable @typescript-eslint/no-namespace */
export namespace CollectionTypes {
  export type PartAddress = {
    street1: string;
    street2?: string;
    zipCode: string;
    city: string;
    state?: string;
    country: string;
  };

  // ── ImmoPatri shared sub-documents (DAT Partie 3.5) ──
  export type PartAssurance = {
    assureur?: string;
    numero?: string;
    expiration?: Date;
  };

  export type PartProprietaireLink = {
    proprietaireId: string;
    pourcentage: number;
  };

  export type PartDPE = {
    note?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
    dateRealisation?: Date;
    dateExpiration?: Date;
    fichier?: string;
    loiClimatAlerte?: boolean;
  };

  export type PartDiagnostic = {
    type: string;
    dateRealisation?: Date;
    dateExpiration?: Date;
    resultat?: string;
    fichier?: string;
    alerte?: boolean;
  };

  export type Account = {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    createdDate?: Date;
  };

  export type Realm = {
    _id: string;
    name: string;
    members: {
      name: string;
      email: string;
      role: UserRole;
      registered: boolean;
    }[];
    applications: {
      name: string;
      role: UserRole;
      clientId: string;
      clientSecret: string;
      createdDate: Date;
      expiryDate: Date;
    }[];
    addresses: CollectionTypes.PartAddress[];
    bankInfo: {
      name: string;
      iban: string;
    };
    contacts: {
      name: string;
      email: string;
      phone1: string;
      phone2: string;
    }[];
    isCompany: boolean;
    companyInfo: {
      name: string;
      legalStructure: string;
      legalRepresentative: string;
      capital: number;
      ein: string;
      dos: string;
      vatnumber: string;
    };
    thirdParties: {
      gmail: {
        selected: boolean;
        email: string;
        appPassword: string;
        fromEmail: string;
        replyToEmail: string;
      };
      mailgun: {
        selected: boolean;
        apiKey: string;
        domain: string;
        fromEmail: string;
        replyToEmail: string;
      };
      b2: {
        keyId: string;
        applicationKey: string;
        endpoint: string;
        bucket: string;
      };
    };
    locale: Locale;
    currency: string;
  };

  export type Document = {
    _id: string;
    realmId: string;
    tenantId: string;
    leaseId: string;
    templateId: string;
    type: 'text' | 'file';
    name: string;
    description: string;
    mimeType?: string;
    expiryDate?: Date;
    contents?: Record<string, never>;
    html?: string;
    url?: string;
    versionId?: string;
    createdDate: Date;
    updatedDate: Date;
  };

  export type Email = {
    _id: string;
    templateName: string;
    recordId: string;
    params: Record<string, never>;
    sentTo: string;
    sentDate: Date;
    status: string;
    emailId: string;
  };

  export type Lease = {
    _id: string;
    realmId: string;
    name: string;
    description: string;
    numberOfTerms: number;
    timeRange: LeaseTimeRange;
    active: boolean;
    stepperMode: boolean;
  };

  export type Property = {
    _id: string;
    realmId: string;
    type: string;
    name: string;
    description: string;
    surface: number;
    phone: string;
    digicode: string;
    address: CollectionTypes.PartAddress;
    price: number;

    // TODO to remove, replaced by address
    building: string;
    level: string;
    location: string;

    // ── ImmoPatri lot extensions (DAT Partie 2.5 / 3.5) ──
    immeubleId?: string;
    numero?: string;
    tantiemes?: number;
    etage?: number;
    nombrePieces?: number;
    meuble?: boolean;
    loyerHC?: number;
    charges?: number;
    loyerTotal?: number;
    depotGarantie?: number;
    statut?: 'loue' | 'vacant' | 'travaux' | 'preavis' | 'reserve';
    assurancePNO?: CollectionTypes.PartAssurance;
    dpe?: CollectionTypes.PartDPE;
    diagnostics?: CollectionTypes.PartDiagnostic[];
    photos?: string[];
    documents?: string[];
    proprietaires?: CollectionTypes.PartProprietaireLink[];
  };

  // ── ImmoPatri new collections (DAT Partie 3.5) ──
  export type Site = {
    _id: string;
    realmId: string;
    nom: string;
    adresse?: string;
    ville?: string;
    codePostal?: string;
    region?: string;
    pays?: string;
    banquePrincipale?: string;
    assurance?: CollectionTypes.PartAssurance;
    taxeFonciere?: number;
    notes?: string;
    proprietaires?: CollectionTypes.PartProprietaireLink[];
    documents?: string[];
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type Immeuble = {
    _id: string;
    realmId: string;
    siteId: string;
    nom: string;
    adresse?: string;
    refCadastrale?: string;
    type?: string;
    modeDetention?: {
      type?:
        | 'monopropriete'
        | 'copropriete'
        | 'indivision'
        | 'sci'
        | 'sas'
        | 'sarl'
        | 'autre';
      syndic?: string;
      contactSyndic?: string;
      emailSyndic?: string;
      numLotCopro?: string;
      tantiemes?: number;
      chargesCoproAnnuelles?: number;
      reglementCopro?: string;
      chargesCommunes?: number;
      repartitionParLot?: boolean;
    };
    appelsCharges?: {
      periode?: string;
      montant?: number;
      dateEnvoi?: Date;
      datePaiement?: Date;
      statut?: string;
      document?: string;
    }[];
    proprietaires?: CollectionTypes.PartProprietaireLink[];
    assuranceImmeuble?: CollectionTypes.PartAssurance;
    banque?: string;
    iban?: string;
    taxeFonciere?: number;
    travaux?: {
      description?: string;
      budget?: number;
      datePrevu?: Date;
      statut?: string;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type Proprietaire = {
    _id: string;
    realmId: string;
    nom?: string;
    prenom?: string;
    raisonSociale?: string;
    type?: 'physique' | 'sci' | 'sarl' | 'sas' | 'indivision';
    siren?: string;
    adresse?: string;
    email?: string;
    telephone?: string;
    banques?: { banque?: string; iban?: string }[];
    assurances?: {
      type?: string;
      assureur?: string;
      numero?: string;
      expiration?: Date;
    }[];
    documents?: string[];
    valeurEstimePatrimoine?: number;
    anonymise?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type Alerte = {
    _id: string;
    realmId: string;
    lotId?: string;
    immeubleId?: string;
    siteId?: string;
    type: string;
    niveau: 'orange' | 'rouge';
    message: string;
    dateExpiration?: Date;
    dateAlerte?: Date;
    envoyeEmail?: boolean;
    acquittee?: boolean;
  };

  export type Template = {
    _id: string;
    realmId: string;
    name: string;
    type: string;
    description: string;
    hasExpiryDate: boolean;
    contents: Record<string, never>;
    html: string;
    linkedResourceIds: string[];
    required: boolean;
    requiredOnceContractTerminated: boolean;
  };

  export type PartRent = {
    term: number;
    total: {
      preTaxAmount: number;
      charges: number;
      vat: number;
      discount: number;
      debts: number;
      balance: number;
      grandTotal: number;
      payment: number;
    };
    preTaxAmounts:
      | {
          amount: number;
          description: string;
        }[]
      | [];
    charges:
      | {
          amount: number;
          description: string;
        }[]
      | [];
    debts:
      | {
          amount: number;
          description: string;
        }[]
      | [];
    discounts:
      | {
          origin: 'contract' | 'settlement';
          amount: number;
          description: string;
        }[]
      | [];
    vats:
      | {
          origin: 'contract' | 'settlement';
          amount: number;
          description: string;
          rate: number;
        }[]
      | [];
    payments:
      | {
          date: string;
          type: PaymentMethod;
          reference: string;
          amount: number;
        }[]
      | [];
    description: string;
  };

  export type Tenant = {
    _id: string;
    realmId: string | Realm;
    name: string;
    isCompany: boolean;
    company: string;
    manager: string;
    legalForm: string;
    siret: string;
    rcs: string;
    capital: number;
    street1: string;
    street2: string;
    zipCode: string;
    city: string;
    country: string;
    contacts: {
      contact: string;
      phone: string;
      email: string;
    }[];
    reference: string;
    contract: string;
    leaseId: string | Lease;
    beginDate: Date;
    endDate: Date;
    terminationDate: Date;
    properties:
      | {
          propertyId: string;
          property: CollectionTypes.Property;
          rent: number;
          expenses: [
            { title: string; amount: number; beginDate: Date; endDate: Date }
          ];
          entryDate: Date;
          exitDate: Date;
        }[]
      | [];
    rents: PartRent[] | [];
    isVat: boolean;
    vatRatio: number;
    discount: number;
    guaranty: number;
    guarantyPayback: number;

    stepperMode: boolean;
  };

  // ── Module 16 — États des lieux guidés par photos (DAT v1.1) ──
  export type EdlPieceConfig = {
    id: string;
    nom: string;
    nomPersonnalise?: string;
    type: string;
    estPrivative?: boolean;
    chambreId?: string;
    equipements?: {
      id: string;
      nom: string;
      type?: string;
      quantite?: number;
      notes?: string;
    }[];
  };

  export type ConfigurationLogement = {
    _id: string;
    realmId: string;
    lotId: string;
    typeLocation: 'entier' | 'colocation';
    modeleDepartId?: string;
    pieces: EdlPieceConfig[];
    annexes?: { id: string; type: string; nom?: string }[];
    createdAt?: Date;
    updatedAt?: Date;
  };

  export type EdlObservation = {
    elementId: string;
    etat?: 'tres_bon' | 'bon' | 'use' | 'degrade' | 'non_verifiable' | null;
    proprete?: 'propre' | 'traces_legeres' | 'sale' | 'non_verifiable' | null;
    fonctionnement?:
      | 'fonctionne'
      | 'partiellement'
      | 'ne_fonctionne_pas'
      | 'non_teste'
      | null;
    reponseSpeciale?:
      | 'absent'
      | 'non_concerne'
      | 'inaccessible'
      | 'non_teste'
      | 'non_verifiable';
    signalement?: boolean;
    commentaire?: string;
    photos?: string[];
  };

  export type EdlPhoto = {
    elementId: string;
    elementNom?: string;
    cheminMinio: string;
    dateReception: Date;
    resolution?: { largeur: number; hauteur: number };
    hashSHA256?: string;
    estOriginal: boolean;
    importeExternalement?: boolean;
  };

  export type DossierEdl = {
    _id: string;
    realmId: string;
    lotId: string;
    locataireId: string;
    chambreId?: string;
    type: 'entree' | 'sortie';
    statut:
      | 'a_envoyer'
      | 'en_cours'
      | 'transmis'
      | 'a_completer'
      | 'finalise'
      | 'signe';
    lienToken?: string;
    lienExpiration?: Date;
    dateCreation?: Date;
    dateDernierAcces?: Date;
    dateTransmission?: Date;
    dateSignature?: Date;
    pieces: {
      pieceId: string;
      nom: string;
      photos: EdlPhoto[];
      observations: EdlObservation[];
    }[];
    compteurs?: {
      id: string;
      type: string;
      index?: number;
      unite?: string;
      photo?: string;
    }[];
    cles?: { type: string; quantite: number }[];
    inventaire?: { article: string; quantite: number }[];
    detectionFumee?: {
      presente?: boolean;
      testEffectue?: boolean;
      resultat?: string;
    };
    versions?: {
      numero: number;
      date: Date;
      auteur?: string;
      action: string;
    }[];
  };

  export type ComparaisonSignalementType =
    | 'tache'
    | 'rayure'
    | 'trou'
    | 'casse'
    | 'salissure'
    | 'element_manquant'
    | 'changement_equipement'
    | 'autre';

  export type ComparaisonStatutValidation =
    | 'en_attente'
    | 'confirme'
    | 'ecarte'
    | 'complement_demande';

  export type ComparaisonEdl = {
    _id: string;
    realmId: string;
    dossierEntreeId: string;
    dossierSortieId: string;
    proprietaireId?: string;
    statut: 'en_attente' | 'en_cours' | 'termine';
    statutGlobal?: string;
    dateAnalyseIA?: Date;
    dateValidationHumaine?: Date;
    resultats: {
      pieceId: string;
      elementId: string;
      typeSignalement: ComparaisonSignalementType;
      descriptionFactuelle: string;
      niveauConfiance: number;
      statutValidation: ComparaisonStatutValidation;
      commentaireProprietaire?: string;
      photosEntree?: string[];
      photosSortie?: string[];
      zoneSignalee?: {
        x: number;
        y: number;
        largeur: number;
        hauteur: number;
      };
    }[];
  };

  export type HistoriqueCommun = {
    _id: string;
    realmId: string;
    lotId: string;
    pieceId: string;
    seriesPhotos: {
      dossierEdlId: string;
      locataireId: string;
      type: 'entree' | 'sortie';
      date: Date;
      photos: string[];
    }[];
  };
}
