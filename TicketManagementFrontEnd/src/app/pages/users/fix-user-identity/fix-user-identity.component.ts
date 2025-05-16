import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fix-user-identity',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Fix User Identity</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Current user ID: {{ currentUserId }}</p>
          <p>This utility fixes user identity issues when the stored ID doesn't match the actual user ID.</p>
          
          <mat-form-field>
            <mat-label>New User ID</mat-label>
            <input matInput type="number" [(ngModel)]="newUserId" />
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="fixIdentity()">Fix Identity</button>
          <button mat-button (click)="goBack()">Go Back</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    
    mat-card {
      max-width: 400px;
      width: 100%;
    }
    
    mat-form-field {
      width: 100%;
      margin-top: 20px;
    }
    
    mat-card-actions {
      display: flex;
      justify-content: space-between;
    }
  `]
})
export class FixUserIdentityComponent implements OnInit {
  currentUserId: number | null = null;
  newUserId: number = 3; // Default to 3, which is the actual user ID

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user ID from localStorage
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        this.currentUserId = userData.id;
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }
  }

  fixIdentity(): void {
    if (!this.newUserId) {
      this.snackBar.open('Please enter a valid user ID', 'Close', { duration: 3000 });
      return;
    }

    this.snackBar.open('Fixing user identity...', 'Close', { duration: 2000 });
    
    this.authService.resetUserIdentity(this.newUserId).subscribe((success: boolean) => {
      if (success) {
        this.snackBar.open(`User identity updated to ID: ${this.newUserId}`, 'Close', { duration: 3000 });
        
        // Navigate to the tickets page after a short delay
        setTimeout(() => {
          this.router.navigate(['/client/mes-tickets']);
        }, 1500);
      } else {
        this.snackBar.open('Failed to update user identity. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/mes-tickets']);
  }
} 