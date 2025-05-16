# Cahier des Charges - Plateforme de Gestion de Tickets SimSoft

## Table des Matières

1. [Introduction](#1-introduction)
2. [Architecture Technique](#2-architecture-technique)
3. [Système d'Authentification](#3-système-dauthentification)
4. [Rôles et Autorisations](#4-rôles-et-autorisations)
5. [Gestion des Tickets](#5-gestion-des-tickets)
6. [Workflow des Tickets](#6-workflow-des-tickets)
7. [Interfaces Utilisateur](#7-interfaces-utilisateur)
8. [Fonctionnalités par Rôle](#8-fonctionnalités-par-rôle)
9. [Gestion des Entités](#9-gestion-des-entités)
10. [API et Services](#10-api-et-services)
11. [Sécurité](#11-sécurité)
12. [Annexes](#12-annexes)

## 1. Introduction

### 1.1 Contexte du Projet

SimSoft est une entreprise spécialisée dans les solutions ERP, la gestion de parc automobile, l'assistance technique et le développement spécifique. Cette plateforme de gestion de tickets a été développée pour centraliser les demandes clients, améliorer le suivi des incidents, et optimiser la communication entre les différentes parties prenantes.

### 1.2 Objectifs

- **Centralisation des tickets** : Regrouper toutes les demandes d'assistance et incidents dans une seule interface
- **Suivi efficace** : Suivre l'état d'avancement des tickets en temps réel
- **Assignation automatisée** : Diriger automatiquement les tickets vers les collaborateurs appropriés
- **Communication fluide** : Faciliter les échanges entre clients, développeurs et administrateurs
- **Reporting** : Générer des rapports détaillés pour analyse et prise de décision

## 2. Architecture Technique

### 2.1 Technologies Utilisées

- **Frontend** : Angular 15+ avec Angular Material
- **Backend** : ASP.NET Core avec architecture REST
- **Base de données** : MySQL
- **Authentification** : JWT (JSON Web Tokens)
- **Déploiement** : Conteneurisation avec Docker

### 2.2 Structure du Code

L'application est structurée selon une architecture modulaire:

#### 2.2.1 Frontend (Angular)

- **Core** : Contient les services fondamentaux comme l'authentification et les gardes
- **Shared** : Composants réutilisables, directives et pipes
- **Features** : Modules fonctionnels par rôle utilisateur (Admin, Chef de Projet, etc.)
- **Models** : Définition des interfaces et types
- **Services** : Communication avec l'API backend
- **Interceptors** : Gestion des requêtes HTTP et des erreurs

#### 2.2.2 Backend (ASP.NET Core)

- **Controllers** : Points d'entrée API RESTful
- **Models** : Entités de données et DTOs
- **Services** : Logique métier
- **Data** : Contexte de base de données et migrations
- **Middleware** : Gestion de l'authentification et des erreurs

## 3. Système d'Authentification

### 3.1 Processus de Connexion

1. L'utilisateur saisit ses identifiants (email et mot de passe) dans le formulaire de connexion
2. Le service d'authentification envoie ces informations à l'API backend
3. Le backend vérifie les identifiants dans la base de données
4. Si valides, un JWT est généré et renvoyé au client
5. Le token est stocké localement (localStorage) et utilisé pour toutes les requêtes ultérieures
6. Un mécanisme de rafraîchissement automatique du token est implémenté pour maintenir la session

### 3.2 Sécurité des Sessions

- Les tokens JWT expirent après 15 minutes
- Un mécanisme de rafraîchissement permet de maintenir la session active
- Utilisation de HTTPS pour toutes les communications
- Protection contre les attaques CSRF et XSS

### 3.3 Déconnexion

- Suppression du token JWT du localStorage
- Redirection vers la page de connexion
- Invalidation possible du token côté serveur pour des déconnexions forcées

## 4. Rôles et Autorisations

### 4.1 Définition des Rôles

Le système comporte cinq rôles principaux, chacun avec des autorisations spécifiques:

1. **Admin** : Accès complet à toutes les fonctionnalités du système
2. **Chef Projet** : Gestion des projets et des tickets assignés à son équipe
3. **Collaborateur** : Traitement des tickets qui lui sont assignés
4. **Client** : Création et suivi de tickets pour ses projets
5. **User** : Rôle de base avec des fonctionnalités limitées

### 4.2 Matrice des Autorisations

| Fonctionnalité                      | Admin | Chef Projet | Collaborateur | Client | User |
| ----------------------------------- | ----- | ----------- | ------------- | ------ | ---- |
| Gestion des utilisateurs            | ✅    | ❌          | ❌            | ❌     | ❌   |
| Création de projets                 | ✅    | ✅          | ❌            | ❌     | ❌   |
| Assignation de collaborateurs       | ✅    | ✅          | ❌            | ❌     | ❌   |
| Création de tickets                 | ✅    | ✅          | ✅            | ✅     | ✅   |
| Modification de tickets             | ✅    | ✅          | ✅            | ❌     | ❌   |
| Clôture de tickets                  | ✅    | ✅          | ✅            | ❌     | ❌   |
| Visualisation de tous les tickets   | ✅    | ❌          | ❌            | ❌     | ❌   |
| Rapports et statistiques            | ✅    | ✅          | ❌            | ❌     | ❌   |
| Gestion des catégories de problèmes | ✅    | ❌          | ❌            | ❌     | ❌   |
| Gestion des sociétés                | ✅    | ❌          | ❌            | ❌     | ❌   |

### 4.3 Système de Gardes (Guards)

L'accès aux différentes routes de l'application est protégé par un système de gardes:

```typescript
// Exemple de garde d'authentification avec vérification de rôle
export const authGuard = (allowedRoles?: UserRole[]) => {
  // Vérifie l'authentification et les rôles autorisés
  // Redirige vers login si non autorisé
};
```

Ces gardes sont appliqués à chaque route dans le routeur Angular pour garantir que seuls les utilisateurs autorisés peuvent accéder à certaines fonctionnalités.

## 5. Gestion des Tickets

### 5.1 Structure d'un Ticket

Un ticket contient les informations suivantes:

- **Identifiant unique** : Généré automatiquement
- **Titre** : Description courte du problème
- **Description** : Détails complets du problème
- **Statut** : En attente, En cours, Résolu, Rejeté, etc.
- **Priorité** : Basse, Moyenne, Haute, Critique
- **Qualification** : Catégorisation du type de problème
- **Projet associé** : Projet auquel le ticket est lié
- **Date de création** : Horodatage automatique
- **Date de dernière mise à jour** : Horodatage automatique
- **Assigné à** : Collaborateur responsable de la résolution
- **Créé par** : Utilisateur ayant créé le ticket
- **Commentaires** : Échanges entre les différentes parties
- **Pièces jointes** : Documents, captures d'écran, etc.
- **Rapport** : Rapport final de résolution
- **Métriques de travail** : Temps de travail, dates de début/fin, etc.

### 5.2 Création de Tickets

La création d'un ticket suit le processus suivant:

1. L'utilisateur remplit un formulaire avec les informations nécessaires
2. Validation des champs obligatoires (titre, description, etc.)
3. Attribution automatique d'un statut initial "En attente"
4. Enregistrement en base de données
5. Notification envoyée aux personnes concernées

### 5.3 Recherche et Filtrage

Les tickets peuvent être recherchés et filtrés selon plusieurs critères:

- Statut
- Priorité
- Date de création
- Projet associé
- Assigné à
- Créé par
- Qualification
- Mots-clés dans le titre/description

## 6. Workflow des Tickets

### 6.1 États du Ticket

Un ticket passe par différents états tout au long de son cycle de vie:

1. **En attente** : Ticket créé mais pas encore traité
2. **En cours** : Ticket en cours de traitement par un collaborateur
3. **Temporairement arrêté** : Traitement suspendu (attente d'information, etc.)
4. **Résolu** : Problème résolu, ticket fermé
5. **Rejeté** : Ticket non valide ou ne nécessitant pas d'action
6. **Réouvert** : Ticket précédemment résolu mais nécessitant de nouvelles actions

### 6.2 Transitions d'États

```
[En attente] → [En cours] → [Temporairement arrêté] → [En cours] → [Résolu]
                         ↘                                      ↗
                           → [Rejeté]
[Résolu] → [Réouvert] → [En cours]
```

### 6.3 Métriques de Travail

Le système suit diverses métriques pour chaque ticket:

- **Temps de traitement total** : Durée entre la création et la résolution
- **Temps de travail effectif** : Temps réellement passé sur le ticket
- **Horodatage de début/fin de travail** : Quand le travail a commencé/terminé
- **Nombre d'interactions** : Commentaires et mises à jour

## 7. Interfaces Utilisateur

### 7.1 Tableaux de Bord

Chaque rôle dispose d'un tableau de bord personnalisé:

#### 7.1.1 Admin

- Vue globale de tous les tickets
- Statistiques de performance
- Gestion des utilisateurs et des projets
- Rapports détaillés

#### 7.1.2 Chef Projet

- Tickets de ses projets
- Performance de son équipe
- Assignation des tickets
- Suivi des délais

#### 7.1.3 Collaborateur

- Tickets qui lui sont assignés
- Historique des tickets traités
- Métriques personnelles

#### 7.1.4 Client

- Ses tickets ouverts
- Historique des tickets
- Création de nouveaux tickets

### 7.2 Navigation

L'application utilise plusieurs éléments de navigation:

#### 7.2.1 Barre de Navigation Supérieure (Top Bar)

La barre de navigation supérieure contient:

- **Logo SimSoft**: Situé à gauche, permet de revenir à la page d'accueil
- **Titre de la page courante**: Affichage contextuel du titre de la page
- **Barre de recherche globale**: Recherche rapide dans tout le système
- **Notifications**: Icône avec compteur affichant les notifications non lues
- **Menu profil utilisateur**: Accès aux paramètres du compte, préférences et déconnexion
- **Indicateur de statut**: Affiche l'état de la connexion au serveur
- **Sélecteur de langue**: Pour le support multilingue

#### 7.2.2 Barre de Navigation Latérale (Sidebar)

La navigation latérale comprend:

- **Accès rapide aux fonctionnalités principales**: Dashboard, Tickets, Projets, etc.
- **Filtrage contextuel selon le rôle**: Affichage adaptatif des options selon les permissions
- **Bouton de réduction**: Permet de réduire la sidebar pour agrandir l'espace de travail
- **Indicateurs visuels**: Badges montrant le nombre d'éléments nécessitant attention
- **Regroupements logiques**: Organisation des fonctionnalités par catégorie
- **Footer**: Liens vers l'aide, la documentation et les informations de version

Les deux éléments de navigation s'adaptent aux différentes tailles d'écran (responsive design) et sont personnalisés selon le rôle de l'utilisateur connecté.

### 7.3 Formulaires et Validation

- Validation côté client pour une expérience utilisateur optimale
- Validation côté serveur pour la sécurité
- Messages d'erreur clairs et informatifs
- Prévisualisation des données avant soumission

### 7.4 Gestion des Pièces Jointes

La plateforme permet l'ajout de pièces jointes aux tickets pour une meilleure communication:

- **Téléversement de fichiers** : Possibilité d'ajouter des fichiers à un ticket lors de sa création ou modification
- **Stockage sécurisé** : Les fichiers sont stockés dans un répertoire dédié du serveur (`wwwroot/uploads`)
- **Accès aux pièces jointes** : Visualisation et téléchargement depuis l'interface utilisateur
- **Types de fichiers supportés** : Documents, images et autres formats courants

Implémentation technique:

```csharp
[HttpPost("upload")]
public async Task<IActionResult> UploadFile(IFormFile file)
{
    if (file == null || file.Length == 0)
        return BadRequest("Aucun fichier n'a été fourni");

    // Génération d'un nom de fichier unique
    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
    var filePath = Path.Combine(_environment.WebRootPath, "uploads", fileName);

    // Création du répertoire si nécessaire
    Directory.CreateDirectory(Path.Combine(_environment.WebRootPath, "uploads"));

    // Sauvegarde du fichier
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    // Retourne le chemin d'accès relatif
    return Ok(new { filePath = "/uploads/" + fileName });
}
```

### 7.5 Tableaux de Bord et Rapports

La plateforme propose des tableaux de bord adaptés à chaque rôle:

#### 7.5.1 Fonctionnalités de Reporting

- **Exportation Excel** : Possibilité d'exporter les tickets et leurs informations au format Excel
- **Filtres avancés** : Filtrage des données par période, statut, priorité, etc.
- **Métriques visuelles** : Graphiques et indicateurs de performance
- **Rapports d'activité** : Suivi des performances des équipes et des collaborateurs

#### 7.5.2 Tableaux de Bord par Rôle

Chaque rôle dispose d'un tableau de bord adapté à ses besoins:

- **Admin** : Vue globale de tous les projets, tickets et métriques de performance
- **Chef Projet** : Vue d'ensemble des projets sous sa responsabilité et des performances de son équipe
- **Collaborateur** : Suivi des tickets assignés et des métriques personnelles
- **Client** : Suivi des tickets créés et de leur état d'avancement

## 8. Fonctionnalités par Rôle

### 8.1 Admin

- **Gestion complète des utilisateurs** : Création, modification, désactivation
- **Configuration système** : Paramètres globaux, catégories, priorités
- **Rapports avancés** : Analyses de performance, temps de résolution
- **Gestion des projets** : Création, configuration, assignation
- **Supervision globale** : Vue d'ensemble de toute l'activité
- **Gestion des sociétés et clients** : Création et gestion des entités clientes

### 8.2 Chef Projet

- **Gestion d'équipe** : Assignation des collaborateurs aux projets
- **Supervision des tickets** : Suivi des tickets de ses projets
- **Assignation des tickets** : Distribution des tickets aux collaborateurs
- **Rapports d'activité** : Performance de l'équipe, statuts des tickets
- **Communication** : Interface avec les clients et collaborateurs

### 8.3 Collaborateur

- **Traitement des tickets** : Prise en charge et résolution
- **Mise à jour de statut** : Progression, commentaires, rapports
- **Gestion du temps** : Suivi du temps de travail sur chaque ticket
- **Documentation** : Rédaction de rapports et solutions

### 8.4 Client

- **Création de tickets** : Signalement de problèmes
- **Suivi de tickets** : État d'avancement de ses demandes
- **Communication** : Échanges avec l'équipe de support
- **Historique** : Consultation des tickets passés et leurs résolutions

## 9. Gestion des Entités

### 9.1 Utilisateurs

- Création et gestion des comptes utilisateurs
- Attribution des rôles et permissions
- Gestion des informations personnelles
- Désactivation/réactivation de comptes

### 9.2 Projets

- Création et configuration de projets
- Association avec des clients et collaborateurs
- Suivi de l'avancement et des métriques
- Gestion des ressources et planning

### 9.3 Sociétés/Clients

- Enregistrement des informations client
- Association avec des utilisateurs et projets
- Historique des interactions
- Métriques de satisfaction

### 9.4 Catégories de Problèmes

- Définition des types de problèmes
- Hiérarchisation et organisation
- Association avec des projets spécifiques
- Statistiques par catégorie

## 10. API et Services

### 10.1 Structure de l'API

L'API backend est organisée en contrôleurs RESTful:

- **AuthController** : Authentification et gestion des sessions
- **UsersController** : Gestion des utilisateurs
  - Création, modification, suppression et récupération des utilisateurs
  - Attribution des rôles
  - Gestion des mots de passe
  - Récupération des collaborateurs par chef de projet
- **ProjectController** : Gestion des projets
  - CRUD des projets
  - Assignation des projets aux clients et collaborateurs
  - Filtrage des projets par chef de projet ou client
- **TicketsController** : Gestion complète des tickets
  - CRUD des tickets
  - Filtrage par statut, utilisateur assigné, projet
  - Gestion des pièces jointes et commentaires
  - Suivi du workflow et des métriques de travail
- **CompaniesController** : Gestion des sociétés
  - CRUD des sociétés clientes
  - Association avec des utilisateurs et projets
- **ProblemCategoryController** : Gestion des catégories de problèmes
  - CRUD des catégories et qualifications
  - Association avec des clients spécifiques
- **RolesController** : Gestion des rôles et permissions
- **CountriesController** : Gestion des pays
  - Liste des pays disponibles
  - Ajout de pays depuis l'API externe (REST Countries)
  - Suppression de pays

### 10.2 Services Angular

Le frontend utilise des services pour communiquer avec l'API:

- **AuthService** : Authentification et gestion des sessions
- **TicketService** : Opérations CRUD sur les tickets
- **UserService** : Gestion des utilisateurs
- **ProjectService** : Gestion des projets
- **NotificationService** : Notifications temps réel
- **CompanyService** : Gestion des sociétés
- **RoleService** : Gestion des rôles et permissions
- **CountryService** : Gestion des pays
- **ExportService** : Export de données en format Excel

### 10.3 Services Intégrés

Le backend implémente plusieurs services pour le traitement métier:

#### 10.3.1 EmailService

- **Fonctionnalité** : Envoi d'emails aux utilisateurs
- **Configuration** : Utilise SMTP (configurable via appsettings.json)
- **Cas d'utilisation** :
  - Envoi des identifiants lors de la création d'un compte
  - Notifications des changements de statut des tickets
  - Réinitialisations de mot de passe

```csharp
// Exemple d'implémentation
public class EmailService : IEmailService
{
    // Configuration SMTP
    public async Task SendUserCredentialsAsync(string email, string username, string password)
    {
        // Envoi des identifiants à l'utilisateur
    }
}
```

#### 10.3.2 PasswordGeneratorService

- **Fonctionnalité** : Génération de mots de passe sécurisés
- **Cas d'utilisation** : Création de comptes utilisateurs avec mot de passe temporaire

```csharp
// Exemple d'implémentation
public class PasswordGeneratorService : IPasswordGeneratorService
{
    public string GeneratePassword()
    {
        // Génération d'un mot de passe aléatoire sécurisé
    }
}
```

#### 10.3.3 TicketService

- **Fonctionnalité** : Logique métier pour la gestion des tickets
- **Cas d'utilisation** :
  - Création et mise à jour des tickets
  - Récupération filtrée des tickets
  - Gestion du workflow et des états

#### 10.3.4 ExportService (Frontend)

- **Fonctionnalité** : Export de données en format Excel
- **Cas d'utilisation** : Génération de rapports et exports de tickets
- **Implémentation** : Utilise la bibliothèque XLSX pour générer des fichiers Excel

```typescript
// Exemple d'implémentation
export class ExportService {
  exportToExcel(tickets: Ticket[], fileName: string): void {
    // Préparation des données
    // Génération du fichier Excel
  }
}
```

#### 10.3.5 Intégrations API Externes

- **REST Countries API** : Utilisée pour la récupération des pays et de leurs drapeaux
  - Point d'entrée : `https://restcountries.com/v3.1/all`
  - Implémentation dans `CountriesController`

#### 10.3.6 Architecture des Fichiers Frontend

Le frontend Angular est organisé selon une architecture modulaire claire:

- **/src/app/core** : Services fondamentaux et gardes d'authentification

  - **/services** : Services principaux comme AuthService
  - **/constants** : Constantes globales comme les rôles et statuts
  - **/interceptors** : Intercepteurs HTTP pour l'authentification et la gestion des erreurs

- **/src/app/shared** : Composants et services partagés

  - **/components** : Composants réutilisables (boutons, modals, etc.)
  - **/services** : Services utilitaires (export, notifications, etc.)
  - **/pipes** : Pipes personnalisés pour la transformation de données
  - **/directives** : Directives Angular personnalisées

- **/src/app/features** : Modules fonctionnels par rôle

  - Chaque module représente une fonctionnalité principale

- **/src/app/pages** : Pages principales de l'application

  - Organisation par rôle utilisateur (admin, chef-projet, collaborateur, client)
  - Chaque rôle possède ses propres tableaux de bord et vues spécifiques

- **/src/app/models** : Interfaces TypeScript pour les modèles de données

  - Définition des modèles correspondant aux entités backend
  - DTOs pour les transferts de données

- **/src/app/guards** : Gardes de routes pour la sécurité
  - Implémentation du contrôle d'accès basé sur les rôles
  - Protection des routes en fonction des permissions

```typescript
// Exemple d'implémentation du garde d'authentification avec rôles
export const authGuard = (allowedRoles?: UserRole[]) => {
  return async (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> => {
    // Vérification du token et des rôles
    // Redirection si non autorisé
  };
};
```

## 11. Sécurité

### 11.1 Authentification

- Utilisation de JWT pour l'authentification
- Expiration des tokens après 15 minutes
- Rafraîchissement automatique des tokens
- Stockage sécurisé des mots de passe (hachage)

### 11.2 Autorisation

- Vérification des rôles pour chaque action
- Gardes de routes côté client
- Validation des permissions côté serveur
- Journalisation des activités sensibles

### 11.3 Protection des Données

- Chiffrement des communications (HTTPS)
- Validation des entrées contre les injections SQL
- Protection contre les attaques XSS et CSRF
- Sanitisation des données utilisateur

## 12. Annexes

### 12.1 Modèle de Données

Le modèle de données comprend les entités principales suivantes:

#### 12.1.1 User

Représente un utilisateur du système avec ses informations personnelles et son rôle.

```csharp
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public int CountryId { get; set; }
    public int RoleId { get; set; }
    public string PasswordHash { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime? ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }

    // Relations
    public Country Country { get; set; }
    public Role Role { get; set; }
    public int? ChefProjetId { get; set; }
    public User ChefProjet { get; set; }

    // Collections
    public ICollection<Project> AssignedProjects { get; set; }
    public ICollection<Company> Companies { get; set; }
    public ICollection<User> AssignedCollaborateurs { get; set; }
    public ICollection<Project> Projects { get; set; }
    public ICollection<ProblemCategory> AssignedProblemCategories { get; set; }
}
```

#### 12.1.2 Role

Définit les rôles utilisateur dans le système et leurs permissions.

```csharp
public class Role
{
    public int Id { get; set; }
    public string Name { get; set; }

    // Collection
    public ICollection<User> Users { get; set; }
}
```

#### 12.1.3 Ticket

Enregistre les tickets de support et incidents.

```csharp
public class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }
    public string Priority { get; set; }
    public string Qualification { get; set; }
    public int? ProjectId { get; set; }
    public int? ProblemCategoryId { get; set; }
    public int? AssignedToId { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public string Commentaire { get; set; }
    public bool TemporarilyStopped { get; set; }
    public bool WorkFinished { get; set; }
    public DateTime? StartWorkTime { get; set; }
    public DateTime? FinishWorkTime { get; set; }
    public int? WorkDuration { get; set; }

    // Relations
    public Project Project { get; set; }
    public ProblemCategory ProblemCategory { get; set; }
    public User AssignedTo { get; set; }
    public User CreatedBy { get; set; }

    // Collections
    public ICollection<Attachment> Attachments { get; set; }
}
```

#### 12.1.4 Project

Projets associés aux tickets et aux clients.

```csharp
public class Project
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
    public int? ChefProjetId { get; set; }

    // Relations
    public User ChefProjet { get; set; }

    // Collections
    public ICollection<Ticket> Tickets { get; set; }
    public ICollection<User> Collaborateurs { get; set; }
    public ICollection<User> Clients { get; set; }
}
```

#### 12.1.5 Company

Sociétés clientes associées aux utilisateurs.

```csharp
public class Company
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public string PhoneNumber { get; set; }
    public string Email { get; set; }

    // Collections
    public ICollection<User> Clients { get; set; }
}
```

#### 12.1.6 ProblemCategory

Catégories de problèmes pour la classification des tickets.

```csharp
public class ProblemCategory
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }

    // Collections
    public ICollection<Ticket> Tickets { get; set; }
    public ICollection<User> AssignedClients { get; set; }
}
```

#### 12.1.7 Attachment

Pièces jointes aux tickets.

```csharp
public class Attachment
{
    public int Id { get; set; }
    public string FileName { get; set; }
    public string FilePath { get; set; }
    public string ContentType { get; set; }
    public long FileSize { get; set; }
    public DateTime UploadDate { get; set; }
    public int TicketId { get; set; }

    // Relation
    public Ticket Ticket { get; set; }
}
```

#### 12.1.8 Country

Pays pour les adresses et les utilisateurs.

```csharp
public class Country
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Code { get; set; }
    public string Icon { get; set; }

    // Collection
    public ICollection<User> Users { get; set; }
}
```

#### 12.1.9 Relations entre Entités

Le système comprend plusieurs relations complexes:

- **Chef de Projet → Collaborateurs**: Un chef de projet peut avoir plusieurs collaborateurs assignés
- **Projet → Clients**: Un projet peut être associé à plusieurs clients
- **Projet → Collaborateurs**: Un projet peut avoir plusieurs collaborateurs assignés
- **Client → Catégories de Problèmes**: Un client peut avoir accès à certaines catégories de problèmes spécifiques

#### 12.1.10 Implémentation de la Base de Données

La base de données est implémentée à l'aide d'Entity Framework Core avec les caractéristiques suivantes:

```csharp
public class AppDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<Country> Countries { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<ProblemCategory> ProblemCategories { get; set; }
    public DbSet<ClientProblemCategory> ClientProblemCategories { get; set; }
    public DbSet<CollaborateurChef> CollaborateurChefs { get; set; }
    public DbSet<ProjectClient> ProjectClients { get; set; }
    public DbSet<ProjectChef> ProjectChefs { get; set; }

    // Configuration des relations et contraintes
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configuration des relations entre entités
        // Configuration des clés étrangères et contraintes
        // Définition des propriétés obligatoires
    }
}
```

Caractéristiques principales:

- Utilisation de MySQL comme base de données
- Migrations gérées par Entity Framework Core
- Relations many-to-many implémentées via des tables de jointure
- Configuration des contraintes de suppression (cascade, restrict, etc.)
- Journalisation des modifications avec des timestamps automatiques

### 12.2 Workflows Détaillés

#### 12.2.1 Création et Résolution d'un Ticket

1. Le client crée un ticket via l'interface
2. Le ticket est assigné à un chef de projet
3. Le chef de projet l'assigne à un collaborateur
4. Le collaborateur commence le travail (statut "En cours")
5. Le collaborateur documente la solution
6. Le collaborateur marque le ticket comme "Résolu"
7. Le client est notifié de la résolution

#### 12.2.2 Gestion des Utilisateurs

1. L'admin crée un compte utilisateur
2. L'utilisateur reçoit un email avec identifiants temporaires
3. L'utilisateur se connecte et change son mot de passe
4. L'admin attribue les rôles et permissions appropriés
5. L'utilisateur peut maintenant accéder aux fonctionnalités selon son rôle

#### 12.2.3 Configuration Système

#### 12.2.3.1 Exigences Techniques

- **Serveur** : .NET Core 6.0+
- **Base de données** : MySQL 8.0+
- **Client** : Navigateurs modernes (Chrome, Firefox, Edge)
- **Stockage** : Espace suffisant pour les pièces jointes

#### 12.2.3.2 Performance

- Temps de réponse < 2 secondes pour les opérations courantes
- Support pour au moins 100 utilisateurs simultanés
- Capacité de stockage adaptée au volume de tickets et pièces jointes

### 12.3 Modèles de Données Frontend et Backend

#### 12.3.1 Modèles Frontend (TypeScript)

Les modèles frontend sont implémentés sous forme d'interfaces TypeScript pour assurer le typage fort et améliorer la fiabilité du code.

##### 12.3.1.1 Ticket (ticket.model.ts)

```typescript
export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  qualification: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  report: string;
  commentaire: string;
  attachment: string;

  // Suivi du temps de travail
  startWorkTime?: string;
  finishWorkTime?: string;
  workDuration?: number;
  currentSessionDuration?: number;

  // Champs pour le tableau de bord collaborateur
  startTime?: Date | string;
  endTime?: Date | string;

  // Suivi du workflow
  temporarilyStopped?: boolean;
  workFinished?: boolean;

  // Associations utilisateur
  assignedUserId?: number;
  reporterId?: number;

  project?: {
    id: number;
    name: string;
    chefProjetId: number;
  };
  problemCategory?: {
    id: number;
    name: string;
  };
  assignedToId?: number;
  assignedTo?: User;
  showComments?: boolean;
}
```

##### 12.3.1.2 User (user.model.ts)

```typescript
export interface User {
  id?: number;
  name: string;
  lastName?: string;
  email: string;
  password?: string;
  role?: {
    id: number;
    name: string;
  };
  country?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  projectId?: number;
  companyId?: number;
  phoneNumber?: string;
  hasContract?: boolean;
  contractStartDate?: Date;
  contractEndDate?: Date;
  roles?: string[];
  assignedProjects?: Project[];
  assignedCollaborateurs?: User[];
  assignedProblemCategories?: ProblemCategory[];
  companies?: Company[];

  // Propriétés liées à l'authentification
  tokenExpired?: boolean;
  sessionExpired?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
```

##### 12.3.1.3 Project (project.model.ts)

```typescript
export interface Project {
  id?: number;
  name: string;
  description?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  chefProjetId?: number;
  chefProjet?: User;
  collaborateurs?: User[];
  clients?: User[];
}
```

##### 12.3.1.4 Autres Modèles Frontend

- **Company**: Représentation des sociétés clientes
- **Country**: Pays disponibles avec codes et drapeaux
- **Role**: Rôles système avec permissions associées
- **ProblemCategory**: Catégories de problèmes pour la classification des tickets

#### 12.3.2 Modèles Backend (C#)

Les modèles backend sont implémentés sous forme de classes C# avec annotations pour Entity Framework Core.

##### 12.3.2.1 Ticket (Ticket.cs)

```csharp
public class Ticket
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Status { get; set; } = "Open";

    [Required]
    public string Priority { get; set; } = string.Empty;

    [Required]
    public string Qualification { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    [Required]
    public int ProjectId { get; set; }

    [Required]
    public int ProblemCategoryId { get; set; }

    public int AssignedToId { get; set; }

    public int? CreatedById { get; set; }

    [ForeignKey("CreatedById")]
    public virtual User CreatedBy { get; set; }

    [ForeignKey("ProjectId")]
    public virtual Project Project { get; set; } = null!;

    [ForeignKey("ProblemCategoryId")]
    public virtual ProblemCategory ProblemCategory { get; set; } = null!;

    [ForeignKey("AssignedToId")]
    public virtual User AssignedTo { get; set; } = null!;

    public string Attachment { get; set; } = string.Empty;

    [Column("rapport")]
    public string Report { get; set; } = string.Empty;

    public string Commentaire { get; set; } = string.Empty;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }

    // Propriétés du workflow
    public bool TemporarilyStopped { get; set; } = false;
    public bool WorkFinished { get; set; } = false;
    public string? StartWorkTime { get; set; }
    public string? FinishWorkTime { get; set; }
    public int? WorkDuration { get; set; }
}
```

##### 12.3.2.2 DTOs (Data Transfer Objects)

Les DTOs sont utilisés pour la communication entre le frontend et le backend, assurant la validation et le formatage des données.

###### TicketDto.cs

```csharp
public class TicketDto
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Qualification { get; set; }
    public int ProjectId { get; set; }
    public int ProblemCategoryId { get; set; }
    public required string Priority { get; set; }
    public int? AssignedToId { get; set; }
    public string Attachment { get; set; } = string.Empty;
    public string? Status { get; set; }
    public string Commentaire { get; set; } = string.Empty;
    public string? Report { get; set; }
    public bool TemporarilyStopped { get; set; } = false;
    public bool WorkFinished { get; set; } = false;
    public string? StartWorkTime { get; set; }
    public string? FinishWorkTime { get; set; }
    public int? WorkDuration { get; set; }
}
```

##### 12.3.2.3 Relations entre Modèles

Les relations entre modèles backend sont configurées dans le `AppDbContext` pour représenter les relations métier:

- **User ↔ Role**: Relation many-to-one
- **User ↔ Country**: Relation many-to-one
- **User ↔ Chef de Projet**: Relation many-to-one (auto-référence)
- **User ↔ Projects**: Relation many-to-many
- **Ticket ↔ Project**: Relation many-to-one
- **Ticket ↔ ProblemCategory**: Relation many-to-one
- **Ticket ↔ AssignedTo (User)**: Relation many-to-one
- **Project ↔ ChefProjet (User)**: Relation many-to-one
- **User ↔ Company**: Relation many-to-many

#### 12.3.3 Correspondance et Mapping

La correspondance entre modèles frontend et backend est assurée par:

1. **Services Angular**: Transforment les réponses API en objets TypeScript
2. **Intercepteurs HTTP**: Gèrent l'authentification et les erreurs uniformément
3. **Contrôleurs API**: Assurent le mapping entre DTOs et entités du domaine

Exemple de mapping dans le TicketService:

```typescript
getTicketById(id: number): Observable<Ticket> {
  return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
    map(response => ({
      id: response.id,
      title: response.title,
      description: response.description,
      priority: response.priority,
      qualification: response.qualification,
      status: response.status,
      createdAt: response.createdDate,
      updatedAt: response.updatedAt,
      report: response.report,
      commentaire: response.commentaire,
      attachment: response.attachment,
      // ... mapping des autres propriétés
      project: response.project ? {
        id: response.project.id,
        name: response.project.name,
        chefProjetId: response.project.chefProjetId
      } : undefined,
      // ... mapping des autres objets imbriqués
    }))
  );
}
```

### 12.4 Implémentation de la Base de Données et Logique Métier

#### 12.4.1 Configuration de la Base de Données MySQL

La base de données de l'application est une instance MySQL configurée via Entity Framework Core:

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;database=simsoftdb;user=root;password="
  }
}
```

La connexion est établie dans le fichier `Program.cs` :

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 29)),
        o => {
            o.EnableRetryOnFailure();
            o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        }
    )
);
```

#### 12.4.2 Migrations et Évolution de la Base de Données

Les migrations sont gérées par Entity Framework Core et enregistrées dans le dossier `Migrations/`. Voici les principales migrations du projet:

1. **20250224100930_InitialMigration**: Création initiale des tables principales
2. **20250224100221_AddAttachmentToTickets**: Ajout du support pour les pièces jointes
3. **20250408173448_FinalColumnMappings**: Mise à jour des mappings de colonnes pour cohérence
4. **20250416115555_AddTicketWorkflowProperties**: Ajout des propriétés de workflow pour les tickets

Pour appliquer les migrations, la méthode `InitializeDatabaseAsync()` du service `DatabaseInitializationService` est exécutée au démarrage de l'application:

```csharp
public async Task InitializeDatabaseAsync()
{
    try
    {
        _logger.LogInformation("Starting database initialization");

        // Apply migrations
        await _context.Database.MigrateAsync();

        // Seed initial data if tables are empty
        await SeedInitialDataAsync();

        _logger.LogInformation("Database initialization completed successfully");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error during database initialization");
        throw;
    }
}
```

#### 12.4.3 Initialisation et Données de Départ

Le service `DatabaseInitializationService` est responsable de l'initialisation de la base de données avec des données essentielles pour le fonctionnement de l'application:

```csharp
public async Task SeedInitialDataAsync()
{
    if (!_context.Roles.Any())
    {
        _context.Roles.AddRange(
            new Role { Name = "Admin" },
            new Role { Name = "User" }
        );
    }

    if (!_context.Countries.Any())
    {
        _context.Countries.AddRange(
            new Country { Name = "United States", Code = "us", Icon = "https://flagcdn.com/48x36/us.png" },
            new Country { Name = "France", Code = "fr", Icon = "https://flagcdn.com/48x36/fr.png" }
        );
    }

    // Seed other essential data...
    await _context.SaveChangesAsync();
}
```

L'application propose également un endpoint d'administration pour réinitialiser la base de données en cas de besoin:

```csharp
app.MapGet("/api/reset-database", async (DatabaseCleanupService cleanupService) =>
{
    await cleanupService.CleanupDatabaseAsync();
    return Results.Ok(new { message = "Database reset successful" });
});
```

#### 12.4.4 Logique Métier et Services Backend

La logique métier est encapsulée dans des services dédiés qui implémentent les règles et comportements spécifiques à chaque entité:

##### 12.4.4.1 UserService

Le `UserService` gère la logique liée aux utilisateurs:

```csharp
public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .Where(u => u.Email == email)
            .FirstOrDefaultAsync();
    }

    public async Task<User> CreateUserAsync(RegisterDto model, string password)
    {
        string hashedPassword = HashPassword(password);

        var user = new User
        {
            Email = model.Email,
            Name = model.Name,
            LastName = string.Empty,
            CountryId = 1,
            RoleId = 2,
            PasswordHash = hashedPassword
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public bool VerifyPassword(string storedHash, string password)
    {
        // Implémentation de la vérification de mot de passe
    }
}
```

##### 12.4.4.2 TicketService

Le `TicketService` gère la logique des tickets:

```csharp
public class TicketService : ITicketService
{
    private readonly AppDbContext _context;
    private readonly ILogger<TicketService> _logger;

    public TicketService(AppDbContext context, ILogger<TicketService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Ticket>> GetTicketsAsync()
    {
        return await _context.Tickets
            .Include(t => t.Project)
            .Include(t => t.ProblemCategory)
            .ToListAsync();
    }

    public async Task<Ticket> CreateTicketAsync(Ticket ticket)
    {
        // Définir la date de création automatiquement
        ticket.CreatedDate = DateTime.UtcNow;

        // Statut par défaut
        if (string.IsNullOrEmpty(ticket.Status))
            ticket.Status = "Open";

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }
}
```

#### 12.4.5 Règles Métier et Flux de Travail

Les principales règles métier sont implémentées à différents niveaux:

##### 12.4.5.1 Validation

La validation des données est effectuée à plusieurs niveaux:

1. **Frontend**: Validation côté client avec Angular Reactive Forms
2. **API**: Validation avec les attributs `[Required]` et les annotations de modèle
3. **Services**: Validation logique dans les méthodes de service

Exemple de validation dans un contrôleur:

```csharp
[HttpPost]
public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserDto createUserDto)
{
    try
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Validation de l'existence du pays et du rôle
        var countryExists = await _context.Countries.AnyAsync(c => c.Id == createUserDto.CountryId);
        var roleExists = await _context.Roles.AnyAsync(r => r.Id == createUserDto.RoleId);

        if (!countryExists)
            return BadRequest($"Country with ID {createUserDto.CountryId} does not exist");

        if (!roleExists)
            return BadRequest($"Role with ID {createUserDto.RoleId} does not exist");

        // Validation de l'unicité de l'email
        if (await _context.Users.AnyAsync(u => u.Email == createUserDto.Email))
            return Conflict($"Email {createUserDto.Email} already exists");

        // Création de l'utilisateur...
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error creating user: {ex.Message}");
        return StatusCode(500, "Internal server error");
    }
}
```

##### 12.4.5.2 Transition d'États des Tickets

Les transitions d'états des tickets suivent des règles strictes implémentées dans le contrôleur `TicketsController`:

```csharp
[HttpPatch("{id}/status")]
public async Task<ActionResult<Ticket>> UpdateTicketStatus(int id, [FromBody] UpdateTicketStatusDto dto)
{
    try
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
            return NotFound($"Ticket with ID {id} not found");

        // Validation des transitions d'états autorisées
        if (ticket.Status == "Resolved" && dto.Status != "Reopened")
            return BadRequest("Can only change from Resolved to Reopened");

        if (ticket.Status == "Refused" && dto.Status != "Reopened")
            return BadRequest("Can only change from Refused to Reopened");

        // Mise à jour du ticket
        ticket.Status = dto.Status;
        if (!string.IsNullOrEmpty(dto.Report))
            ticket.Report = dto.Report;

        ticket.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ticket);
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error updating ticket status: {ex.Message}");
        return StatusCode(500, "Internal server error");
    }
}
```

##### 12.4.5.3 Gestion des Assignations

La logique d'assignation des tickets et projets est implémentée dans leurs contrôleurs respectifs:

```csharp
[HttpPost("{chefId}/assign-collaborateur")]
public async Task<IActionResult> AssignCollaborateurToChef(int chefId, [FromBody] AssignCollaborateurDto dto)
{
    try
    {
        // Validation de l'existence des utilisateurs
        var chef = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Id == chefId);

        if (chef == null)
            return NotFound($"Chef de projet with ID {chefId} not found");

        if (chef.Role.Name != "ChefProjet")
            return BadRequest($"User with ID {chefId} is not a chef de projet");

        var collaborateur = await _context.Users.FindAsync(dto.CollaborateurId);
        if (collaborateur == null)
            return NotFound($"Collaborateur with ID {dto.CollaborateurId} not found");

        // Vérification si la relation existe déjà
        var existingRelation = await _context.CollaborateurChefs
            .AnyAsync(cc => cc.CollaborateurId == dto.CollaborateurId && cc.ChefProjetId == chefId);

        if (existingRelation)
            return Conflict($"Collaborateur {dto.CollaborateurId} is already assigned to Chef {chefId}");

        // Création de la relation
        _context.CollaborateurChefs.Add(new CollaborateurChef
        {
            CollaborateurId = dto.CollaborateurId,
            ChefProjetId = chefId
        });

        await _context.SaveChangesAsync();
        return Ok(new { message = "Collaborateur assigned successfully" });
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error assigning collaborateur: {ex.Message}");
        return StatusCode(500, "Internal server error");
    }
}
```

#### 12.4.6 Journalisation et Suivi

Le système utilise un système de journalisation complet pour suivre les opérations importantes:

```csharp
// Configuration dans Program.cs
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Exemple d'utilisation dans un service
public async Task<Ticket> CreateTicketAsync(Ticket ticket)
{
    try
    {
        _logger.LogInformation($"Creating new ticket: {ticket.Title}");

        // Création du ticket...

        _logger.LogInformation($"Ticket created successfully with ID {ticket.Id}");
        return ticket;
    }
    catch (Exception ex)
    {
        _logger.LogError($"Error creating ticket: {ex.Message}");
        throw;
    }
}
```

#### 12.4.7 Cycle de Vie des Données

Le cycle de vie complet des données dans l'application suit ce flux:

1. **Création** : Saisie utilisateur → Validation frontend → Envoi API → Validation backend → Persistance
2. **Lecture** : Requête frontend → Récupération API → Filtrage/Autorisation → Transformation DTO → Présentation
3. **Mise à jour** : Modification utilisateur → Validation frontend → Envoi API → Validation backend → Persistance
4. **Suppression** : Action utilisateur → Confirmation → Envoi API → Vérification contraintes → Suppression

La cohérence des données est assurée par:

- Les contraintes de base de données (clés étrangères, contraintes d'unicité)
- Les validations applicatives
- Les transactions pour les opérations complexes
- La journalisation des erreurs et exceptions

#### 12.4.8 Maintenance et Administration

L'application fournit des outils pour la maintenance et l'administration:

- **Endpoint de réinitialisation** : `/api/reset-database` pour réinitialiser complètement la base de données
- **Endpoint de restauration** : `/api/restore-data` pour restaurer des données de test
- **Logs détaillés** : Journalisation des opérations importantes pour le debugging
- **Migrations automatiques** : Application des migrations au démarrage pour maintenir le schéma à jour
