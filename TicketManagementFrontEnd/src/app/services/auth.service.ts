import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, AuthResponse } from '../models/user.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenExpirationTimer: any;
  private refreshTokenInProgress = false;
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map((user) => !!user));
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private tokenExpirationTime = 15 * 60 * 1000; // 15 minutes
  private userDataLoaded = false;
  private navigateAfterLoginUrl: string | null = null;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private notificationService: NotificationService
  ) {
    console.log('[AuthService] Service initialized');
    this.loadStoredUser();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // NEW METHOD: Preload user data to ensure it's available before components initialize
  preloadUserData(): Promise<User | null> {
    // If user is already loaded, return it immediately
    if (this.currentUserSubject.value) {
      console.log('[AuthService] User already loaded in memory');
      return Promise.resolve(this.currentUserSubject.value);
    }
    
    // If we've already tried loading and failed, don't try again
    if (this.userDataLoaded) {
      console.log('[AuthService] User data already attempted to load');
      return Promise.resolve(this.currentUserSubject.value);
    }
    
    // Try to load user data
    return new Promise((resolve) => {
      console.log('[AuthService] Preloading user data');
      
      // Try to load from storage
      this.loadStoredUser();
      
      // Wait a short time for the load to complete
      setTimeout(() => {
        resolve(this.currentUserSubject.value);
      }, 100);
    });
  }

  private loadStoredUser(): void {
    console.log('[AuthService] Loading stored user');
    
    try {
      // Check both storage keys used by the different auth services
      const storedUser =
        localStorage.getItem('user') || localStorage.getItem('userData');
      const token = localStorage.getItem('token');
      const tokenExpiration = localStorage.getItem('tokenExpiration');

      console.log('[AuthService] Stored data:', {
        hasUser: !!storedUser,
        hasToken: !!token,
        tokenExpiration,
        userDataKey: !!localStorage.getItem('userData'),
        userKey: !!localStorage.getItem('user'),
      });

      if (!storedUser || !token) {
        console.log('[AuthService] Missing user data or token');
        this.userDataLoaded = true;
        return;
      }

      let user: User;
      try {
        user = JSON.parse(storedUser);
      } catch (error) {
        console.error('[AuthService] Error parsing user data:', error);
        this.userDataLoaded = true;
        return;
      }

      if (!tokenExpiration) {
        console.log('[AuthService] Missing token expiration');
        this.userDataLoaded = true;
        return;
      }

      const expirationDate = new Date(tokenExpiration);
      const now = new Date();

      console.log('[AuthService] Token expiration check:', {
        expirationDate,
        now,
        isExpired: expirationDate <= now,
      });

      if (expirationDate > now) {
        // Also ensure both storage keys are set for cross-service compatibility
        if (!localStorage.getItem('user')) {
          localStorage.setItem('user', storedUser);
        }
        if (!localStorage.getItem('userData')) {
          localStorage.setItem('userData', storedUser);
        }

        // Ensure user has roles in a consistent format
        if (!user.roles && user.role && user.role.name) {
          user.roles = [user.role.name.toUpperCase()];
        }

        this.currentUserSubject.next(user);
        const timeUntilExpiration = expirationDate.getTime() - now.getTime();
        console.log(
          '[AuthService] Setting up auto refresh, time until expiration:',
          timeUntilExpiration
        );
        this.autoRefreshToken(timeUntilExpiration);
      } else {
        console.log('[AuthService] Token expired, attempting refresh');
        this.refreshToken().subscribe({
          next: () => {
            console.log('[AuthService] Token refresh successful');
            // Re-emit the current user to trigger any subscriptions
            if (this.currentUserSubject.value) {
              this.currentUserSubject.next(this.currentUserSubject.value);
            }
          },
          error: (error) => {
            console.log('[AuthService] Token refresh failed:', error);
            this.logout();
          },
        });
      }
      
      this.userDataLoaded = true;
    } catch (error) {
      console.error('[AuthService] Unexpected error in loadStoredUser:', error);
      this.userDataLoaded = true;
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  user(): Observable<User | null> {
    return this.currentUser$;
  }

  getCurrentUserRole(): string | null {
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser?.role?.name) {
      console.log('[AuthService] No current user or role found');
      return null;
    }
    console.log('[AuthService] Current user role:', currentUser.role);
    return currentUser.role.name.toUpperCase();
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/auth/change-password`, { oldPassword, newPassword })
      .pipe(
        catchError((error) => {
          console.error('Password change error:', error);
          
          // Handle 401 errors specifically for password change
          if (error.status === 401) {
            return throwError(() => new Error("Le mot de passe actuel est incorrect"));
          }
          
          return throwError(() => error);
        })
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    console.log('[AuthService] 🔐 Login request initiated');
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          console.log('[AuthService] 🔐 Login response received:', {
            hasToken: !!response.token,
            hasUser: !!response.user,
            userId: response.user?.id,
            userRole: response.user?.role?.name || 'No role name',
            userRoles: response.user?.roles || 'No roles array',
          });
          
          if (!response.token || !response.user) {
            console.error('[AuthService] ❌ Invalid response format - missing token or user');
            throw new Error('Invalid response format');
          }

          // CRITICAL FIX: Ensure roles array exists
          if (!response.user.roles) {
            console.log('[AuthService] ⚠️ No roles array, creating empty one');
            response.user.roles = [];
          }

          // CRITICAL FIX: Add role from role object to roles array if missing
          if (response.user.role && response.user.role.name) {
            const roleName = response.user.role.name;
            if (!response.user.roles.includes(roleName)) {
              console.log(`[AuthService] ⚠️ Adding role '${roleName}' from role object to roles array`);
              response.user.roles.push(roleName);
            }
          }

          // CRITICAL FIX: Handle USER/CLIENT roles consistently
          const hasUserClientRole =
            (Array.isArray(response.user.roles) &&
              response.user.roles.some(
                (role) =>
                  typeof role === 'string' &&
                  (role === 'USER' || 
                   role === 'CLIENT' || 
                   role.toUpperCase() === 'USER' ||
                   role.toUpperCase() === 'CLIENT')
              )) ||
            (response.user.role &&
              (response.user.role.name === 'USER' ||
               response.user.role.name === 'CLIENT' ||
               response.user.role.name?.toUpperCase() === 'USER' ||
               response.user.role.name?.toUpperCase() === 'CLIENT' ||
               response.user.role.id === 2));

          if (hasUserClientRole) {
            console.log('[AuthService] 🔒 USER/CLIENT role detected - direct handling');

            // Ensure one of these roles is in the roles array
            if (!response.user.roles.some(r => 
                (typeof r === 'string') && 
                (r === 'USER' || r === 'CLIENT' || r.toUpperCase() === 'USER' || r.toUpperCase() === 'CLIENT'))) {
              console.log('[AuthService] ⚠️ Adding USER role to roles array');
              response.user.roles.push('USER');
            }

            // Store token data
            this.storeTokenData(response);

            // Store role directly for faster access
            localStorage.setItem('userRole', 'USER');

            // Force role ID to be correct
            if (response.user.role && response.user.role.id !== 2) {
              console.log('[AuthService] ⚠️ Fixing role ID to 2 for USER/CLIENT');
              response.user.role.id = 2;
            }
            
            // Load notifications immediately after login
            console.log('[AuthService] 🔔 Loading notifications for USER/CLIENT');
            this.loadUserNotifications();

            // Navigate directly to user dashboard with a delay
            setTimeout(() => {
              console.log('[AuthService] 👤 Force navigation to user dashboard');
              this.router.navigate(['/user/dashboard'], {
                replaceUrl: true,
                queryParams: { refresh: new Date().getTime() }
              });
            }, 100);

            return;
          }

          // Continue with the rest of the login processing
          this.handleAuthentication(response);
        }),
        catchError((error) => {
          console.error('[AuthService] ❌ Login pipeline error:', error);
          return throwError(() => error);
        })
      );
  }

  private handleAuthentication(response: AuthResponse): void {
    console.log('[AuthService] Handling authentication response', {
      user: response.user,
      hasRole: !!response.user.role,
      hasRoles: !!response.user.roles,
      roleDetails: response.user.role,
      rolesArray: response.user.roles,
      fullUser: response.user,
    });

    try {
      // Store all token data using the dedicated method
      this.storeTokenData(response);

      // Immediately load notifications for the user
      console.log('[AuthService] 🔔 Loading notifications immediately after login');
      this.loadUserNotifications();

      // CRITICAL CHECK: Handle Chef Projet role specifically to bypass all other logic
      const isChefProjet =
        (Array.isArray(response.user.roles) &&
          response.user.roles.some(
            (role) =>
              typeof role === 'string' &&
              (role === 'Chef Projet' || role.toUpperCase() === 'CHEF_PROJET' || role.toUpperCase() === 'CHEF PROJET')
          )) ||
        (response.user.role &&
          typeof response.user.role === 'object' &&
          response.user.role.name &&
          (response.user.role.name === 'Chef Projet' ||
            response.user.role.name.toUpperCase() === 'CHEF_PROJET' ||
            response.user.role.name.toUpperCase() === 'CHEF PROJET'));

      if (isChefProjet) {
        console.log('[AuthService] 🚨 Chef Projet detected, direct navigation');
        this.navigateAfterLogin('/chef-projet/tickets');
        return;
      }

      // CRITICAL CHECK: Handle ADMIN role specifically
      const isAdmin =
        (Array.isArray(response.user.roles) &&
          response.user.roles.some(
            (role) =>
              typeof role === 'string' &&
              (role === 'Admin' || role.toUpperCase() === 'ADMIN')
          )) ||
        (response.user.role &&
          typeof response.user.role === 'object' &&
          response.user.role.name &&
          (response.user.role.name === 'Admin' ||
            response.user.role.name.toUpperCase() === 'ADMIN'));

      if (isAdmin) {
        console.log('[AuthService] 🚨 Admin detected, direct navigation');
        this.navigateAfterLogin('/admin/dashboard');
        return;
      }

      // CRITICAL CHECK: Handle USER/CLIENT role specifically
      const isUser =
        (Array.isArray(response.user.roles) &&
          response.user.roles.some(
            (role) =>
              typeof role === 'string' &&
              (role === 'User' || role.toUpperCase() === 'USER' || 
               role === 'Client' || role.toUpperCase() === 'CLIENT')
          )) ||
        (response.user.role &&
          typeof response.user.role === 'object' &&
          response.user.role.name &&
          (response.user.role.name === 'User' ||
            response.user.role.name.toUpperCase() === 'USER' ||
            response.user.role.name === 'Client' ||
            response.user.role.name.toUpperCase() === 'CLIENT'));

      if (isUser) {
        console.log('[AuthService] 🚨 User/Client detected, direct navigation');
        this.navigateAfterLogin('/user/tickets');
        return;
      }

      // Determine user's role for navigation
      let roleName = '';

      // Try to get role from roles array first (most reliable)
      if (Array.isArray(response.user.roles) && response.user.roles.length > 0) {
        // Get the first role as the primary role
        const primaryRole = response.user.roles[0];
        roleName = typeof primaryRole === 'string' ? primaryRole.toUpperCase() : '';
        
        console.log('[AuthService] Using role from roles array:', roleName);

        // Direct role checks based on role name
        if (roleName === 'ADMIN') {
          this.navigateAfterLogin('/admin/dashboard');
          return;
        }
        if (roleName === 'USER' || roleName === 'CLIENT') {
          this.navigateAfterLogin('/user/tickets');
          return;
        }
        if (roleName === 'CHEF PROJET' || roleName === 'CHEF_PROJET') {
          this.navigateAfterLogin('/chef-projet/tickets');
          return;
        }
        if (roleName === 'COLLABORATEUR') {
          this.navigateAfterLogin('/collaborateur/tickets');
          return;
        }
      }

      // PRIORITY CHECK: Check for Chef Projet role in any format first
      // This ensures Chef Projet routing always works correctly
      if (
        (Array.isArray(response.user.roles) &&
          response.user.roles.some(
            (role) =>
              typeof role === 'string' &&
              (role === 'Chef Projet' ||
                role.toUpperCase() === 'CHEF PROJET' ||
                role.toUpperCase() === 'CHEF_PROJET')
          )) ||
        (response.user.role &&
          (response.user.role.name === 'Chef Projet' ||
            response.user.role.name?.toUpperCase() === 'CHEF PROJET' ||
            response.user.role.id === 3))
      ) {
        console.log(
          '[AuthService] 🎯 Chef Projet role detected - immediate navigation'
        );
        setTimeout(() => {
          this.router.navigate(['/chef-projet'], { replaceUrl: true });
        }, 100);
        return;
      }

      // If role is found in roles array, use that directly for navigation
      if (
        Array.isArray(response.user.roles) &&
        response.user.roles.length > 0
      ) {
        const role = response.user.roles[0];
        console.log('[AuthService] Using first role from roles array:', role);

        // Use direct role string comparison without transformations
        if (role === 'COLLABORATEUR' || role === 'Collaborateur') {
          setTimeout(() => {
            console.log(
              '[AuthService] 👷 Navigating to collaborateur dashboard (direct match)'
            );
            this.router.navigate(['/collaborateur'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (role === 'ADMIN' || role === 'Admin') {
          setTimeout(() => {
            console.log(
              '[AuthService] 👑 Navigating to admin dashboard (direct match)'
            );
            this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (role === 'CLIENT' || role === 'Client') {
          setTimeout(() => {
            console.log(
              '[AuthService] 👤 Navigating to client dashboard (direct match)'
            );
            this.router.navigate(['/client'], { replaceUrl: true });
          }, 100);
          return;
        }

        // Additional Chef Projet check for roles array
        if (role === 'Chef Projet' || role === 'CHEF PROJET') {
          setTimeout(() => {
            console.log(
              '[AuthService] 🔐 Chef Projet role detected in roles array'
            );
            this.router.navigate(['/chef-projet'], { replaceUrl: true });
          }, 100);
          return;
        }
      }

      // Fallback to role object if available
      if (response.user.role) {
        const roleName =
          typeof response.user.role === 'string'
            ? response.user.role
            : response.user.role.name || '';

        console.log('[AuthService] Using role from role object:', roleName);

        // Direct role check by role ID (most reliable)
        if (response.user.role.id) {
          switch (response.user.role.id) {
            case 1: // Admin
              setTimeout(() => {
                console.log(
                  '[AuthService] 👑 Navigating to admin dashboard (by ID 1)'
                );
                this.router.navigate(['/admin/dashboard'], {
                  replaceUrl: true,
                });
              }, 100);
              return;
            case 2: // Client
              setTimeout(() => {
                console.log(
                  '[AuthService] 👤 Navigating to client dashboard (by ID 2)'
                );
                this.router.navigate(['/client'], { replaceUrl: true });
              }, 100);
              return;
            case 3: // Chef Projet
              setTimeout(() => {
                console.log(
                  '[AuthService] 👨‍💼 Navigating to chef projet dashboard (by ID 3)'
                );
                this.router.navigate(['/chef-projet'], { replaceUrl: true });
              }, 100);
              return;
            case 4: // Collaborateur
              setTimeout(() => {
                console.log(
                  '[AuthService] 👷 Navigating to collaborateur dashboard (by ID 4)'
                );
                this.router.navigate(['/collaborateur'], { replaceUrl: true });
              }, 100);
              return;
          }
        }

        // CHEF PROJET DIRECT CHECK
        if (roleName === 'CHEF PROJET') {
          console.log(
            '[AuthService] 💥 Critical case: CHEF PROJET exact match'
          );
          setTimeout(() => {
            this.router.navigate(['/chef-projet'], { replaceUrl: true });
          }, 100);
          return;
        }

        // Direct role name matching as final fallback
        if (roleName === 'ADMIN' || roleName === 'Admin') {
          setTimeout(() => {
            this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (roleName === 'CLIENT' || roleName === 'Client') {
          setTimeout(() => {
            this.router.navigate(['/client'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (roleName === 'Chef Projet' || roleName === 'CHEF PROJET') {
          setTimeout(() => {
            console.log(
              '[AuthService] 👨‍💼 Navigating to chef projet dashboard (by name match)'
            );
            this.router.navigate(['/chef-projet'], { replaceUrl: true });
          }, 100);
          return;
        }

        if (roleName === 'COLLABORATEUR' || roleName === 'Collaborateur') {
          setTimeout(() => {
            this.router.navigate(['/collaborateur'], { replaceUrl: true });
          }, 100);
          return;
        }
      }

      // FINAL FALLBACK FOR CHEF PROJET
      if (
        (Array.isArray(response.user.roles) &&
          response.user.roles.some(
            (r) =>
              typeof r === 'string' &&
              (r.includes('CHEF') ||
                r.includes('Chef') ||
                r.includes('PROJET') ||
                r.includes('Projet'))
          )) ||
        (response.user.role?.name &&
          (response.user.role.name.includes('CHEF') ||
            response.user.role.name.includes('Chef') ||
            response.user.role.name.includes('PROJET') ||
            response.user.role.name.includes('Projet')))
      ) {
        console.log(
          '[AuthService] 🔄 Final fallback for Chef Projet - attempting navigation'
        );
        setTimeout(() => {
          this.router.navigate(['/chef-projet'], { replaceUrl: true });
        }, 100);
        return;
      }

      console.log(
        '[AuthService] ⚠️ No role match found, navigate to chef-projet as fallback'
      );
      // Changed from unauthorized to chef-projet as final fallback
      this.router.navigate(['/chef-projet'], { replaceUrl: true });
    } catch (error) {
      console.error('[AuthService] Error during authentication:', error);
      this.logout();
    }
  }

  private autoRefreshToken(expirationDuration: number): void {
    console.log('[AuthService] ⚙️ Setting up auto refresh:', {
      expirationDuration,
      currentTime: new Date(),
      nextRefreshIn:
        Math.floor((expirationDuration * 0.75) / 1000) + ' seconds',
    });

    if (this.tokenExpirationTimer) {
      console.log('[AuthService] 🔄 Clearing existing refresh timer');
      clearTimeout(this.tokenExpirationTimer);
    }

    const refreshTime = Math.floor(expirationDuration * 0.75);

    if (refreshTime <= 0) {
      console.log(
        '[AuthService] ⚠️ Token too close to expiration, refreshing now'
      );
      this.refreshToken().subscribe();
      return;
    }

    this.tokenExpirationTimer = setTimeout(() => {
      console.log('[AuthService] 🔄 Auto refresh timer triggered:', {
        currentTime: new Date(),
        isLoggedIn: this.isLoggedIn(),
      });

      if (this.isLoggedIn()) {
        this.refreshToken().subscribe({
          next: () => console.log('[AuthService] ✅ Auto refresh successful'),
          error: (error) => {
            console.error('[AuthService] ❌ Auto refresh failed:', error);
            if (error.status === 401) {
              console.log(
                '[AuthService] 🚫 Unauthorized during refresh, logging out'
              );
              this.logout();
            }
          },
        });
      } else {
        console.log('[AuthService] ⚠️ User not logged in during auto refresh');
        this.logout();
      }
    }, refreshTime);
  }

  public refreshToken(): Observable<any> {
    console.log('[AuthService] 🔄 Starting token refresh');
    const refreshToken = localStorage.getItem('refreshToken');
    const currentToken = localStorage.getItem('token');

    console.log('[AuthService] 🎫 Token refresh state:', {
      hasRefreshToken: !!refreshToken,
      hasCurrentToken: !!currentToken,
      refreshInProgress: this.refreshTokenInProgress,
    });

    if (!refreshToken) {
      console.log('[AuthService] ❌ No refresh token found');
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    if (this.refreshTokenInProgress) {
      console.log('[AuthService] ⏳ Refresh already in progress');
      return of(null);
    }

    this.refreshTokenInProgress = true;

    return this.http.post(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap((response: any) => {
        console.log('[AuthService] ✅ Refresh response received:', {
          hasToken: !!response.token,
          hasRefreshToken: !!response.refreshToken,
          timestamp: new Date(),
        });
        this.refreshTokenInProgress = false;

        if (response.token && response.refreshToken) {
          this.storeTokenData(response);
        } else {
          console.error('[AuthService] ❌ Invalid refresh response format');
          this.logout();
        }
      }),
      catchError((error) => {
        console.error('[AuthService] ❌ Token refresh failed:', error);
        this.refreshTokenInProgress = false;
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    console.log('[AuthService] Logging out user');
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');

    // Clear timers
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    // Reset user state
    this.currentUserSubject.next(null);
    this.refreshTokenInProgress = false;

    console.log('[AuthService] User logged out, navigating to login');
    this.router.navigate(['/login']);
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    const user = this.currentUserSubject.value;
    const refreshToken = localStorage.getItem('refreshToken');

    console.log('[AuthService] 🔍 Checking login state:', {
      hasToken: !!token,
      hasUser: !!user,
      hasRefreshToken: !!refreshToken,
      tokenExpiration: tokenExpiration ? new Date(tokenExpiration) : null,
      currentTime: new Date(),
      userDetails: user ? { id: user.id, role: user.role } : null,
    });

    if (!token || !tokenExpiration || !user) {
      console.log('[AuthService] ❌ Login check failed:', {
        missingToken: !token,
        missingExpiration: !tokenExpiration,
        missingUser: !user,
      });
      return false;
    }

    const expirationDate = new Date(tokenExpiration);
    const now = new Date();
    const isValid = expirationDate > now;
    const timeUntilExpiration = expirationDate.getTime() - now.getTime();

    console.log('[AuthService] ⏰ Token expiration check:', {
      isValid,
      timeUntilExpiration: Math.floor(timeUntilExpiration / 1000) + ' seconds',
      shouldRefresh: timeUntilExpiration < this.tokenExpirationTime * 0.75,
    });

    return isValid;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private normalizeRoleName(role: string): string {
    if (!role) return '';

    // Convert role to uppercase for comparison
    const upperRole = role.trim().toUpperCase();
    
    // CRITICAL FIX: Handle Chef Projet role consistently
    if (upperRole === 'CHEF PROJET' || upperRole === 'CHEF_PROJET' || upperRole === 'CHEFPROJET') {
      return 'CHEF_PROJET';
    }
    
    // Handle ADMIN role
    if (upperRole === 'ADMIN' || upperRole === 'ADMINISTRATOR') {
      return 'ADMIN';
    }
    
    // Handle USER/CLIENT roles
    if (upperRole === 'USER' || upperRole === 'CLIENT') {
      return upperRole;
    }
    
    // Handle COLLABORATEUR role
    if (upperRole === 'COLLABORATEUR') {
      return 'COLLABORATEUR';
    }

    // Normalize by removing spaces, converting to uppercase, and handling French accents
    const normalized = role
      .trim()
      .replace(/\s+/g, '_')
      .normalize('NFD') // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
      .toUpperCase();

    return normalized;
  }

  hasRole(requiredRole: string): boolean {
    const currentUser = this.currentUserSubject.getValue();
    console.log('[AuthService] 🎭 Checking role access:', {
      requiredRole,
      currentUser: currentUser
        ? {
            id: currentUser.id,
            role: currentUser.role,
            roles: currentUser.roles,
          }
        : null,
      hasCurrentUser: !!currentUser,
      hasRole: !!currentUser?.role,
      hasRoles: !!currentUser?.roles,
    });

    if (!currentUser) {
      console.log('[AuthService] ❌ Role check failed: No user');
      return false;
    }

    // CRITICAL HOTFIX: If USER or CLIENT role is required, check for either one
    if (requiredRole.toUpperCase() === 'USER' || requiredRole.toUpperCase() === 'CLIENT') {
      // First check direct USER role match
      const hasUserRole = this.checkSpecificRole(currentUser, 'USER');
      // Then check direct CLIENT role match
      const hasClientRole = this.checkSpecificRole(currentUser, 'CLIENT');
      
      if (hasUserRole || hasClientRole) {
        console.log('[AuthService] ✅ USER/CLIENT role matched');
        return true;
      }
    }

    // CRITICAL FIX: Direct check for Chef Projet role
    if (
      requiredRole.toUpperCase() === 'CHEF_PROJET' ||
      requiredRole.toUpperCase() === 'CHEF PROJET'
    ) {
      // First check role object if it exists
      if (currentUser.role) {
        if (
          currentUser.role.id === 3 ||
          currentUser.role.name === 'Chef Projet' ||
          currentUser.role.name?.toUpperCase() === 'CHEF PROJET'
        ) {
          console.log('[AuthService] ✅ Chef Projet role matched from role object');
          return true;
        }
      }

      // Then check roles array if it exists
      if (currentUser.roles && Array.isArray(currentUser.roles)) {
        const hasChefProjetRole = currentUser.roles.some(
          (role) =>
            typeof role === 'string' &&
            (role === 'Chef Projet' || role.toUpperCase() === 'CHEF PROJET')
        );
        if (hasChefProjetRole) {
          console.log('[AuthService] ✅ Chef Projet role matched from roles array');
          return true;
        }
      }
    }
    
    // CRITICAL FIX: Direct check for ADMIN role
    if (
      requiredRole.toUpperCase() === 'ADMIN'
    ) {
      if (this.checkSpecificRole(currentUser, 'ADMIN')) {
        console.log('[AuthService] ✅ ADMIN role matched');
        return true;
      }
    }

    // CRITICAL FIX: Normalize the required role for comparison
    const normalizedRequiredRole = requiredRole.toUpperCase();
    console.log('[AuthService] Normalized role:', normalizedRequiredRole);

    // First try checking the roles array (which is the format from the backend)
    if (currentUser.roles && Array.isArray(currentUser.roles)) {
      const normalizedRequiredRole = this.normalizeRoleName(requiredRole);

      const hasMatchingRole = currentUser.roles.some(
        (role) => this.normalizeRoleName(role) === normalizedRequiredRole
      );

      if (hasMatchingRole) {
        console.log(
          `[AuthService] ✅ Role matched from roles array: ${requiredRole}`
        );
        return true;
      }
    }

    // Then try checking the role object
    if (currentUser.role) {
      // Check if the role is matching by ID
      // For collaborateur, we expect role ID 4 from the database
      if (
        requiredRole.toUpperCase() === 'COLLABORATEUR' &&
        currentUser.role.id === 4
      ) {
        console.log(
          '[AuthService] ✅ Role matched by ID: Collaborateur (ID: 4)'
        );
        return true;
      }

      // Get the user's role name, handling both string and object formats
      const userRoleName = currentUser.role.name || '';
      const userRole = this.normalizeRoleName(userRoleName);
      const requiredRoleNormalized = this.normalizeRoleName(requiredRole);

      console.log('[AuthService] ✅ Role comparison:', {
        userRole,
        requiredRole: requiredRoleNormalized,
        exactMatch: userRole === requiredRoleNormalized,
        partialMatch:
          userRole.includes(requiredRoleNormalized) ||
          requiredRoleNormalized.includes(userRole),
        roleDetails: currentUser.role,
      });

      // First try exact match, then try partial match in either direction
      const isExactMatch = userRole === requiredRoleNormalized;
      const isPartialMatch =
        userRole.includes(requiredRoleNormalized) ||
        requiredRoleNormalized.includes(userRole);

      return isExactMatch || isPartialMatch;
    }

    console.log(
      '[AuthService] ❌ Role check failed: No valid role information found'
    );
    return false;
  }
  
  // Helper method to check for a specific role in all possible locations
  private checkSpecificRole(user: User, roleName: string): boolean {
    const normalizedRoleName = roleName.toUpperCase();
    
    // Check in role object
    if (user.role) {
      if (
        user.role.name?.toUpperCase() === normalizedRoleName ||
        (user.role.id === 1 && normalizedRoleName === 'ADMIN') ||
        (user.role.id === 2 && (normalizedRoleName === 'USER' || normalizedRoleName === 'CLIENT')) ||
        (user.role.id === 3 && normalizedRoleName === 'CHEF_PROJET') ||
        (user.role.id === 4 && normalizedRoleName === 'COLLABORATEUR')
      ) {
        console.log(`[AuthService] ✅ ${roleName} role matched from role object`);
        return true;
      }
    }
    
    // Check in roles array
    if (user.roles && Array.isArray(user.roles)) {
      const hasRole = user.roles.some(
        (role) => 
          typeof role === 'string' && 
          (role.toUpperCase() === normalizedRoleName || 
           (normalizedRoleName === 'USER' && role.toUpperCase() === 'CLIENT') ||
           (normalizedRoleName === 'CLIENT' && role.toUpperCase() === 'USER'))
      );
      
      if (hasRole) {
        console.log(`[AuthService] ✅ ${roleName} role matched from roles array`);
        return true;
      }
    }
    
    // Check in localStorage as last resort
    try {
      const storedRoles = localStorage.getItem('userRoles');
      if (storedRoles) {
        const parsedRoles = JSON.parse(storedRoles);
        if (Array.isArray(parsedRoles)) {
          const hasRole = parsedRoles.some(
            (role) => 
              typeof role === 'string' && 
              (role.toUpperCase() === normalizedRoleName ||
               (normalizedRoleName === 'USER' && role.toUpperCase() === 'CLIENT') ||
               (normalizedRoleName === 'CLIENT' && role.toUpperCase() === 'USER'))
          );
          
          if (hasRole) {
            console.log(`[AuthService] ✅ ${roleName} role found in localStorage`);
            return true;
          }
        }
      }
      
      // Check direct role storage
      const storedRole = localStorage.getItem('userRole');
      if (storedRole && 
          (storedRole.toUpperCase() === normalizedRoleName ||
           (normalizedRoleName === 'USER' && storedRole.toUpperCase() === 'CLIENT') ||
           (normalizedRoleName === 'CLIENT' && storedRole.toUpperCase() === 'USER'))) {
        console.log(`[AuthService] ✅ ${roleName} role found in localStorage userRole`);
        return true;
      }
    } catch (e) {
      console.error(`[AuthService] Error checking localStorage for ${roleName} role:`, e);
    }
    
    return false;
  }

  navigateByRole(role: any): void {
    // More detailed logging to track the role navigation process
    const timestamp = new Date().toISOString();

    console.log('[AuthService] 🧭 Navigating by role:', {
      roleInput: role,
      roleType: typeof role,
      roleProperties: role ? Object.keys(role) : [],
      currentUrl: this.router.url,
      timestamp,
    });

    // CRITICAL IMMEDIATE FIX - Direct check for "CHEF PROJET" string
    const roleName = role?.name || '';
    if (roleName === 'CHEF PROJET') {
      console.log(
        '[AuthService] ⚡ CHEF PROJET detected - emergency direct navigation'
      );
      this.router.navigate(['/chef-projet/tickets'], { 
        replaceUrl: true,
        queryParams: { refresh: new Date().getTime() }
      });
      return;
    }
    
    // CRITICAL IMMEDIATE FIX - Direct check for "USER" or "CLIENT" string
    if (roleName === 'USER' || roleName === 'CLIENT') {
      console.log(
        '[AuthService] ⚡ USER/CLIENT detected - emergency direct navigation'
      );
      this.router.navigate(['/user/dashboard'], { 
        replaceUrl: true,
        queryParams: { refresh: new Date().getTime() }
      });
      return;
    }

    // First check for role by ID (from database)
    if (role && typeof role.id === 'number') {
      switch (role.id) {
        case 1: // Admin role ID
          console.log('[AuthService] 👑 Navigating to admin dashboard by ID');
          this.router.navigate(['/admin/dashboard'], {
            replaceUrl: true,
            state: { source: 'login', timestamp },
          });
          return;
        case 2: // User/Client role ID
          console.log('[AuthService] 👤 Navigating to client dashboard by ID');
          this.router.navigate(['/user/dashboard'], {
            replaceUrl: true,
            queryParams: { refresh: new Date().getTime() },
            state: { source: 'login', timestamp },
          });
          return;
        case 3: // Chef Projet role ID
          console.log(
            '[AuthService] 👷 Navigating to chef projet dashboard by ID'
          );
          this.router.navigate(['/chef-projet/tickets'], {
            replaceUrl: true,
            queryParams: { refresh: new Date().getTime() },
            state: { source: 'login', timestamp },
          });
          return;
        case 4: // Collaborateur role ID
          console.log(
            '[AuthService] 👷 Navigating to collaborateur dashboard by ID'
          );
          this.router.navigate(['/collaborateur'], {
            replaceUrl: true,
            state: { source: 'login', timestamp },
          });
          return;
      }
    }

    // Extract role name from the role object
    const normalizedRole = this.normalizeRoleName(roleName);

    console.log('[AuthService] 🎯 Role resolution:', {
      originalRole: role,
      extractedName: roleName,
      normalizedRole,
      timestamp,
    });

    // DIRECT CHECK for Chef Projet - check this first
    if (
      roleName === 'Chef Projet' ||
      roleName === 'CHEF PROJET' ||
      normalizedRole === 'CHEF_PROJET'
    ) {
      console.log(
        '[AuthService] 👨‍💼 Direct match for Chef Projet - navigating to chef-projet dashboard'
      );
      this.router.navigate(['/chef-projet'], {
        replaceUrl: true,
        state: { source: 'login', timestamp },
      });
      return;
    }

    // Special handling for collaborateur
    if (
      normalizedRole.includes('COLLABORATEUR') ||
      normalizedRole.includes('COLLABORATOR')
    ) {
      console.log(
        '[AuthService] 👷 Navigating to collaborateur dashboard with direct routing'
      );
      // Use replaceUrl to avoid history stacking
      this.router.navigate(['/collaborateur'], {
        replaceUrl: true,
        state: { source: 'login', timestamp },
      });
      return;
    }

    // Use a more flexible approach with includes() for partial matches
    if (normalizedRole.includes('ADMIN')) {
      console.log('[AuthService] 👑 Navigating to admin dashboard');
      this.router
        .navigate(['/admin/dashboard'], {
          replaceUrl: true,
          state: { source: 'login' },
        })
        .then((success) => {
          console.log('[AuthService] 🚀 Admin navigation result:', {
            success,
            targetUrl: '/admin/dashboard',
            timestamp,
          });
        });
    } else if (
      normalizedRole.includes('USER') ||
      normalizedRole.includes('CLIENT')
    ) {
      this.router.navigate(['/client'], { replaceUrl: true });
    } else if (
      normalizedRole.includes('CHEF') ||
      normalizedRole.includes('PROJET')
    ) {
      this.router.navigate(['/chef-projet'], { replaceUrl: true });
    } else {
      // Direct error handling - If we see "CHEF PROJET", go directly to chef-projet
      // Log for diagnosis but don't let it fail
      console.log('[AuthService] 🔍 Final role check:', role);

      if (
        Array.isArray(role.roles) &&
        role.roles.some((r: string) => r === 'CHEF PROJET')
      ) {
        console.log(
          '[AuthService] 🚨 CRITICAL ARRAY FIX: Found CHEF PROJET in roles array'
        );
        this.router.navigate(['/chef-projet'], { replaceUrl: true });
        return;
      }

      console.log(
        '[AuthService] ⚠️ Role not recognized, defaulting to chef-projet'
      );
      // Log navigating to login instead of unauthorized for "CHEF PROJET"
      console.log('[AuthService] 🚀 Navigating to chef-projet as fallback');
      this.router.navigate(['/chef-projet'], { replaceUrl: true });
    }
  }

  private setupTokenRefresh(): void {
    console.log('[AuthService] Setting up token refresh');
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Check token every minute
    this.refreshInterval = setInterval(() => {
      if (this.isLoggedIn()) {
        const tokenExpiration = localStorage.getItem('tokenExpiration');
        if (tokenExpiration) {
          const expirationDate = new Date(tokenExpiration);
          const now = new Date();
          const timeUntilExpiration = expirationDate.getTime() - now.getTime();

          // If token expires in less than 5 minutes, refresh it
          if (timeUntilExpiration < 5 * 60 * 1000) {
            console.log('[AuthService] Token close to expiration, refreshing');
            this.refreshToken().subscribe({
              next: () =>
                console.log('[AuthService] Token refreshed successfully'),
              error: (error) => {
                console.error('[AuthService] Token refresh failed:', error);
                if (error.status === 401) {
                  this.logout();
                }
              },
            });
          }
        }
      }
    }, 60000); // Check every minute
  }

  // Helper method to ensure ID is a number
  private ensureNumberId(id: string | number): number {
    return typeof id === 'string' ? parseInt(id, 10) : id;
  }

  // Add the missing resetUserIdentity method
  resetUserIdentity(newUserId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-identity`, { newUserId }).pipe(
      tap((response: any) => {
        if (response.success) {
          // Update the stored user data with the new ID
          const currentUser = this.currentUserSubject.getValue();
          if (currentUser) {
            currentUser.id = newUserId;
            localStorage.setItem('user', JSON.stringify(currentUser));
            this.currentUserSubject.next(currentUser);
          }
        }
      }),
      catchError((error) => {
        console.error('[AuthService] Reset identity error:', error);
        return throwError(() => error);
      })
    );
  }

  storeTokenData(response: AuthResponse): void {
    try {
      // Make sure we have all required data
      if (!response.token || !response.user) {
        console.error('[AuthService] Missing token or user data');
        return;
      }
      
      // Create a safe copy of the user data
      const user = { ...response.user };
      const token = response.token;
      const refreshToken = response.refreshToken || '';
      
      // Normalize roles for consistent handling
      if (Array.isArray(user.roles)) {
        // Make a copy of the roles array with normalized names
        const normalizedRoles = user.roles.map(role => {
          if (typeof role === 'string') {
            return this.normalizeRoleName(role);
          }
          return role;
        });
        
        // Replace the roles array
        user.roles = normalizedRoles;
        
        // Store roles for quick access
        localStorage.setItem('userRoles', JSON.stringify(normalizedRoles));
      } else if (!user.roles) {
        user.roles = [];
      }
      
      // Ensure there's a role if it's present
      if (user.role && typeof user.role === 'object' && user.role.name) {
        const normalizedRoleName = this.normalizeRoleName(user.role.name);
        // Store main role separately for quick access
        localStorage.setItem('userRole', normalizedRoleName);
        
        // Add this role to the roles array if not present
        if (Array.isArray(user.roles) && !user.roles.includes(normalizedRoleName)) {
          user.roles.push(normalizedRoleName);
          localStorage.setItem('userRoles', JSON.stringify(user.roles));
        }
      }
      
      // Calculate token expiration - default to 24 hours if not specified
      const expiresInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const expirationDate = new Date(new Date().getTime() + expiresInMs);
      const expirationString = expirationDate.toISOString();
      
      // Store token data
      localStorage.setItem('token', token);
      localStorage.setItem('tokenExpiration', expirationString);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Store user data
      localStorage.setItem('userData', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user)); // For compatibility
      
      // Store user ID separately for quick access
      if (user.id) {
        localStorage.setItem('userId', user.id.toString());
      }
      
      // Store user name if available
      if (user.name) {
        localStorage.setItem('userName', user.name);
      } else if (user.email) {
        localStorage.setItem('userName', user.email);
      }
      
      console.log('[AuthService] 💾 Storing authentication data:');
      console.log(`- User data length: ${JSON.stringify(user).length}`);
      console.log(`- Token length: ${token.length}`);
      console.log(`- Expiration: ${expirationDate}`);
      
      // Update current user
      this.currentUserSubject.next(user);
      
      // Set up token refresh
      this.setupTokenRefresh();
    } catch (error) {
      console.error('[AuthService] 🚨 Error storing token data:', error);
    }
  }

  mapUserResponse(response: any): User {
    return {
      id: response.user.id,
      name: response.user.name,
      lastName: response.user.lastName,
      email: response.user.email,
      role: {
        id: response.user.role?.id || 0,
        name: response.user.role?.name || 'USER',
      },
      country: response.user.country,
      company: response.user.company,
      // Include any other properties as needed
    };
  }

  /**
   * Debug method to help diagnose role issues
   */
  debugRoleInfo(): void {
    const user = this.currentUserSubject.getValue();
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    console.log('[AuthService] 🔍 ROLE DEBUG INFO:', {
      timestamp: new Date().toISOString(),
      currentUser: user
        ? {
            id: user.id,
            name: user.name,
            role: user.role,
            rawRole: JSON.stringify(user.role),
          }
        : null,
      localStorage: {
        hasToken: !!token,
        hasUser: !!storedUser,
        userParsed: storedUser ? JSON.parse(storedUser) : null,
      },
      isLoggedIn: this.isLoggedIn(),
    });
  }

  /**
   * Restore user from localStorage if BehaviorSubject is empty
   * Useful when components are loaded before auth service has fully initialized
   */
  restoreUserFromStorage(): void {
    const currentUser = this.currentUserSubject.getValue();

    // Only restore if there's no current user
    if (!currentUser) {
      try {
        console.log('[AuthService] 🔄 Attempting to restore user from storage');
        // First try to rerun the loadStoredUser method
        this.loadStoredUser();

        // If that didn't work, try direct approach
        if (!this.currentUserSubject.getValue()) {
          const storedUserString = localStorage.getItem('user') || localStorage.getItem('userData');

          if (storedUserString) {
            const storedUser = JSON.parse(storedUserString);
            console.log(
              '[AuthService] 🔄 Manual restore of user from storage:',
              {
                id: storedUser.id,
                hasRole: !!storedUser.role,
                role: storedUser.role,
                roles: storedUser.roles,
                timestamp: new Date().toISOString(),
              }
            );

            // Special handling for Chef Projet role
            if (storedUser.role && storedUser.role.id === 3) {
              console.log('[AuthService] 🔑 Chef Projet role detected by ID');
              
              // Ensure roles array exists and contains Chef Projet
              if (!storedUser.roles) {
                storedUser.roles = ['Chef Projet'];
              } else if (!storedUser.roles.includes('Chef Projet')) {
                storedUser.roles.push('Chef Projet');
              }
            }

            // Update the BehaviorSubject with the stored user
            this.currentUserSubject.next(storedUser);

            // Make sure the token is valid
            if (!this.isLoggedIn()) {
              console.warn(
                '[AuthService] ⚠️ Restored user but token is invalid or expired'
              );

              // Try to refresh the token if we have a refresh token
              const refreshToken = localStorage.getItem('refreshToken');
              if (refreshToken) {
                console.log(
                  '[AuthService] 🔄 Attempting token refresh during restore'
                );
                this.refreshToken().subscribe({
                  next: () =>
                    console.log(
                      '[AuthService] ✅ Token refreshed during restore'
                    ),
                  error: (error) =>
                    console.error(
                      '[AuthService] ❌ Token refresh failed during restore:',
                      error
                    ),
                });
              }
            }
          } else {
            console.warn(
              '[AuthService] ⚠️ No stored user found in localStorage'
            );
          }
        } else {
          console.log(
            '[AuthService] ✅ User successfully restored via loadStoredUser'
          );
        }
      } catch (error) {
        console.error(
          '[AuthService] ❌ Error restoring user from storage:',
          error
        );
      }
    } else {
      console.log(
        '[AuthService] ✅ User already in memory, no need to restore'
      );
    }
  }

  /**
   * Special method to ensure admin routes work correctly
   * This is called from the route guard and app.routes.ts
   */
  ensureAdminAccess(): boolean {
    console.log('[AuthService] 👑 Ensuring admin access...');
    
    // First try to restore user from storage if needed
    this.restoreUserFromStorage();
    
    // Check if we have a current user
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) {
      console.log('[AuthService] ❌ No user found for admin access');
      
      // Last resort: Check localStorage directly
      try {
        const storedRoles = localStorage.getItem('userRoles');
        if (storedRoles) {
          const parsedRoles = JSON.parse(storedRoles);
          if (Array.isArray(parsedRoles)) {
            const hasAdminRole = parsedRoles.some(
              (role) => typeof role === 'string' && role.toUpperCase() === 'ADMIN'
            );
            if (hasAdminRole) {
              console.log('[AuthService] ✅ Admin role found in localStorage');
              return true;
            }
          }
        }
        
        // Also check if role is stored directly
        const storedRole = localStorage.getItem('userRole');
        if (storedRole && storedRole.toUpperCase() === 'ADMIN') {
          console.log('[AuthService] ✅ Admin role found in localStorage userRole');
          return true;
        }
        
        // Try to get user from localStorage and check role
        const storedUser = localStorage.getItem('userData') || localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData.role && (userData.role.id === 1 || userData.role.name?.toUpperCase() === 'ADMIN')) {
              console.log('[AuthService] ✅ Admin role found in stored user data');
              return true;
            }
            if (Array.isArray(userData.roles) && userData.roles.some((r: any) => typeof r === 'string' && r.toUpperCase() === 'ADMIN')) {
              console.log('[AuthService] ✅ Admin role found in stored user roles');
              return true;
            }
          } catch (e) {
            console.error('[AuthService] Error parsing stored user data:', e);
          }
        }
      } catch (e) {
        console.error('[AuthService] Error checking localStorage for admin role:', e);
      }
      
      return false;
    }
    
    // Check for admin role in any format
    const hasAdminRole = this.hasRole('ADMIN');
    
    if (hasAdminRole) {
      console.log('[AuthService] ✅ Admin role confirmed');
      return true;
    }
    
    // Additional fallback checks for admin
    if (Array.isArray(currentUser.roles)) {
      const adminRoleFound = currentUser.roles.some(
        role => typeof role === 'string' && 
               (role === 'Admin' || role.toUpperCase() === 'ADMIN')
      );
      
      if (adminRoleFound) {
        console.log('[AuthService] ✅ Admin role found in roles array');
        return true;
      }
    }
    
    // Check role object if available
    if (currentUser.role) {
      const roleName = typeof currentUser.role === 'string' 
        ? currentUser.role 
        : currentUser.role.name || '';
      
      if (roleName === 'Admin' || roleName.toUpperCase() === 'ADMIN') {
        console.log('[AuthService] ✅ Admin role found in role object');
        return true;
      }
      
      // Check by role ID
      if (currentUser.role.id === 1) {
        console.log('[AuthService] ✅ Admin role confirmed by ID');
        return true;
      }
    }
    
    console.log('[AuthService] ❌ Admin role not found');
    return false;
  }

  private navigateAfterLogin(targetUrl: string): void {
    console.log('[AuthService] 🚀 Preparing navigation after login to:', targetUrl);
    
    // Store the target URL for reference
    this.navigateAfterLoginUrl = targetUrl;
    
    // Use setTimeout to ensure all storage operations complete before navigation
    setTimeout(() => {
      console.log('[AuthService] 🚀 Now navigating to:', targetUrl);
      this.router.navigate([targetUrl], { 
        replaceUrl: true,
        queryParams: { refresh: new Date().getTime() } // Force refresh
      });
    }, 100);
  }

  /**
   * Special method to ensure collaborateur routes work correctly
   * This is called from the route guard and app.routes.ts
   */
  ensureCollaborateurAccess(): boolean {
    console.log('[AuthService] 👷 Ensuring collaborateur access...');
    
    // First try to restore user from storage if needed
    this.restoreUserFromStorage();
    
    // Check if we have a current user
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) {
      console.log('[AuthService] ❌ No user found for collaborateur access');
      return false;
    }
    
    // Check for collaborateur role in any format
    const hasCollaborateurRole = this.hasRole('COLLABORATEUR');
    
    if (hasCollaborateurRole) {
      console.log('[AuthService] ✅ Collaborateur role confirmed');
      return true;
    }
    
    // Additional fallback checks for collaborateur
    if (Array.isArray(currentUser.roles)) {
      const collaborateurRoleFound = currentUser.roles.some(
        role => typeof role === 'string' && 
               (role === 'Collaborateur' || role.toUpperCase() === 'COLLABORATEUR')
      );
      
      if (collaborateurRoleFound) {
        console.log('[AuthService] ✅ Collaborateur role found in roles array');
        return true;
      }
    }
    
    // Check role object if available
    if (currentUser.role) {
      const roleName = typeof currentUser.role === 'string' 
        ? currentUser.role 
        : currentUser.role.name || '';
      
      if (roleName === 'Collaborateur' || roleName.toUpperCase() === 'COLLABORATEUR') {
        console.log('[AuthService] ✅ Collaborateur role found in role object');
        return true;
      }
      
      // Check by role ID
      if (currentUser.role.id === 4) {
        console.log('[AuthService] ✅ Collaborateur role confirmed by ID');
        return true;
      }
    }
    
    console.log('[AuthService] ❌ Collaborateur role not found');
    return false;
  }

  /**
   * Special method to ensure user/client routes work correctly
   * This is called from the route guard and app.routes.ts
   */
  ensureUserClientAccess(): boolean {
    console.log('[AuthService] 👤 Ensuring user/client access...');
    
    // First try to restore user from storage if needed
    this.restoreUserFromStorage();
    
    // Check if we have a current user
    const currentUser = this.currentUserSubject.getValue();
    if (!currentUser) {
      console.log('[AuthService] ❌ No user found for user/client access');
      
      // Last resort: Check localStorage directly
      try {
        // Check for USER or CLIENT in stored roles
        const storedRoles = localStorage.getItem('userRoles');
        if (storedRoles) {
          try {
            const parsedRoles = JSON.parse(storedRoles);
            if (Array.isArray(parsedRoles)) {
              const hasUserClientRole = parsedRoles.some(
                (role) => typeof role === 'string' && 
                         (role.toUpperCase() === 'USER' || role.toUpperCase() === 'CLIENT')
              );
              if (hasUserClientRole) {
                console.log('[AuthService] ✅ User/Client role found in localStorage');
                return true;
              }
            }
          } catch (e) {
            console.error('[AuthService] Error parsing stored roles:', e);
          }
        }
        
        // Also check if role is stored directly
        const storedRole = localStorage.getItem('userRole');
        if (storedRole && 
            (storedRole.toUpperCase() === 'USER' || storedRole.toUpperCase() === 'CLIENT')) {
          console.log('[AuthService] ✅ User/Client role found in localStorage userRole');
          return true;
        }
        
        // Try to get user from localStorage and check role
        const storedUser = localStorage.getItem('userData') || localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            
            // Check role by ID
            if (userData.role && userData.role.id === 2) {
              console.log('[AuthService] ✅ User/Client role found in stored user data by ID');
              return true;
            }
            
            // Check role by name
            if (userData.role && 
                (userData.role.name?.toUpperCase() === 'USER' || 
                 userData.role.name?.toUpperCase() === 'CLIENT')) {
              console.log('[AuthService] ✅ User/Client role found in stored user data by name');
              return true;
            }
            
            // Check roles array
            if (Array.isArray(userData.roles)) {
              const hasUserClientRole = userData.roles.some(
                (r: any) => typeof r === 'string' && 
                           (r.toUpperCase() === 'USER' || r.toUpperCase() === 'CLIENT')
              );
              if (hasUserClientRole) {
                console.log('[AuthService] ✅ User/Client role found in stored user roles');
                return true;
              }
            }
          } catch (e) {
            console.error('[AuthService] Error parsing stored user data:', e);
          }
        }
      } catch (e) {
        console.error('[AuthService] Error checking localStorage for user/client role:', e);
      }
      
      return false;
    }
    
    // Check for user/client role in any format
    const hasUserRole = this.hasRole('USER');
    
    if (hasUserRole) {
      console.log('[AuthService] ✅ User/Client role confirmed through hasRole');
      return true;
    }
    
    // Direct check in the roles array as fallback
    if (Array.isArray(currentUser.roles)) {
      const userClientRoleFound = currentUser.roles.some(
        role => typeof role === 'string' && 
               (role === 'User' || 
                role === 'Client' || 
                role.toUpperCase() === 'USER' ||
                role.toUpperCase() === 'CLIENT')
      );
      
      if (userClientRoleFound) {
        console.log('[AuthService] ✅ User/Client role found in roles array');
        return true;
      }
    }
    
    // Check role object if available
    if (currentUser.role) {
      const roleName = typeof currentUser.role === 'string' 
        ? currentUser.role 
        : currentUser.role.name || '';
      
      if (roleName === 'User' || 
          roleName === 'Client' ||
          roleName.toUpperCase() === 'USER' ||
          roleName.toUpperCase() === 'CLIENT') {
        console.log('[AuthService] ✅ User/Client role found in role object');
        return true;
      }
      
      // Check by role ID
      if (currentUser.role.id === 2) {
        console.log('[AuthService] ✅ User/Client role confirmed by ID');
        return true;
      }
    }
    
    console.log('[AuthService] ❌ User/Client role not found');
    return false;
  }

  /**
   * Load notifications immediately after login
   * This ensures notifications appear right away instead of waiting for the refresh timer
   */
  private loadUserNotifications(): void {
    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log('[AuthService] Cannot load notifications - no userId found');
        return;
      }

      console.log(`[AuthService] 🔔 Immediate notification loading for user ${userId}`);
      
      // First refresh from storage to get any cached notifications
      this.notificationService.refreshFromStorage();
      
      // Then immediately fetch from API to ensure we have the latest
      this.notificationService.refreshNotifications();
      
      // Set up a second refresh after a short delay to handle any race conditions
      setTimeout(() => {
        console.log('[AuthService] 🔄 Secondary notification refresh to ensure completeness');
        this.notificationService.refreshNotifications();
      }, 2000);
    } catch (error) {
      console.error('[AuthService] Error loading notifications:', error);
    }
  }
}
