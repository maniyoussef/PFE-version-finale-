// policy.component.ts
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TopBarComponent } from '../../components/AdminComponents/top-bar/top-bar.component';
import { NavbarComponent } from '../../components/AdminComponents/navbar/navbar.component';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    TopBarComponent,
    NavbarComponent,
    MatButtonModule
  ],
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss']
})
export class PolicyComponent {
  constructor(private router: Router, private authService: AuthService) {}
  
  navigateToDashboard(): void {
    const userRole = this.authService.userRole();
    
    if (!userRole) {
      this.router.navigate(['/login']);
      return;
    }
    
    switch (userRole.toUpperCase()) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'CHEF PROJET':
        this.router.navigate(['/chef-projet/dashboard']);
        break;
      case 'COLLABORATEUR':
        this.router.navigate(['/collaborateur/dashboard']);
        break;
      default:
        this.router.navigate(['/user/dashboard']);
        break;
    }
  }
}
