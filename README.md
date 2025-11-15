# SwapIt - Architecture Microservices Distribuée

Une plateforme peer-to-peer pour l'achat, la vente et l'échange de vêtements et accessoires d'occasion, construite avec une architecture microservices.

## 🏗️ Vue d'ensemble de l'architecture

SwapIt est construit avec une architecture microservices comprenant les services suivants :

- **API Gateway** - Point d'entrée unifié pour toutes les requêtes client
- **User Service** - Authentification, inscription et gestion de profil
- **Catalog Service** - Opérations CRUD sur les annonces de produits
- **Search Service** - Recherche plein texte avec Elasticsearch
- **Messaging Service** - Chat en temps réel entre utilisateurs
- **Transaction Service** - Gestion des commandes et traitement des paiements
- **Notification Service** - Notifications par email et push
- **Review Service** - Système d'évaluations et de notes
- **Favorite Service** - Gestion des favoris
- **Delivery Service** - Livraisons et suivi de colis
- **Wallet Service** - Porte-monnaie et transactions financières
- **Admin Service** - Administration, modération et statistiques

## 🛠️ Stack technologique

- **Langage:** Node.js avec TypeScript
- **Framework:** Express.js
- **Bases de données:**
  - PostgreSQL (Services User, Catalog, Transaction, Review, Favorite, Delivery, Wallet, Admin)
  - MongoDB (Service Messaging)
  - Elasticsearch (Service Search)
- **Message Queue:** RabbitMQ
- **Containerisation:** Docker & Docker Compose

## 📋 Prérequis

- Docker et Docker Compose installés
- Node.js 20+ (pour le développement local)
- Git

## 🚀 Démarrage rapide

### 1. Cloner le dépôt

```bash
git clone <repository-url>
cd SwapIt
```

### 2. Démarrer tous les services avec Docker Compose

```bash
docker-compose up --build
```

Cela démarrera :

- Tous les microservices
- Base de données PostgreSQL
- Base de données MongoDB
- Elasticsearch
- RabbitMQ

### 3. Accéder aux services

- **API Gateway:** http://localhost:3000
- **RabbitMQ Management:** http://localhost:15672 (swapit/swapit123)
- **Elasticsearch:** http://localhost:9200

## 📚 Endpoints API

### User Service (`/api/users`)

- `POST /register` - Inscrire un nouvel utilisateur
- `POST /login` - Connexion utilisateur
- `GET /profile/:id` - Obtenir le profil utilisateur
- `PUT /profile/:id` - Mettre à jour le profil
- `GET /:id` - Obtenir un utilisateur par ID

### Catalog Service (`/api/catalog`)

- `POST /` - Créer une annonce de produit
- `GET /` - Obtenir tous les produits (avec filtres)
- `GET /:id` - Obtenir un produit par ID
- `GET /user/:userId` - Obtenir les produits d'un utilisateur
- `PUT /:id` - Mettre à jour un produit
- `DELETE /:id` - Supprimer un produit

### Search Service (`/api/search`)

- `GET /search?q=query&category=...` - Rechercher des produits
- `GET /suggest?q=query` - Obtenir des suggestions de recherche

### Messaging Service (`/api/messages`)

- `POST /conversations` - Créer une conversation
- `GET /conversations/:userId` - Obtenir les conversations d'un utilisateur
- `GET /conversations/:conversationId/messages` - Obtenir les messages
- `POST /conversations/:conversationId/messages` - Envoyer un message
- `PUT /messages/:messageId/read` - Marquer un message comme lu

### Transaction Service (`/api/transactions`)

- `POST /` - Créer une commande
- `GET /:id` - Obtenir une commande par ID
- `GET /user/:userId?role=buyer|seller` - Obtenir les commandes d'un utilisateur
- `PUT /:id/status` - Mettre à jour le statut d'une commande
- `POST /:id/payment` - Traiter un paiement

### Review Service (`/api/reviews`)

- `POST /` - Créer une évaluation
- `GET /user/:userId` - Obtenir les évaluations d'un utilisateur
- `GET /product/:productId` - Obtenir les évaluations d'un produit
- `GET /:id` - Obtenir une évaluation par ID

### Favorite Service (`/api/favorites`)

- `POST /` - Ajouter un favori
- `DELETE /:id` - Retirer un favori
- `GET /user/:userId` - Obtenir les favoris d'un utilisateur
- `GET /check?userId=...&productId=...` - Vérifier si un produit est en favori

### Delivery Service (`/api/deliveries`)

- `POST /` - Créer un envoi
- `PUT /:id/status` - Mettre à jour le statut d'un envoi
- `GET /order/:orderId` - Obtenir l'envoi d'une commande
- `GET /user/:userId?role=buyer|seller` - Obtenir les envois d'un utilisateur
- `GET /:id` - Obtenir un envoi par ID

