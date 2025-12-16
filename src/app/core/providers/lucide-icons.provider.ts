
import { importProvidersFrom } from '@angular/core';

import {
  LucideAngularModule,
  Home,
  Info,
  Mail,
  Sun,
  Moon,
  Settings,
  LogOut,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Youtube,
  ChevronDown,
  Globe,
} from 'lucide-angular';

const icons = {
  Home,
  Info,
  Mail,
  Sun, 
  Moon,
  Settings,
  Globe,
  ChevronDown,
  LogOut,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Youtube,
};

export const lucideIconsProvider = importProvidersFrom(
  LucideAngularModule.pick(icons)
);
