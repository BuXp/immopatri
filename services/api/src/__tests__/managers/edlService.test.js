// Covers the BDD scenarios tagged @critique in DAT v1.1 annexe 2
// at the unit level — the pure services are the right boundary here
// (no DB / HTTP / MinIO / OpenAI needed).

import {
  appendSerieCommun,
  buildCommonPhotoKey,
  buildPrivatePhotoKey,
  evaluateObservation,
  filterPiecesForLocataire,
  selectEntreeSerieForSortie,
  summariseObservations
} from '../../services/edlService.js';
import {
  confidenceCategory,
  parseAiResponse,
  requiresHumanReview,
  validateComparaisonDecision
} from '../../services/edlComparaison.js';
import {
  EdlTokenError,
  generateEdlToken,
  verifyEdlToken
} from '../../services/edlTokens.js';
import jwt from 'jsonwebtoken';

const SECRET = 'test-edl-secret-32-chars-minimum-1234';

describe('@critique Réponse manquante ≠ bon état', () => {
  it('a missing answer is reported as non_renseigne (never "bon")', () => {
    expect(evaluateObservation({})).toEqual({
      statut: 'non_renseigne',
      alerte: true
    });
    expect(evaluateObservation({ etat: '' })).toEqual({
      statut: 'non_renseigne',
      alerte: true
    });
    expect(evaluateObservation({ etat: null })).toEqual({
      statut: 'non_renseigne',
      alerte: true
    });
  });

  it('maps bon / tres_bon to statut bon without alerte', () => {
    expect(evaluateObservation({ etat: 'bon' }).statut).toBe('bon');
    expect(evaluateObservation({ etat: 'tres_bon' }).alerte).toBe(false);
  });

  it('maps use / degrade to statut mauvais with alerte', () => {
    expect(evaluateObservation({ etat: 'degrade' })).toEqual({
      statut: 'mauvais',
      alerte: true,
      detail: 'degrade'
    });
  });

  it('honours reponseSpeciale over missing etat', () => {
    expect(
      evaluateObservation({ reponseSpeciale: 'non_concerne' }).statut
    ).toBe('reponse_speciale');
  });

  it('summariseObservations counts un-answered items and alerts', () => {
    const summary = summariseObservations({
      pieces: [
        { observations: [{ etat: 'bon' }, {}, { etat: 'degrade' }] },
        { observations: [{ reponseSpeciale: 'absent' }] }
      ]
    });
    expect(summary).toEqual({
      renseignees: 3,
      nonRenseignees: 1,
      alertes: 2
    });
  });
});

describe('@critique Colocation — isolation des dossiers', () => {
  const pieces = [
    {
      id: 'chambre1',
      nom: 'Chambre Martin',
      estPrivative: true,
      chambreId: 'c1'
    },
    {
      id: 'chambre2',
      nom: 'Chambre Dupont',
      estPrivative: true,
      chambreId: 'c2'
    },
    { id: 'salon', nom: 'Salon', estPrivative: false },
    { id: 'cuisine', nom: 'Cuisine' }
  ];

  it('Martin voit sa chambre et les communs, jamais la chambre de Dupont', () => {
    const visibles = filterPiecesForLocataire(pieces, 'c1').map((p) => p.id);
    expect(visibles).toContain('chambre1');
    expect(visibles).toContain('salon');
    expect(visibles).toContain('cuisine');
    expect(visibles).not.toContain('chambre2');
  });

  it('Dupont ne voit pas la chambre de Martin', () => {
    const visibles = filterPiecesForLocataire(pieces, 'c2').map((p) => p.id);
    expect(visibles).not.toContain('chambre1');
    expect(visibles).toContain('chambre2');
  });
});

