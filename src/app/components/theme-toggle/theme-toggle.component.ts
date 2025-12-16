
import { Component, OnInit, inject } from '@angular/core';

import { LucideAngularModule } from 'lucide-angular';

import { Theme, ThemeService } from '~/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './theme-toggle.component.html'
})
export class ThemeToggleComponent implements OnInit {
  theme: Theme = 'light';

  private readonly themeService = inject(ThemeService);

  ngOnInit() {
    this.themeService.theme$.subscribe((t: Theme ) => this.theme = t);
  }

  toggle() {
    this.themeService.toggleTheme();
  }
}
