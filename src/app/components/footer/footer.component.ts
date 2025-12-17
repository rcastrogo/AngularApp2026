import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LucideAngularModule } from 'lucide-angular';

import { APP_VERSION } from '~/config/constans';
import { TranslationService } from '~/services/translation.service';

@Component({
  selector: 'app-footer',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './footer.component.html',
})
export class Footer {

  readonly version = APP_VERSION;
  readonly i18n = inject(TranslationService);

}
