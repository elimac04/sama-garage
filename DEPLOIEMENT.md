# 🚀 Guide de Déploiement SAMA GARAGE

Ce guide vous explique comment déployer SAMA GARAGE avec :
- **Frontend** sur **Vercel** (optimisé pour React/Vite)
- **Backend** sur **Railway** (avec PostgreSQL intégré)

---

## 📋 Prérequis

1. **Compte GitHub** (pour connecter vos dépôts)
2. **Compte Vercel** (gratuit) : https://vercel.com
3. **Compte Railway** (gratuit) : https://railway.app
4. **Compte Supabase** (gratuit) : https://supabase.com

---

## 🗄️ ÉTAPE 1 : Configuration de la Base de Données (Supabase)

### 1.1 Créer un projet Supabase

1. Allez sur https://supabase.com et connectez-vous
2. Cliquez sur **"New Project"**
3. Remplissez les informations :
   - **Name** : `sama-garage-db`
   - **Database Password** : Générez un mot de passe fort (sauvegardez-le !)
   - **Region** : Choisissez la région la plus proche (ex: `eu-west-1` pour l'Europe)
4. Cliquez sur **"Create new project"**
5. Attendez 2-3 minutes que le projet soit créé

### 1.2 Récupérer les credentials Supabase

1. Dans votre projet Supabase, allez dans **Settings** > **API**
2. Notez ces informations (vous en aurez besoin) :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon/public key** (commence par `eyJ...`)
   - **service_role key** (commence par `eyJ...`) ⚠️ À garder secret !

### 1.3 Initialiser la base de données

1. Allez dans **SQL Editor** dans Supabase
2. Exécutez les scripts SQL de votre projet (si vous avez un fichier `schema.sql` ou migrations)
3. Vérifiez que les tables sont créées dans **Table Editor**

---

## 🔧 ÉTAPE 2 : Déploiement du Backend sur Railway

### 2.1 Préparer le dépôt Git

```bash
# Si vous n'avez pas encore initialisé Git
cd "c:\Users\HP\DATAS\CascadeProjects\ProjectV1\SAMA GARAGE"
git init
git add .
git commit -m "Initial commit - SAMA GARAGE"

# Créer un dépôt sur GitHub et le pousser
git remote add origin https://github.com/VOTRE_USERNAME/sama-garage.git
git branch -M main
git push -u origin main
```

### 2.2 Déployer sur Railway

1. Allez sur https://railway.app et connectez-vous avec GitHub
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Choisissez votre dépôt `sama-garage`
5. Railway détecte automatiquement le projet Node.js

### 2.3 Configurer le service Backend

1. Cliquez sur le service déployé
2. Allez dans l'onglet **"Settings"**
3. Configurez :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm run start:prod`

### 2.4 Ajouter les variables d'environnement

1. Allez dans l'onglet **"Variables"**
2. Ajoutez ces variables (cliquez sur **"New Variable"** pour chaque) :

```env
NODE_ENV=production
PORT=${{PORT}}
APP_NAME=SAMA GARAGE API

# Supabase (utilisez vos valeurs de l'ÉTAPE 1.2)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# JWT (générez une clé secrète forte)
JWT_SECRET=votre_cle_secrete_tres_longue_et_aleatoire_123456789
JWT_EXPIRATION=15m
SESSION_INACTIVITY_TIMEOUT=30

# URLs (à mettre à jour après déploiement frontend)
FRONTEND_URL=https://votre-app.vercel.app
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Multi-Tenant
ENABLE_MULTI_TENANT=false

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Logs
LOG_LEVEL=info

# Email (optionnel pour V1)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app
EMAIL_FROM=noreply@samagarage.sn
EMAIL_FROM_NAME=SAMA GARAGE
```

3. Cliquez sur **"Deploy"** pour redémarrer avec les nouvelles variables

### 2.5 Récupérer l'URL du Backend

1. Dans Railway, allez dans **"Settings"** > **"Networking"**
2. Cliquez sur **"Generate Domain"**
3. Notez l'URL générée (ex: `https://sama-garage-backend.up.railway.app`)
4. **Mettez à jour la variable `BACKEND_URL`** avec cette URL

---

## 🎨 ÉTAPE 3 : Déploiement du Frontend sur Vercel

### 3.1 Déployer sur Vercel

1. Allez sur https://vercel.com et connectez-vous avec GitHub
2. Cliquez sur **"Add New..."** > **"Project"**
3. Importez votre dépôt `sama-garage`
4. Configurez le projet :
   - **Framework Preset** : Vite
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build` (détecté automatiquement)
   - **Output Directory** : `dist` (détecté automatiquement)

### 3.2 Ajouter les variables d'environnement

1. Avant de déployer, cliquez sur **"Environment Variables"**
2. Ajoutez :

```env
VITE_API_URL=https://sama-garage-backend.up.railway.app
```

⚠️ **Important** : Remplacez par l'URL de votre backend Railway (ÉTAPE 2.5)

3. Cliquez sur **"Deploy"**

### 3.3 Récupérer l'URL du Frontend

1. Attendez que le déploiement se termine (1-2 minutes)
2. Vercel vous donne une URL (ex: `https://sama-garage.vercel.app`)
3. **Retournez sur Railway** et mettez à jour la variable `FRONTEND_URL` avec cette URL

---

## ✅ ÉTAPE 4 : Vérification et Tests

### 4.1 Tester le Backend

1. Ouvrez l'URL de votre backend : `https://sama-garage-backend.up.railway.app`
2. Vous devriez voir un message de bienvenue ou une erreur 404 (normal si pas de route `/`)
3. Testez la documentation Swagger (si activée en dev) : `/api/docs`

### 4.2 Tester le Frontend

1. Ouvrez l'URL de votre frontend : `https://sama-garage.vercel.app`
2. L'application devrait se charger
3. Testez la connexion (créez un compte ou connectez-vous)

### 4.3 Vérifier les logs

**Railway (Backend)** :
- Allez dans l'onglet **"Deployments"**
- Cliquez sur le dernier déploiement
- Consultez les logs en temps réel

**Vercel (Frontend)** :
- Allez dans **"Deployments"**
- Cliquez sur le dernier déploiement
- Consultez les logs de build et runtime

---

## 🔐 ÉTAPE 5 : Sécurité et Configuration Finale

### 5.1 Générer une clé JWT sécurisée

```bash
# Sur votre machine locale
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copiez le résultat et mettez à jour `JWT_SECRET` sur Railway.

### 5.2 Configurer CORS

Vérifiez que `FRONTEND_URL` dans Railway correspond exactement à votre URL Vercel (sans `/` à la fin).

### 5.3 Configurer le domaine personnalisé (optionnel)

**Vercel** :
1. Allez dans **"Settings"** > **"Domains"**
2. Ajoutez votre domaine personnalisé (ex: `app.samagarage.sn`)

**Railway** :
1. Allez dans **"Settings"** > **"Networking"**
2. Ajoutez un domaine personnalisé (ex: `api.samagarage.sn`)

---

## 🔄 Déploiements Automatiques

### Configuration Git

Les deux plateformes déploient automatiquement à chaque `git push` :

```bash
# Faire des modifications
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main

# Vercel et Railway déploient automatiquement !
```

### Branches de déploiement

- **Production** : branche `main` → déploiement automatique
- **Staging** : créez une branche `staging` et configurez un environnement de preview

---

## 📊 Monitoring et Maintenance

### Railway

- **Logs** : Consultez les logs en temps réel
- **Metrics** : CPU, RAM, Network dans l'onglet "Metrics"
- **Alertes** : Configurez des alertes email

### Vercel

- **Analytics** : Activez Vercel Analytics pour suivre les performances
- **Logs** : Consultez les logs de build et runtime
- **Speed Insights** : Activez pour optimiser les performances

---

## 🆘 Dépannage

### Erreur CORS

**Symptôme** : Le frontend ne peut pas contacter le backend

**Solution** :
1. Vérifiez que `FRONTEND_URL` sur Railway = URL exacte de Vercel
2. Vérifiez que `VITE_API_URL` sur Vercel = URL exacte de Railway
3. Pas de `/` à la fin des URLs

### Erreur 500 Backend

**Symptôme** : Le backend crash au démarrage

**Solution** :
1. Consultez les logs Railway
2. Vérifiez que toutes les variables d'environnement sont définies
3. Vérifiez la connexion Supabase (URL et clés correctes)

### Build Frontend échoue

**Symptôme** : Vercel ne peut pas builder le frontend

**Solution** :
1. Vérifiez que `Root Directory` = `frontend`
2. Vérifiez que `package.json` contient le script `build`
3. Consultez les logs de build Vercel

### Base de données inaccessible

**Symptôme** : Erreurs de connexion à Supabase

**Solution** :
1. Vérifiez que le projet Supabase est actif
2. Vérifiez les credentials (URL, keys)
3. Vérifiez que les tables sont créées

---

## 💰 Coûts

### Plans Gratuits

- **Vercel** : 100 GB bandwidth/mois, déploiements illimités
- **Railway** : $5 de crédit gratuit/mois (suffisant pour débuter)
- **Supabase** : 500 MB database, 2 GB bandwidth/mois

### Passage en Production

Quand votre application grandit :
- **Vercel Pro** : $20/mois (domaines illimités, analytics)
- **Railway** : Pay-as-you-go (~$5-20/mois selon usage)
- **Supabase Pro** : $25/mois (8 GB database, 100 GB bandwidth)

---

## 📝 Checklist de Déploiement

- [ ] Projet Supabase créé et configuré
- [ ] Backend déployé sur Railway
- [ ] Variables d'environnement backend configurées
- [ ] URL backend générée et notée
- [ ] Frontend déployé sur Vercel
- [ ] Variable `VITE_API_URL` configurée avec URL backend
- [ ] URL frontend générée et notée
- [ ] Variable `FRONTEND_URL` mise à jour sur Railway
- [ ] Tests de connexion frontend ↔ backend réussis
- [ ] Clé JWT sécurisée générée
- [ ] Logs vérifiés (pas d'erreurs)

---

## 🎉 Félicitations !

Votre application SAMA GARAGE est maintenant en ligne et accessible partout dans le monde !

**URLs à partager** :
- Frontend : `https://sama-garage.vercel.app`
- Backend API : `https://sama-garage-backend.up.railway.app`

---

## 📞 Support

Pour toute question :
1. Consultez les logs Railway et Vercel
2. Vérifiez la documentation Supabase
3. Consultez les docs officielles :
   - https://vercel.com/docs
   - https://docs.railway.app
   - https://supabase.com/docs
