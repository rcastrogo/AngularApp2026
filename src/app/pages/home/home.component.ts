import {
  Component,
  inject
} from '@angular/core';

import { CountryTableComponent } from "~/pages/components/country-table.component";
import { TranslationService } from '~/services/translation.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CountryTableComponent],
  template: `
    <div class="p-8 animate-page-entry">
      <h2 class="text-3xl font-bold mb-4">{{ i18n.t('home.title') }}</h2>
      <p>{{ i18n.t('home.subtitle') }}</p>

      <app-country-table></app-country-table>
      
    </div>
  `
})
export class HomeComponent {
  i18n = inject(TranslationService);
}
