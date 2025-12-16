import {
  Component,
  inject
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { LucideAngularModule } from 'lucide-angular';

import { LanguageSelectorComponent } from '~/components/language-selector/language-selector.component';
import { ThemeToggleComponent } from '~/components/theme-toggle/theme-toggle.component';
import { TranslationService } from '~/services/translation.service';


@Component({
  selector: 'app-app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    ThemeToggleComponent,
    LanguageSelectorComponent,
    LucideAngularModule
  ],
  templateUrl: './app-navbar.component.html',
})
export class AppNavbar {
  i18n = inject(TranslationService);
}
