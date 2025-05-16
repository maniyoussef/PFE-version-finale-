import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

/**
 * This module is only used for backwards compatibility with the Angular router.
 * The main routing configuration is in app.routes.ts, and the application is bootstrapped
 * using standalone components and provideRouter in app.config.ts.
 */
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
      enableTracing: true, // Enable router debug tracing
      paramsInheritanceStrategy: 'always',
      urlUpdateStrategy: 'eager',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
