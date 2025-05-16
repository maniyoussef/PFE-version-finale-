import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule],
  template: `
    <mat-toolbar class="top-bar">
      <div class="top-bar-content">
        <div class="top-bar-links">
          <a routerLink="/support" class="top-link">
            <mat-icon>help_outline</mat-icon>
            <span>Support</span>
          </a>
          <a routerLink="/about" class="top-link">
            <mat-icon>info_outline</mat-icon>
            <span>About Us</span>
          </a>
          <a routerLink="/policy" class="top-link">
            <mat-icon>policy</mat-icon>
            <span>Policy</span>
          </a>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .top-bar {
      position: relative;
      height: 40px;
      min-height: 40px;
      max-height: 40px;
      background-color: var(--background-primary);
      border-bottom: 1px solid var(--border-color);
      z-index: 2;
      transition: all 0.3s ease;
      padding: 0;
      margin: 0;
    }

    .top-bar-content {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .top-bar-links {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      height: 100%;
    }

    .top-link {
      color: var(--text-primary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.5rem;
      border-radius: 4px;
      transition: all 0.2s ease;
      height: 100%;

      mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
      }

      &:hover {
        color: var(--accent-color);
        background-color: rgba(227, 111, 22, 0.1);
      }
    }

    @media (max-width: 768px) {
      .top-bar {
        height: 30px;
        min-height: 30px;
        max-height: 30px;
      }

      .top-bar-content {
        padding: 0;
      }

      .top-bar-links {
        gap: 1rem;
      }

      .top-link {
        span {
          display: none;
        }
      }
    }
  `]
})
export class TopBarComponent {} 