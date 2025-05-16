// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { UserRole } from './core/constants/roles';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UserProfileComponent } from './pages/users/user-profile/user-profile.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then(
        (m) => m.HomeComponent
      ),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'direct-collab',
    redirectTo: '/collaborateur',
    pathMatch: 'full',
  },
  {
    path: 'test-admin',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'support',
    loadComponent: () =>
      import('./pages/support/support.component').then(
        (m) => m.SupportComponent
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about-us/about-us.component').then(
        (m) => m.AboutComponent
      ),
  },
  {
    path: 'policy',
    loadComponent: () =>
      import('./pages/policy/policy.component').then((m) => m.PolicyComponent),
  },
  // Direct route to user profile bypassing normal auth guards
  {
    path: 'user-profile',
    component: UserProfileComponent
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => {
      console.log('[Router] 📦 ADMIN_ROUTES loaded successfully');
      return m.ADMIN_ROUTES;
    }),
    canActivate: [(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
      console.log('[Router] ⭐ Admin guard check');
      
      // Get authService in the proper injection context
      const authService = inject(AuthService);
      
      // Try to restore user data if needed
      if (typeof authService.restoreUserFromStorage === 'function') {
        try {
          authService.restoreUserFromStorage();
          console.log('[Router] 🔄 Restored user data for admin route');
        } catch (e) {
          console.error('[Router] ❌ Error restoring user data:', e);
        }
      }
      
      // Use the standard guard
      return authGuard([UserRole.ADMIN])(route, state);
    }],
  },
  {
    path: 'chef-projet',
    loadChildren: () =>
      import('./pages/chef-projet/chef-projet.routes').then(
        (m) => m.CHEF_PROJET_ROUTES
      ),
    canActivate: [(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
      console.log('[Router] ⭐ Chef projet guard check');
      
      // Use direct access to authGuard without inject()
      return authGuard([UserRole.CHEF_PROJET])(route, state);
    }],
  },
  {
    path: 'client',
    redirectTo: '/user',
    pathMatch: 'full'
  },
  {
    path: 'collaborateur',
    loadChildren: () =>
      import('./pages/collaborateur/collaborateur.routes').then((m) => {
        console.log('[Router] 📦 COLLABORATEUR_ROUTES loaded successfully');
        return m.COLLABORATEUR_ROUTES;
      }),
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        console.log('[Router] ⭐ Direct collaborateur guard check');
        
        // Get authService in the proper injection context
        const authService = inject(AuthService);
        
        // Use the specialized collaborateur access method if available
        if (typeof authService.ensureCollaborateurAccess === 'function') {
          try {
            const collaborateurAccess = authService.ensureCollaborateurAccess();
            if (collaborateurAccess) {
              console.log('[Router] ✅ Collaborateur access granted via ensureCollaborateurAccess');
              return true;
            }
          } catch (e) {
            console.error('[Router] ❌ Error in ensureCollaborateurAccess:', e);
          }
        }
        
        // Try to restore user data if needed
        if (typeof authService.restoreUserFromStorage === 'function') {
          try {
            authService.restoreUserFromStorage();
            console.log('[Router] 🔄 Restored user data for collaborateur route');
          } catch (e) {
            console.error('[Router] ❌ Error restoring user data:', e);
          }
        }
        
        // Use the standard guard
        return authGuard([UserRole.COLLABORATEUR])(route, state);
      },
    ],
  },
  {
    path: 'user',
    loadChildren: () =>
      import('./pages/users/users.routes').then((m) => {
        console.log('[Router] 📦 USER_ROUTES loaded successfully');
        return m.usersRoutes;
      }),
    canActivate: [
      (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
        console.log('[Router] ⭐ User guard check');
        // Use a more direct approach for user/client routes
        const authService = inject(AuthService);
        
        // Try to restore user from storage if needed
        if (typeof authService.restoreUserFromStorage === 'function') {
          try {
            authService.restoreUserFromStorage();
          } catch (e) {
            console.error('[Router] Error restoring user data:', e);
          }
        }
        
        // Use the standard guard as a fallback
        return authGuard([UserRole.USER, UserRole.CLIENT])(route, state);
      },
    ],
  },
  { path: '**', redirectTo: '/home' },
];
