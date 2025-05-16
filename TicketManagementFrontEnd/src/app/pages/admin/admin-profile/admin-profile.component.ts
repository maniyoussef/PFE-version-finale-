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

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss'],
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
    MatSnackBarModule
  ],
})
export class AdminProfileComponent implements OnInit {
  user: User | null = null;
  passwordForm: FormGroup;
  isPasswordFormVisible = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
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
    this.authService.getCurrentUser().subscribe(user => {
      this.user = user;
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
        console.error('Error changing password:', error);
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
}
