# Documentation API - SAMA GARAGE

## Base URL

- **Développement** : `http://localhost:3000`
- **Documentation Swagger** : `http://localhost:3000/api/docs`

## Authentification

Toutes les requêtes (sauf `/auth/login` et `/auth/register`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <votre_token>
```

---

## Endpoints

### 🔐 Authentification

#### POST /auth/register
Créer un nouvel utilisateur

**Body** :
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nom Complet",
  "role": "admin_garage",
  "tenant_id": "uuid"
}
```

**Réponse** : `201 Created`

---

#### POST /auth/login
Se connecter

**Body** :
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse** :
```json
{
  "access_token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Nom Complet",
    "role": "admin_garage"
  }
}
```

---

### 👥 Utilisateurs

#### GET /users
Lister tous les utilisateurs (Admin uniquement)

**Réponse** : `200 OK`

---

#### GET /users/:id
Récupérer un utilisateur

**Réponse** : `200 OK`

---

#### PATCH /users/:id
Mettre à jour un utilisateur (Admin uniquement)

**Body** :
```json
{
  "full_name": "Nouveau Nom",
  "phone": "+221771234567"
}
```

**Réponse** : `200 OK`

---

### 🚗 Véhicules

#### POST /vehicles
Enregistrer un nouveau véhicule

**Body** :
```json
{
  "registration_number": "DK-1234-AB",
  "brand": "Toyota",
  "model": "Corolla",
  "year": "2018",
  "owner_id": "uuid",
  "color": "Blanc"
}
```

**Réponse** : `201 Created`

---

#### GET /vehicles
Lister tous les véhicules

**Réponse** : `200 OK`

---

#### GET /vehicles/:id
Récupérer un véhicule avec son historique

**Réponse** : `200 OK`

---

#### PATCH /vehicles/:id
Mettre à jour un véhicule

**Réponse** : `200 OK`

---

#### DELETE /vehicles/:id
Supprimer un véhicule

**Réponse** : `200 OK`

---

### 🔧 Interventions

#### POST /interventions
Créer une nouvelle intervention

**Body** :
```json
{
  "vehicle_id": "uuid",
  "type": "repair",
  "description": "Changement de batterie",
  "mechanic_id": "uuid",
  "estimated_cost": 50000
}
```

**Réponse** : `201 Created`

---

#### GET /interventions
Lister les interventions

**Query params** :
- `status` : pending, in_progress, completed

**Réponse** : `200 OK`

---

#### GET /interventions/:id
Récupérer une intervention

**Réponse** : `200 OK`

---

#### PATCH /interventions/:id
Mettre à jour une intervention

**Body** :
```json
{
  "status": "completed",
  "work_done": "Batterie changée",
  "final_cost": 45000
}
```

**Réponse** : `200 OK`

---

### 💰 Finance

#### POST /finance/invoices
Créer une facture

**Body** :
```json
{
  "intervention_id": "uuid",
  "total_amount": 45000,
  "description": "Facture pour intervention #123"
}
```

**Réponse** : `201 Created`

---

#### GET /finance/invoices
Lister les factures

**Réponse** : `200 OK`

---

#### POST /finance/payments
Enregistrer un paiement

**Body** :
```json
{
  "invoice_id": "uuid",
  "payment_method": "cash",
  "amount_paid": 45000
}
```

**Réponse** : `201 Created`

---

#### GET /finance/reports
Obtenir les rapports financiers

**Query params** :
- `startDate` : date de début (ISO 8601)
- `endDate` : date de fin (ISO 8601)

**Réponse** :
```json
{
  "totalRevenue": 1500000,
  "paidInvoices": 25,
  "pendingInvoices": 5,
  "invoices": []
}
```

---

### 📦 Stock

#### POST /stock
Ajouter un article au stock

**Body** :
```json
{
  "name": "Batterie 12V",
  "reference": "BAT-001",
  "quantity": 10,
  "unit_price": 25000,
  "alert_threshold": 5
}
```

**Réponse** : `201 Created`

---

#### GET /stock
Lister les articles en stock

**Réponse** : `200 OK`

---

#### GET /stock/alerts
Alertes de stock faible

**Réponse** : `200 OK`

---

#### PATCH /stock/:id
Mettre à jour un article

**Réponse** : `200 OK`

---

### ⚙️ Paramètres

#### GET /settings
Récupérer les paramètres du garage

**Réponse** : `200 OK`

---

#### PATCH /settings
Mettre à jour les paramètres (Admin uniquement)

**Body** :
```json
{
  "garage_name": "SAMA GARAGE",
  "address": "Dakar, Sénégal",
  "phone": "+221771234567",
  "email": "contact@samagarage.sn"
}
```

**Réponse** : `200 OK`

---

## Codes de statut

- **200** : Succès
- **201** : Créé avec succès
- **400** : Requête invalide
- **401** : Non authentifié
- **403** : Non autorisé
- **404** : Ressource introuvable
- **500** : Erreur serveur

## Formats de données

### Dates
Format ISO 8601 : `2025-01-01T00:00:00.000Z`

### Montants
Nombres décimaux : `45000.00` (en FCFA)

### UUID
Format standard : `123e4567-e89b-12d3-a456-426614174000`

---

## Exemples avec cURL

### Connexion
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@samagarage.sn","password":"password123"}'
```

### Créer un véhicule
```bash
curl -X POST http://localhost:3000/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"registration_number":"DK-1234-AB","brand":"Toyota","model":"Corolla","owner_id":"uuid"}'
```

---

Pour plus de détails, consultez la documentation Swagger interactive : `http://localhost:3000/api/docs`
