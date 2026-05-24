import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';
import { updateItems } from './utils';

export default class Proprietaire {
  constructor() {
    this.selected = {};
    this.items = [];

    makeObservable(this, {
      selected: observable,
      items: observable,
      setSelected: action,
      fetch: flow,
      fetchOne: flow,
      patrimoine: flow,
      create: flow,
      update: flow,
      delete: flow,
      anonymiser: flow
    });
  }

  setSelected = (proprietaire) => (this.selected = proprietaire);

  *fetch() {
    try {
      const response = yield apiFetcher().get('/proprietaires');
      this.items = response.data;
      if (this.selected?._id) {
        this.setSelected(
          this.items.find((item) => item._id === this.selected._id) || {}
        );
      }
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *fetchOne(proprietaireId) {
    try {
      const response = yield apiFetcher().get(
        `/proprietaires/${proprietaireId}`
      );
      const updated = response.data;
      this.items = updateItems(updated, this.items);
      if (this.selected?._id === updated._id) {
        this.selected = updated;
      }
      return { status: 200, data: updated };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  // Consolidated holdings (sites/immeubles/lots + stats) for one owner.
  *patrimoine(proprietaireId) {
    try {
      const response = yield apiFetcher().get(
        `/proprietaires/${proprietaireId}/patrimoine`
      );
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *create(proprietaire) {
    try {
      const response = yield apiFetcher().post('/proprietaires', proprietaire);
      const created = response.data;
      this.items = updateItems(created, this.items);
      return { status: 200, data: created };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *update(proprietaire) {
    try {
      const response = yield apiFetcher().patch(
        `/proprietaires/${proprietaire._id}`,
        proprietaire
      );
      const updated = response.data;
      this.items = updateItems(updated, this.items);
      if (this.selected?._id === updated._id) {
        this.setSelected(updated);
      }
      return { status: 200, data: updated };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *delete(ids) {
    try {
      yield apiFetcher().delete(`/proprietaires/${ids.join(',')}`);
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  // GDPR right to erasure (DAT Sprint 8).
  *anonymiser(proprietaireId) {
    try {
      const response = yield apiFetcher().post(
        `/rgpd/proprietaires/${proprietaireId}/anonymisation`
      );
      const updated = response.data;
      this.items = updateItems(updated, this.items);
      return { status: 200, data: updated };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
