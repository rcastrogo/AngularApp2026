import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<Theme>('light');
  theme$ = this.themeSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) this.themeSubject.next(saved);

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!saved) this.themeSubject.next(prefersDark ? 'dark' : 'light');

    this.applyTheme(this.themeSubject.value);
  }

  toggleTheme() {
    const newTheme = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.themeSubject.next(newTheme);
    localStorage.setItem('theme', newTheme);
    this.applyTheme(newTheme);
  }

  private applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
