import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `<router-outlet></router-outlet>`,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  title = 'TicketManagementFrontEnd';
  isAdminRoute = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Handle route changes
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.isAdminRoute = event.url.includes('/admin');
      });

    // Check authentication state on app initialization
    this.checkAuthenticationState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkAuthenticationState() {
    const token = this.authService.getToken();
    const tokenExpiration = localStorage.getItem('tokenExpiration');

    if (token && tokenExpiration) {
      const expirationDate = new Date(tokenExpiration);
      const now = new Date();

      if (expirationDate <= now) {
        // Token is expired, logout and redirect to login
        this.authService.logout();
        // Only navigate to login if we're not already there
        if (!this.router.url.includes('/login')) {
          this.router.navigate(['/login']);
        }
      }
    }
  }
}
