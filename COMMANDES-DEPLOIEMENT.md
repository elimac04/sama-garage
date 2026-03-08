# 📝 Commandes de Déploiement - SAMA GARAGE

## 🔧 Commandes Utiles

### Générer une clé JWT sécurisée

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Initialiser Git et pousser sur GitHub

```bash
# Dans le dossier racine du projet
cd "c:\Users\HP\DATAS\CascadeProjects\ProjectV1\SAMA GARAGE"

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - SAMA GARAGE ready for deployment"

# Créer un dépôt sur GitHub puis :
git remote add origin https://github.com/VOTRE_USERNAME/sama-garage.git
git branch -M main
git push -u origin main
```

### Vérifier les fichiers avant commit

```bash
# Voir les fichiers qui seront commités
git status

# Voir les fichiers ignorés
git status --ignored
```

### Tester localement avant déploiement

#### Backend
```bash
cd backend
npm install
npm run build
npm run start:prod
```

#### Frontend
```bash
cd frontend
npm install
npm run build
npm run preview
```

---

## 🌐 URLs de Déploiement

### Plateformes

- **Supabase** : https://supabase.com
- **Railway** : https://railway.app
- **Vercel** : https://vercel.com

### Documentation

- **Railway Docs** : https://docs.railway.app
- **Vercel Docs** : https://vercel.com/docs
- **Supabase Docs** : https://supabase.com/docs

---

## 📋 Variables d'Environnement à Préparer

### Pour Railway (Backend)

Copiez ce template et remplissez les valeurs :

```env
NODE_ENV=production
PORT=${{PORT}}
APP_NAME=SAMA GARAGE API

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

JWT_SECRET=
JWT_EXPIRATION=15m
SESSION_INACTIVITY_TIMEOUT=30

FRONTEND_URL=
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}

ENABLE_MULTI_TENANT=false
MAX_FILE_SIZE=5242880
LOG_LEVEL=info

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@samagarage.sn
EMAIL_FROM_NAME=SAMA GARAGE
```

### Pour Vercel (Frontend)

```env
VITE_API_URL=
```

---

## 🔍 Vérification Post-Déploiement

### Tester le Backend

```bash
# Vérifier que le serveur répond
curl https://votre-backend.up.railway.app

# Tester un endpoint spécifique (exemple)
curl https://votre-backend.up.railway.app/api/health
```

### Tester le Frontend

1. Ouvrir l'URL Vercel dans le navigateur
2. Ouvrir la console développeur (F12)
3. Vérifier qu'il n'y a pas d'erreurs CORS
4. Tester la connexion

---

## 🚨 Dépannage Rapide

### Backend ne démarre pas sur Railway

```bash
# Vérifier les logs
1. Aller sur Railway → Votre projet → Deployments
2. Cliquer sur le dernier déploiement
3. Consulter les logs

# Problèmes courants :
- Variables d'environnement manquantes
- Erreur de build (vérifier package.json)
- Port non configuré (utiliser ${{PORT}})
```

### Frontend ne build pas sur Vercel

```bash
# Vérifier :
1. Root Directory = "frontend"
2. Build Command = "npm run build"
3. Output Directory = "dist"
4. Framework Preset = "Vite"

# Consulter les logs de build sur Vercel
```

### Erreur CORS

```bash
# Sur Railway, vérifier :
FRONTEND_URL=https://sama-garage.vercel.app  # Sans "/" à la fin !

# Sur Vercel, vérifier :
VITE_API_URL=https://sama-garage-backend.up.railway.app  # Sans "/" à la fin !
```

---

## 🔄 Redéploiement

### Déployer une nouvelle version

```bash
# Faire vos modifications
git add .
git commit -m "Description des changements"
git push origin main

# Railway et Vercel redéploient automatiquement !
```

### Forcer un redéploiement

**Railway** :
1. Aller dans Deployments
2. Cliquer sur "Redeploy"

**Vercel** :
1. Aller dans Deployments
2. Cliquer sur "..." → "Redeploy"

---

## 📊 Monitoring

### Vérifier les logs en temps réel

**Railway** :
```bash
# Via CLI (optionnel)
railway logs
```

**Vercel** :
```bash
# Via CLI (optionnel)
vercel logs
```

### Métriques importantes à surveiller

- **Railway** : CPU, RAM, Network usage
- **Vercel** : Build time, Response time, Bandwidth
- **Supabase** : Database size, API requests

---

## 💾 Backup et Sécurité

### Backup de la base de données

1. Aller sur Supabase → Database → Backups
2. Configurer les backups automatiques
3. Télécharger un backup manuel si nécessaire

### Rotation des secrets

```bash
# Générer une nouvelle clé JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Mettre à jour sur Railway
# Redéployer
```

---

## 🎯 Prochaines Étapes

Après le déploiement réussi :

1. ✅ Configurer un domaine personnalisé
2. ✅ Activer les analytics Vercel
3. ✅ Configurer les alertes Railway
4. ✅ Mettre en place un monitoring (ex: Sentry)
5. ✅ Configurer les backups automatiques Supabase
6. ✅ Documenter les procédures pour votre équipe

---

## 📞 Ressources

- **Support Railway** : https://railway.app/help
- **Support Vercel** : https://vercel.com/support
- **Support Supabase** : https://supabase.com/support
- **Documentation NestJS** : https://docs.nestjs.com
- **Documentation React** : https://react.dev
