// src/app/pages/not-found/not-found.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopBarComponent } from '../../components/AdminComponents/top-bar/top-bar.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
})
export class NotFoundComponent {}