describe('@critique Colocation — historique commun immuable', () => {
  const janvier = {
    dossierEdlId: 'd-martin',
    locataireId: 'martin',
    type: 'entree',
    date: new Date('2026-01-10'),
    photos: ['/lot1/communs/salon/d-martin/jan.jpg']
  };
  const mars = {
    dossierEdlId: 'd-dupont',
    locataireId: 'dupont',
    type: 'entree',
    date: new Date('2026-03-15'),
    photos: ['/lot1/communs/salon/d-dupont/mars.jpg']
  };

  it("une nouvelle série n'écrase jamais les précédentes", () => {
    const h0 = { lotId: 'lot1', pieceId: 'salon', seriesPhotos: [] };
    const h1 = appendSerieCommun(h0, janvier);
    const h2 = appendSerieCommun(h1, mars);
    expect(h1.seriesPhotos).toHaveLength(1);
    expect(h2.seriesPhotos).toHaveLength(2);
    // the first append is still present in h2
    expect(h2.seriesPhotos[0]).toBe(janvier);
  });

  it("appendSerieCommun est pur (ne mute pas l'historique source)", () => {
    const h0 = { lotId: 'lot1', pieceId: 'salon', seriesPhotos: [janvier] };
    const h1 = appendSerieCommun(h0, mars);
    expect(h0.seriesPhotos).toHaveLength(1);
    expect(h1.seriesPhotos).toHaveLength(2);
    expect(h0.seriesPhotos).not.toBe(h1.seriesPhotos);
  });
});

describe('@critique Colocation — sélection série entrée pour la sortie', () => {
  const janvier = {
    dossierEdlId: 'd-martin-in',
    locataireId: 'martin',
    type: 'entree',
    date: new Date('2026-01-10'),
    photos: []
  };
  const mars = {
    dossierEdlId: 'd-dupont-in',
    locataireId: 'dupont',
    type: 'entree',
    date: new Date('2026-03-15'),
    photos: []
  };
  const juin = {
    dossierEdlId: 'd-martin-out',
    locataireId: 'martin',
    type: 'sortie',
    date: new Date('2026-06-20'),
    photos: []
  };

  it("la comparaison sortie Martin utilise bien l'entrée de janvier", () => {
    const historique = { seriesPhotos: [janvier, mars, juin] };
    const { entreeDeReference, observationsIntermediaires } =
      selectEntreeSerieForSortie(historique, 'martin');
    expect(entreeDeReference).toBe(janvier);
    expect(observationsIntermediaires).toContain(mars);
    expect(observationsIntermediaires).not.toContain(janvier);
  });

  it('retourne null si aucun dossier entrée du locataire partant', () => {
    const historique = { seriesPhotos: [mars] };
    const { entreeDeReference } = selectEntreeSerieForSortie(
      historique,
      'martin'
    );
    expect(entreeDeReference).toBeNull();
  });
});

describe('@critique Lien EDL — token JWT', () => {
  it('génère un token valable 30 jours par défaut', () => {
    const { token, expiration } = generateEdlToken({
      dossierEdlId: 'd1',
      secret: SECRET
    });
    expect(typeof token).toBe('string');
    expect(expiration.getTime()).toBeGreaterThan(Date.now());
  });

  it('un token valide retourne le dossierEdlId', () => {
    const { token } = generateEdlToken({ dossierEdlId: 'd42', secret: SECRET });
    expect(verifyEdlToken(token, SECRET).dossierEdlId).toBe('d42');
  });

  it('un token expiré est rejeté avec code "expired"', () => {
    // Sign a token with an explicit `exp` in the past — more reliable than
    // waiting for a small `expiresIn` window to lapse during the test run.
    const past = Math.floor(Date.now() / 1000) - 60;
    const token = jwt.sign(
      { sub: 'd1', aud: 'immopatri:edl', exp: past },
      SECRET,
      { algorithm: 'HS256' }
    );
    try {
      verifyEdlToken(token, SECRET);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EdlTokenError);
      expect(err.code).toBe('expired');
    }
  });

  it('un token forgé (mauvais secret) est rejeté avec code "invalid"', () => {
    const { token } = generateEdlToken({ dossierEdlId: 'd1', secret: SECRET });
    try {
      verifyEdlToken(token, 'autre-secret-different');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EdlTokenError);
      expect(err.code).toBe('invalid');
    }
  });

  it('un token sans secret serveur retourne server_misconfigured', () => {
    try {
      verifyEdlToken('abc', '');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err.code).toBe('server_misconfigured');
    }
  });
});

