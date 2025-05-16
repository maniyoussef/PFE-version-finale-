import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  Router,
  NavigationEnd,
  Event as RouterEvent,
  ActivatedRoute,
  NavigationStart,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { TopBarComponent } from '../../components/AdminComponents/top-bar/top-bar.component';
import { NavbarComponent } from '../../components/AdminComponents/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { UserRole } from '../../core/constants/roles';
import {
  Subject,
  filter,
  takeUntil,
  distinctUntilChanged,
  map,
  tap,
  take,
  BehaviorSubject,
  Observable,
  merge,
  debounceTime,
  skip,
  combineLatest,
  firstValueFrom,
} from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="admin-dashboard-container">
      <app-top-bar></app-top-bar>
      <app-navbar></app-navbar>
      <main class="admin-main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      /* Define CSS variables at :host level for consistency */
      :host {
        --topbar-height: 30px;
        --navbar-height: 40px;
        --topbar-plus-navbar: 70px;
        --content-padding: 16px;

        /* Color theme aligned with navbar */
        --primary: #ff7043;
        --primary-light: #ffccbc;
        --primary-dark: #e64a19;
        --text-dark: #333333;
        --text-medium: #545454;
        --text-light: #757575;
        --background: #ffffff;
        --surface: #f8f9fa;
        --surface-alt: #f2f2f2;
        --divider: #e0e0e0;
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08),
          0 1px 2px rgba(0, 0, 0, 0.12);
        --shadow: 0 3px 6px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.15);
        --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.12),
          0 6px 6px rgba(0, 0, 0, 0.1);
        --border-radius: 8px;
      }

      .admin-dashboard-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        width: 100%;
        overflow-x: hidden;
        padding-top: 70px;
        background-color: var(--surface);
        color: var(--text-dark);
      }

      app-top-bar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: var(--topbar-height);
        z-index: 1002;
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
      }

      app-navbar {
        position: fixed;
        top: var(--topbar-height);
        left: 0;
        width: 100%;
        height: var(--navbar-height);
        z-index: 1001;
        box-shadow: var(--shadow-sm);
        display: block !important;
        visibility: visible !important;
      }

      ::ng-deep app-navbar * {
        visibility: visible;
      }

      .admin-main-content {
        width: 100%;
        min-height: calc(100vh - var(--topbar-plus-navbar));
        padding: 20px var(--content-padding) var(--content-padding);
        box-sizing: border-box;
      }

      /* Global styles for dashboard cards and UI elements */
      ::ng-deep {
        /* Card styling */
        .mat-card {
          border-radius: var(--border-radius);
          box-shadow: var(--shadow);
          border: 1px solid var(--divider);
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;

          &:hover {
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
          }
        }

        /* Button styling */
        .mat-raised-button.mat-primary {
          background-color: var(--primary);
        }

        .mat-button.mat-primary {
          color: var(--primary);
        }

        /* Table styling */
        .mat-table {
          background-color: var(--background);
          border-radius: var(--border-radius);
          overflow: hidden;
          box-shadow: var(--shadow-sm);

          .mat-header-row {
            background-color: var(--surface-alt);
          }

          .mat-header-cell {
            color: var(--text-medium);
            font-weight: 600;
          }

          .mat-row:nth-child(even) {
            background-color: var(--surface);
          }

          .mat-row:hover {
            background-color: rgba(255, 112, 67, 0.04);
          }
        }

        /* Paginator styling */
        .mat-paginator {
          background-color: var(--surface-alt);
          border-top: 1px solid var(--divider);
        }
      }

      @media (max-width: 768px) {
        :host {
          --topbar-height: 30px;
          --navbar-height: 40px;
          --topbar-plus-navbar: 70px;
          --content-padding: 12px;
        }

        .admin-main-content {
          padding: 0 var(--content-padding) var(--content-padding);
        }
      }

      @media (max-width: 576px) {
        :host {
          --content-padding: 8px;
        }
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule, RouterModule, TopBarComponent, NavbarComponent],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private navigationCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('[AdminLayout] 🏗️ Component constructed', {
      url: this.router.url,
      route: this.route.snapshot.url,
      queryParams: this.route.snapshot.queryParams,
      timestamp: new Date().toISOString(),
      navigationCount: this.navigationCount,
    });
  }

  async ngOnInit() {
    console.log('[AdminLayout] 🔍 Starting initialization', {
      currentUrl: this.router.url,
      routeSnapshot: this.route.snapshot.url,
      queryParams: this.route.snapshot.queryParams,
      timestamp: new Date().toISOString(),
      navigationCount: this.navigationCount,
    });

    // Log initial auth state
    const currentRole = this.authService.userRole();
    console.log('[AdminLayout] 📊 Initial auth state:', {
      hasUser: this.authService.isLoggedIn(),
      userRole: currentRole,
      isInitiallyAdmin: currentRole === UserRole.ADMIN,
      timestamp: new Date().toISOString(),
    });

    // Track all navigation events
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        tap((event) => {
          if (event instanceof NavigationStart) {
            this.navigationCount++;
            console.log(
              '[AdminLayout] 🚦 Navigation #' +
                this.navigationCount +
                ' starting:',
              {
                url: event.url,
                navigationId: event.id,
                trigger: event.navigationTrigger,
                previousUrl: this.router.url,
                timestamp: new Date().toISOString(),
              }
            );
          } else if (event instanceof NavigationEnd) {
            console.log(
              '[AdminLayout] ✅ Navigation #' +
                this.navigationCount +
                ' completed:',
              {
                url: event.url,
                navigationId: event.id,
                timestamp: new Date().toISOString(),
              }
            );
          } else if (event instanceof NavigationCancel) {
            console.warn(
              '[AdminLayout] ⚠️ Navigation #' +
                this.navigationCount +
                ' cancelled:',
              {
                url: event.url,
                reason: event.reason,
                navigationId: event.id,
                timestamp: new Date().toISOString(),
              }
            );
          } else if (event instanceof NavigationError) {
            console.error(
              '[AdminLayout] 🔴 Navigation #' +
                this.navigationCount +
                ' error:',
              {
                url: event.url,
                errorMessage: event.error?.message || 'Unknown error',
                errorName: event.error?.name,
                navigationId: event.id,
                timestamp: new Date().toISOString(),
                error: event.error
              }
            );
            
            // For error recovery - navigate directly to dashboard if we detect specific errors
            if (event.error?.message?.includes('AdminReportsComponent2') ||
                (event.error?.message?.includes('Component') && 
                event.error?.message?.includes('is not resolved'))) {
              console.log('[AdminLayout] 🔧 Recovering from component resolution error');
              
              // Use setTimeout to break the navigation cycle
              setTimeout(() => {
                // Navigate to dashboard as a recovery measure with a clean navigation
                this.router.navigate(['/admin/dashboard'], { 
                  replaceUrl: true,
                  skipLocationChange: false,
                  queryParams: {},
                  queryParamsHandling: ''
                }).then(success => {
                  console.log('[AdminLayout] Recovery navigation to dashboard:', success ? 'succeeded' : 'failed');
                }).catch(err => {
                  console.error('[AdminLayout] Failed to recover navigation:', err);
                });
              }, 100);
            }
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    console.log('[AdminLayout] 🧹 Component being destroyed', {
      currentUrl: this.router.url,
      navigationCount: this.navigationCount,
      routeSnapshot: this.route.snapshot.url,
      queryParams: this.route.snapshot.queryParams,
      timestamp: new Date().toISOString(),
    });
    this.destroy$.next();
    this.destroy$.complete();
  }
}
