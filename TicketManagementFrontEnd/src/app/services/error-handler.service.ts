import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  constructor() { }
  
  /**
   * Get a user-friendly error message from any HTTP error
   * @param error Any error object
   * @returns A user-friendly error message
   */
  getErrorMessage(error: any): string {
    if (!error) {
      return 'Une erreur inconnue est survenue';
    }
    
    // Handle HTTP errors
    if (error instanceof HttpErrorResponse) {
      return this.handleHttpError(error);
    }
    
    // Handle JavaScript errors
    if (error instanceof Error) {
      return `Erreur: ${error.message}`;
    }
    
    // If it's a string, return it directly
    if (typeof error === 'string') {
      return error;
    }
    
    // Handle generic objects with message property
    if (error.message) {
      return `Erreur: ${error.message}`;
    }
    
    // If it's a custom object with error info
    if (error.error && error.error.message) {
      return `Erreur: ${error.error.message}`;
    }
    
    // Fallback
    return 'Une erreur est survenue lors de la communication avec le serveur';
  }
  
  /**
   * Handle HTTP specific errors and return user-friendly messages
   * @param error HttpErrorResponse
   * @returns User-friendly error message
   */
  private handleHttpError(error: HttpErrorResponse): string {
    // Network error (no connection to server)
    if (error.status === 0) {
      return 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
    }
    
    // Handle specific HTTP status codes
    switch (error.status) {
      case 400:
        return 'Données invalides. Veuillez vérifier les informations saisies.';
      case 401:
        return 'Vous devez vous connecter pour accéder à cette fonctionnalité.';
      case 403:
        return 'Vous n\'avez pas les droits nécessaires pour effectuer cette action.';
      case 404:
        return 'La ressource demandée n\'existe pas sur le serveur.';
      case 408:
        return 'Le serveur a mis trop de temps à répondre. Veuillez réessayer.';
      case 429:
        return 'Trop de requêtes. Veuillez attendre quelques instants avant de réessayer.';
      case 500:
        return 'Le serveur a rencontré une erreur interne. L\'équipe technique a été notifiée.';
      case 502:
        return 'Le serveur est temporairement indisponible. Veuillez réessayer dans quelques minutes.';
      case 503:
        return 'Le service est temporairement indisponible pour cause de maintenance ou de surcharge.';
      case 504:
        return 'Le serveur a mis trop de temps à répondre. Veuillez réessayer plus tard.';
      default:
        // Try to extract the most useful error information
        if (error.error && typeof error.error === 'object') {
          if (error.error.message) {
            return `Erreur: ${error.error.message}`;
          }
          if (error.error.detail) {
            return `Erreur: ${error.error.detail}`;
          }
        }
        
        // Use the status text if available
        if (error.statusText) {
          return `Erreur ${error.status}: ${error.statusText}`;
        }
        
        // Fallback to generic error with status code
        return `Erreur de serveur (code: ${error.status})`;
    }
  }
  
  /**
   * Get a technical detailed error message for logging
   * @param error Any error object
   * @returns Technical error details for logging
   */
  getTechnicalErrorDetails(error: any): string {
    if (!error) {
      return 'Unknown error (null or undefined)';
    }
    
    if (error instanceof HttpErrorResponse) {
      return `HTTP Error ${error.status} (${error.statusText}): ${JSON.stringify(error.error)}`;
    }
    
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\nStack: ${error.stack}`;
    }
    
    if (typeof error === 'object') {
      try {
        return JSON.stringify(error);
      } catch (e) {
        return `Object serialization failed: ${Object.prototype.toString.call(error)}`;
      }
    }
    
    return String(error);
  }
} 