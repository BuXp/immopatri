import { flow, makeObservable } from 'mobx';

import { apiFetcher } from '../utils/fetch';

export default class Rapprochement {
  constructor() {
    makeObservable(this, {
      analyse: flow
    });
  }

  *analyse({ csv, year, month }) {
    try {
      const response = yield apiFetcher().post('/rapprochement', {
        csv,
        year,
        month
      });
      return { status: 200, data: response.data };
    } catch (error) {
      return { status: error?.response?.status };
    }
  }
}
