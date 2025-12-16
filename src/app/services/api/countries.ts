
import { createApiRequest } from "./api-resquest";
import { type WrappedFetchResponse } from "./utils";

export interface Country  {
  id: number;
  cca2: string,
  name: string;
  capital: string;
  region: string;
  population: number;
  flag: string;
}

export async function getAllCountries(): Promise<WrappedFetchResponse<Country[]> | string> {
  return createApiRequest<Country[]>()
    .getFrom('https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags,cca2')
    .useLog('Fetching countries')
    .useTransform(countries => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return countries.map((c: any, i) => {
        return {
          id : i + 1,
          cca2: c.cca2 || '',
          name: c.name.common || '',
          capital: c.capital[0] || '',
          region: c.region,
          flag: c.flags.png || '',
          population: c.population,
        } as Country;
      });
    })
    .invoke();
}

export async function searchCountryByName(term: string): Promise<WrappedFetchResponse<[]> | string> {
  return createApiRequest<[]>()
    .getFrom(`https://restcountries.com/v3.1/name/${term}`)
    .invoke();
};