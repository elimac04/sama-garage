# Module Auth - SAMA GARAGE

Ce module gère l'authentification, l'autorisation et la gestion des mots de passe pour l'application SAMA GARAGE.

## 🚀 Fonctionnalités

### 1. **Authentification**
- **Login** : Connexion des utilisateurs avec email/mot de passe
- **Register** : Création de nouveaux comptes (Admin uniquement)
- **Profile** : Accès aux informations de l'utilisateur connecté

### 2. **Gestion des Mots de Passe**
- **Forgot Password** : Demande de réinitialisation du mot de passe
- **Reset Password** : Réinitialisation avec token sécurisé
- **Token Verification** : Validation des tokens de réinitialisation

### 3. **Sécurité**
- **JWT Tokens** : Tokens d'authentification sécurisés
- **Role-based Access** : Contrôle d'accès par rôle
- **Password Hashing** : Hashage sécurisé avec bcrypt
- **Token Expiration** : Tokens avec durée de vie limitée

## 📋 Rôles et Permissions

| Rôle | Permissions |
|------|-------------|
| `super_admin` | Accès complet à tous les modules |
| `admin_garage` | Gestion du garage, création d'utilisateurs |
| `mechanic` | Gestion des interventions et véhicules |
| `cashier` | Gestion financière et caisse uniquement |

## 🔌 Endpoints API

### Authentification
```http
POST /auth/login
POST /auth/register (Admin uniquement)
GET /auth/me
```

### Mot de Passe Oublié
```http
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-reset-token
```

## 📝 DTOs (Data Transfer Objects)

### RegisterDto
```typescript
{
  email: string;
  password: string; // min 6 caractères
  full_name: string;
  role: UserRole;
  tenant_id?: string;
}
```

### LoginDto
```typescript
{
  email: string;
  password: string;
}
```

### ForgotPasswordDto
```typescript
{
  email: string;
}
```

### ResetPasswordDto
```typescript
{
  token: string;
  newPassword: string; // min 6 caractères
}
```

## 🔐 Sécurité

### 1. **Validation des Entrées**
- Validation des emails avec `class-validator`
- Longueur minimale des mots de passe : 6 caractères
- Énumération stricte des rôles

### 2. **Protection des Endpoints**
- `@UseGuards(JwtAuthGuard)` pour l'authentification
- `@Roles(UserRole.ADMIN_GARAGE)` pour l'autorisation
- `@ApiBearerAuth()` pour la documentation Swagger

### 3. **Tokens JWT**
```typescript
// Structure du payload
{
  sub: string;      // ID utilisateur
  email: string;    // Email utilisateur
  role: string;     // Rôle utilisateur
  tenant_id: string; // ID tenant (multi-tenant)
}
```

### 4. **Tokens de Réinitialisation**
- Durée de vie : 1 heure
- Type spécifique : `password_reset`
- Stockage en base avec statut d'utilisation

## 🗄️ Base de Données

### Tables requises :
1. **users** : Informations des utilisateurs
2. **password_resets** : Tokens de réinitialisation

### Migration SQL :
```sql
-- Voir le fichier : migrations/001_create_password_resets_table.sql
```

## 📧 Configuration Email

### Variables d'environnement :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@samagarage.sn
EMAIL_FROM_NAME=SAMA GARAGE
```

### Services d'email supportés :
- **Développement** : Console logging
- **Production** : Nodemailer (SMTP)
- **Future** : SendGrid, Mailgun, etc.

## 🧪 Tests et Développement

### Mode Développement :
- Les tokens de réinitialisation sont retournés dans la réponse
- Emails loggés dans la console
- Variables d'environnement par défaut

### Tests Postman :
```json
{
  "login": {
    "url": "POST /auth/login",
    "body": {
      "email": "admin@samagarage.sn",
      "password": "password123"
    }
  },
  "forgot": {
    "url": "POST /auth/forgot-password",
    "body": {
      "email": "user@example.com"
    }
  }
}
```

## 🔧 Configuration

### Variables requises :
```env
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRATION=7d
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Installation des dépendances :
```bash
npm install @nestjs/jwt @nestjs/passport bcrypt
npm install @nestjs/config @nestjs/swagger
npm install class-validator class-transformer
npm install --save-dev @types/bcrypt @types/node
```

## 📋 Workflow d'Authentification

### 1. Login
```
User → POST /auth/login → Validation → JWT Token → Response
```

### 2. Registration (Admin)
```
Admin → POST /auth/register → Vérification rôle → Création user → Email bienvenue
```

### 3. Mot de Passe Oublié
```
User → POST /auth/forgot-password → Token génération → Email token → User reçoit email
User → POST /auth/reset-password → Token validation → MàJ password → Confirmation
```

## 🚨 Erreurs Communes

### 1. **Email déjà utilisé**
```json
{
  "statusCode": 400,
  "message": "Cet email est déjà utilisé"
}
```

### 2. **Token expiré**
```json
{
  "statusCode": 400,
  "message": "Token expiré"
}
```

### 3. **Accès non autorisé**
```json
{
  "statusCode": 403,
  "message": "Accès refusé - Admin uniquement"
}
```

## 🔄 Prochaines Évolutions

1. **OAuth2** : Google, Facebook login
2. **2FA** : Double authentification
3. **Rate Limiting** : Limitation des tentatives
4. **Audit Logs** : Journalisation des actions
5. **Password Policies** : Politiques de mot de passe complexes

---

**Note** : Ce module est conçu pour être sécurisé, scalable et facile à maintenir. Suivez les bonnes pratiques de sécurité en production !
