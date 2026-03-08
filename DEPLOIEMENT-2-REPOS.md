# 🚀 Déploiement avec 2 Dépôts Séparés

## Option Alternative : Frontend et Backend dans des repos séparés

### Étape 1 : Créer 2 dépôts GitHub

1. **sama-garage-backend** (dépôt 1)
2. **sama-garage-frontend** (dépôt 2)

---

## 📦 Préparation Backend

```bash
# Aller dans le dossier backend
cd "c:\Users\HP\DATAS\CascadeProjects\ProjectV1\SAMA GARAGE\backend"

# Initialiser Git
git init

# Créer .gitignore pour le backend
echo "node_modules/
dist/
.env
.env.*
!.env.example
*.log
coverage/" > .gitignore

# Ajouter les fichiers
git add .
git commit -m "Initial commit - SAMA GARAGE Backend"

# Créer le dépôt sur GitHub puis :
git remote add origin https://github.com/VOTRE_USERNAME/sama-garage-backend.git
git branch -M main
git push -u origin main
```

---

## 🎨 Préparation Frontend

```bash
# Aller dans le dossier frontend
cd "c:\Users\HP\DATAS\CascadeProjects\ProjectV1\SAMA GARAGE\frontend"

# Initialiser Git
git init

# Créer .gitignore pour le frontend
echo "node_modules/
dist/
.env
.env.*
!.env.example
*.log
.cache/" > .gitignore

# Ajouter les fichiers
git add .
git commit -m "Initial commit - SAMA GARAGE Frontend"

# Créer le dépôt sur GitHub puis :
git remote add origin https://github.com/VOTRE_USERNAME/sama-garage-frontend.git
git branch -M main
git push -u origin main
```

---

## 🚂 Déploiement Railway (Backend)

1. Aller sur https://railway.app
2. New Project → Deploy from GitHub
3. **Sélectionner : sama-garage-backend**
4. Settings :
   - ✅ **Root Directory** : Laisser vide (ou `/`)
   - ✅ Build Command : `npm install && npm run build`
   - ✅ Start Command : `npm run start:prod`
5. Ajouter les variables d'environnement (voir DEPLOIEMENT-RAPIDE.md)
6. Generate Domain → Noter l'URL

---

## 🎯 Déploiement Vercel (Frontend)

1. Aller sur https://vercel.com
2. New Project → Import from GitHub
3. **Sélectionner : sama-garage-frontend**
4. Settings :
   - ✅ Framework Preset : Vite
   - ✅ **Root Directory** : Laisser vide (ou `/`)
   - ✅ Build Command : `npm run build`
   - ✅ Output Directory : `dist`
5. Environment Variables :
   ```env
   VITE_API_URL=https://sama-garage-backend.up.railway.app
   ```
6. Deploy → Noter l'URL

---

## ⚖️ Comparaison : 1 Repo vs 2 Repos

### 1 Repo (Monorepo) ✅ RECOMMANDÉ

**Avantages** :
- ✅ Plus simple à gérer
- ✅ Historique Git unifié
- ✅ Partage facile de docs et configs
- ✅ Déploiements coordonnés
- ✅ Moins de repos à maintenir

**Inconvénients** :
- ⚠️ Besoin de configurer "Root Directory"

### 2 Repos (Séparés)

**Avantages** :
- ✅ Séparation claire des responsabilités
- ✅ Équipes différentes peuvent travailler indépendamment
- ✅ Permissions GitHub granulaires

**Inconvénients** :
- ⚠️ 2 repos à maintenir
- ⚠️ Documentation dupliquée
- ⚠️ Synchronisation manuelle des versions
- ⚠️ Plus complexe pour les déploiements coordonnés

---

## 🎯 Recommandation

Pour SAMA GARAGE, **gardez 1 seul repo** (monorepo) car :

1. Vous êtes probablement la même équipe
2. Les déploiements sont liés (API + Frontend)
3. Plus simple à maintenir
4. Railway et Vercel gèrent parfaitement les monorepos

---

## 🔄 Migration : Passer de 1 repo à 2 repos (si besoin)

Si vous changez d'avis plus tard :

```bash
# Extraire le backend dans un nouveau repo
git subtree split -P backend -b backend-only
git push https://github.com/VOTRE_USERNAME/sama-garage-backend.git backend-only:main

# Extraire le frontend dans un nouveau repo
git subtree split -P frontend -b frontend-only
git push https://github.com/VOTRE_USERNAME/sama-garage-frontend.git frontend-only:main
```

---

## 📝 Conclusion

**Restez avec 1 seul repo** et utilisez les "Root Directory" sur Railway et Vercel. C'est la solution la plus simple et efficace pour votre projet !
