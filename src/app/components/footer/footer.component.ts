import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LucideAngularModule } from 'lucide-angular';

import { TranslationService } from '~/services/translation.service';

@Component({
  selector: 'app-footer',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './footer.component.html',
})
export class Footer {
  i18n = inject(TranslationService);
}
