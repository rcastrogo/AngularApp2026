import { Injectable } from '@angular/core';

import { createApiRequest } from "./api-resquest";
import { type WrappedFetchResponse } from "./utils";

export interface Country {
  id: number;
  cca2: string;
  name: string;
  capital: string;
  region: string;
  population: number;
  flag: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

const BASE_ENDPOINT = 'https://restcountries.com/v3.1/';

@Injectable({
  providedIn: 'root' 
})
export class CountriesService {

  async getAll(): Promise<WrappedFetchResponse<Country[]> | string> {
    return createApiRequest<Country[]>()
      .useBase(BASE_ENDPOINT)
      .useLog('Fetching all countries')
      .useTransform(countries => countries.map((c, i) => this.#mapCountry(c, i)))
      .getFrom('all?fields=name,capital,region,population,flags,cca2')
      .invoke();
  }

  async searchByName(term: string): Promise<WrappedFetchResponse<Country[]> | string> {
    return createApiRequest<Country[]>()
      .useBase(BASE_ENDPOINT)
      .useLog(`Searching country: ${term}`)
      .getFrom(`name/${term}`)
      .useTransform(countries => countries.map((c, i) => this.#mapCountry(c, i)))
      .invoke();
  }

 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #mapCountry(c: any, index: number): Country {
    return {
      id: index + 1,
      cca2: c.cca2 || '',
      name: c.name?.common || '',
      capital: c.capital?.[0] || '',
      region: c.region,
      flag: c.flags?.png || '',
      population: c.population,
      data: c,
    };
  }
}