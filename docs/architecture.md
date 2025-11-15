# Documentation d'Architecture SwapIt

## Vue d'ensemble de l'architecture système

SwapIt est conçu comme un système microservices distribué suivant les meilleures pratiques pour la scalabilité, la résilience et la maintenabilité.

## Diagramme d'architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP/REST
       │
┌──────▼─────────────────────────────────────┐
│           API Gateway (Port 3000)           │
│  - Routage des requêtes                    │
│  - Répartition de charge                   │
│  - Gestion CORS                            │
└──────┬──────────────────────────────────────┘
       │
       ├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
       │          │          │          │          │          │          │
┌──────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
│   User   │ │Catalog │ │ Search │ │Message │ │Transac │ │Notific │ │Review  │
│ Service  │ │Service │ │Service │ │Service │ │Service │ │Service │ │Service │
│  :3001   │ │ :3002  │ │ :3003  │ │ :3004  │ │ :3005  │ │ :3006  │ │ :3007  │
└────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
     │           │          │          │          │          │          │
┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
│Favorite│ │Delivery│ │ Wallet │ │ Admin  │
│Service │ │Service │ │Service │ │Service │
│ :3008  │ │ :3009  │ │ :3010  │ │ :3011  │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │
    │          │          │          │
┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
│Postgres│ │Postgres│ │Elastic │ │MongoDB │ │Postgres│ │Postgres│
│   DB   │ │   DB   │ │ search │ │   DB   │ │   DB   │ │   DB   │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
     │           │          │          │          │          │
     └───────────┴──────────┴──────────┴──────────┴──────────┘
                    │
            ┌───────▼────────┐
            │   RabbitMQ     │
            │  Event Bus     │
            └────────────────┘
