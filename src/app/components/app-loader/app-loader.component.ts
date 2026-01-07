
import { Component, inject, Input } from '@angular/core';

import { LucideAngularModule } from 'lucide-angular'; 

import { TranslationService } from '~/services/translation.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="fixed top-0 left-0 right-0 bottom-0 z-9999 flex flex-col items-center gap-2 justify-center bg-background/80">
      {{text}}  
      <div class="h-1 w-40 overflow-hidden rounded-full bg-red-700">
        <div class="h-full w-full origin-left animate-[progress_2.5s_infinite_linear] bg-primary"></div>        
      </div>
    </div>
  `,
})
export class AppLoaderComponent {
  i18n = inject(TranslationService);

   @Input() text = 'Inicializando';

  constructor() {
    const saved = this.i18n.getLang();
    this.text = saved == 'es' ? 'Cargando' : 'Loading';
  }

}