import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { User, AuthResponse } from '../models/user.model';
import { UserRole, ROLE_ROUTES } from '../constants/roles';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenExpirationTimer: any;
  private navigationTimer: any;

  // Modern state management using signals
  private readonly userSignal = signal<User | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // Computed values
  readonly user = computed(() => this.userSignal());
  readonly isLoggedIn = computed(() => {
    // First check if user is already in memory
    let user = this.userSignal();

    // If no user in memory, try to get from localStorage
    if (!user) {
      const userData = localStorage.getItem('userData') || localStorage.getItem('user');
      if (userData) {
        try {
          user = JSON.parse(userData);
          // Update userSignal with the loaded user
          this.userSignal.set(user);
          console.log('[AuthService] 🔄 Loaded user from localStorage:', user);
        } catch (error) {
          console.error('[AuthService] Error parsing user data:', error);
        }
      }
    }

    const token = localStorage.getItem('token');
    const expiration = localStorage.getItem('tokenExpiration');

    console.log('[AuthService] 🔍 Checking login state:', {
      hasToken: !!token,
      hasUser: !!user,
      hasRefreshToken: !!localStorage.getItem('refreshToken'),
      tokenExpiration: expiration ? new Date(expiration) : null,
      currentTime: new Date(),
      isExpired: expiration ? new Date(expiration) <= new Date() : true,
      userId: user?.id,
      userRoles: user?.roles
    });

    if (!token || !expiration) {
      console.log('[AuthService] 🔒 Not logged in - missing token or expiration');
      return false;
    }

    if (!user) {
      console.log('[AuthService] ❌ Login check failed:', {
        missingToken: !token,
        missingExpiration: !expiration,
        missingUser: !user
      });
      return false;
    }

    const expirationDate = new Date(expiration);
    const isValid = expirationDate > new Date();

    console.log('[AuthService] 🔓 Login check result:', isValid);
    return isValid;
  });
  readonly userRole = computed(() => {
    const user = this.user();
    console.log('[AuthService] Computing user role from:', user);

    // Check if user has roles array
    if (
      !user ||
      !user.roles ||
      !Array.isArray(user.roles) ||
      user.roles.length === 0
    ) {
      console.warn('[AuthService] User has no roles array or empty roles');

      // Fallback to check if there's a role object (using type assertion to satisfy compiler)
      if (
        user &&
        'role' in user &&
        user.role &&
        typeof user.role === 'object' &&
        'name' in user.role
      ) {
        // Use type assertion to safely access the name property
        const role = user.role as { name: string };
        const roleName = role.name.toUpperCase();
        console.log('[AuthService] Found role in role object:', roleName);
        return roleName;
      }

      return null;
    }

    // Always normalize role to uppercase for consistent comparison
    const role = user.roles[0];
    console.log('[AuthService] Role from roles array:', role);

    // Handle both string and object role formats
    if (typeof role === 'string') {
      return role.toUpperCase();
    } else if (role && typeof role === 'object') {
      // Use type assertion for complex objects
      const roleObj = role as unknown as { name: string };
      if ('name' in roleObj && typeof roleObj.name === 'string') {
        return roleObj.name.toUpperCase();
      }
    }

    return null;
  });
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  constructor(
    private router: Router,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    console.log('[AuthService] Service initialized');
    this.initializeAuth();
  }

  private initializeAuth(): void {
    console.log('[AuthService] Loading stored user');
    // Try both storage keys for cross-service compatibility
    const userData =
      localStorage.getItem('userData') || localStorage.getItem('user');
    if (!userData) {
      console.log('[AuthService] No stored user data found');
      return;
    }

    let user: User;
    try {
      user = JSON.parse(userData);
      console.log('[AuthService] Successfully parsed user data:', user);

      // Debug user role information
      if (user.roles && Array.isArray(user.roles)) {
        console.log('[AuthService] User roles from storage:', user.roles);
      } else if ('role' in user && user.role) {
        console.log('[AuthService] User role object from storage:', user.role);
      } else {
        console.warn(
          '[AuthService] No role information found in stored user data'
        );
      }
    } catch (error) {
      console.error('[AuthService] Error parsing user data:', error);
      this.logout();
      return;
    }

    const expirationTime = localStorage.getItem('tokenExpiration');

    console.log('[AuthService] Stored data:', {
      hasUser: !!user,
      hasToken: !!localStorage.getItem('token'),
      tokenExpiration: expirationTime,
    });

    if (!expirationTime || new Date(expirationTime) <= new Date()) {
      console.log('[AuthService] Token expired or missing, logging out');
      this.logout();
      return;
    }

    // Ensure the roles array exists
    if (
      !user.roles &&
      'role' in user &&
      user.role &&
      typeof user.role === 'object' &&
      'name' in user.role
    ) {
      const roleObj = user.role as { name: string };
      console.log('[AuthService] Converting role object to roles array');
      user.roles = [roleObj.name.toUpperCase()]; // Ensure uppercase

      // Update localStorage to ensure consistent format (both keys)
      const updatedUserData = JSON.stringify(user);
      localStorage.setItem('userData', updatedUserData);
      localStorage.setItem('user', updatedUserData);
      console.log(
        '[AuthService] Updated both storage keys with normalized role data'
      );
    }

    // Also reload token and expiration to ensure everything is in sync
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[AuthService] Token missing but user data exists');
      this.logout();
      return;
    }

    // Set the user signal
    this.userSignal.set(user);
    console.log('[AuthService] User loaded from storage:', user);

    // Set auto-logout
    this.autoLogout(new Date(expirationTime).getTime() - new Date().getTime());
  }

  login(email: string, password: string): Observable<User> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => this.handleAuthentication(response)),
        map((response) => response.user),
        catchError((error) => {
          console.error('[AuthService] Login error:', error);
          this.loadingSignal.set(false);
          this.errorSignal.set(
            error.error?.message || 'An error occurred during login'
          );
          return throwError(() => error);
        })
      );
  }

  private handleAuthentication(response: AuthResponse): void {
    // Destructure response
    const { token, user, refreshToken, expiresIn } = response;

    if (!token || !user) {
      this.errorSignal.set('Invalid authentication response');
      return;
    }

    try {
      // Process and normalize user roles
      if (Array.isArray(user.roles)) {
        // Normalize roles to uppercase
        const normalizedRoles = user.roles.map((role) => {
          // Don't uppercase Chef Projet to prevent issues
          if (role === 'Chef Projet') {
            console.log('[AuthService] 🔐 Preserved exact Chef Projet role');
            return role;
          }
          return role.toUpperCase();
        });

        console.log(
          '[AuthService] Normalized user roles to uppercase:',
          normalizedRoles
        );
        user.roles = normalizedRoles;
      } else {
        // Ensure user.roles is always an array
        user.roles = [];
      }

      console.log('[AuthService] User roles:', user.roles);

      // Calculate expiration date
      const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);

      // Store auth data
      this.storeAuthData(token, user, refreshToken || null, expirationDate);

      // Update state (before navigation)
      this.userSignal.set(user);
      this.loadingSignal.set(false);
      this.errorSignal.set(null);

      // Set auto logout
      this.autoLogout(expiresIn * 1000);

      // Add delay to ensure storage is updated before trying to migrate notifications
      setTimeout(() => {
        // Force store userId in a more reliable way
        const userId = this.user() ? this.user()?.id : response.user?.id;
        if (userId) {
          console.log(`[AuthService] Ensuring userId ${userId} is in localStorage before notification migration`);
          localStorage.setItem('userId', userId.toString());
          
          // Now migrate notifications with guaranteed userId
          console.log('[AuthService] Migrating global notifications after login with delay');
          this.notificationService.migrateGlobalNotifications();
          
          // Force refresh notifications from storage
          this.notificationService.refreshFromStorage();
          this.notificationService.forceWriteNotificationsToStorage();
        }
      }, 1000);

      // SINGLE NAVIGATION PATH - Use a clean approach with delay for admin only
      this.navigateAfterLogin();
    } catch (error) {
      console.error('[AuthService] Error in authentication handling:', error);
      this.errorSignal.set('Authentication error');
      this.loadingSignal.set(false);
    }
  }

  logout(): void {
    console.log('[AuthService] 🚪 Logging out');

    // Clear state
    this.userSignal.set(null);
    this.errorSignal.set(null);

    // Clear storage (clear both keys for cross-service compatibility)
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiration');

    // Clear timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    // Navigate to login
    this.router.navigate(['/login']);
  }

  private autoLogout(expirationDuration: number): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  refreshToken(): Observable<any> {
    console.log('[AuthService] 🔄 Attempting to refresh token');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.error('[AuthService] ❌ No refresh token available');
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          console.log('[AuthService] ✅ Token refreshed successfully');
          this.handleAuthentication(response);
        }),
        catchError((error) => {
          console.error('[AuthService] ❌ Token refresh failed', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/change-password`, { oldPassword, newPassword })
      .pipe(
        catchError((error) => {
          console.error('[AuthService] Password change error:', error);
          
          // Handle 401 errors specifically for password change
          if (error.status === 401) {
            return throwError(() => new Error("Le mot de passe actuel est incorrect"));
          }
          
          return throwError(() => error);
        })
      );
  }

  // Method to request a password reset
  requestPasswordReset(email: string): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http
      .post(`${this.apiUrl}/forgot-password`, { email })
      .pipe(
        tap((response) => {
          console.log('[AuthService] Password reset requested successfully');
          this.loadingSignal.set(false);
        }),
        catchError((error) => {
          console.error('[AuthService] Password reset request error:', error);
          this.loadingSignal.set(false);
          this.errorSignal.set(
            error.error?.message || 'Une erreur est survenue lors de la demande de réinitialisation'
          );
          return throwError(() => error);
        })
      );
  }
  
  // Method to reset password with token
  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    
    return this.http
      .post(`${this.apiUrl}/reset-password`, { email, token, newPassword })
      .pipe(
        tap((response) => {
          console.log('[AuthService] Password reset successful');
          this.loadingSignal.set(false);
        }),
        catchError((error) => {
          console.error('[AuthService] Password reset error:', error);
          this.loadingSignal.set(false);
          this.errorSignal.set(
            error.error?.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe'
          );
          return throwError(() => error);
        })
      );
  }

  hasAnyRole(allowedRoles: UserRole[]): boolean {
    const userRole = this.userRole();
    if (!userRole) return false;

    // Log detailed role matching information
    console.log('[AuthService] 🔎 Checking role access:', {
      userRole,
      allowedRoles,
      userRoleUpper: userRole.toUpperCase(),
      allowedRolesUpper: allowedRoles.map((r) => r.toUpperCase()),
    });

    // Convert both the user's role and allowed roles to uppercase for comparison
    const userRoleUpper = userRole.toUpperCase();
    return allowedRoles.some((role) => role.toUpperCase() === userRoleUpper);
  }

  // Add this method to provide current user as Observable
  getCurrentUser(): Observable<User | null> {
    // First check if user is already in memory
    const currentUser = this.userSignal();
    if (currentUser) {
      console.log(
        '[AuthService] 🔄 Returning existing user from signal:',
        currentUser
      );
      return of(currentUser);
    }

    // Try to get from localStorage if not in memory
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Update userSignal with the loaded user
        this.userSignal.set(user);
        console.log('[AuthService] 🔄 Returning user from localStorage:', user);
        return of(user);
      } catch (error) {
        console.error('[AuthService] Error parsing user data:', error);
      }
    }

    console.log('[AuthService] No user available');
    return of(null);
  }

  private storeAuthData(
    token: string,
    user: User,
    refreshToken: string | null,
    expirationDate: Date
  ): void {
    // Ensure all required data is populated before saving
    const userData = JSON.stringify(user);

    // Store auth data with error handling
    console.log('[AuthService] 💾 Storing authentication data:');
    console.log('- User data length:', userData.length);
    console.log('- Token length:', token.length);
    console.log('- Expiration:', expirationDate.toISOString());

    // IMPORTANT: Set the user signal BEFORE storing in localStorage
    // This ensures the user data is available in memory immediately
    this.userSignal.set(user);

    try {
      // Store in both keys for cross-service compatibility
      localStorage.setItem('userData', userData);
      localStorage.setItem('user', userData);
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('tokenExpiration', expirationDate.toISOString());

      // Store userId and userRole for notifications
      if (user.id) {
        localStorage.setItem('userId', user.id.toString());
      }
      if (user.roles && user.roles.length > 0) {
        // Use the first role for notifications
        const role = user.roles[0];
        // Handle both string and object role formats
        const roleName = typeof role === 'string' ? role : (role as { name: string }).name;
        localStorage.setItem('userRole', roleName);
      }
    } catch (err) {
      console.error('[AuthService] 🔴 Error storing auth data:', err);
    }

    // Verify storage
    const storedData = localStorage.getItem('userData');
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedExpiration = localStorage.getItem('tokenExpiration');
    const storedUserId = localStorage.getItem('userId');
    const storedUserRole = localStorage.getItem('userRole');

    console.log('[AuthService] ✅ Storage verification:', {
      userDataStored: !!storedData,
      userStored: !!storedUser,
      userDataLength: storedData ? storedData.length : 0,
      tokenStored: !!storedToken,
      tokenLength: storedToken ? storedToken.length : 0,
      expirationStored: !!storedExpiration,
      userIdStored: !!storedUserId,
      userRoleStored: !!storedUserRole,
      userId: storedUserId,
      userRole: storedUserRole
    });
  }

  private navigateAfterLogin(): void {
    // Get the user's role - this is a computed value based on user data
    const userRole = this.userRole();
    console.log('[AuthService] 🚀 Preparing navigation after login for role:', userRole);

    if (!userRole) {
      console.warn('[AuthService] Cannot navigate - no user role found');
      return;
    }

    // For extra safety, clear any existing navigation timer
    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
      this.navigationTimer = null;
    }

    let targetRoute = '/';
    
    // Determine the correct route based on role
    switch (userRole) {
      case 'ADMIN':
        // For admin, always navigate directly to dashboard to avoid component resolution issues
        targetRoute = '/admin/dashboard';
        break;
      case 'USER':
      case 'CLIENT':
        targetRoute = '/user/dashboard';
        break;
      case 'CHEF PROJET':
      case 'CHEF_PROJET':
        targetRoute = '/chef-projet';
        break;
      case 'COLLABORATEUR':
        targetRoute = '/collaborateur';
        break;
      default:
        console.warn(`[AuthService] Unknown role: ${userRole}, using default route`);
    }
    
    console.log(`[AuthService] Will navigate to: ${targetRoute}`);
    
    // Use a shorter delay for ADMIN users to avoid timing issues with component resolution
    const delay = userRole === 'ADMIN' ? 100 : 1000;
    
    // Schedule navigation after delay - with safe handler to prevent errors
    this.navigationTimer = setTimeout(() => {
      console.log(`[AuthService] 🚀 Now navigating to: ${targetRoute}`);
      
      // Verify login state just before navigation
      if (this.isLoggedIn()) {
        try {
          // For ADMIN users, force a direct navigation with no query params and replace URL
          if (userRole === 'ADMIN') {
            this.router.navigate([targetRoute], { 
              replaceUrl: true, 
              queryParams: {}, 
              queryParamsHandling: '' 
            })
            .then(success => {
              if (!success) {
                console.error(`[AuthService] ❌ Admin navigation to ${targetRoute} failed, trying fallback`);
                // Try alternative navigation as fallback
                setTimeout(() => {
                  this.router.navigateByUrl(targetRoute, { replaceUrl: true });
                }, 100);
              }
            })
            .catch(err => {
              console.error(`[AuthService] ❌ Admin navigation error:`, err);
              // Fallback in case of error - navigate to a safe route
              this.router.navigate(['/']);
            });
          } else {
            // For other roles, use the regular navigation
            this.router.navigateByUrl(targetRoute, { replaceUrl: true })
              .then(success => {
                if (!success) {
                  console.error(`[AuthService] ❌ Navigation to ${targetRoute} failed`);
                  this.router.navigate(['/']);
                }
              })
              .catch(err => {
                console.error(`[AuthService] ❌ Navigation error:`, err);
                this.router.navigate(['/']);
              });
          }
        } catch (error) {
          console.error(`[AuthService] ❌ Navigation exception:`, error);
          // Safe fallback for any exception
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 100);
        }
      } else {
        console.warn(`[AuthService] User not logged in, redirecting to login page`);
        this.router.navigate(['/login']);
      }
    }, delay);
  }
}
