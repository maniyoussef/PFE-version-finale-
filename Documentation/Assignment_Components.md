# Documentation des Composants d'Assignation

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Assignation de Projets](#2-assignation-de-projets)
3. [Assignation de Collaborateurs](#3-assignation-de-collaborateurs)
4. [Assignation aux Clients](#4-assignation-aux-clients)
5. [Assignation des Catégories de Problèmes](#5-assignation-des-catégories-de-problèmes)
6. [Relation avec le Workflow des Tickets](#6-relation-avec-le-workflow-des-tickets)
7. [Implémentation Technique](#7-implémentation-technique)

## 1. Vue d'Ensemble

Le système d'assignation est un élément central du fonctionnement de la plateforme de gestion de tickets SimSoft. Il permet de structurer les relations hiérarchiques et les responsabilités entre les différents acteurs (Admin, Chef Projet, Collaborateur, Client). Ce document explique en détail les mécanismes d'assignation et leur impact sur le flux de travail des tickets.

### 1.1 Hiérarchie des Assignations

La plateforme suit une structure hiérarchique claire:

```
Admin
  ↓
Chef Projet
  ↓
Collaborateur
```

- L'**Admin** possède les droits d'assignation les plus étendus
- Le **Chef Projet** peut gérer les assignations pour son équipe
- Le **Collaborateur** reçoit des assignations mais n'en effectue pas
- Le **Client/User** est externe à cette hiérarchie d'assignation

## 2. Assignation de Projets

### 2.1 Rôle de l'Admin dans l'Assignation de Projets

L'administrateur est le seul utilisateur qui peut:

1. **Créer des projets** dans le système
2. **Assigner un Chef Projet** à un projet spécifique
3. **Modifier l'assignation** d'un Chef Projet à tout moment
4. **Visualiser tous les projets** et leurs assignations

### 2.2 Processus d'Assignation de Projet

#### 2.2.1 Interface Admin pour l'Assignation de Projets

L'interface d'assignation de projets pour l'administrateur comprend:

- Une liste déroulante des Chefs de Projet disponibles
- Un tableau des projets existants avec leur statut d'assignation
- Un bouton "Assigner" pour confirmer l'action
- Un historique des modifications d'assignation

#### 2.2.2 Workflow d'Assignation de Projet

1. L'Admin accède à la section "Gestion des Projets"
2. Il sélectionne un projet existant ou en crée un nouveau
3. Il choisit un Chef Projet dans la liste déroulante
4. Il confirme l'assignation
5. Le système envoie une notification au Chef Projet concerné
6. Le projet apparaît désormais dans le tableau de bord du Chef Projet

### 2.3 Impact de l'Assignation de Projet

Une fois qu'un projet est assigné à un Chef Projet:

- Le Chef Projet devient responsable de la gestion de ce projet
- Il peut voir tous les tickets associés à ce projet
- Il reçoit des notifications concernant les nouveaux tickets
- Il peut assigner des collaborateurs aux tickets du projet
- Il peut générer des rapports sur l'avancement du projet

## 3. Assignation de Collaborateurs

### 3.1 Rôles dans l'Assignation de Collaborateurs

#### 3.1.1 Rôle de l'Admin

L'administrateur peut:

- Assigner n'importe quel collaborateur à n'importe quel Chef Projet
- Modifier ces assignations à tout moment
- Visualiser et gérer toutes les relations Chef Projet-Collaborateur

#### 3.1.2 Rôle du Chef Projet

Le Chef Projet peut:

- Voir uniquement les collaborateurs qui lui sont assignés
- Assigner ces collaborateurs aux tickets de ses projets
- Suivre le travail et la charge des collaborateurs de son équipe

### 3.2 Processus d'Assignation de Collaborateurs

#### 3.2.1 Interface d'Assignation de Collaborateurs

Pour l'administrateur, l'interface comprend:

- Une liste des Chefs Projet
- Pour chaque Chef Projet, une liste de collaborateurs disponibles
- Un système de glisser-déposer pour l'assignation
- Des indicateurs visuels de la charge de travail

#### 3.2.2 Workflow d'Assignation de Collaborateurs

1. L'Admin accède à la section "Gestion des Utilisateurs"
2. Il sélectionne l'onglet "Assignation Collaborateurs"
3. Il sélectionne un Chef Projet dans la liste
4. Il assigne un ou plusieurs collaborateurs à ce Chef Projet
5. Le système envoie des notifications aux personnes concernées
6. Les nouvelles relations sont immédiatement effectives

### 3.3 Impact de l'Assignation de Collaborateurs

L'assignation d'un collaborateur à un Chef Projet:

- Crée une relation hiérarchique entre les deux
- Permet au Chef Projet d'assigner des tickets à ce collaborateur
- Donne au collaborateur accès aux projets du Chef Projet
- Influence les notifications et les tableaux de bord

## 4. Assignation aux Clients

### 4.1 Assignation de Projets aux Clients

#### 4.1.1 Rôle de l'Admin dans l'Assignation de Projets aux Clients

L'administrateur est le seul utilisateur qui peut:

1. **Associer un client à un projet**
2. **Modifier les associations client-projet** existantes
3. **Visualiser toutes les associations** client-projet dans le système

#### 4.1.2 Interface d'Assignation Client-Projet

L'interface d'assignation des clients aux projets comprend:

- Une liste des clients disponibles
- Une liste des projets existants
- Un système matriciel pour visualiser les associations existantes
- Des filtres pour faciliter la gestion des nombreux projets/clients

#### 4.1.3 Workflow d'Assignation Client-Projet

1. L'Admin accède à la section "Gestion des Projets"
2. Il sélectionne l'onglet "Assignation aux Clients"
3. Il choisit un client dans la liste déroulante
4. Il sélectionne un ou plusieurs projets à associer à ce client
5. Il confirme l'assignation
6. Le système envoie une notification au client
7. Les projets apparaissent désormais dans le tableau de bord du client

### 4.2 Impact de l'Assignation Client-Projet

Lorsqu'un projet est assigné à un client:

- Le client peut visualiser le projet dans son tableau de bord
- Il peut créer des tickets associés à ce projet spécifique
- Il reçoit des notifications concernant les tickets de ce projet
- Il peut consulter les rapports d'avancement du projet
- Il ne peut pas voir les projets qui ne lui sont pas assignés

## 5. Assignation des Catégories de Problèmes

### 5.1 Gestion des Catégories de Problèmes

#### 5.1.1 Création et Organisation des Catégories

Les catégories de problèmes sont organisées hiérarchiquement:

- Catégories principales (ex: "Bugs", "Fonctionnalités", "Support")
- Sous-catégories (ex: "Interface utilisateur", "Performance", "Sécurité")

#### 5.1.2 Rôle de l'Admin dans la Gestion des Catégories

L'administrateur peut:

- Créer/modifier/supprimer des catégories de problèmes
- Assigner des catégories spécifiques aux différents projets
- Assigner des catégories spécifiques aux collaborateurs selon leurs compétences

### 5.2 Assignation des Catégories aux Collaborateurs

#### 5.2.1 Processus d'Assignation des Catégories

1. L'Admin ou Chef Projet accède à la section "Gestion des Catégories"
2. Il sélectionne un collaborateur
3. Il assigne une ou plusieurs catégories de problèmes à ce collaborateur
4. Les assignations sont enregistrées et prises en compte pour les futures attributions de tickets

#### 5.2.2 Avantages de l'Assignation par Catégorie

- **Assignation automatique**: Les tickets peuvent être automatiquement dirigés vers les collaborateurs spécialisés
- **Répartition équilibrée**: Le système peut suggérer des assignations basées sur l'expertise
- **Montée en compétence**: Possibilité de suivre les domaines d'expertise de chaque collaborateur

### 5.3 Relation Catégories-Projets-Clients

- Un projet peut avoir plusieurs catégories de problèmes activées
- Un client ne voit que les catégories associées à ses projets
- Lors de la création d'un ticket, le client doit choisir une catégorie parmi celles disponibles pour le projet

## 6. Relation avec le Workflow des Tickets

### 6.1 Création et Assignation de Tickets

#### 6.1.1 Contraintes d'Assignation des Tickets

Les règles suivantes s'appliquent:

- Un Admin peut assigner un ticket à n'importe quel collaborateur
- Un Chef Projet peut uniquement assigner un ticket aux collaborateurs de son équipe
- Un ticket ne peut être assigné qu'à un seul collaborateur à la fois
- Un ticket est toujours lié à un projet spécifique

#### 6.1.2 Workflow d'Assignation des Tickets

1. Un ticket est créé par un Client/User
2. Le ticket est associé à un projet
3. L'Admin ou le Chef Projet du projet reçoit une notification
4. Le Chef Projet (ou l'Admin) assigne le ticket à un collaborateur
5. Le collaborateur reçoit une notification d'assignation
6. Le statut du ticket passe à "Assigné"

### 6.2 Impact des Assignations sur le Traitement des Tickets

Les assignations influencent directement:

- **Visibilité des tickets**: Chaque utilisateur ne voit que les tickets pertinents selon son rôle et ses assignations
- **Notifications**: Le système envoie des alertes basées sur les relations d'assignation
- **Rapports**: Les métriques de performance sont organisées selon la structure hiérarchique
- **Workflow**: La progression d'un ticket suit les chaînes d'assignation

## 7. Implémentation Technique

### 7.1 Modèles de Données pour les Assignations

#### 7.1.1 Relation User-Project (Chef Projet à Projet)

```csharp
// Dans la classe Project
public int ChefProjetId { get; set; }
[ForeignKey("ChefProjetId")]
public User ChefProjet { get; set; }

// Dans la classe User
public ICollection<Project> AssignedProjects { get; set; }
```

#### 7.1.2 Relation User-User (Chef Projet à Collaborateur)

```csharp
// Dans la classe User
public int? ChefProjetId { get; set; }
[ForeignKey("ChefProjetId")]
public User ChefProjet { get; set; }
public ICollection<User> AssignedCollaborateurs { get; set; }
```

### 7.2 APIs d'Assignation

#### 7.2.1 Endpoints pour l'Assignation de Projets

```csharp
// ProjectsController
[HttpPut("assign/{projectId}/chef-projet/{chefProjetId}")]
public async Task<IActionResult> AssignChefProjet(int projectId, int chefProjetId)
{
    // Logique d'assignation
}
```

#### 7.2.2 Endpoints pour l'Assignation de Collaborateurs

```csharp
// UsersController
[HttpPut("assign/{collaborateurId}/chef-projet/{chefProjetId}")]
public async Task<IActionResult> AssignCollaborateurToChefProjet(int collaborateurId, int chefProjetId)
{
    // Logique d'assignation
}
```

### 7.3 Services Frontend

#### 7.3.1 Service d'Assignation

```typescript
// assignment.service.ts
export class AssignmentService {
  // Assignation de projet
  assignProjectToChefProjet(
    projectId: number,
    chefProjetId: number
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/projects/assign/${projectId}/chef-projet/${chefProjetId}`,
      {}
    );
  }

  // Assignation de collaborateur
  assignCollaborateurToChefProjet(
    collaborateurId: number,
    chefProjetId: number
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/assign/${collaborateurId}/chef-projet/${chefProjetId}`,
      {}
    );
  }
}
```

### 7.4 Composants d'Interface Utilisateur

#### 7.4.1 Composant d'Assignation de Projet

```typescript
// project-assignment.component.ts
export class ProjectAssignmentComponent implements OnInit {
  projects: Project[] = [];
  chefsProjets: User[] = [];

  assignProject(projectId: number, chefProjetId: number): void {
    this.assignmentService
      .assignProjectToChefProjet(projectId, chefProjetId)
      .subscribe(
        (response) => {
          this.notificationService.success("Projet assigné avec succès");
          this.loadProjects();
        },
        (error) => {
          this.notificationService.error("Erreur lors de l'assignation");
        }
      );
  }
}
```

#### 7.4.2 Composant d'Assignation de Collaborateurs

```typescript
// collaborateur-assignment.component.ts
export class CollaborateurAssignmentComponent implements OnInit {
  collaborateurs: User[] = [];
  chefsProjets: User[] = [];

  assignCollaborateur(collaborateurId: number, chefProjetId: number): void {
    this.assignmentService
      .assignCollaborateurToChefProjet(collaborateurId, chefProjetId)
      .subscribe(
        (response) => {
          this.notificationService.success("Collaborateur assigné avec succès");
          this.loadCollaborateurs();
        },
        (error) => {
          this.notificationService.error("Erreur lors de l'assignation");
        }
      );
  }
}
```

### 7.5 Gestion des Permissions

```typescript
// assignment.guard.ts
export class AssignmentGuard implements CanActivate {
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.authService.getCurrentUser();

    // Seul l'admin peut accéder aux pages d'assignation complètes
    if (state.url.includes("/admin/assignments")) {
      return user.role.name === "Admin";
    }

    // Les chefs de projet peuvent accéder à leur propre page d'assignation
    if (state.url.includes("/chef-projet/assignments")) {
      return user.role.name === "ChefProjet";
    }

    return false;
  }
}
```

### 7.6 Modèles de Données pour les Assignations Client-Projet

```csharp
// Dans la classe Project
public ICollection<User> AssignedClients { get; set; }

// Dans la classe User (Client)
public ICollection<Project> AssignedProjects { get; set; }
```

### 7.7 Modèles de Données pour les Catégories de Problèmes

```csharp
public class ProblemCategory
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int? ParentCategoryId { get; set; }

    // Relations
    [ForeignKey("ParentCategoryId")]
    public ProblemCategory ParentCategory { get; set; }
    public ICollection<ProblemCategory> SubCategories { get; set; }
    public ICollection<Project> AssignedProjects { get; set; }
    public ICollection<User> AssignedCollaborateurs { get; set; }
}
```

### 7.8 API pour l'Assignation Client-Projet

```csharp
// ProjectsController
[HttpPut("assign/{projectId}/client/{clientId}")]
public async Task<IActionResult> AssignProjectToClient(int projectId, int clientId)
{
    // Logique d'assignation
}

[HttpDelete("unassign/{projectId}/client/{clientId}")]
public async Task<IActionResult> UnassignProjectFromClient(int projectId, int clientId)
{
    // Logique de désassignation
}
```

### 7.9 API pour l'Assignation des Catégories

```csharp
// ProblemCategoriesController
[HttpPut("assign/collaborateur/{collaborateurId}")]
public async Task<IActionResult> AssignCategoriesToCollaborateur(
    int collaborateurId,
    [FromBody] List<int> categoryIds)
{
    // Logique d'assignation
}

[HttpPut("assign/project/{projectId}")]
public async Task<IActionResult> AssignCategoriesToProject(
    int projectId,
    [FromBody] List<int> categoryIds)
{
    // Logique d'assignation
}
```

## 8. Bonnes Pratiques et Recommandations

### 8.1 Gestion des Charges de Travail

- Vérifier la charge de travail d'un collaborateur avant de lui assigner un nouveau ticket
- Répartir équitablement les tickets entre les membres d'une équipe
- Permettre aux Chefs Projet de visualiser des métriques de charge

### 8.2 Gestion des Changements d'Assignation

- Conserver un historique des changements d'assignation
- Notifier toutes les parties concernées lors d'un changement
- Prévoir une procédure de transfert de tickets lors du changement de Chef Projet

### 8.3 Optimisation du Workflow d'Assignation

- Permettre l'assignation par lot pour les grands projets
- Implémenter des suggestions d'assignation basées sur les compétences
- Autoriser la réassignation temporaire en cas d'absence
