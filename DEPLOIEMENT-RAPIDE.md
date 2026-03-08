# 🚀 Déploiement Rapide - SAMA GARAGE

## Vue d'ensemble

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   SUPABASE      │◄────────│   RAILWAY       │◄────────│    VERCEL       │
│  (PostgreSQL)   │         │   (Backend)     │         │  (Frontend)     │
│                 │         │   NestJS API    │         │  React + Vite   │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## ⚡ Déploiement en 15 minutes

### 1️⃣ Supabase (5 min)

```bash
1. Créer un compte sur https://supabase.com
2. Nouveau projet → Nom: "sama-garage-db"
3. Copier: Project URL + anon key + service_role key
```

### 2️⃣ Railway - Backend (5 min)

```bash
1. Push votre code sur GitHub
2. https://railway.app → New Project → Deploy from GitHub
3. Sélectionner le dépôt "sama-garage"
4. Settings → Root Directory: "backend"
5. Variables → Ajouter (voir section Variables Backend)
6. Generate Domain → Copier l'URL
```

**Variables Backend essentielles** :
```env
NODE_ENV=production
SUPABASE_URL=<votre_url_supabase>
SUPABASE_ANON_KEY=<votre_anon_key>
SUPABASE_SERVICE_KEY=<votre_service_key>
JWT_SECRET=<générer_une_clé_aléatoire>
FRONTEND_URL=<url_vercel_après_étape_3>
```

### 3️⃣ Vercel - Frontend (5 min)

```bash
1. https://vercel.com → New Project → Import from GitHub
2. Sélectionner "sama-garage"
3. Framework: Vite
4. Root Directory: "frontend"
5. Environment Variables → Ajouter:
   VITE_API_URL=<url_railway_étape_2>
6. Deploy
7. Copier l'URL générée
```

### 4️⃣ Finalisation (2 min)

```bash
1. Retourner sur Railway
2. Mettre à jour FRONTEND_URL avec l'URL Vercel
3. Redéployer
4. Tester l'application !
```

---

## 🔑 Variables d'Environnement Complètes

### Backend (Railway)

```env
# Application
NODE_ENV=production
PORT=${{PORT}}
APP_NAME=SAMA GARAGE API

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# JWT - Générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=votre_cle_secrete_aleatoire_64_caracteres
JWT_EXPIRATION=15m
SESSION_INACTIVITY_TIMEOUT=30

# URLs
FRONTEND_URL=https://sama-garage.vercel.app
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Config
ENABLE_MULTI_TENANT=false
MAX_FILE_SIZE=5242880
LOG_LEVEL=info
```

### Frontend (Vercel)

```env
VITE_API_URL=https://sama-garage-backend.up.railway.app
```

---

## ✅ Checklist Rapide

- [ ] Compte Supabase créé
- [ ] Projet Supabase créé + credentials notés
- [ ] Code pushé sur GitHub
- [ ] Backend déployé sur Railway
- [ ] Variables backend configurées
- [ ] URL backend notée
- [ ] Frontend déployé sur Vercel
- [ ] Variable VITE_API_URL configurée
- [ ] URL frontend notée
- [ ] Variable FRONTEND_URL mise à jour sur Railway
- [ ] Application testée et fonctionnelle

---

## 🆘 Problèmes Courants

### ❌ CORS Error
**Solution** : Vérifier que `FRONTEND_URL` sur Railway = URL exacte Vercel (sans `/` final)

### ❌ Backend ne démarre pas
**Solution** : Vérifier les logs Railway + toutes les variables d'environnement

### ❌ Frontend ne se connecte pas au backend
**Solution** : Vérifier que `VITE_API_URL` = URL exacte Railway

### ❌ Erreur Supabase
**Solution** : Vérifier URL et clés Supabase dans Railway

---

## 📱 Accès à votre Application

Une fois déployé :
- **Frontend** : `https://sama-garage.vercel.app`
- **Backend API** : `https://sama-garage-backend.up.railway.app`
- **Documentation API** : Désactivée en production (sécurité)

---

## 💡 Conseils

1. **Sécurité** : Ne jamais commiter les fichiers `.env`
2. **Monitoring** : Consultez régulièrement les logs Railway et Vercel
3. **Performance** : Activez Vercel Analytics pour suivre les performances
4. **Domaine** : Configurez un domaine personnalisé pour plus de professionnalisme

---

## 📚 Documentation Complète

Pour plus de détails, consultez `DEPLOIEMENT.md` dans la racine du projet.
