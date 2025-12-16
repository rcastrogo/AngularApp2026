import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { LucideAngularModule } from 'lucide-angular'; 

import { TranslationService } from '~/services/translation.service';



@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItem, LucideAngularModule, UpperCasePipe],
  template: `
    <button
      [cdkMenuTriggerFor]="menu"
      class="flex items-center gap-2 tool-bar-button"
    >
      <lucide-angular name="globe" class="size-4 hidden md:block"></lucide-angular>      
      <span class="text-sm block md:hidden">{{i18n.getLang() | uppercase}}</span>
      <span class="text-sm hidden md:block">{{ i18n.t('language.' + i18n.getLang())}}</span>
      <lucide-angular name="chevron-down" class="size-4 opacity-50"></lucide-angular>
    </button>

    <ng-template #menu>
      <div
        cdkMenu
        class="button z-50 min-w-20 md:min-w-32 items-center overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-100"
      >
        @for (lang of ['es', 'en']; track lang) {
          <button
            cdkMenuItem
            (cdkMenuItemTriggered)="i18n.setLanguage(lang)"
            class="relative flex w-full cursor-default select-none items-center justify-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            [class.bg-accent]="i18n.getLang() === lang"
            [class.text-accent-foreground]="i18n.getLang() === lang"
          >            
            <span class="text-sm block md:hidden text-center">{{lang | uppercase}}</span>
            <span class="text-sm hidden md:block text-center">{{ i18n.t('language.' + lang) }}</span>
          </button>
        }
      </div>
    </ng-template>
  `,
})
export class LanguageSelectorComponent {
  i18n = inject(TranslationService);
}