import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar'; // ✅ Angular Material Toolbar
import { Router, RouterModule } from '@angular/router';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { UserNavbarComponent } from '../../../components/UserComponents/user-navbar/user-navbar.component';
import { UsersMainContentComponent } from '../../../components/UserComponents/user-maincontent/user-maincontent.component';

@Component({
  selector: 'app-users-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    RouterModule,
    UserNavbarComponent,
    TopBarComponent,
    UsersMainContentComponent,
  ], // ✅ Ensure UserNavbarComponent exists
  templateUrl: './users-dashboard.component.html',

  styleUrls: ['./users-dashboard.component.scss'], // ✅ Changed from `styleUrl` to `styleUrls`
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class UsersDashboardComponent {
  constructor(public router: Router) {}
}
