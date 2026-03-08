# SAMA GARAGE - Plateforme de Gestion de Garage Électromécanique

## 🎯 Vue d'ensemble

SAMA GARAGE est une solution SaaS multi-tenant complète pour la gestion d'un garage électromécanique, adaptée au contexte africain.

## 🏗️ Architecture

- **Backend**: NestJS (Node.js)
- **Frontend**: React + Tailwind CSS
- **Base de données**: PostgreSQL (Supabase)
- **Authentification**: Supabase Auth
- **Type**: SaaS Multi-Tenant

## 📁 Structure du projet

```
SAMA GARAGE/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── modules/        # Modules métier
│   │   ├── common/         # Utilitaires partagés
│   │   ├── config/         # Configuration
│   │   └── database/       # Configuration DB
│   └── package.json
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   └── utils/          # Utilitaires
│   └── package.json
└── docs/                   # Documentation
```

## 🚀 Version 1 (MVP)

### Modules disponibles:
- ✅ **Utilisateurs et Rôles**: Admin Garage, Mécanicien, Caissier
- ✅ **Véhicules**: Enregistrement et historique
- ✅ **Interventions**: Diagnostic et réparation
- ✅ **Finance**: Facturation et paiements (Espèces, Wave, Orange Money)
- ✅ **Stock**: Gestion des pièces et alertes
- ✅ **Paramétrages**: Configuration du garage

## 📋 Version 2 (Commerciale)

- Multi-Garages avec Super Admin
- CRM et notifications WhatsApp
- Statistiques avancées
- PWA avec mode offline
- API de paiement intégrée

## 🛠️ Installation

### Prérequis
- Node.js 18+
- PostgreSQL (via Supabase)
- npm ou yarn

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Sécurité

- RBAC (Role-Based Access Control)
- JWT Tokens
- Hash des mots de passe
- Protection anti-injection SQL
- Logs d'audit
- Backups automatiques

## 📞 Support

Pour toute question ou assistance, consultez la documentation dans le dossier `docs/`.

## 📄 Licence

Propriétaire - SAMA GARAGE © 2025
# sama-garage
# sama-garage
# sama-garage
# sama-garage
