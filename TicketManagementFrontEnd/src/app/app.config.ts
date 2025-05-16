import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import {
  provideRouter,
  withDebugTracing,
  withRouterConfig,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules
} from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor.fn';
import { provideClientHydration } from '@angular/platform-browser';

// Import compiler for JIT compilation
import '@angular/compiler';
// Import platform-browser-dynamic for JIT compilation
import { bootstrapApplication } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Material Modules
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withDebugTracing(),
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always',
        urlUpdateStrategy: 'eager',
      })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([
      authInterceptor, 
      errorInterceptor
    ])),
    provideClientHydration(),
    importProvidersFrom(
      // Material Modules
      MatSnackBarModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatGridListModule,
      MatFormFieldModule,
      MatInputModule,
      MatProgressSpinnerModule,
      MatDialogModule,
      MatTableModule,
      MatChipsModule,
      MatTooltipModule
    ),
    AuthService,
  ],
};
