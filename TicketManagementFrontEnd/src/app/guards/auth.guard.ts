import { inject } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of, Observable, firstValueFrom } from 'rxjs';
import { UserRole } from '../core/constants/roles';

// Auth guard that checks if user is logged in
export const authGuard = (allowedRoles?: UserRole[]) => {
  // Return an async function that handles the auth check
  return async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    console.log('[AuthGuard] ⭐ Guard called for route:', {
      url: state.url,
      requiredRoles: allowedRoles,
      routePath: route.routeConfig?.path,
      timestamp,
    });

    // Get the auth service
    const authService = inject(AuthService);
    const router = inject(Router);

    // SPECIAL CASE: Admin routes need special handling
    if (state.url.includes('/admin')) {
      console.log(
        `[AuthGuard] 🔎 Handling admin route access (${timestamp})`
      );

      // Use the specialized admin access method if available
      if (typeof authService.ensureAdminAccess === 'function') {
        try {
          const adminAccess = authService.ensureAdminAccess();
          if (adminAccess) {
            console.log(`[AuthGuard] ✅ Admin access granted via ensureAdminAccess (${timestamp})`);
            return true;
          }
        } catch (e) {
          console.error('[AuthGuard] ❌ Error in ensureAdminAccess:', e);
        }
      }

      // Preload user data if possible
      if (typeof authService.restoreUserFromStorage === 'function') {
        try {
          authService.restoreUserFromStorage();
          console.log('[AuthGuard] 🔄 Restored user data for admin check');
        } catch (e) {
          console.error('[AuthGuard] ❌ Error restoring user data:', e);
        }
      }

      // Force user data sync and restoration
      try {
        // Try to get user from localStorage directly if the service doesn't have it
        const hasAdminRole = authService.hasRole('ADMIN');
        console.log('[AuthGuard] 👑 Admin role check result:', hasAdminRole);
        
        if (hasAdminRole) {
          console.log(`[AuthGuard] ✅ Admin access granted (${timestamp})`);
          return true;
        } else {
          // Last resort: Check localStorage directly for admin role
          try {
            const storedRoles = localStorage.getItem('userRoles');
            if (storedRoles) {
              const parsedRoles = JSON.parse(storedRoles);
              if (Array.isArray(parsedRoles)) {
                const hasAdminRoleInStorage = parsedRoles.some(
                  (role: any) => typeof role === 'string' && role.toUpperCase() === 'ADMIN'
                );
                if (hasAdminRoleInStorage) {
                  console.log(`[AuthGuard] ✅ Admin access granted via localStorage (${timestamp})`);
                  return true;
                }
              }
            }
            
            // Also check if role is stored directly
            const storedRole = localStorage.getItem('userRole');
            if (storedRole && storedRole.toUpperCase() === 'ADMIN') {
              console.log(`[AuthGuard] ✅ Admin access granted via localStorage userRole (${timestamp})`);
              return true;
            }
            
            // Try to get user from localStorage and check role
            const storedUser = localStorage.getItem('userData') || localStorage.getItem('user');
            if (storedUser) {
              try {
                const userData = JSON.parse(storedUser);
                if (userData.role && (userData.role.id === 1 || userData.role.name?.toUpperCase() === 'ADMIN')) {
                  console.log(`[AuthGuard] ✅ Admin access granted via stored user data (${timestamp})`);
                  return true;
                }
                if (Array.isArray(userData.roles) && userData.roles.some((r: any) => typeof r === 'string' && r.toUpperCase() === 'ADMIN')) {
                  console.log(`[AuthGuard] ✅ Admin access granted via stored user roles (${timestamp})`);
                  return true;
                }
              } catch (e) {
                console.error('[AuthGuard] ❌ Error parsing stored user data:', e);
              }
            }
          } catch (e) {
            console.error('[AuthGuard] ❌ Error checking localStorage for admin role:', e);
          }
          
          console.log(`[AuthGuard] ❌ Admin access denied (${timestamp})`);
          router.navigate(['/login']);
          return false;
        }
      } catch (e) {
        console.error('[AuthGuard] ❌ Error during admin check:', e);
        router.navigate(['/login']);
        return false;
      }
    }

    // SPECIAL CASE: Chef-projet routes need special handling
    if (state.url.includes('/chef-projet')) {
      console.log(
        `[AuthGuard] 🔎 Handling chef-projet route access (${timestamp})`
      );

      // Preload user data if possible
      if (typeof authService.restoreUserFromStorage === 'function') {
        try {
          authService.restoreUserFromStorage();
          console.log('[AuthGuard] 🔄 Restored user data for chef-projet check');
        } catch (e) {
          console.error('[AuthGuard] ❌ Error restoring user data:', e);
        }
      }

      // Force user data sync and restoration
      try {
        // Try to get user from localStorage directly if the service doesn't have it
        const hasChefProjetRole = authService.hasRole('CHEF_PROJET');
        console.log('[AuthGuard] 👨‍💼 Chef Projet role check result:', hasChefProjetRole);
        
        if (hasChefProjetRole) {
          console.log(`[AuthGuard] ✅ Chef Projet access granted (${timestamp})`);
          return true;
        } else {
          console.log(`[AuthGuard] ❌ Chef Projet access denied (${timestamp})`);
          router.navigate(['/login']);
          return false;
        }
      } catch (e) {
        console.error('[AuthGuard] ❌ Error during chef-projet check:', e);
      }
    }

    // SPECIAL CASE: User/Client routes need special handling
    if (state.url.includes('/user')) {
      console.log(
        `[AuthGuard] 🔎 Handling user/client route access (${timestamp})`
      );

      // Use the specialized user/client access method if available
      if (typeof authService.ensureUserClientAccess === 'function') {
        try {
          const userClientAccess = authService.ensureUserClientAccess();
          if (userClientAccess) {
            console.log(`[AuthGuard] ✅ User/Client access granted via ensureUserClientAccess (${timestamp})`);
            return true;
          }
        } catch (e) {
          console.error('[AuthGuard] ❌ Error in ensureUserClientAccess:', e);
        }
      }

      // Preload user data if possible
      if (typeof authService.restoreUserFromStorage === 'function') {
        try {
          authService.restoreUserFromStorage();
          console.log('[AuthGuard] 🔄 Restored user data for user/client check');
        } catch (e) {
          console.error('[AuthGuard] ❌ Error restoring user data:', e);
        }
      }

      // Force user data sync and restoration
      try {
        // IMPROVED CHECK: Use explicit OR to check for either role
        // Both roles are considered valid for user route access
        const hasUserOrClientRole = authService.hasRole('USER');
        console.log('[AuthGuard] 👤 User/Client role check result:', hasUserOrClientRole);
        
        if (hasUserOrClientRole) {
          console.log(`[AuthGuard] ✅ User/Client access granted (${timestamp})`);
          return true;
        }
        
        // Last resort check: Look in localStorage directly
        try {
          // Check for USER or CLIENT in stored roles
          const storedRoles = localStorage.getItem('userRoles');
          if (storedRoles) {
            try {
              const parsedRoles = JSON.parse(storedRoles);
              if (Array.isArray(parsedRoles)) {
                const hasUserClientRoleInStorage = parsedRoles.some(
                  (role: any) => typeof role === 'string' && 
                                (role.toUpperCase() === 'USER' || role.toUpperCase() === 'CLIENT')
                );
                if (hasUserClientRoleInStorage) {
                  console.log(`[AuthGuard] ✅ User/Client access granted via localStorage roles (${timestamp})`);
                  return true;
                }
              }
            } catch (e) {
              console.error('[AuthGuard] Error parsing stored roles:', e);
            }
          }
          
          // Check direct role storage
          const storedRole = localStorage.getItem('userRole');
          if (storedRole && 
              (storedRole.toUpperCase() === 'USER' || storedRole.toUpperCase() === 'CLIENT')) {
            console.log(`[AuthGuard] ✅ User/Client access granted via localStorage userRole (${timestamp})`);
            return true;
          }
          
          // Check stored user data
          const storedUser = localStorage.getItem('userData') || localStorage.getItem('user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              
              // Check role object with ID 2 (USER/CLIENT in the system)
              if (userData.role && userData.role.id === 2) {
                console.log(`[AuthGuard] ✅ User/Client access granted via role ID (${timestamp})`);
                return true;
              }
              
              // Check role name
              if (userData.role && 
                  (userData.role.name?.toUpperCase() === 'USER' || 
                   userData.role.name?.toUpperCase() === 'CLIENT')) {
                console.log(`[AuthGuard] ✅ User/Client access granted via role name (${timestamp})`);
                return true;
              }
              
              // Check roles array
              if (Array.isArray(userData.roles) && userData.roles.some(
                  (r: any) => typeof r === 'string' && 
                              (r.toUpperCase() === 'USER' || r.toUpperCase() === 'CLIENT')
                )) {
                console.log(`[AuthGuard] ✅ User/Client access granted via roles array (${timestamp})`);
                return true;
              }
            } catch (e) {
              console.error('[AuthGuard] Error parsing stored user data:', e);
            }
          }
        } catch (e) {
          console.error('[AuthGuard] Error checking localStorage for user/client role:', e);
        }
        
        console.log(`[AuthGuard] ❌ User/Client access denied (${timestamp})`);
        router.navigate(['/login']);
        return false;
      } catch (e) {
        console.error('[AuthGuard] ❌ Error during user/client check:', e);
        router.navigate(['/login']);
        return false;
      }
    }

    // SPECIAL CASE: Collaborateur routes need special handling
    if (state.url.includes('/collaborateur')) {
      console.log(
        `[AuthGuard] 🔎 Handling collaborateur route access (${timestamp})`
      );

      // Use the specialized collaborateur access method if available
      if (typeof authService.ensureCollaborateurAccess === 'function') {
        try {
          const collaborateurAccess = authService.ensureCollaborateurAccess();
          if (collaborateurAccess) {
            console.log(`[AuthGuard] ✅ Collaborateur access granted via ensureCollaborateurAccess (${timestamp})`);
            return true;
          }
        } catch (e) {
          console.error('[AuthGuard] ❌ Error in ensureCollaborateurAccess:', e);
        }
      }

      // Preload user data if possible
      if (typeof authService.restoreUserFromStorage === 'function') {
        try {
          authService.restoreUserFromStorage();
          console.log('[AuthGuard] 🔄 Restored user data for collaborateur check');
        } catch (e) {
          console.error('[AuthGuard] ❌ Error restoring user data:', e);
        }
      }

      // Force user data sync and restoration
      try {
        // Try to get user from localStorage directly if the service doesn't have it
        const hasCollaborateurRole = authService.hasRole('COLLABORATEUR');
        console.log('[AuthGuard] 👷 Collaborateur role check result:', hasCollaborateurRole);
        
        if (hasCollaborateurRole) {
          console.log(`[AuthGuard] ✅ Collaborateur access granted (${timestamp})`);
          return true;
        } else {
          console.log(`[AuthGuard] ❌ Collaborateur access denied (${timestamp})`);
          router.navigate(['/login']);
          return false;
        }
      } catch (e) {
        console.error('[AuthGuard] ❌ Error during collaborateur check:', e);
      }
    }

    // Standard auth check for other routes
    try {
      // Check if the user is logged in
      const isLoggedIn = authService.isLoggedIn();
      console.log('[AuthGuard] 🔑 Login check:', isLoggedIn);

      if (!isLoggedIn) {
        console.log(`[AuthGuard] ❌ Not logged in, redirecting to login (${timestamp})`);
        router.navigate(['/login']);
        return false;
      }

      // If no specific roles are required, just being logged in is enough
      if (!allowedRoles || allowedRoles.length === 0) {
        console.log(`[AuthGuard] ✅ No specific roles required, access granted (${timestamp})`);
        return true;
      }

      // Check if the user has any of the required roles
      for (const role of allowedRoles) {
        if (authService.hasRole(role)) {
          console.log(`[AuthGuard] ✅ User has required role: ${role}, access granted (${timestamp})`);
          return true;
        }
      }

      console.log(`[AuthGuard] ❌ User does not have any required roles: ${allowedRoles}, access denied (${timestamp})`);
      router.navigate(['/unauthorized']);
      return false;
    } catch (error) {
      console.error('[AuthGuard] ❌ Error in auth guard:', error);
      router.navigate(['/login']);
      return false;
    }
  };
};
