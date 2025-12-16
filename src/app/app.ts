
import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  inject
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppNavbar } from '~/components/app-navbar/app-navbar.component';
import { Footer } from '~/components/footer/footer.component';
import { MSG_LANGUAGE_CHANGE } from '~/core/messages';
import { pubSub } from '~/core/pubsub';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const unsubscribe = pubSub.subscribe(MSG_LANGUAGE_CHANGE, () => {
      this.cdr.markForCheck();
    });
    this.destroyRef.onDestroy(unsubscribe);
  }
}
