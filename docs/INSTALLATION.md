# Guide d'installation - SAMA GARAGE

## Prérequis

### Logiciels requis
- **Node.js** 18 ou supérieur
- **npm** ou **yarn**
- **Git**
- Un compte **Supabase** (gratuit)

## Étape 1 : Configuration de Supabase

### 1.1 Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet
4. Notez les informations suivantes :
   - **Project URL** (SUPABASE_URL)
   - **Anon/Public Key** (SUPABASE_ANON_KEY)
   - **Service Role Key** (SUPABASE_SERVICE_KEY)

### 1.2 Configurer la base de données

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez le contenu du fichier `docs/supabase-schema.sql`
3. Exécutez le script SQL
4. Vérifiez que toutes les tables sont créées

### 1.3 Configurer l'authentification

1. Allez dans **Authentication** > **Settings**
2. Configurez :
   - **Site URL** : `http://localhost:5173` (pour le développement)
   - **Redirect URLs** : Ajoutez `http://localhost:5173/**`
3. Activez **Email Authentication**

## Étape 2 : Installation du Backend

### 2.1 Naviguer vers le dossier backend

```bash
cd backend
```

### 2.2 Installer les dépendances

```bash
npm install
```

### 2.3 Configurer les variables d'environnement

1. Copiez le fichier `.env.example` vers `.env` :
```bash
copy .env.example .env
```

2. Éditez le fichier `.env` avec vos informations Supabase :

```env
NODE_ENV=development
PORT=3000
APP_NAME=SAMA GARAGE API

# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_KEY=votre_service_key

# JWT Configuration
JWT_SECRET=votre_secret_jwt_unique_et_securise
JWT_EXPIRATION=7d

# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Multi-Tenant Configuration
ENABLE_MULTI_TENANT=false
```

### 2.4 Démarrer le backend

```bash
npm run start:dev
```

Le backend devrait démarrer sur `http://localhost:3000`

## Étape 3 : Installation du Frontend

### 3.1 Ouvrir un nouveau terminal et naviguer vers le dossier frontend

```bash
cd frontend
```

### 3.2 Installer les dépendances

```bash
npm install
```

### 3.3 Configurer les variables d'environnement

1. Copiez le fichier `.env.example` vers `.env` :
```bash
copy .env.example .env
```

2. Éditez le fichier `.env` :

```env
VITE_API_URL=http://localhost:3000
```

### 3.4 Démarrer le frontend

```bash
npm run dev
```

Le frontend devrait démarrer sur `http://localhost:5173`

## Étape 4 : Créer le premier utilisateur

### Option 1 : Via l'API (Recommandé)

1. Ouvrez la documentation Swagger : `http://localhost:3000/api/docs`
2. Utilisez l'endpoint `POST /auth/register` avec :

```json
{
  "email": "admin@samagarage.sn",
  "password": "password123",
  "full_name": "Administrateur",
  "role": "admin_garage",
  "tenant_id": "00000000-0000-0000-0000-000000000001"
}
```

### Option 2 : Via Supabase Dashboard

1. Allez dans **Authentication** > **Users**
2. Créez un nouvel utilisateur
3. Ajoutez manuellement l'entrée dans la table `users` via SQL Editor

## Étape 5 : Se connecter

1. Ouvrez `http://localhost:5173` dans votre navigateur
2. Utilisez les identifiants créés :
   - **Email** : admin@samagarage.sn
   - **Mot de passe** : password123

## Vérification de l'installation

### Backend
- Documentation API : `http://localhost:3000/api/docs`
- Health check : `http://localhost:3000`

### Frontend
- Application : `http://localhost:5173`

## Dépannage

### Erreurs de connexion à Supabase
- Vérifiez que les URLs et clés sont correctes
- Assurez-vous que le projet Supabase est actif
- Vérifiez que le schéma SQL a été exécuté

### Erreurs CORS
- Vérifiez que `FRONTEND_URL` dans le backend correspond à l'URL du frontend
- Vérifiez la configuration CORS dans `backend/src/main.ts`

### Erreurs d'authentification
- Vérifiez que l'utilisateur existe dans Supabase Auth ET dans la table `users`
- Vérifiez le `JWT_SECRET` dans le fichier `.env`

## Prochaines étapes

1. Personnalisez les paramètres du garage dans **Paramètres**
2. Créez d'autres utilisateurs (mécaniciens, caissiers)
3. Commencez à enregistrer des véhicules et des interventions

## Support

Pour toute question ou problème :
- Consultez la documentation dans le dossier `docs/`
- Vérifiez les logs du backend et du frontend
- Consultez les issues GitHub du projet

## Mise en production

Pour déployer en production, consultez le guide `docs/DEPLOYMENT.md`
