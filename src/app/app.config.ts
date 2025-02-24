import { ApplicationConfig, importProvidersFrom, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import localEs from '@angular/common/locales/es-MX';
import { registerLocaleData } from '@angular/common';
registerLocaleData(localEs, 'es');

import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { provideHttpClient } from '@angular/common/http';
import { enviroment } from '../environments/enviroment.qa';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withHashLocation()), 
    {provide: LOCALE_ID, useValue: 'es'},
    importProvidersFrom(enviroment.production ? [] : AkitaNgDevtools.forRoot()),
    provideHttpClient(),
    provideAnimationsAsync()]
};
