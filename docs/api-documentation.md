# Documentation API SwapIt

URL de base : `http://localhost:3000`

Toutes les requêtes passent par l'API Gateway qui route vers le microservice approprié.

## Authentification

La plupart des endpoints nécessitent une authentification JWT. Inclure le token dans l'en-tête Authorization :

```
Authorization: Bearer <token>
```

## API User Service

### Inscrire un utilisateur

```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Connexion

```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe"
    }
  }
}
```

### Obtenir le profil utilisateur

```http
GET /api/users/profile/:id
```

### Mettre à jour le profil

```http
PUT /api/users/profile/:id
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Passionné de mode vintage",
  "preferences": {
    "notifications": true,
    "language": "fr"
  },
  "address": {
    "street": "123 Rue Example",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France"
  }
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Passionné de mode vintage",
    "preferences": {
      "notifications": true,
      "language": "fr"
    },
    "address": {
      "street": "123 Rue Example",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France"
    }
  }
}
```

### Obtenir l'historique (achats et ventes)

```http
GET /api/users/:id/history
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "purchases": [
      {
        "id": "order-uuid",
        "buyerId": "user-uuid",
        "sellerId": "seller-uuid",
        "productId": "product-uuid",
        "amount": 45.99,
        "status": "delivered",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "sales": [
      {
        "id": "order-uuid",
        "buyerId": "buyer-uuid",
        "sellerId": "user-uuid",
        "productId": "product-uuid",
        "amount": 45.99,
        "status": "delivered",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalPurchases": 5,
    "totalSales": 12
  }
}
```

## API Catalog Service

### Créer un produit

```http
POST /api/catalog
Content-Type: application/json

{
  "userId": "user-uuid",
  "title": "Veste en jean vintage",
  "description": "Veste vintage en excellent état des années 90",
  "price": 45.99,
  "category": "jackets",
  "size": "M",
  "condition": "good",
  "images": ["https://example.com/image1.jpg"],
  "location": "Paris, France"
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "product-uuid",
    "userId": "user-uuid",
    "title": "Veste en jean vintage",
    "price": 45.99,
    "status": "available",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Obtenir les produits

```http
GET /api/catalog?category=jackets&minPrice=20&maxPrice=100&status=available
```

**Paramètres de requête:**

- `category` - Filtrer par catégorie
- `minPrice` - Prix minimum
- `maxPrice` - Prix maximum
- `status` - Statut du produit (available, sold, reserved)

### Obtenir un produit par ID

```http
GET /api/catalog/:id
```

### Obtenir les produits d'un utilisateur

```http
GET /api/catalog/user/:userId
```

### Mettre à jour un produit

```http
PUT /api/catalog/:id
Content-Type: application/json

{
  "price": 40.00,
  "status": "sold"
}
```

### Supprimer un produit

```http
DELETE /api/catalog/:id
```

## API Search Service

### Rechercher des produits

```http
GET /api/search/search?q=veste&category=jackets&minPrice=20&maxPrice=100&size=M&page=1&limit=20
```

**Paramètres de requête:**

- `q` - Requête de recherche (plein texte)
- `category` - Filtrer par catégorie
- `minPrice` - Prix minimum
- `maxPrice` - Prix maximum
- `size` - Taille du produit
- `condition` - État du produit
- `location` - Filtre de localisation
- `page` - Numéro de page (défaut: 1)
- `limit` - Résultats par page (défaut: 20)

**Réponse:**

```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid",
      "title": "Veste en jean vintage",
      "price": 45.99,
      "score": 0.95
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

### Obtenir des suggestions de recherche

```http
GET /api/search/suggest?q=vest
```

## API Messaging Service

### Créer une conversation

```http
POST /api/messages/conversations
Content-Type: application/json

{
  "participant1Id": "user-uuid-1",
  "participant2Id": "user-uuid-2",
  "productId": "product-uuid" // optionnel
}
```

### Obtenir les conversations d'un utilisateur

```http
GET /api/messages/conversations/:userId
```

### Obtenir les messages

```http
GET /api/messages/conversations/:conversationId/messages?limit=50&before=2024-01-01T00:00:00Z
```

### Envoyer un message

```http
POST /api/messages/conversations/:conversationId/messages
Content-Type: application/json

{
  "senderId": "user-uuid-1",
  "receiverId": "user-uuid-2",
  "content": "Bonjour, est-ce que c'est encore disponible ?"
}
```

### Marquer un message comme lu

```http
PUT /api/messages/messages/:messageId/read
```

## API Transaction Service

### Créer une commande

```http
POST /api/transactions
Content-Type: application/json

{
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "productId": "product-uuid",
  "amount": 45.99
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "buyerId": "buyer-uuid",
    "sellerId": "seller-uuid",
    "productId": "product-uuid",
    "amount": 45.99,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Obtenir une commande

```http
GET /api/transactions/:id
```

### Obtenir les commandes d'un utilisateur

```http
GET /api/transactions/user/:userId?role=buyer
GET /api/transactions/user/:userId?role=seller
```

### Mettre à jour le statut d'une commande

```http
PUT /api/transactions/:id/status
Content-Type: application/json

{
  "status": "paid" // pending, paid, shipped, delivered, cancelled
}
```

### Traiter un paiement

```http
POST /api/transactions/:id/payment
Content-Type: application/json

{
  "paymentIntentId": "stripe-payment-intent-id"
}
```

## API Review Service

### Créer une évaluation

```http
POST /api/reviews
Content-Type: application/json

{
  "reviewerId": "reviewer-uuid",
  "revieweeId": "reviewee-uuid",
  "orderId": "order-uuid",
  "rating": 5,
  "comment": "Excellent vendeur, produit conforme"
}
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "reviewerId": "reviewer-uuid",
    "revieweeId": "reviewee-uuid",
    "orderId": "order-uuid",
    "rating": 5,
    "comment": "Excellent vendeur",
    "avgRating": 4.8,
    "totalReviews": 15,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Obtenir les évaluations d'un utilisateur

```http
GET /api/reviews/user/:userId
```

**Réponse:**

```json
{
  "success": true,
  "data": [...],
  "avgRating": 4.8,
  "totalReviews": 15
}
```

### Obtenir les évaluations d'un produit

```http
GET /api/reviews/product/:productId
```

## API Favorite Service

### Ajouter un favori

```http
POST /api/favorites
Content-Type: application/json

{
  "userId": "user-uuid",
  "productId": "product-uuid"
}
```

### Retirer un favori

```http
DELETE /api/favorites/:id
```

### Obtenir les favoris d'un utilisateur

```http
GET /api/favorites/user/:userId
```

### Vérifier si un produit est en favori

```http
GET /api/favorites/check?userId=user-uuid&productId=product-uuid
```

## API Delivery Service

### Créer un envoi

```http
POST /api/deliveries
Content-Type: application/json

{
  "orderId": "order-uuid",
  "shippingMethod": "relay_point",
  "trackingNumber": "TRACK123456",
  "carrier": "La Poste",
  "address": {
    "street": "123 Rue Example",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France"
  }
}
```

### Mettre à jour le statut d'un envoi

```http
PUT /api/deliveries/:id/status
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

### Obtenir l'envoi d'une commande

```http
GET /api/deliveries/order/:orderId
```

### Obtenir les envois d'un utilisateur

```http
GET /api/deliveries/user/:userId?role=buyer
GET /api/deliveries/user/:userId?role=seller
```

## API Wallet Service

### Obtenir le porte-monnaie d'un utilisateur

```http
GET /api/wallet/:userId
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "id": "wallet-uuid",
    "userId": "user-uuid",
    "balance": 150.50,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Créditer le porte-monnaie

```http
POST /api/wallet/:userId/credit
Content-Type: application/json

{
  "amount": 50.00,
  "description": "Recharge"
}
```

### Débiter le porte-monnaie

```http
POST /api/wallet/:userId/debit
Content-Type: application/json

{
  "amount": 25.00,
  "description": "Achat produit"
}
```

### Obtenir l'historique des transactions

```http
GET /api/wallet/:userId/transactions?limit=50&offset=0
```

## API Admin Service

### Créer un signalement

```http
POST /api/admin/reports
Content-Type: application/json

{
  "reporterId": "reporter-uuid",
  "reportedUserId": "reported-uuid",
  "reportedProductId": "product-uuid",
  "reason": "Contenu inapproprié",
  "description": "Description détaillée"
}
```

### Obtenir les signalements

```http
GET /api/admin/reports?status=pending&limit=50&offset=0
```

### Mettre à jour le statut d'un signalement

```http
PUT /api/admin/reports/:id/status
Content-Type: application/json

{
  "status": "resolved",
  "adminNotes": "Signalement traité"
}
```

### Obtenir les statistiques

```http
GET /api/admin/statistics
```

**Réponse:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalProducts": 5430,
    "totalOrders": 890,
    "totalRevenue": 45678.90,
    "pendingReports": 12
  }
}
```

### Modérer un produit

```http
PUT /api/admin/products/:productId/moderate
Content-Type: application/json

{
  "action": "reject",
  "reason": "Contenu non conforme"
}
```

## Réponses d'erreur

Tous les endpoints retournent les erreurs dans le format suivant :

```json
{
  "success": false,
  "error": {
    "message": "Description de l'erreur"
  }
}
```

**Codes de statut HTTP:**

- `200` - Succès
- `201` - Créé
- `400` - Requête invalide
- `401` - Non autorisé
- `404` - Non trouvé
- `409` - Conflit
- `500` - Erreur serveur interne
- `503` - Service indisponible

## Événements WebSocket (Messaging Service)

Connexion à : `ws://localhost:3004`

### Événements

**Client → Serveur:**

- `join-conversation` - Rejoindre une conversation
- `leave-conversation` - Quitter une conversation

**Serveur → Client:**

- `new-message` - Nouveau message reçu

### Exemple

```javascript
const socket = io("http://localhost:3004");
socket.emit("join-conversation", "conversation-id");
socket.on("new-message", (message) => {
  console.log("Nouveau message:", message);
});
```
