# API de Gestion des Agents - SAMA GARAGE

Cette documentation décrit les endpoints spécifiques pour la gestion des comptes agents (Mécaniciens et Caissiers) par l'administrateur.

## 🎯 **Objectif**

Permettre à l'administrateur du garage de :
- ✅ Créer des comptes agents (mécanicien/caissier)
- ✅ Lister tous les agents existants
- ✅ Gérer les mots de passe des agents
- ❌ Les agents ne peuvent PAS créer de comptes

## 🔐 **Sécurité et Permissions**

### **Rôles Autorisés**
- **`admin_garage`** : Accès complet à la gestion des agents
- **`mechanic`** : Accès refusé
- **`cashier`** : Accès refusé

### **Protection des Endpoints**
- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles(UserRole.ADMIN_GARAGE)`
- `@ApiBearerAuth()` pour Swagger

## 📋 **Endpoints API**

### 1. **Créer un Agent**
```http
POST /auth/create-agent
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Corps de la requête :**
```json
{
  "email": "mechanic@samagarage.sn",
  "password": "password123",
  "full_name": "Cheikh Mbodj",
  "role": "mechanic"  // ou "cashier"
}
```

**Réponse succès (201) :**
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": "uuid-de-lutilisateur",
    "email": "mechanic@samagarage.sn",
    "full_name": "Cheikh Mbodj",
    "role": "mechanic",
    "is_active": true,
    "tenant_id": "default",
    "created_at": "2024-01-25T13:00:00Z"
  }
}
```

**Erreurs possibles :**
- `403` : Accès refusé (non-admin)
- `400` : Rôle invalide (seuls mechanic/cashier autorisés)
- `400` : Email déjà utilisé

---

### 2. **Lister tous les Agents**
```http
GET /auth/agents
Authorization: Bearer <admin_jwt_token>
```

**Réponse succès (200) :**
```json
{
  "message": "Agents récupérés avec succès",
  "agents": [
    {
      "id": "uuid-1",
      "email": "mechanic@samagarage.sn",
      "full_name": "Cheikh Mbodj",
      "role": "mechanic",
      "is_active": true,
      "created_at": "2024-01-25T13:00:00Z"
    },
    {
      "id": "uuid-2",
      "email": "cashier@samagarage.sn",
      "full_name": "Fatou Sarr",
      "role": "cashier",
      "is_active": true,
      "created_at": "2024-01-25T12:30:00Z"
    }
  ],
  "total": 2
}
```

---

### 3. **Mot de Passe Oublié (Agent)**
```http
POST /auth/forgot-password
Content-Type: application/json
```

**Corps de la requête :**
```json
{
  "email": "mechanic@samagarage.sn"
}
```

**Réponse succès (200) :**
```json
{
  "message": "Email de réinitialisation envoyé avec succès",
  "resetToken": "jwt-token-pour-tests"  // Uniquement en développement
}
```

---

### 4. **Réinitialiser le Mot de Passe**
```http
POST /auth/reset-password
Content-Type: application/json
```

**Corps de la requête :**
```json
{
  "token": "jwt-token-reçu-par-email",
  "newPassword": "nouveauMotDePasse123"
}
```

**Réponse succès (200) :**
```json
{
  "message": "Mot de passe réinitialisé avec succès"
}
```

---

## 🧪 **Exemples d'Utilisation**

### **Postman Collection**

#### **1. Login Admin**
```json
{
  "info": {
    "name": "SAMA GARAGE - Agents API"
  },
  "item": [
    {
      "name": "Login Admin",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"admin@samagarage.sn\",\n  \"password\": \"password123\"\n}"
        }
      }
    }
  ]
}
```

#### **2. Créer un Mécanicien**
```json
{
  "name": "Créer Mécanicien",
  "request": {
    "method": "POST",
    "url": "http://localhost:3000/auth/create-agent",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{admin_token}}"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"email\": \"mechanic1@samagarage.sn\",\n  \"password\": \"password123\",\n  \"full_name\": \"Ibrahim Ba\",\n  \"role\": \"mechanic\"\n}"
    }
  }
}
```

#### **3. Créer un Caissier**
```json
{
  "name": "Créer Caissier",
  "request": {
    "method": "POST",
    "url": "http://localhost:3000/auth/create-agent",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{admin_token}}"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"email\": \"cashier1@samagarage.sn\",\n  \"password\": \"password123\",\n  \"full_name\": \"Aminata Diop\",\n  \"role\": \"cashier\"\n}"
    }
  }
}
```

---

## 📝 **DTOs et Validation**

### **CreateAgentDto**
```typescript
export class CreateAgentDto {
  @IsEmail() email: string;                    // Email valide requis
  @MinLength(6) password: string;             // Min 6 caractères
  @IsString() full_name: string;              // Nom complet requis
  @IsEnum(['mechanic', 'cashier']) role: UserRole.MECHANIC | UserRole.CASHIER;
}
```

### **Messages d'Erreur**
- `"L'email est obligatoire"`
- `"Le mot de passe doit contenir au moins 6 caractères"`
- `"Le nom complet est obligatoire"`
- `"Le rôle doit être soit Mécanicien soit Caissier"`

---

## 🔧 **Workflow Complet**

### **1. Configuration Initiale**
```
Admin → Login → JWT Token → Accès endpoints agents
```

### **2. Création d'Agent**
```
Admin → POST /auth/create-agent → Validation → Création Supabase → Email bienvenue
```

### **3. Gestion des Agents**
```
Admin → GET /auth/agents → Liste agents → Interface gestion
```

### **4. Support Agent**
```
Agent → POST /auth/forgot-password → Token → Email → Réinitialisation
```

---

## 🚨 **Sécurité**

### **Validations**
- ✅ Seul l'admin peut créer des comptes
- ✅ Rôles limités à mechanic/cashier
- ✅ Validation stricte des emails
- ✅ Longueur minimale des mots de passe
- ✅ Unicité des emails

### **Protection**
- ✅ JWT tokens obligatoires
- ✅ Vérification des rôles
- ✅ Isolation par tenant_id
- ✅ RLS policies sur Supabase

---

## 📊 **Statistiques**

L'endpoint `GET /auth/agents` retourne :
- **agents[]** : Liste des agents actifs
- **total** : Nombre total d'agents
- **filtré par rôle** : mechanic/cashier uniquement
- **trié par date** : Plus récents d'abord

---

## 🔄 **Intégration Frontend**

### **React Hook Exemple**
```typescript
// Créer un agent
const createAgent = async (agentData: CreateAgentDto) => {
  const response = await fetch('/auth/create-agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(agentData)
  });
  return response.json();
};

// Lister les agents
const getAgents = async () => {
  const response = await fetch('/auth/agents', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

---

**Cette API est optimisée pour la gestion des agents dans SAMA GARAGE avec des validations strictes et une sécurité renforcée.**