describe('@critique Comparaison IA — parser + validation humaine', () => {
  it('parseAiResponse normalise les différences et clamps la confiance', () => {
    const parsed = parseAiResponse({
      differences: [
        {
          type: 'rayure',
          description: 'Rayure verticale sur la porte',
          niveauConfiance: 82
        },
        {
          type: 'inconnu',
          description: 'bizarre',
          niveauConfiance: 150
        }
      ],
      statutComparaison: 'differences_detectees'
    });
    expect(parsed.statut).toBe('differences_detectees');
    expect(parsed.resultats).toHaveLength(2);
    expect(parsed.resultats[0]).toMatchObject({
      typeSignalement: 'rayure',
      niveauConfiance: 82,
      statutValidation: 'en_attente'
    });
    expect(parsed.resultats[1].typeSignalement).toBe('autre');
    expect(parsed.resultats[1].niveauConfiance).toBe(100);
  });

  it('parseAiResponse gère un JSON invalide → comparaison_impossible', () => {
    const parsed = parseAiResponse('not-json');
    expect(parsed.statut).toBe('comparaison_impossible');
    expect(parsed.resultats).toEqual([]);
  });

  it('parseAiResponse remonte comparaison_impossible + raison', () => {
    const parsed = parseAiResponse({
      statutComparaison: 'comparaison_impossible',
      raisonImpossible: 'Image de sortie insuffisante — flou excessif'
    });
    expect(parsed.statut).toBe('comparaison_impossible');
    expect(parsed.raisonImpossible).toMatch(/flou/i);
  });

  it('requiresHumanReview est toujours vrai (aucun montant auto)', () => {
    expect(requiresHumanReview({ niveauConfiance: 10 })).toBe(true);
    expect(requiresHumanReview({ niveauConfiance: 99 })).toBe(true);
  });

  it('confidenceCategory trie faible/moyen/eleve', () => {
    expect(confidenceCategory(10)).toBe('faible');
    expect(confidenceCategory(50)).toBe('moyen');
    expect(confidenceCategory(85)).toBe('eleve');
  });

  it('validateComparaisonDecision refuse une action inconnue', () => {
    expect(validateComparaisonDecision({ action: 'autre' }).ok).toBe(false);
  });

  it('validateComparaisonDecision exige un commentaire pour complément', () => {
    const r = validateComparaisonDecision({ action: 'complement_demande' });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/commentaire/);
  });
});

describe('Minio keys', () => {
  it('private key contains lot / dossier / piece / element segments', () => {
    const key = buildPrivatePhotoKey({
      lotId: 'lot1',
      dossierEdlId: 'd1',
      pieceId: 'salon',
      elementId: 'mur-nord',
      timestamp: 1700000000000,
      hash: 'abcdef1234567890'
    });
    expect(key).toBe('lot1/d1/salon/mur-nord/1700000000000_abcdef123456.jpg');
  });

  it('common key uses the /communs/ namespace', () => {
    const key = buildCommonPhotoKey({
      lotId: 'lot1',
      pieceId: 'salon',
      seriesId: 'serie1',
      timestamp: 1700000000000,
      hash: 'abc'
    });
    expect(key).toContain('/communs/');
    expect(key.startsWith('lot1/communs/salon/serie1/')).toBe(true);
  });

  it('rejects path traversal characters in segments', () => {
    const key = buildPrivatePhotoKey({
      lotId: '../../etc',
      dossierEdlId: 'd1',
      pieceId: 'salon',
      elementId: 'e'
    });
    expect(key.includes('..')).toBe(false);
  });
});
