
import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';

import { LucideAngularModule } from 'lucide-angular';
import { filter } from 'rxjs/operators';

import { AppLoaderComponent } from "~/components/app-loader/app-loader.component";
import { AppNavbar } from '~/components/app-navbar/app-navbar.component';
import { Footer } from '~/components/footer/footer.component';
import { MSG_LANGUAGE_CHANGE, MSG_LOADING_BEGINS, MSG_LOADING_END } from '~/core/messages';
import { pubSub } from '~/core/pubsub';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavbar, Footer, LucideAngularModule, AppLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  public isReady = signal(false);
  public isLoading = signal(false);

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const subs = [
      pubSub.subscribe(MSG_LOADING_BEGINS, () => this.isLoading.set(true)),
      pubSub.subscribe(MSG_LOADING_END, () => this.isLoading.set(false)),
      pubSub.subscribe(MSG_LANGUAGE_CHANGE, () => {
        this.cdr.markForCheck();
        this.isReady.set(true);
      })
    ];

    this.destroyRef.onDestroy(() => subs.forEach(unsub => unsub()));

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

  }

}
