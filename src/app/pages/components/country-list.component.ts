import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';

import { MSG_LOADING_BEGINS, MSG_LOADING_END } from '~/core/messages';
import { pubSub } from '~/core/pubsub';
import { Country, CountriesService} from '~/services/api/countries.service';

@Component({
  selector: 'app-country-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <input 
        #searchBox
        (input)="fetchCountries(searchBox.value)" 
        placeholder="Escribe el nombre de un país..." 
        class="border p-2 mb-4 w-full" 
      />

      @if (isLoading()) {
        <p>Cargando países...</p>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (country of countries(); track country.id) {
            <div class="p-4 border rounded shadow-sm flex items-center gap-3">
              <img [src]="country.flag" class="w-12 h-8 object-cover border" alt="bandera">
              <span class="font-medium">{{ country.name }}</span>
            </div>
          } @empty {
            <p>No se encontraron países.</p>
          }
        </div>
      }
    </div>
  `
})

export class CountryListComponent implements OnInit {

  private countriesService = inject(CountriesService);

  countries = signal<Country[]>([]);
  isLoading = signal(false);

  async ngOnInit() {
    await this.fetchCountries();
  }

  async fetchCountries(term = '') {

    this.isLoading.set(true);
    pubSub.publish(MSG_LOADING_BEGINS);
    
    const response = term.length > 2 
      ? await this.countriesService.searchByName(term) 
      : await this.countriesService.getAll();
 
    this.isLoading.set(false);
    pubSub.publish(MSG_LOADING_END);

    if (typeof response !== 'string') {
      this.countries.set(response.data || []);
    }

  }
}