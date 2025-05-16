# Documentation Complète du Système de Gestion de Tickets SimSoft

## Table des Matières

1. [Présentation du Projet](#1-présentation-du-projet)
2. [Architecture Technique](#2-architecture-technique)
3. [Système d'Authentification](#3-système-dauthentification)
4. [Rôles et Autorisations](#4-rôles-et-autorisations)
5. [Workflow et Gestion des Tickets](#5-workflow-et-gestion-des-tickets)
6. [Interfaces Utilisateur](#6-interfaces-utilisateur)
7. [Modèles de Données](#7-modèles-de-données)
8. [API et Services](#8-api-et-services)
9. [Implémentation de la Base de Données](#9-implémentation-de-la-base-de-données)
10. [Guide d'Implémentation avec IA](#10-guide-dimplémentation-avec-ia)

## 1. Présentation du Projet

### 1.1 Contexte et Entreprise

**SimSoft** est un holding de deux entreprises, **SIMSOFT TECHNOLOGY** et **SIMSOFT INTERNATIONALE**. Fondée en 2000 par Monsieur SRIHI HATEM, ingénieur en développement informatique, l'entreprise opère dans le domaine de l'intégration des systèmes d'information et du développement de logiciels au sein d'un cadre Interentreprises (Business to Business).

SimSoft est spécialisée dans plusieurs solutions:

- **Divalto**: ERP dédié aux PME et ETI
- **First Parc**: GMAO pour la gestion de parc automobile
- **WaveSoft**: Solution intégrée pour entreprises modernes
- **FirstMAG**: Logiciel d'encaissement et facturation
- **Sophos XG Firewall**: Administration de pare-feu

### 1.2 Objectifs du Système de Gestion de Tickets

- **Centralisation des tickets**: Regrouper toutes les demandes d'assistance et incidents dans une seule interface
- **Suivi efficace**: Suivre l'état d'avancement des tickets en temps réel
- **Assignation et workflow optimisés**: Diriger les tickets vers les collaborateurs appropriés
- **Communication fluide**: Faciliter les échanges entre clients, développeurs et administrateurs
- **Reporting avancé**: Générer des rapports détaillés pour analyse et prise de décision

## 2. Architecture Technique

### 2.1 Technologies Utilisées

- **Frontend**: Angular 15+ avec Angular Material
- **Backend**: ASP.NET Core avec architecture REST
- **Base de données**: MySQL
- **Authentification**: JWT (JSON Web Tokens)
- **Déploiement**: Conteneurisation avec Docker

### 2.2 Structure du Code Frontend

```
/src
  /app
    /core                   # Services fondamentaux
      /services             # Services principaux (auth, etc.)
      /constants            # Constantes globales (rôles, statuts)
      /interceptors         # Intercepteurs HTTP

    /shared                 # Composants et services partagés
      /components           # Composants réutilisables
      /services             # Services utilitaires (export, etc.)
      /pipes                # Pipes personnalisés
      /directives           # Directives Angular

    /features               # Modules fonctionnels par rôle

    /pages                  # Pages principales
      /admin                # Pages d'administration
      /chef-projet          # Pages chef de projet
      /collaborateur        # Pages collaborateur
      /client               # Pages client/utilisateur

    /models                 # Interfaces TypeScript

    /guards                 # Gardes de routes

    app.module.ts
    app.component.ts
    app-routing.module.ts
```

### 2.3 Structure du Code Backend

```
/SimSoftAPI
  /Controllers             # Points d'entrée API RESTful
  /Models                  # Entités de données
  /DTOs                    # Objets de transfert de données
  /Services                # Logique métier
  /Data                    # Contexte de base de données et migrations
  /Middleware              # Gestion de l'authentification et des erreurs
  /wwwroot                 # Fichiers statiques et uploads
  Program.cs              # Configuration principale
```

## 3. Système d'Authentification

### 3.1 Processus de Connexion

1. L'utilisateur saisit ses identifiants (email et mot de passe)
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

## 4. Rôles et Autorisations

### 4.1 Définition des Rôles

Le système comporte quatre rôles principaux (**important**: le rôle "User" et "Client" sont identiques):

1. **Admin**: Accès complet à toutes les fonctionnalités du système
2. **Chef Projet**: Gestion des projets et des tickets assignés à son équipe
3. **Collaborateur**: Traitement des tickets qui lui sont assignés
4. **Client/User**: Création et suivi de tickets pour ses projets (ces rôles sont identiques)

### 4.2 Matrice des Autorisations

| Fonctionnalité                      | Admin | Chef Projet | Collaborateur | Client/User |
| ----------------------------------- | ----- | ----------- | ------------- | ----------- |
| Gestion des utilisateurs            | ✅    | ❌          | ❌            | ❌          |
| Création de projets                 | ✅    | ✅          | ❌            | ❌          |
| Assignation de collaborateurs       | ✅    | ✅          | ❌            | ❌          |
| Création de tickets                 | ✅    | ✅          | ✅            | ✅          |
| Modification de tickets             | ✅    | ✅          | ✅            | ❌          |
| Clôture de tickets                  | ✅    | ✅          | ✅            | ❌          |
| Visualisation de tous les tickets   | ✅    | ❌          | ❌            | ❌          |
| Rapports et statistiques            | ✅    | ✅          | ❌            | ❌          |
| Gestion des catégories de problèmes | ✅    | ❌          | ❌            | ❌          |
| Gestion des sociétés                | ✅    | ❌          | ❌            | ❌          |

## 5. Workflow et Gestion des Tickets

### 5.1 Structure d'un Ticket

Un ticket contient les informations suivantes:

- **Identifiant unique**: Généré automatiquement
- **Titre**: Description courte du problème
- **Description**: Détails complets du problème
- **Statut**: En attente, En cours, Résolu, Rejeté, etc.
- **Priorité**: Basse, Moyenne, Haute, Critique
- **Qualification**: Catégorisation du type de problème
- **Projet associé**: Projet auquel le ticket est lié
- **Dates**: Création, dernière mise à jour
- **Assignation**: Collaborateur responsable, créateur
- **Communication**: Commentaires, rapports, pièces jointes
- **Métriques**: Temps de travail, début/fin

### 5.2 Workflow Complet des Tickets

1. **Création du ticket** par le client/user:

   - Saisie des données requises (qualification, projet, titre, description, pièces jointes)
   - Statut initial: "En attente"

2. **Réception et évaluation**:
   - L'admin et le chef projet (dont le projet est associé) reçoivent le ticket
   - Ils décident d'accepter ou refuser le ticket
3. **En cas de refus**:

   - Un rapport explicatif doit être fourni
   - Statut changé à "Refusé"
   - Le ticket est retiré des listes actives
   - Le rapport est ajouté dans la section rapports pour admin et chef projet

4. **En cas d'acceptation**:

   - Statut changé à "Accepté"
   - Assignation à un collaborateur:
     - L'admin peut assigner à n'importe quel collaborateur
     - Le chef projet ne peut assigner qu'aux collaborateurs de son équipe

5. **Traitement par le collaborateur**:

   - Statut changé à "En cours"
   - Possibilité de mettre le statut "Temporairement arrêté" si nécessaire
   - Le collaborateur peut ajouter des commentaires et des pièces jointes

6. **Résolution du ticket**:

   - Le collaborateur marque le ticket comme:
     - "Résolu": problème réglé avec succès
     - "Non résolu": problème impossible à résoudre
   - Un rapport de résolution est ajouté

7. **Fin du cycle de vie**:

   - Si "Résolu": ticket ajouté à l'historique des tickets résolus
   - Si "Non résolu": ticket retiré des listes actives, rapport ajouté à la section rapports

8. **Possibilité de réouverture**:
   - Un ticket résolu peut être rouvert si nécessaire
   - Statut changé à "Réouvert" puis "En cours"

### 5.3 Transitions d'États

```
[En attente] → [Accepté] → [En cours] → [Temporairement arrêté] → [En cours] → [Résolu]
          ↘               ↘                                                 ↗
            → [Refusé]      → [Non résolu]
[Résolu] → [Réouvert] → [En cours]
```

## 6. Interfaces Utilisateur

### 6.1 Charte Graphique

- **Couleurs principales**:
  - Orange (linéaire de `linear-gradient(135deg, var(--orange) 0%, #ffa726 100%)`)
  - Noir
  - Blanc
- **Style**: Interface moderne avec animations et thème Material Design
- **Composants**: Angular Material pour l'uniformité et la réactivité

### 6.2 Structure de la Page d'Accueil

La page d'accueil comprend:

1. **En-tête**: Logo SimSoft, navigation principale
2. **Section "Qui Sommes-Nous"**: Présentation de SimSoft et de son histoire
3. **Section "Nos Produits"**: Présentation des solutions (Divalto, FirstParc, WaveSoft, FirstMAG, Sophos)
4. **Appel à l'action**: Connexion/Inscription pour utiliser le système de tickets
5. **Pied de page**: Coordonnées, liens utiles, copyright

### 6.3 Tableaux de Bord par Rôle

#### 6.3.1 Admin

- Vue globale de tous les tickets
- Statistiques de performance
- Gestion des utilisateurs et projets
- Rapports détaillés
- Liste complète des tickets

#### 6.3.2 Chef Projet

- Tickets des projets assignés
- Performance de l'équipe
- Interface d'assignation des tickets
- Suivi des délais
- Rapports d'activité

#### 6.3.3 Collaborateur

- Tickets assignés personnellement
- Interface de mise à jour de statut
- Métriques de temps de travail
- Historique des tickets traités

#### 6.3.4 Client/User

- Création de tickets
- Suivi des tickets soumis
- Historique des demandes
- Interface de communication

### 6.4 Gestion des Pièces Jointes

- Upload sécurisé vers `wwwroot/uploads/`
- Génération de noms uniques avec GUID
- Prévisualisation et téléchargement depuis l'interface
- Validation des types de fichiers

## 7. Modèles de Données

### 7.1 Modèles Frontend (TypeScript)

#### 7.1.1 Ticket

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

  // Suivi du temps
  startWorkTime?: string;
  finishWorkTime?: string;
  workDuration?: number;
  currentSessionDuration?: number;

  temporarilyStopped?: boolean;
  workFinished?: boolean;

  // Relations
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
}
```

#### 7.1.2 User

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
  phoneNumber?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;

  // Relations
  assignedProjects?: Project[];
  assignedCollaborateurs?: User[];
  assignedProblemCategories?: ProblemCategory[];
  companies?: Company[];
}
```

### 7.2 Modèles Backend (C#)

#### 7.2.1 Ticket

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

    // Relations
    [ForeignKey("CreatedById")]
    public virtual User CreatedBy { get; set; }

    [ForeignKey("ProjectId")]
    public virtual Project Project { get; set; } = null!;

    [ForeignKey("ProblemCategoryId")]
    public virtual ProblemCategory ProblemCategory { get; set; } = null!;

    [ForeignKey("AssignedToId")]
    public virtual User AssignedTo { get; set; } = null!;

    public string Attachment { get; set; } = string.Empty;
    public string Report { get; set; } = string.Empty;
    public string Commentaire { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }

    // Workflow
    public bool TemporarilyStopped { get; set; } = false;
    public bool WorkFinished { get; set; } = false;
    public string? StartWorkTime { get; set; }
    public string? FinishWorkTime { get; set; }
    public int? WorkDuration { get; set; }
}
```

#### 7.2.2 User

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

## 8. API et Services

### 8.1 Structure de l'API

L'API backend est organisée en contrôleurs RESTful:

- **AuthController**: Authentification et sessions
- **UsersController**: CRUD utilisateurs, rôles, collaborateurs
- **ProjectController**: CRUD projets, assignations
- **TicketsController**: CRUD tickets, statuts, filtrage
- **CompaniesController**: CRUD sociétés
- **ProblemCategoryController**: CRUD catégories
- **RolesController**: Gestion des rôles
- **CountriesController**: Pays et intégration REST Countries API

### 8.2 Services Angular

- **AuthService**: Authentification et sessions
- **TicketService**: CRUD tickets, workflow
- **UserService**: Gestion utilisateurs
- **ProjectService**: Gestion projets
- **NotificationService**: Notifications temps réel
- **ExportService**: Export Excel
- **CountryService**: Gestion pays

### 8.3 Services Backend

#### 8.3.1 EmailService

```csharp
public class EmailService : IEmailService
{
    // Configuration SMTP (Gmail)
    private readonly string _smtpServer;
    private readonly int _smtpPort;
    private readonly string _smtpUser;
    private readonly string _smtpPassword;

    public async Task SendUserCredentialsAsync(string email, string username, string password)
    {
        // Envoi d'email avec identifiants
    }
}
```

#### 8.3.2 TicketService

```csharp
public class TicketService : ITicketService
{
    public async Task<List<Ticket>> GetTicketsAsync()
    {
        // Récupération des tickets avec relations
    }

    public async Task<Ticket> CreateTicketAsync(Ticket ticket)
    {
        // Création avec statut initial et date
    }
}
```

## 9. Implémentation de la Base de Données

### 9.1 Configuration MySQL

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "server=localhost;database=simsoftdb;user=root;password="
  }
}
```

### 9.2 Migrations Principales

1. **InitialMigration**: Tables de base
2. **AddAttachmentToTickets**: Support pièces jointes
3. **FinalColumnMappings**: Optimisation colonnes
4. **AddTicketWorkflowProperties**: Propriétés workflow

### 9.3 Relations entre Entités

- **User ↔ Role**: Many-to-one
- **User ↔ Country**: Many-to-one
- **User ↔ Chef de Projet**: Many-to-one (auto-référence)
- **Ticket ↔ Project**: Many-to-one
- **Project ↔ ChefProjet**: Many-to-one

## 10. Guide d'Implémentation avec IA

### 10.1 Prompts pour Frontend (Angular)

#### 10.1.1 Page d'Accueil avec Angular Material

```
Créez une page d'accueil moderne pour une plateforme de gestion de tickets avec les spécifications suivantes:
- Utilisez Angular 16+ et Angular Material
- Palette de couleurs: Orange (#FFA726), Noir et Blanc
- Inclure une section "Qui Sommes-Nous" présentant SimSoft
- Inclure une section "Nos Produits" présentant Divalto, First Parc, WaveSoft, FirstMAG, Sophos
- Ajouter des animations et transitions fluides
- Créer un en-tête avec logo et navigation
- Design responsive sur tous les appareils
- Fournir les fichiers component.ts, component.html et component.scss
```

#### 10.1.2 Tableau de Bord Admin

```
Créez un tableau de bord d'administration pour une plateforme de gestion de tickets avec les spécifications suivantes:
- Utilisez Angular 16+ et Angular Material
- Palette de couleurs: Orange (#FFA726), Noir et Blanc
- Inclure un tableau paginé de tous les tickets avec filtres
- Ajouter des graphiques pour les métriques (tickets par statut, temps moyens)
- Inclure des cartes pour accès rapide aux fonctions principales
- Implémenter le routage pour accéder aux fonctions détaillées
- Fournir les fichiers component.ts, component.html et component.scss
```

### 10.2 Prompts pour Backend (.NET)

#### 10.2.1 Controller de Tickets

```
Créez un contrôleur RESTful pour la gestion des tickets dans une application ASP.NET Core avec les spécifications suivantes:
- Implémenter toutes les opérations CRUD
- Ajouter des endpoints pour:
  * Filtrer les tickets par statut, priorité, projet
  * Mettre à jour le statut d'un ticket
  * Assigner un ticket à un collaborateur
  * Télécharger et récupérer des pièces jointes
- Utiliser Entity Framework Core
- Inclure validation des entrées et gestion des erreurs
- Documenter avec des commentaires XML
```

#### 10.2.2 Service Email

```
Créez un service d'envoi d'email pour une application ASP.NET Core avec les spécifications suivantes:
- Utiliser SMTP pour l'envoi d'emails
- Configurer via appsettings.json
- Implémenter les fonctionnalités:
  * Envoi d'identifiants aux nouveaux utilisateurs
  * Notification de création/modification de tickets
  * Notification de changement de statut
- Utiliser des templates HTML pour les emails
- Inclure gestion des erreurs et logging
```

### 10.3 Prompts pour Modèles et Base de Données

```
Créez les classes de modèle et la configuration Entity Framework Core pour une plateforme de gestion de tickets avec les entités suivantes:
- User: Infos utilisateur avec relations aux rôles, pays, etc.
- Ticket: Structure complète avec statuts, dates, relations
- Project: Informations projet et assignations
- Company: Informations sociétés clientes
- Intégrer toutes les relations many-to-many nécessaires
- Configurer les contraintes de suppression appropriées
- Inclure les migrations initiales
```

### 10.4 Conseils pour l'Implémentation Complète

1. **Commencer par la Structure**:

   - Mettre en place les projets Angular et ASP.NET Core
   - Configurer la base de données et les migrations

2. **Implémentation Backend**:

   - Développer les modèles et le contexte
   - Créer les contrôleurs API de base
   - Implémenter les services métier

3. **Implémentation Frontend**:

   - Créer les composants de base et la navigation
   - Implémenter l'authentification
   - Développer les tableaux de bord par rôle

4. **Workflow et Fonctionnalités Avancées**:

   - Implémenter le workflow des tickets
   - Ajouter la gestion des pièces jointes
   - Développer les rapports et exports

5. **Tests et Optimisation**:
   - Tester chaque fonctionnalité
   - Optimiser les performances
   - Sécuriser l'application
