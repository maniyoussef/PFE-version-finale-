import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-auth-diagnostic',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="container">
      <h1>Authentication Diagnostic Tool</h1>
      
      <mat-card>
        <mat-card-header>
          <mat-card-title>Authentication Status</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Token Present:</strong> {{hasToken ? 'Yes' : 'No'}}</p>
          <p><strong>User Data Present:</strong> {{hasUserData ? 'Yes' : 'No'}}</p>
          <p><strong>Token Expiration:</strong> {{tokenExpiration || 'Not set'}}</p>
          <p><strong>User ID:</strong> {{userId || 'Unknown'}}</p>
          <p><strong>User Role:</strong> {{userRole || 'Unknown'}}</p>
          <p><strong>API Status:</strong> {{apiStatus}}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="testApi()">Test API Connection</button>
          <button mat-raised-button color="accent" (click)="clearSession()">Clear Session</button>
          <button mat-raised-button (click)="goToLogin()">Go to Login</button>
        </mat-card-actions>
      </mat-card>
      
      <mat-card *ngIf="tokenDetails">
        <mat-card-header>
          <mat-card-title>Token Details</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <pre>{{tokenDetails | json}}</pre>
        </mat-card-content>
      </mat-card>
      
      <mat-card *ngIf="userDetails">
        <mat-card-header>
          <mat-card-title>User Details</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <pre>{{userDetails | json}}</pre>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }
    
    mat-card {
      margin-bottom: 20px;
    }
    
    button {
      margin-right: 10px;
    }
    
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      max-height: 300px;
      overflow: auto;
    }
  `]
})
export class AuthDiagnosticComponent implements OnInit {
  hasToken = false;
  hasUserData = false;
  tokenExpiration: string | null = null;
  userId: string | null = null;
  userRole: string | null = null;
  apiStatus = 'Not tested';
  tokenDetails: any = null;
  userDetails: any = null;
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}
  
  ngOnInit(): void {
    // Check token
    const token = localStorage.getItem('token');
    this.hasToken = !!token;
    
    // Parse token to show details if present
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          this.tokenDetails = payload;
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    // Check user data
    const userData = localStorage.getItem('userData');
    this.hasUserData = !!userData;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.userId = user.id;
        this.userRole = user.roles?.[0] || null;
        this.userDetails = user;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Check expiration
    const expiration = localStorage.getItem('expiration');
    if (expiration) {
      const expirationDate = new Date(expiration);
      const now = new Date();
      
      if (expirationDate <= now) {
        this.tokenExpiration = `EXPIRED on ${expirationDate.toLocaleString()}`;
      } else {
        this.tokenExpiration = `Valid until ${expirationDate.toLocaleString()}`;
      }
    }
  }
  
  testApi(): void {
    this.apiStatus = 'Testing...';
    
    // Make a test call to the API health endpoint
    this.http.get('http://localhost:5000/api/health', { responseType: 'text' })
      .pipe(
        catchError(error => {
          this.apiStatus = `Error: ${error.status} ${error.statusText}`;
          return of(null);
        })
      )
      .subscribe(result => {
        if (result) {
          this.apiStatus = `Connected: ${result}`;
        }
      });
  }
  
  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('expiration');
    this.ngOnInit(); // Refresh the data
  }
  
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
} 