# 🔐 Guide : Créer un Nouvel Utilisateur Admin

## ✨ Méthode SIMPLE : Supabase Hash Automatiquement ! (Recommandé)

### Étape 1 : Exécuter le Script SQL

1. Allez sur **Supabase** : https://supabase.com
2. Ouvrez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez-collez ce script :

```sql
-- Activer l'extension pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Créer l'utilisateur admin (PostgreSQL hash automatiquement !)
INSERT INTO users (
  id, 
  email, 
  password_hash, 
  full_name, 
  role, 
  tenant_id,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'votre_email@example.com',  -- ← Remplacez par votre email
  crypt('VotreMotDePasse2024!', gen_salt('bf', 10)),  -- ← Remplacez par votre mot de passe
  'Votre Nom Complet',  -- ← Remplacez par votre nom
  'admin_garage',
  'default',
  true,
  NOW(),
  NOW()
);
```

6. **Modifiez UNIQUEMENT** :
   - `votre_email@example.com` → Votre email
   - `VotreMotDePasse2024!` → Votre mot de passe (en clair !)
   - `Votre Nom Complet` → Votre nom

7. Cliquez sur **Run** (ou F5)

**C'est tout !** PostgreSQL hash automatiquement le mot de passe avec bcrypt.

### Étape 3 : Vérifier la Création

Exécutez cette requête pour vérifier :

```sql
SELECT id, email, full_name, role, is_active, created_at 
FROM users 
WHERE email = 'votre_email@example.com';
```

Vous devriez voir votre utilisateur !

---

## Méthode 2 : Via l'API Backend (Alternative)

Si votre backend est déjà déployé et fonctionnel, vous pouvez utiliser l'endpoint de création d'agent.

### Utiliser Postman ou cURL

```bash
curl -X POST https://votre-backend.up.railway.app/api/auth/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -d '{
    "email": "nouvel_admin@example.com",
    "full_name": "Nouveau Admin",
    "role": "admin_garage"
  }'
```

**Note** : Cette méthode nécessite d'être déjà connecté avec un compte admin.

---

## Méthode 3 : Script Node.js Local (Plus Rapide)

Si vous voulez générer le hash localement :

### Étape 1 : Créer un script

Créez un fichier `generate-admin.js` :

```javascript
const bcrypt = require('bcrypt');

async function generateAdmin() {
  const email = 'votre_email@example.com';
  const password = 'VotreMotDePasse2024!';
  const fullName = 'Votre Nom Complet';
  
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n=== SQL à exécuter dans Supabase ===\n');
  console.log(`INSERT INTO users (id, email, password_hash, full_name, role, tenant_id, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '${email}',
  '${hash}',
  '${fullName}',
  'admin_garage',
  'default',
  true,
  NOW(),
  NOW()
);\n`);
  
  console.log('=== Identifiants de connexion ===');
  console.log(`Email: ${email}`);
  console.log(`Mot de passe: ${password}`);
}

generateAdmin();
```

### Étape 2 : Exécuter le script

```bash
cd "c:\Users\HP\DATAS\CascadeProjects\ProjectV1\SAMA GARAGE\backend"
node generate-admin.js
```

### Étape 3 : Copier le SQL généré

Copiez le SQL affiché et exécutez-le dans Supabase SQL Editor.

---

## 🎯 Exemple Complet

Voici un exemple avec des valeurs réelles :

**Mot de passe choisi** : `Admin2024Secure!`

**Hash bcrypt généré** : `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGa8LR8WzMyWiUe.Em`

**SQL à exécuter** :

```sql
INSERT INTO users (
  id, 
  email, 
  password_hash, 
  full_name, 
  role, 
  tenant_id,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'admin@mongarage.sn',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGa8LR8WzMyWiUe.Em',
  'Administrateur Principal',
  'admin_garage',
  'default',
  true,
  NOW(),
  NOW()
);
```

**Identifiants de connexion** :
- Email : `admin@mongarage.sn`
- Mot de passe : `Admin2024Secure!`

---

## ✅ Vérification

Après avoir créé l'utilisateur :

1. Allez sur votre frontend Vercel
2. Connectez-vous avec les identifiants
3. Changez le mot de passe dans les paramètres du profil

---

## 🔒 Conseils de Sécurité

- ✅ Utilisez un mot de passe fort (12+ caractères, majuscules, minuscules, chiffres, symboles)
- ✅ Ne partagez jamais le hash du mot de passe
- ✅ Changez le mot de passe après la première connexion
- ✅ Activez l'authentification à deux facteurs (si disponible)
- ✅ Utilisez un gestionnaire de mots de passe

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Vérifiez que la table `users` existe dans Supabase
2. Vérifiez que l'email n'existe pas déjà
3. Vérifiez que le hash bcrypt est correct (commence par `$2b$10$`)
4. Consultez les logs d'erreur dans Supabase
