import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../constants/roles';

export const authGuard = (allowedRoles?: UserRole[]) => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const hasRequiredRole = authService.hasAnyRole(allowedRoles);
      if (!hasRequiredRole) {
        // Redirect to appropriate error page or dashboard
        router.navigate(['/unauthorized']);
        return false;
      }
    }

    return true;
  };
};
