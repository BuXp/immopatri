import { action, flow, makeObservable, observable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

export default class Alerte {
  constructor() {
    this.items = [];

    makeObservable(this, {
      items: observable,
      setItems: action,
      fetch: flow,
      scan: flow,
      acknowledge: flow
    });
  }

  setItems = (items) => (this.items = items);

  *fetch(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      const qs = params.toString();
      const response = yield apiFetcher().get(
        `/alertes${qs ? `?${qs}` : ''}`
      );
      this.items = response.data;
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *scan() {
    try {
      const response = yield apiFetcher().post('/alertes/scan');
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }

  *acknowledge(id) {
    try {
      const response = yield apiFetcher().patch(`/alertes/${id}/acquittement`);
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
