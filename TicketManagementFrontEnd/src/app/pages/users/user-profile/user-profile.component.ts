import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { UserNavbarComponent } from '../../../components/UserComponents/user-navbar/user-navbar.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDividerModule,
    MatSnackBarModule,
    TopBarComponent,
    UserNavbarComponent
  ],
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  passwordForm: FormGroup = new FormGroup({});
  isPasswordFormVisible = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Create the form
    this.createForm();
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
  }
  
  private createForm(): void {
    this.passwordForm = this.fb.group(
      {
        oldPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: [
          '',
          Validators.compose([
            Validators.required,
            Validators.minLength(6),
          ]),
        ],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.checkPasswords }
    );
  }

  ngOnInit(): void {
    document.title = 'Mon Profil';
    
    // Try to load user data from localStorage first for faster display
    const userData = this.loadUserFromStorage();
    if (userData) {
      this.user = userData;
    }
    
    // Also try to load from the service for most up-to-date data
    this.loadUserFromService();
  }
  
  private loadUserFromStorage(): User | null {
    try {
      const userData = localStorage.getItem('user') || localStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
    return null;
  }
  
  private loadUserFromService(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
        }
      },
      error: (error) => {
        // If we already have user data from localStorage, just show a warning
        if (!this.user) {
          this.snackBar.open('Erreur lors de la récupération des données utilisateur', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  togglePasswordForm(): void {
    this.isPasswordFormVisible = !this.isPasswordFormVisible;
    if (!this.isPasswordFormVisible) {
      this.passwordForm.reset();
    }
  }

  checkPasswords(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { notSame: true };
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    const oldPassword = this.passwordForm.get('oldPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;
    
    this.authService.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.snackBar.open('Mot de passe changé avec succès', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.isLoading = false;
        this.passwordForm.reset();
        this.isPasswordFormVisible = false;
      },
      error: (error) => {
        let errorMessage = 'Erreur lors du changement de mot de passe';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Mot de passe actuel incorrect';
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }
  
  goBackToDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }
} 