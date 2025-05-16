import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-main-content',
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
    MatSnackBarModule,
  ],
})
export class MainContentComponent {
  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }
}
