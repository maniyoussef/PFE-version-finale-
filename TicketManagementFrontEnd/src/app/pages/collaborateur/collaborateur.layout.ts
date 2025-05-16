import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { CollaborateurNavbarComponent } from '../../components/CollaborateurComponents/Collaborateur-Navbar.component/Collaborateur-Navbar.component';
import { TopBarComponent } from '../../components/AdminComponents/top-bar/top-bar.component';

@Component({
  selector: 'app-collaborateur-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    CollaborateurNavbarComponent,
    TopBarComponent,
  ],
  templateUrl: './collaborateur.layout.html',
  styleUrls: ['./collaborateur.layout.scss'],
})
export class CollaborateurLayoutComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    console.log('[CollaborateurLayout] 🚀 Component initialized');

    // Check the current route and navigate to dashboard if needed
    if (
      this.router.url === '/collaborateur' ||
      this.router.url === '/direct-collab'
    ) {
      console.log('[CollaborateurLayout] 🔄 Redirecting to dashboard');
      this.router.navigate(['/collaborateur/dashboard']);
    }
  }
}