```

## Détails des microservices

### 1. Service API Gateway

**Port:** 3000  
**Technologie:** Express.js avec http-proxy-middleware

**Responsabilités:**

- Point d'entrée unique pour toutes les requêtes client
- Routage des requêtes vers les microservices appropriés
- Gestion CORS
- Gestion des erreurs et de l'indisponibilité des services

**Endpoints:**

- Routes `/api/users/*` → User Service
- Routes `/api/catalog/*` → Catalog Service
- Routes `/api/search/*` → Search Service
- Routes `/api/messages/*` → Messaging Service
- Routes `/api/transactions/*` → Transaction Service
- Routes `/api/notifications/*` → Notification Service
- Routes `/api/reviews/*` → Review Service
- Routes `/api/favorites/*` → Favorite Service
- Routes `/api/deliveries/*` → Delivery Service
- Routes `/api/wallet/*` → Wallet Service
- Routes `/api/admin/*` → Admin Service

### 2. User Service

**Port:** 3001  
**Base de données:** PostgreSQL  
**Technologie:** Express.js, PostgreSQL, JWT, bcrypt

**Responsabilités:**

- Inscription et authentification utilisateur
- Génération de tokens JWT
- Gestion de profil utilisateur
- Hachage de mots de passe et sécurité

**Schéma de base de données:**

```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Événements publiés:**

- `UserRegistered` - Lors de l'inscription d'un nouvel utilisateur

### 3. Catalog Service

**Port:** 3002  
**Base de données:** PostgreSQL  
**Technologie:** Express.js, PostgreSQL

**Responsabilités:**

- Opérations CRUD sur les annonces de produits
- Gestion des métadonnées de produits
- Gestion du statut des produits (available, sold, reserved)

**Schéma de base de données:**

```sql
products (
  id UUID PRIMARY KEY,
  user_id UUID,
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  category VARCHAR(100),
  size VARCHAR(50),
  condition VARCHAR(20),
  images TEXT[],
  location VARCHAR(255),
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Événements publiés:**

- `ItemCreated` - Lors de la création d'un nouveau produit

### 4. Search Service

**Port:** 3003  
**Base de données:** Elasticsearch  
**Technologie:** Express.js, Elasticsearch

**Responsabilités:**

- Recherche plein texte sur les produits
- Indexation de recherche
- Suggestions de recherche
- Filtrage avancé (prix, catégorie, taille, etc.)

**Index Elasticsearch:**

- Nom de l'index : `products`
- Champs : id, userId, title, description, price, category, size, condition, location, status, createdAt

**Événements consommés:**

- `ItemCreated` - Indexe les nouveaux produits

### 5. Messaging Service

**Port:** 3004  
**Base de données:** MongoDB  
**Technologie:** Express.js, MongoDB, Socket.IO

**Responsabilités:**

- Messagerie en temps réel entre utilisateurs
- Gestion des conversations
- Livraison de messages et accusés de lecture
- Support WebSocket pour les mises à jour en temps réel

**Collections MongoDB:**

- `conversations` - Stocke les métadonnées de conversation
- `messages` - Stocke les messages individuels

**Événements publiés:**

- `MessageSent` - Lors de l'envoi d'un message

### 6. Transaction Service

**Port:** 3005  
**Base de données:** PostgreSQL  
**Technologie:** Express.js, PostgreSQL, Axios

**Responsabilités:**

- Création et gestion des commandes
- Traitement des paiements (intégration Stripe mock)
- Suivi du statut des commandes
- Intégration avec Catalog Service pour la validation des produits

**Schéma de base de données:**

```sql
orders (
  id UUID PRIMARY KEY,
  buyer_id UUID,
  seller_id UUID,
  product_id UUID,
  amount DECIMAL(10,2),
  status VARCHAR(20),
  payment_intent_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Événements publiés:**

- `OrderPlaced` - Lors de la création d'une nouvelle commande

### 7. Notification Service

**Port:** 3006  
**Base de données:** Aucune (stateless)  
**Technologie:** Express.js, Nodemailer

**Responsabilités:**

- Notifications par email
- Notifications orientées événements
- Support des notifications push (futur)

**Événements consommés:**

- `UserRegistered` - Envoie un email de bienvenue
- `OrderPlaced` - Notifie le vendeur
- `MessageSent` - Notifie le destinataire

### 8. Review Service

**Port:** 3007  
**Base de données:** PostgreSQL  
**Technologie:** Express.js, PostgreSQL

**Responsabilités:**

- Gestion des évaluations et notes
- Calcul de la note moyenne par utilisateur
- Affichage des évaluations

**Schéma de base de données:**

```sql
reviews (
  id UUID PRIMARY KEY,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  order_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(reviewer_id, order_id)
)
```

**Événements publiés:**

- `ReviewCreated` - Lors de la création d'une évaluation

### 9. Favorite Service

**Port:** 3008  
**Base de données:** PostgreSQL  
**Technologie:** Express.js, PostgreSQL

**Responsabilités:**

- Gestion des favoris ("J'aime" / "Suivi")
- Ajout/retrait de produits en favoris

**Schéma de base de données:**

```sql
favorites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP,
  UNIQUE(user_id, product_id)
)
```

**Événements publiés:**

- `FavoriteAdded` - Lors de l'ajout d'un favori
- `FavoriteRemoved` - Lors de la suppression d'un favori

### 10. Delivery Service

**Port:** 3009  
**Base de données:** PostgreSQL  
**Technologie:** Express.js, PostgreSQL

**Responsabilités:**

- Gestion des livraisons
- Suivi des colis
- Choix du mode d'expédition (points relais, livraison à domicile)
- Confirmation automatique à réception

**Schéma de base de données:**

```sql
shipments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE,
  shipping_method VARCHAR(50) CHECK (shipping_method IN ('relay_point', 'home_delivery')),
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  address JSONB NOT NULL,
  status VARCHAR(20) CHECK (status IN ('prepared', 'shipped', 'in_transit', 'delivered', 'cancelled')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Événements publiés:**

- `ShipmentCreated` - Lors de la création d'un envoi
- `OrderDelivered` - Lors de la livraison d'une commande

### 11. Wallet Service

**Port:** 3010  
**Base de données:** PostgreSQL  
**Technologie:** Express.js, PostgreSQL

**Responsabilités:**

- Gestion du porte-monnaie utilisateur
- Transactions financières (crédit/débit)
- Historique des transactions

**Schéma de base de données:**

```sql
wallets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

wallet_transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('credit', 'debit')),
  description TEXT,
  created_at TIMESTAMP
)
```

**Événements publiés:**

- `WalletCredited` - Lors d'un crédit
- `WalletDebited` - Lors d'un débit

### 12. Admin Service

**Port:** 3011  
**Base de données:** PostgreSQL  
**Technologie:** Express.js, PostgreSQL

**Responsabilités:**

- Modération des annonces et messages
- Gestion des signalements
- Tableau de bord d'administration
- Statistiques de la plateforme

**Schéma de base de données:**

```sql
reports (
  id UUID PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  reported_product_id UUID,
  reported_message_id UUID,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

admin_users (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role VARCHAR(50) CHECK (role IN ('moderator', 'admin', 'super_admin')),
  created_at TIMESTAMP
)
```

**Événements publiés:**

- `ReportCreated` - Lors de la création d'un signalement

## Patterns de communication

### Communication synchrone

- **REST API** - Toute la communication client-service
- **HTTP** - Appels inter-services (ex: Transaction → Catalog)
- **Protocole:** JSON sur HTTP

### Communication asynchrone

- **Message Queue:** RabbitMQ
- **Exchange:** `swapit_events` (topic exchange)
- **Pattern:** Publish-Subscribe

**Flux d'événements:**

1. Le service publie un événement vers l'exchange RabbitMQ
2. Les services abonnés consomment les événements depuis leurs queues
3. Les événements déclenchent la logique métier (indexation, notifications, etc.)

## Gestion des données

### Pattern Base de données par service

Chaque service possède sa propre base de données :

- **User Service:** PostgreSQL (données utilisateur)
- **Catalog Service:** PostgreSQL (données produits)
- **Transaction Service:** PostgreSQL (données commandes)
- **Review Service:** PostgreSQL (données évaluations)
- **Favorite Service:** PostgreSQL (données favoris)
- **Delivery Service:** PostgreSQL (données livraisons)
- **Wallet Service:** PostgreSQL (données porte-monnaie)
- **Admin Service:** PostgreSQL (données administration)
- **Messaging Service:** MongoDB (messages, conversations)
- **Search Service:** Elasticsearch (index de recherche)

### Cohérence des données

- **Cohérence forte:** Services User, Catalog, Transaction (transactions PostgreSQL)
- **Cohérence éventuelle:** Index de recherche (Elasticsearch mis à jour via événements)
- **Pas de base de données partagée:** Les services sont découplés

## Architecture de déploiement

### Containerisation

Tous les services sont containerisés avec Docker :

- Chaque service a son propre `Dockerfile`
- Builds multi-étapes pour l'optimisation
- Images de base Node.js 20 Alpine

### Orchestration

- **Développement local:** Docker Compose
- **Prêt pour la production:** Kubernetes (non inclus dans le prototype)

### Service Discovery

- **Développement:** Variables d'environnement
- **Production:** Services Kubernetes ou service mesh

## Considérations de scalabilité

### Scalabilité horizontale

- Tous les services sont stateless (sauf connexions base de données)
- Possibilité de scaler les services indépendamment
- Répartition de charge via API Gateway

### Optimisations de performance

- Pool de connexions base de données
- Elasticsearch pour la recherche rapide
- RabbitMQ pour le traitement asynchrone
- Opportunités de cache (Redis - futur)

## Sécurité

### Authentification et autorisation

- Tokens JWT pour l'authentification utilisateur
- Hachage de mots de passe avec bcrypt
- Communication inter-services (futur: mTLS)

### Protection des données

- HTTPS en production
- Validation des entrées
- Prévention des injections SQL (requêtes paramétrées)
- Prévention XSS

## Monitoring et observabilité

### Health Checks

Tous les services exposent un endpoint `/health` :

```bash
GET /health
Response: { "status": "ok", "service": "service-name" }
```

### Logging

- Logging centralisé via console (prêt pour logging structuré)
- Identification du service dans les logs
- Suivi des erreurs

### Métriques (Futur)

- Prometheus pour la collecte de métriques
- Grafana pour la visualisation
- Alertes pour les pannes de service

## Gestion des pannes

### Pattern Circuit Breaker

- Les services gèrent les pannes gracieusement
- L'API Gateway retourne 503 pour les services indisponibles
- Logique de retry dans les consommateurs d'événements

### Résilience

- Retry de connexion base de données
- Logique de reconnexion RabbitMQ
- Dégradation gracieuse

## Workflow de développement

1. **Développement local:**

   - Docker Compose pour tous les services
   - Hot reload avec ts-node-dev
   - Package de types partagés

2. **Tests:**

   - Tests manuels via endpoints API
   - Health checks pour la disponibilité des services
   - Tests d'intégration (futur)

3. **Déploiement:**
   - Build des images Docker
   - Push vers le registry
   - Déploiement via Docker Compose ou Kubernetes

## Améliorations futures

- [x] Review Service implémenté
- [x] Admin Service implémenté
- [ ] Kubernetes deployment manifests
- [ ] Redis caching layer
- [ ] API rate limiting
- [ ] Suite de tests complète
- [ ] Pipeline CI/CD
- [ ] Monitoring avec Prometheus/Grafana
- [ ] Distributed tracing (Jaeger)
- [ ] Service d'upload d'images
- [ ] Intégration Stripe réelle
