import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';
import { updateItems } from './utils';

export default class Immeuble {
  constructor() {
    this.selected = {};
    this.items = [];

    makeObservable(this, {
      selected: observable,
      items: observable,
      setSelected: action,
      fetch: flow,
      fetchOne: flow,
      create: flow,
      update: flow,
      delete: flow,
      repartition: flow
    });
  }

  setSelected = (immeuble) => (this.selected = immeuble);

  // Optional siteId narrows the listing to a single site (API ?siteId=).
  *fetch(siteId) {
    try {
      const url = siteId ? `/immeubles?siteId=${siteId}` : '/immeubles';
      const response = yield apiFetcher().get(url);
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

  *fetchOne(immeubleId) {
    try {
      const response = yield apiFetcher().get(`/immeubles/${immeubleId}`);
      const updatedImmeuble = response.data;
      this.items = updateItems(updatedImmeuble, this.items);
      if (this.selected?._id === updatedImmeuble._id) {
        this.selected = updatedImmeuble;
      }
      return { status: 200, data: updatedImmeuble };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *create(immeuble) {
    try {
      const response = yield apiFetcher().post('/immeubles', immeuble);
      const createdImmeuble = response.data;
      this.items = updateItems(createdImmeuble, this.items);
      return { status: 200, data: createdImmeuble };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *update(immeuble) {
    try {
      const response = yield apiFetcher().patch(
        `/immeubles/${immeuble._id}`,
        immeuble
      );
      const updatedImmeuble = response.data;
      this.items = updateItems(updatedImmeuble, this.items);
      if (this.selected?._id === updatedImmeuble._id) {
        this.setSelected(updatedImmeuble);
      }
      return { status: 200, data: updatedImmeuble };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *delete(ids) {
    try {
      yield apiFetcher().delete(`/immeubles/${ids.join(',')}`);
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  // Distributes a charge call across the immeuble's lots by tantiemes (copro).
  *repartition(immeubleId, montant) {
    try {
      const response = yield apiFetcher().get(
        `/immeubles/${immeubleId}/repartition?montant=${montant}`
      );
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
