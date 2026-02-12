# Architecture - SAMA GARAGE

## Vue d'ensemble

SAMA GARAGE est une application SaaS multi-tenant pour la gestion de garages électromécaniques, développée avec une architecture moderne et scalable.

## Stack technique

### Backend
- **Framework** : NestJS (Node.js + TypeScript)
- **Architecture** : Modulaire, séparation des préoccupations
- **API** : RESTful
- **Documentation** : Swagger/OpenAPI

### Frontend
- **Framework** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Routing** : React Router v6
- **State Management** : Zustand
- **HTTP Client** : Axios
- **Data Fetching** : TanStack Query (React Query)

### Base de données
- **SGBD** : PostgreSQL (via Supabase)
- **ORM** : Client Supabase
- **Auth** : Supabase Auth + JWT

### DevOps
- **Version Control** : Git
- **Package Manager** : npm
- **Build Tool** : Vite (frontend), NestJS CLI (backend)

---

## Architecture Backend

### Structure des modules

```
backend/src/
├── main.ts                 # Point d'entrée
├── app.module.ts           # Module racine
├── common/                 # Code partagé
│   ├── guards/            # Guards d'authentification
│   ├── decorators/        # Décorateurs personnalisés
│   ├── supabase/          # Service Supabase
│   └── tenant/            # Gestion multi-tenant
└── modules/               # Modules métier
    ├── auth/              # Authentification
    ├── users/             # Gestion utilisateurs
    ├── vehicles/          # Gestion véhicules
    ├── interventions/     # Gestion interventions
    ├── finance/           # Module financier
    ├── stock/             # Gestion stock
    └── settings/          # Paramètres
```

### Flux d'authentification

1. **Connexion** : L'utilisateur s'authentifie via `/auth/login`
2. **Validation** : Supabase Auth valide les credentials
3. **JWT** : Un token JWT est généré avec les infos utilisateur
4. **Stockage** : Le token est stocké dans le localStorage (frontend)
5. **Requêtes** : Toutes les requêtes incluent le token dans le header
6. **Validation** : Le JwtAuthGuard valide le token à chaque requête

### Sécurité

- **RBAC** : Contrôle d'accès basé sur les rôles
- **JWT** : Tokens signés avec clé secrète
- **Hash** : Mots de passe hashés avec bcrypt
- **RLS** : Row Level Security sur Supabase
- **CORS** : Configuration CORS sécurisée
- **Validation** : Validation des données avec class-validator

---

## Architecture Frontend

### Structure des dossiers

```
frontend/src/
├── main.tsx               # Point d'entrée
├── App.tsx                # Composant racine + routing
├── components/            # Composants réutilisables
│   └── Layout.tsx        # Layout principal
├── pages/                 # Pages de l'application
│   ├── LoginPage.tsx
│   ├── Dashboard.tsx
│   ├── VehiclesPage.tsx
│   ├── InterventionsPage.tsx
│   ├── StockPage.tsx
│   ├── FinancePage.tsx
│   └── SettingsPage.tsx
├── stores/                # State management
│   └── authStore.ts      # Store d'authentification
├── lib/                   # Utilitaires
│   └── api.ts            # Client API Axios
└── services/              # Services API (à créer)
```

### Flux de navigation

```
/login → Authentification
  ↓
/ → Dashboard (Protégé)
  ↓
Sidebar Navigation → Pages protégées
```

### Gestion d'état

- **Zustand** : State global léger (authentification)
- **React Query** : Cache et synchronisation des données serveur
- **React Hook Form** : Gestion des formulaires

---

## Modèle de données

### Entités principales

```
Tenant (Garage)
  ├── Users (Utilisateurs)
  ├── Owners (Propriétaires)
  │   └── Vehicles (Véhicules)
  │       └── Interventions
  │           └── Invoice
  │               └── Payments
  ├── Stock Items
  └── Settings
```

### Relations

- **Tenant → Users** : 1:N (Un garage a plusieurs utilisateurs)
- **Owner → Vehicles** : 1:N (Un propriétaire a plusieurs véhicules)
- **Vehicle → Interventions** : 1:N (Un véhicule a plusieurs interventions)
- **Intervention → Invoice** : 1:1 (Une intervention = une facture)
- **Invoice → Payments** : 1:N (Une facture peut avoir plusieurs paiements)

---

## Patterns et principes

### Backend

- **Dependency Injection** : Injection de dépendances via NestJS
- **Module Pattern** : Séparation en modules métier
- **Service Layer** : Logique métier dans les services
- **DTO Pattern** : Data Transfer Objects pour la validation
- **Guard Pattern** : Guards pour l'authentification et autorisation

### Frontend

- **Component Composition** : Composants réutilisables
- **Custom Hooks** : Logique réutilisable (à créer)
- **Container/Presenter** : Séparation logique/présentation
- **Route Protection** : Routes protégées par authentification

---

## Scalabilité

### Version 1 (MVP) - Mono-tenant
- Un seul garage par instance
- Configuration simplifiée
- Base de données partagée avec isolation par tenant_id

### Version 2 (Commercial) - Multi-tenant
- Plusieurs garages sur une instance
- Super Admin pour gérer tous les garages
- Isolation complète des données
- Abonnements et facturation

---

## Performance

### Backend
- **Indexation** : Index sur les colonnes fréquemment requêtées
- **Pagination** : Pagination des résultats
- **Caching** : Cache Redis (V2)
- **Connection Pooling** : Pool de connexions Supabase

### Frontend
- **Code Splitting** : Chargement lazy des routes
- **Memoization** : React.memo pour éviter les re-renders
- **Debouncing** : Debounce pour les recherches
- **Image Optimization** : Images optimisées (V2)

---

## Monitoring et logs

### Backend
- **Console Logs** : Logs de développement
- **Error Handling** : Gestion centralisée des erreurs
- **Audit Logs** : Table audit_logs pour traçabilité

### Frontend
- **Console Errors** : Logs d'erreurs dans la console
- **Error Boundaries** : Capture des erreurs React (à ajouter)

---

## Tests

### Backend (à implémenter)
- **Unit Tests** : Jest
- **E2E Tests** : Supertest
- **Coverage** : Minimum 80%

### Frontend (à implémenter)
- **Unit Tests** : Vitest
- **Component Tests** : React Testing Library
- **E2E Tests** : Playwright

---

## Déploiement

### Backend
- **Hosting** : Railway, Render, ou Heroku
- **Variables d'environnement** : Configuration sécurisée
- **Database** : Supabase (production)

### Frontend
- **Hosting** : Vercel, Netlify, ou Cloudflare Pages
- **CDN** : Distribution globale
- **SSL** : HTTPS automatique

---

## Évolutions futures (V2)

- **PWA** : Mode offline partiel
- **Notifications** : WhatsApp, Email
- **Photos** : Upload de photos avant/après
- **Statistiques** : Dashboard analytics avancé
- **Export** : Export Excel/PDF des rapports
- **Multi-langue** : i18n (Français, Wolof)
- **Mobile App** : Application mobile native
