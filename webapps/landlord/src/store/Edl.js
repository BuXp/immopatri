import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

// MobX store for Module 16 — États des lieux (DAT v1.1).
// Carries only the lists the owner UI needs; the tenant-journey PWA talks
// to /api/v2/edl/parcours/:token directly (no store).
export default class Edl {
  constructor() {
    this.dossiers = [];
    this.comparaisons = [];

    makeObservable(this, {
      dossiers: observable,
      comparaisons: observable,
      setDossiers: action,
      setComparaisons: action,
      fetchDossiers: flow,
      fetchConfiguration: flow,
      upsertConfiguration: flow,
      appliquerModele: flow,
      creerDossier: flow,
      creerComparaison: flow,
      fetchComparaison: flow,
      validerItem: flow,
      signerDossier: flow
    });
  }

  setDossiers = (items) => (this.dossiers = items);
  setComparaisons = (items) => (this.comparaisons = items);

  *fetchDossiers(filters = {}) {
    try {
      const qs = new URLSearchParams(filters).toString();
      const response = yield apiFetcher().get(
        `/edl/dossiers${qs ? `?${qs}` : ''}`
      );
      this.dossiers = response.data;
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchConfiguration(lotId) {
    try {
      const response = yield apiFetcher().get(`/edl/configurations/${lotId}`);
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *upsertConfiguration(payload) {
    try {
      const response = yield apiFetcher().put('/edl/configurations', payload);
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *appliquerModele(payload) {
    try {
      const response = yield apiFetcher().post(
        '/edl/configurations/modele',
        payload
      );
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *creerDossier(payload) {
    try {
      const response = yield apiFetcher().post('/edl/dossiers', payload);
      return { status: 201, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *signerDossier(dossierId) {
    try {
      const response = yield apiFetcher().post(
        `/edl/dossiers/${dossierId}/signer`
      );
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *creerComparaison(payload) {
    try {
      const response = yield apiFetcher().post('/edl/comparaisons', payload);
      return { status: 201, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchComparaison(id) {
    try {
      const response = yield apiFetcher().get(`/edl/comparaisons/${id}`);
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *validerItem(comparaisonId, index, decision) {
    try {
      const response = yield apiFetcher().patch(
        `/edl/comparaisons/${comparaisonId}/items/${index}`,
        decision
      );
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