### Wallet Service (`/api/wallet`)

- `GET /:userId` - Obtenir le porte-monnaie d'un utilisateur
- `POST /:userId/credit` - Créditer le porte-monnaie
- `POST /:userId/debit` - Débiter le porte-monnaie
- `GET /:userId/transactions` - Obtenir l'historique des transactions

### Admin Service (`/api/admin`)

- `POST /reports` - Créer un signalement
- `GET /reports` - Obtenir les signalements
- `PUT /reports/:id/status` - Mettre à jour le statut d'un signalement
- `GET /statistics` - Obtenir les statistiques de la plateforme
- `PUT /products/:productId/moderate` - Modérer un produit

## 🔧 Développement

### Exécuter les services localement

Chaque service peut être exécuté indépendamment :

```bash
cd services/user-service
npm install
npm run dev
```

### Construire les services

```bash
cd services/<service-name>
npm run build
npm start
```

## 🧪 Tests

Des endpoints de health check sont disponibles pour tous les services :

```bash
curl http://localhost:3000/health
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Catalog Service
# ... etc
```

## 📖 Exemples d'appels API

### Inscrire un utilisateur

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Créer une annonce de produit

```bash
curl -X POST http://localhost:3000/api/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-here",
    "title": "Veste en jean vintage",
    "description": "Veste vintage en excellent état",
    "price": 45.99,
    "category": "jackets",
    "size": "M",
    "condition": "good",
    "images": ["https://example.com/image.jpg"]
  }'
```

### Rechercher des produits

```bash
curl "http://localhost:3000/api/search/search?q=veste&category=jackets&minPrice=20&maxPrice=100"
```

## 🏛️ Patterns d'architecture

- **Pattern API Gateway** - Point d'entrée unique pour tous les clients
- **Architecture orientée événements** - Les services communiquent via des événements RabbitMQ
- **Base de données par service** - Chaque service a sa propre base de données
- **CQRS** - Ségrégation des responsabilités de commande et de requête pour la scalabilité
- **Service Discovery** - Découverte simple basée sur les variables d'environnement

## 📝 Types d'événements

Le système utilise les types d'événements suivants pour la communication asynchrone :

- `UserRegistered` - Déclenché lors de l'inscription d'un nouvel utilisateur
- `ItemCreated` - Déclenché lors de la création d'un nouveau produit
- `OrderPlaced` - Déclenché lors de la création d'une commande
- `MessageSent` - Déclenché lors de l'envoi d'un message
- `ReviewCreated` - Déclenché lors de la création d'une évaluation
- `FavoriteAdded` / `FavoriteRemoved` - Déclenché lors de l'ajout/suppression d'un favori
- `ShipmentCreated` / `OrderDelivered` - Déclenché lors de la création/livraison d'un envoi
- `WalletCredited` / `WalletDebited` - Déclenché lors d'opérations sur le porte-monnaie

## 🔒 Notes de sécurité

- Les tokens JWT sont utilisés pour l'authentification
- Les mots de passe sont hachés avec bcrypt
- En production, utiliser une gestion appropriée des secrets
- Activer HTTPS pour tous les services
- Implémenter le rate limiting et la validation des entrées

## 📦 Structure du projet

```
SwapIt/
├── services/
│   ├── api-gateway/
│   ├── user-service/
│   ├── catalog-service/
│   ├── search-service/
│   ├── messaging-service/
│   ├── transaction-service/
│   ├── notification-service/
│   ├── review-service/
│   ├── favorite-service/
│   ├── delivery-service/
│   ├── wallet-service/
│   └── admin-service/
├── shared/
│   ├── types/
│   ├── utils/
│   └── middleware/
├── docs/
│   ├── adr-001-message-bus-choice.md
│   ├── dat-architecture-technique.md
│   ├── api-documentation.md
│   ├── architecture.md
│   ├── deployment.md
│   └── quick-start.md
├── docker-compose.yml
└── README.md
```

## 🐛 Dépannage

### Les services ne démarrent pas

1. Vérifier que Docker est en cours d'exécution : `docker ps`
2. Vérifier les logs : `docker-compose logs <service-name>`
3. S'assurer que les ports ne sont pas déjà utilisés
4. Vérifier les connexions à la base de données dans les logs des services

### Problèmes de connexion à la base de données

- Attendre que les bases de données soient saines avant le démarrage des services
- Vérifier les variables d'environnement dans docker-compose.yml
- Vérifier les identifiants de la base de données

## 📄 Licence

Ce projet est à des fins éducatives.

## 👥 Contributeurs

- Architecture et implémentation pour le projet de cours MDS Annecy
