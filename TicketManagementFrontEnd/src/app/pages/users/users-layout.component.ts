import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserNavbarComponent } from '../../components/UserComponents/user-navbar/user-navbar.component';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';

@Component({
  selector: 'app-users-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, UserNavbarComponent, TopBarComponent],
  template: `
    <div class="users-layout">
      <!-- TopBar and Navbar -->
      <app-top-bar></app-top-bar>
      <app-user-navbar></app-user-navbar>
      
      <!-- Animated Backgrounds -->
      <div class="particle-background"></div>
      <div class="animated-gradient"></div>
      
      <!-- Main Content -->
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --primary-color: #ff9800; // Light orange
        --dark-color: #f57c00;    // Dark orange
        --light-color: #ffe0b2;   // Light orange background
        --primary-black: #333333;
        --primary-gray: #f5f5f5;
        --card-radius: 15px;
        --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.06), 0 5px 15px rgba(0, 0, 0, 0.03);
        --animation-duration: 0.6s;
        --topbar-height: 30px;
        --navbar-height: 60px;
        --navbar-top-margin: 4px; /* Added margin for navbar positioning */
        display: block;
        min-height: 100vh;
      }

      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .users-layout {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: linear-gradient(135deg, #f8f9fa 0%, #fff8e1 100%);
        position: relative;
        padding-top: calc(var(--topbar-height) + var(--navbar-height) + var(--navbar-top-margin) + 4px); /* Adjusted for navbar margin and additional space */
        overflow: hidden;
      }
      
      .main-content {
        flex: 1;
        position: relative;
        z-index: 10;
        animation: fadeIn var(--animation-duration) ease-out;
      }

      app-top-bar,
      app-user-navbar {
        width: 100%;
        background-color: white;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        position: fixed;
        left: 0;
        z-index: 1000;
        margin: 0;
        padding: 0;
      }

      app-top-bar {
        top: 0;
        height: var(--topbar-height);
        max-height: var(--topbar-height);
        min-height: var(--topbar-height);
      }

      app-user-navbar {
        top: var(--topbar-height);
        height: var(--navbar-height);
        max-height: var(--navbar-height);
        min-height: var(--navbar-height);
        background-color: white;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        z-index: 990;
        margin-top: var(--navbar-top-margin); /* Added margin-top to match the navbar component */
      }
      
      // Animated background - Matching exactly with profile component
      .animated-gradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(120deg, rgba(255, 255, 255, 0), rgba(255, 152, 0, 0.05), rgba(245, 124, 0, 0.03), rgba(255, 255, 255, 0));
        background-size: 300% 300%;
        animation: gradientFlow 30s ease infinite;
        z-index: 0;
      }

      // Particle background - Matching exactly with profile component
      .particle-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        z-index: 0;
      }

      .particle-background::after {
        content: "";
        position: absolute;
        width: 100%;
        height: 150%;
        top: -25%;
        left: 0;
        background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ff9800' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
        animation: gradientFlow 120s linear infinite;
      }

      @media (max-width: 768px) {
        .users-layout {
          padding-top: calc(36px + 55px + 4px + 4px); /* Adjusted for smaller heights: topbar (36px) + navbar (55px) + margins */
        }

        app-top-bar {
          height: 36px;
        }

        app-user-navbar {
          top: 36px;
          height: 55px;
          margin-top: 4px; /* Keep consistent margin for mobile */
        }
      }
    `,
  ],
})
export class UsersLayoutComponent {}
