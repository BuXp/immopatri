import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';
import { updateItems } from './utils';

export default class Site {
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
      delete: flow
    });
  }

  setSelected = (site) => (this.selected = site);

  *fetch() {
    try {
      const response = yield apiFetcher().get('/sites');
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

  *fetchOne(siteId) {
    try {
      const response = yield apiFetcher().get(`/sites/${siteId}`);
      const updatedSite = response.data;
      this.items = updateItems(updatedSite, this.items);
      if (this.selected?._id === updatedSite._id) {
        this.selected = updatedSite;
      }
      return { status: 200, data: updatedSite };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *create(site) {
    try {
      const response = yield apiFetcher().post('/sites', site);
      const createdSite = response.data;
      this.items = updateItems(createdSite, this.items);
      return { status: 200, data: createdSite };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *update(site) {
    try {
      const response = yield apiFetcher().patch(`/sites/${site._id}`, site);
      const updatedSite = response.data;
      this.items = updateItems(updatedSite, this.items);
      if (this.selected?._id === updatedSite._id) {
        this.setSelected(updatedSite);
      }
      return { status: 200, data: updatedSite };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *delete(ids) {
    try {
      yield apiFetcher().delete(`/sites/${ids.join(',')}`);
      return { status: 200 };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
