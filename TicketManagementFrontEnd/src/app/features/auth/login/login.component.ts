import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-background">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
      
      <div class="login-container" [@fadeInAnimation]>
        <div class="login-card">
          <div class="logo-container">
            <img src="/logo.png" alt="SimSoft Logo" class="logo" />
            <h1 class="company-name"><span class="text-primary">Sim</span><span class="text-secondary">Soft</span></h1>
          </div>
          
          <h2 class="welcome-text">Bon Retour</h2>
          <p class="subtitle">Connectez-vous à votre compte</p>
          
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" [@formAnimation]>
            <div class="form-group" [class.focused]="emailFocused || email?.value">
              <label for="email">
                <i class="form-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                  </svg>
                </i>
                Email
              </label>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-control"
                [class.is-invalid]="email?.invalid && email?.touched"
                (focus)="emailFocused = true"
                (blur)="emailFocused = false"
              />
              <div
                class="invalid-feedback"
                *ngIf="email?.invalid && email?.touched"
                [@fadeInAnimation]
              >
                <span *ngIf="email?.errors?.['required']">L'email est requis</span>
                <span *ngIf="email?.errors?.['email']">Veuillez saisir un email valide</span>
              </div>
            </div>

            <div class="form-group" [class.focused]="passwordFocused || password?.value">
              <label for="password">
                <i class="form-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                  </svg>
                </i>
                Mot de passe
              </label>
              <div class="password-input-container">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  id="password"
                  formControlName="password"
                  class="form-control"
                  [class.is-invalid]="password?.invalid && password?.touched"
                  (focus)="passwordFocused = true"
                  (blur)="passwordFocused = false"
                />
                <button 
                  type="button" 
                  class="password-toggle" 
                  (click)="togglePasswordVisibility($event)"
                  [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                >
                  <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                  </svg>
                  <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path d="M0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0z" fill="none"/>
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              <div
                class="invalid-feedback"
                *ngIf="password?.invalid && password?.touched"
                [@fadeInAnimation]
              >
                <span *ngIf="password?.errors?.['required']">Le mot de passe est requis</span>
                <span *ngIf="password?.errors?.['minlength']">
                  Le mot de passe doit comporter au moins 6 caractères
                </span>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" formControlName="rememberMe" />
                <span class="checkmark"></span>
                Se souvenir de moi
              </label>
              <a href="#" class="forgot-password" (click)="openResetPasswordModal($event)">Mot de passe oublié ?</a>
            </div>

            <div class="alert alert-danger" *ngIf="error()" [@fadeInAnimation]>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {{ error() }}
            </div>

            <button
              type="submit"
              class="btn btn-primary login-button"
              [disabled]="loginForm.invalid || isLoading()"
              [class.loading]="isLoading()"
            >
              <span class="btn-text">{{ isLoading() ? 'Connexion en cours...' : 'Se connecter' }}</span>
              <span class="spinner" *ngIf="isLoading()"></span>
            </button>
          </form>
          
          <div class="login-footer">
            <p>© {{ currentYear }} SimSoft. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Password Reset Modal -->
    <div class="modal" [class.active]="showResetModal">
      <div class="modal-overlay" (click)="closeResetModal()"></div>
      <div class="modal-container" [@fadeInAnimation]>
        <div class="modal-header">
          <h3>{{ resetPasswordSent ? 'Email envoyé' : 'Réinitialisation du mot de passe' }}</h3>
          <button class="close-button" (click)="closeResetModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div *ngIf="!resetPasswordSent">
            <p>Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.</p>
            
            <form [formGroup]="resetForm" (ngSubmit)="onResetSubmit()" class="reset-form">
              <div class="form-group" [class.focused]="resetEmailFocused || resetEmail?.value">
                <label for="resetEmail">
                  <i class="form-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                      <path d="M0 0h24v24H0z" fill="none"/>
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                    </svg>
                  </i>
                  Email
                </label>
                <input
                  type="email"
                  id="resetEmail"
                  formControlName="email"
                  class="form-control"
                  [class.is-invalid]="resetEmail?.invalid && resetEmail?.touched"
                  (focus)="resetEmailFocused = true"
                  (blur)="resetEmailFocused = false"
                />
                <div
                  class="invalid-feedback"
                  *ngIf="resetEmail?.invalid && resetEmail?.touched"
                  [@fadeInAnimation]
                >
                  <span *ngIf="resetEmail?.errors?.['required']">L'email est requis</span>
                  <span *ngIf="resetEmail?.errors?.['email']">Veuillez saisir un email valide</span>
                </div>
              </div>
              
              <div class="alert alert-danger" *ngIf="resetError" [@fadeInAnimation]>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {{ resetError }}
              </div>
              
              <button
                type="submit"
                class="btn btn-primary reset-button"
                [disabled]="resetForm.invalid || resetLoading"
                [class.loading]="resetLoading"
              >
                <span class="btn-text">{{ resetLoading ? 'Envoi en cours...' : 'Envoyer le lien' }}</span>
                <span class="spinner" *ngIf="resetLoading"></span>
              </button>
            </form>
          </div>
          
          <div *ngIf="resetPasswordSent" class="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p>Si l'adresse email est correcte, vous recevrez un lien de réinitialisation de mot de passe dans votre boîte de réception.</p>
            <p class="note">Vérifiez également vos dossiers spam et indésirables.</p>
            <button class="btn btn-secondary" (click)="closeResetModal()">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Color Variables */
      :host {
        --primary-color: #ff7043;
        --primary-light: #ffccbc;
        --primary-dark: #e64a19;
        --secondary-color: #333;
        --text-color: #333;
        --text-light: #757575;
        --error-color: #d32f2f;
        --success-color: #2e7d32;
        --background-color: #f8f9fa;
        --card-background: #ffffff;
        --input-border: #e0e0e0;
        --input-focus-border: #ff7043;
        --shadow-color: rgba(0, 0, 0, 0.1);
        --animation-duration: 0.3s;
        --modal-overlay: rgba(0, 0, 0, 0.5);
      }

      /* Animations */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes float {
        0% {
          transform: translateY(0px) rotate(0deg);
        }
        50% {
          transform: translateY(-20px) rotate(5deg);
        }
        100% {
          transform: translateY(0px) rotate(0deg);
        }
      }

      @keyframes pulse {
        0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(255, 112, 67, 0.7);
        }
        70% {
          transform: scale(1);
          box-shadow: 0 0 0 10px rgba(255, 112, 67, 0);
        }
        100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(255, 112, 67, 0);
        }
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes gradient-animation {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }

      /* Main Styles */
      .login-page {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: var(--background-color);
        position: relative;
        overflow: hidden;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .login-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        overflow: hidden;
      }

      .shape {
        position: absolute;
        border-radius: 50%;
        background: linear-gradient(45deg, var(--primary-color), var(--primary-light));
        opacity: 0.1;
      }

      .shape-1 {
        width: 500px;
        height: 500px;
        top: -250px;
        left: -100px;
        animation: float 15s infinite ease-in-out;
      }

      .shape-2 {
        width: 400px;
        height: 400px;
        bottom: -200px;
        right: -100px;
        animation: float 20s infinite ease-in-out reverse;
      }

      .shape-3 {
        width: 300px;
        height: 300px;
        top: 50%;
        left: 10%;
        animation: float 25s infinite ease-in-out 2s;
      }

      .shape-4 {
        width: 200px;
        height: 200px;
        top: 20%;
        right: 10%;
        animation: float 18s infinite ease-in-out 1s;
      }

      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 1200px;
        min-height: 100vh;
        padding: 2rem;
        position: relative;
        z-index: 1;
      }

      .login-card {
        background: var(--card-background);
        width: 100%;
        max-width: 450px;
        padding: 2.5rem;
        border-radius: 16px;
        box-shadow: 0 10px 25px var(--shadow-color);
        position: relative;
        overflow: hidden;
        animation: fadeIn 0.8s ease-out forwards;
      }

      .logo-container {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      .logo {
        height: 40px;
        margin-right: 10px;
      }

      .company-name {
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0;
      }

      .text-primary {
        color: var(--primary-color);
      }

      .text-secondary {
        color: var(--secondary-color);
      }

      .welcome-text {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-color);
        margin: 0 0 0.5rem;
        text-align: center;
      }

      .subtitle {
        font-size: 1rem;
        color: var(--text-light);
        margin: 0 0 2rem;
        text-align: center;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
        position: relative;
        transition: all var(--animation-duration) ease;
      }

      .form-group label {
        display: flex;
        align-items: center;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-light);
        margin-bottom: 0.5rem;
        transition: all var(--animation-duration) ease;
      }

      .form-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 0.5rem;
        color: var(--text-light);
        transition: color var(--animation-duration) ease;
      }

      .form-group.focused label {
        color: var(--primary-color);
      }

      .form-group.focused .form-icon {
        color: var(--primary-color);
      }

      .form-control {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        background-color: #f5f5f5;
        border: 2px solid transparent;
        border-radius: 8px;
        outline: none;
        transition: all var(--animation-duration) ease;
      }

      .form-control:focus {
        border-color: var(--primary-color);
        background-color: rgba(255, 112, 67, 0.05);
        box-shadow: 0 0 0 4px rgba(255, 112, 67, 0.1);
      }

      .form-control.is-invalid {
        border-color: var(--error-color);
        background-color: rgba(211, 47, 47, 0.05);
      }

      .password-input-container {
        position: relative;
      }

      .password-toggle {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: color var(--animation-duration) ease;
      }

      .password-toggle:hover {
        color: var(--primary-color);
      }

      .invalid-feedback {
        color: var(--error-color);
        font-size: 0.8rem;
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
      }

      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
      }

      .remember-me {
        display: flex;
        align-items: center;
        position: relative;
        padding-left: 30px;
        cursor: pointer;
        color: var(--text-light);
      }

      .remember-me input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }

      .checkmark {
        position: absolute;
        top: 0;
        left: 0;
        height: 20px;
        width: 20px;
        background-color: #f5f5f5;
        border-radius: 4px;
        transition: all var(--animation-duration) ease;
      }

      .remember-me:hover .checkmark {
        background-color: #e0e0e0;
      }

      .remember-me input:checked ~ .checkmark {
        background-color: var(--primary-color);
      }

      .checkmark:after {
        content: "";
        position: absolute;
        display: none;
      }

      .remember-me input:checked ~ .checkmark:after {
        display: block;
      }

      .remember-me .checkmark:after {
        left: 7px;
        top: 3px;
        width: 6px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }

      .forgot-password {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 500;
        transition: color var(--animation-duration) ease;
      }

      .forgot-password:hover {
        color: var(--primary-dark);
        text-decoration: underline;
      }

      .alert {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        animation: fadeIn var(--animation-duration) ease;
      }

      .alert svg {
        margin-right: 0.5rem;
        flex-shrink: 0;
      }

      .alert-danger {
        background-color: rgba(211, 47, 47, 0.1);
        color: var(--error-color);
      }

      .login-button {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: white;
        background: linear-gradient(45deg, var(--primary-color), var(--primary-dark));
        background-size: 200% 200%;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        overflow: hidden;
        transition: all var(--animation-duration) ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .login-button:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 7px 14px rgba(0, 0, 0, 0.1);
        animation: gradient-animation 3s ease infinite;
      }

      .login-button:not(:disabled):active {
        transform: translateY(1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .login-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        background: #cccccc;
      }

      .btn-text {
        position: relative;
        z-index: 1;
      }

      .spinner {
        position: relative;
        width: 20px;
        height: 20px;
        margin-left: 10px;
      }

      .spinner:after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .login-footer {
        margin-top: 2rem;
        text-align: center;
        font-size: 0.8rem;
        color: var(--text-light);
      }

      /* Responsive Styles */
      @media (max-width: 576px) {
        .login-card {
          padding: 1.5rem;
          border-radius: 12px;
        }

        .login-container {
          padding: 1rem;
        }

        .form-options {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .forgot-password {
          align-self: flex-end;
        }
      }

      /* Modal Styles */
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
      }
      
      .modal.active {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--modal-overlay);
        animation: fadeIn 0.3s ease-out;
      }
      
      .modal-container {
        position: relative;
        width: 90%;
        max-width: 500px;
        background-color: var(--card-background);
        border-radius: 12px;
        box-shadow: 0 10px 25px var(--shadow-color);
        z-index: 1001;
        overflow: hidden;
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--input-border);
      }
      
      .modal-header h3 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-color);
      }
      
      .close-button {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        color: var(--text-light);
        transition: color var(--animation-duration) ease;
      }
      
      .close-button:hover {
        color: var(--error-color);
      }
      
      .modal-body {
        padding: 1.5rem;
      }
      
      .reset-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-top: 1rem;
      }
      
      .reset-button {
        margin-top: 1rem;
      }
      
      .success-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 1rem 0;
      }
      
      .success-message svg {
        margin-bottom: 1.5rem;
      }
      
      .success-message p {
        margin-bottom: 1rem;
        color: var(--text-color);
      }
      
      .success-message .note {
        font-size: 0.9rem;
        color: var(--text-light);
        margin-bottom: 1.5rem;
      }
      
      .btn-secondary {
        background: #e0e0e0;
        color: var(--text-color);
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--animation-duration) ease;
      }
      
      .btn-secondary:hover {
        background: #d0d0d0;
      }
    `,
  ],
  animations: [
    trigger('fadeInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('formAnimation', [
      transition(':enter', [
        query('.form-group', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Login form and states
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  isLoading = this.authService.isLoading;
  error = this.authService.error;
  showPassword = false;
  emailFocused = false;
  passwordFocused = false;
  currentYear = new Date().getFullYear();
  
  // Password reset states
  showResetModal = false;
  resetPasswordSent = false;
  resetLoading = false;
  resetError: string | null = null;
  resetEmailFocused = false;
  
  // Reset password form
  resetForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    // Pre-fill email field for development if needed
    if (localStorage.getItem('dev_email')) {
      this.loginForm.patchValue({
        email: localStorage.getItem('dev_email')
      });
    }
  }

  get email() {
    return this.loginForm.get('email');
  }
  
  get password() {
    return this.loginForm.get('password');
  }
  
  get resetEmail() {
    return this.resetForm.get('email');
  }

  togglePasswordVisibility(event: Event): void {
    event.preventDefault();
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: () => {
          // Error is handled by the service
          this.loginForm.get('password')?.reset();
        },
      });
    } else {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }
  
  openResetPasswordModal(event: Event): void {
    event.preventDefault();
    this.showResetModal = true;
    this.resetPasswordSent = false;
    this.resetError = null;
    
    // Pre-fill the email from the login form if it exists
    if (this.email?.valid) {
      this.resetForm.patchValue({
        email: this.email.value
      });
    }
  }
  
  closeResetModal(): void {
    this.showResetModal = false;
    this.resetForm.reset();
  }
  
  onResetSubmit(): void {
    if (this.resetForm.valid) {
      this.resetLoading = true;
      this.resetError = null;
      
      const { email } = this.resetForm.value;
      
      this.authService.requestPasswordReset(email).subscribe({
        next: () => {
          this.resetLoading = false;
          this.resetPasswordSent = true;
        },
        error: (err) => {
          this.resetLoading = false;
          this.resetError = err.message || 'Une erreur est survenue. Veuillez réessayer plus tard.';
        }
      });
    } else {
      this.resetForm.markAllAsTouched();
    }
  }
}
