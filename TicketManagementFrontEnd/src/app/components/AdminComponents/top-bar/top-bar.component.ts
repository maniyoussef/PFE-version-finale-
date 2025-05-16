// top-bar.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, MatButtonModule],
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss'],
})
export class TopBarComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  toggleSidenav() {
    // Implement sidenav toggle logic
  }

  logout(): void {
    try {
      this.authService.logout();
      this.snackBar.open('Déconnexion réussie', 'Fermer', {
        duration: 3000,
      });
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Error during logout:', error);
      this.snackBar.open('Erreur lors de la déconnexion', 'Fermer', {
        duration: 5000,
      });
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
