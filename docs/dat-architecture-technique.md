# DAT - Dossier d'Architecture Technique
## SwapIt - Plateforme d'échange de vêtements d'occasion

**Version:** 1.0  
**Date:** 2025-11-15  
**Auteur:** Équipe Architecture SwapIt

---

## Table des matières

1. [Couche Fonctionnelle](#1-couche-fonctionnelle)
2. [Couche Applicative](#2-couche-applicative)
3. [Couche Infrastructure](#3-couche-infrastructure)
4. [Couche Opérationnelle](#4-couche-opérationnelle)

---

## 1. Couche Fonctionnelle

### 1.1. Processus métiers principaux

#### 1.1.1. Gestion des utilisateurs

**Acteurs:** Utilisateur, Système

**Processus:**
1. Inscription → Création de compte → Validation email → Activation
2. Authentification → Login → Génération JWT → Session
3. Gestion de profil → Mise à jour informations → Sauvegarde
4. Historique → Consultation achats/ventes → Affichage

#### 1.1.2. Gestion des annonces

**Acteurs:** Vendeur, Système

**Processus:**
1. Publication → Création annonce → Validation → Indexation → Disponibilité
2. Modification → Mise à jour → Re-indexation
3. Suppression → Archivage → Retrait index
4. Favoris → Ajout/Retrait → Notification

#### 1.1.3. Recherche et découverte

**Acteurs:** Acheteur, Système

**Processus:**
1. Recherche → Saisie critères → Requête Elasticsearch → Résultats
2. Filtrage → Application filtres → Affinage résultats
3. Suggestions → Analyse requête → Recommandations

#### 1.1.4. Transactions

**Acteurs:** Acheteur, Vendeur, Système

**Processus:**
1. Mise en relation → Messagerie → Négociation
2. Commande → Validation → Création order → Réservation produit
3. Paiement → Traitement → Mise à jour statut → Notification
4. Livraison → Création shipment → Suivi → Confirmation réception
5. Évaluation → Création review → Calcul note moyenne

#### 1.1.5. Communication

**Acteurs:** Utilisateur A, Utilisateur B, Système

**Processus:**
1. Conversation → Création → Échange messages → Notifications temps réel
2. Notification → Événement → Envoi email/push → Réception

### 1.2. Entités métiers et leurs interactions

#### 1.2.1. Modèle de données

**Entités principales:**

1. **User** (Utilisateur)
   - Attributs: id, email, username, password_hash, first_name, last_name, avatar, bio, preferences, address, created_at, updated_at
   - Relations: 1-N avec Product, Order (buyer/seller), Review (reviewer/reviewee), Message, Favorite, Wallet

2. **Product** (Annonce)
   - Attributs: id, user_id, title, description, price, category, size, condition, images, location, status, created_at, updated_at
   - Relations: N-1 avec User, 1-N avec Order, Favorite, Review

3. **Order** (Commande)
   - Attributs: id, buyer_id, seller_id, product_id, amount, status, payment_intent_id, created_at, updated_at
   - Relations: N-1 avec User (buyer/seller), Product, 1-1 avec Shipment, Review

4. **Message** (Message)
   - Attributs: id, conversation_id, sender_id, receiver_id, content, read, created_at
   - Relations: N-1 avec Conversation, User (sender/receiver)

5. **Conversation** (Conversation)
   - Attributs: id, participant1_id, participant2_id, product_id, last_message_at, created_at
   - Relations: 1-N avec Message, N-1 avec User, Product

6. **Review** (Évaluation)
   - Attributs: id, reviewer_id, reviewee_id, order_id, rating, comment, created_at
   - Relations: N-1 avec User (reviewer/reviewee), Order

7. **Favorite** (Favori)
   - Attributs: id, user_id, product_id, created_at
   - Relations: N-1 avec User, Product

8. **Shipment** (Livraison)
   - Attributs: id, order_id, shipping_method, tracking_number, carrier, address, status, created_at, updated_at
   - Relations: 1-1 avec Order

9. **Wallet** (Porte-monnaie)
   - Attributs: id, user_id, balance, created_at, updated_at
   - Relations: 1-1 avec User, 1-N avec WalletTransaction

10. **Report** (Signalement)
    - Attributs: id, reporter_id, reported_user_id, reported_product_id, reported_message_id, reason, description, status, admin_notes, created_at, updated_at
    - Relations: N-1 avec User

#### 1.2.2. Diagramme de relations

```
User ──┬── Product (1-N)
       ├── Order (1-N as buyer/seller)
       ├── Review (1-N as reviewer/reviewee)
       ├── Message (1-N as sender/receiver)
       ├── Favorite (1-N)
       ├── Wallet (1-1)
       └── Conversation (N-N via participants)

Product ──┬── Order (1-N)
          ├── Favorite (1-N)
          └── Review (1-N via Order)

Order ──┬── Shipment (1-1)
        └── Review (1-N)

Conversation ── Message (1-N)
```

### 1.3. Bounded Contexts et dépendances

#### 1.3.1. Bounded Contexts

1. **User Management Context**
   - Services: User Service
   - Responsabilités: Authentification, profils, gestion utilisateurs

2. **Catalog Context**
   - Services: Catalog Service, Favorite Service
   - Responsabilités: Gestion des annonces, favoris

3. **Search Context**
   - Services: Search Service
   - Responsabilités: Recherche, indexation, suggestions

4. **Transaction Context**
   - Services: Transaction Service, Wallet Service, Delivery Service
   - Responsabilités: Commandes, paiements, livraisons, porte-monnaie

5. **Communication Context**
   - Services: Messaging Service, Notification Service
   - Responsabilités: Messagerie, notifications

6. **Review Context**
   - Services: Review Service
   - Responsabilités: Évaluations, notes

7. **Administration Context**
   - Services: Admin Service
   - Responsabilités: Modération, signalements, statistiques

#### 1.3.2. Dépendances entre contextes

```
User Management ──┐
                  ├──> Catalog (vendeur)
                  ├──> Transaction (buyer/seller)
                  ├──> Review (reviewer/reviewee)
                  └──> Wallet (owner)

Catalog ──┬──> Search (indexation)
          └──> Transaction (produit)

Transaction ──┬──> Delivery (commande)
              ├──> Wallet (paiement)
              └──> Review (après livraison)

Search ──> Catalog (données source)
```

### 1.4. Diagramme de flux global

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────┐
│ API Gateway │
└────┬────────┘
     │
     ├──► User Service ──► PostgreSQL
     ├──► Catalog Service ──► PostgreSQL ──► RabbitMQ ──► Search Service
     ├──► Search Service ──► Elasticsearch
     ├──► Messaging Service ──► MongoDB
     ├──► Transaction Service ──► PostgreSQL
     ├──► Review Service ──► PostgreSQL
     ├──► Favorite Service ──► PostgreSQL
     ├──► Delivery Service ──► PostgreSQL
     ├──► Wallet Service ──► PostgreSQL
     ├──► Admin Service ──► PostgreSQL
     └──► Notification Service ──► RabbitMQ (consumer)
```

---

## 2. Couche Applicative

### 2.1. Rôle de chaque microservice

#### 2.1.1. API Gateway (Port 3000)
- **Rôle:** Point d'entrée unique, routage, CORS, gestion d'erreurs
- **Technologies:** Express.js, http-proxy-middleware

#### 2.1.2. User Service (Port 3001)
- **Rôle:** Authentification, gestion utilisateurs, profils
- **Technologies:** Express.js, PostgreSQL, JWT, bcrypt
- **Base de données:** PostgreSQL (table `users`)

#### 2.1.3. Catalog Service (Port 3002)
- **Rôle:** CRUD produits, gestion annonces
- **Technologies:** Express.js, PostgreSQL
- **Base de données:** PostgreSQL (table `products`)
- **Événements:** Publie `ItemCreated`

#### 2.1.4. Search Service (Port 3003)
- **Rôle:** Recherche plein texte, indexation, suggestions
- **Technologies:** Express.js, Elasticsearch
- **Base de données:** Elasticsearch (index `products`)
- **Événements:** Consomme `ItemCreated`

#### 2.1.5. Messaging Service (Port 3004)
- **Rôle:** Messagerie temps réel, conversations
- **Technologies:** Express.js, MongoDB, Socket.IO
- **Base de données:** MongoDB (collections `conversations`, `messages`)
- **Événements:** Publie `MessageSent`

#### 2.1.6. Transaction Service (Port 3005)
- **Rôle:** Commandes, paiements, statuts
- **Technologies:** Express.js, PostgreSQL, Axios
- **Base de données:** PostgreSQL (table `orders`)
- **Événements:** Publie `OrderPlaced`

#### 2.1.7. Notification Service (Port 3006)
- **Rôle:** Emails, notifications push
- **Technologies:** Express.js, Nodemailer
- **Base de données:** Aucune (stateless)
- **Événements:** Consomme `UserRegistered`, `OrderPlaced`, `MessageSent`

#### 2.1.8. Review Service (Port 3007)
- **Rôle:** Évaluations, notes, calcul moyenne
- **Technologies:** Express.js, PostgreSQL
- **Base de données:** PostgreSQL (table `reviews`)
- **Événements:** Publie `ReviewCreated`

#### 2.1.9. Favorite Service (Port 3008)
- **Rôle:** Gestion des favoris
- **Technologies:** Express.js, PostgreSQL
- **Base de données:** PostgreSQL (table `favorites`)
- **Événements:** Publie `FavoriteAdded`, `FavoriteRemoved`

#### 2.1.10. Delivery Service (Port 3009)
- **Rôle:** Livraisons, suivi colis
- **Technologies:** Express.js, PostgreSQL
- **Base de données:** PostgreSQL (table `shipments`)
- **Événements:** Publie `ShipmentCreated`, `OrderDelivered`

#### 2.1.11. Wallet Service (Port 3010)
- **Rôle:** Porte-monnaie, transactions financières
- **Technologies:** Express.js, PostgreSQL
- **Base de données:** PostgreSQL (tables `wallets`, `wallet_transactions`)
- **Événements:** Publie `WalletCredited`, `WalletDebited`

#### 2.1.12. Admin Service (Port 3011)
- **Rôle:** Modération, signalements, statistiques
- **Technologies:** Express.js, PostgreSQL
- **Base de données:** PostgreSQL (tables `reports`, `admin_users`)
- **Événements:** Consomme/Publie selon besoins

### 2.2. API exposées

Voir `docs/api-documentation.md` pour la documentation complète des API.

**Principales routes:**
- `/api/users/*` - Gestion utilisateurs
- `/api/catalog/*` - Gestion produits
- `/api/search/*` - Recherche
- `/api/messages/*` - Messagerie
- `/api/transactions/*` - Transactions
- `/api/reviews/*` - Évaluations
- `/api/favorites/*` - Favoris
- `/api/deliveries/*` - Livraisons
- `/api/wallet/*` - Porte-monnaie
- `/api/admin/*` - Administration

### 2.3. Événements publiés/consommés

#### 2.3.1. Événements publiés

| Événement | Service Producteur | Consommateurs |
|-----------|-------------------|---------------|
| `UserRegistered` | User Service | Notification Service |
| `ItemCreated` | Catalog Service | Search Service |
| `OrderPlaced` | Transaction Service | Notification Service, Wallet Service |
| `MessageSent` | Messaging Service | Notification Service |
| `ReviewCreated` | Review Service | User Service (mise à jour note) |
| `FavoriteAdded` | Favorite Service | - |
| `FavoriteRemoved` | Favorite Service | - |
| `ShipmentCreated` | Delivery Service | Notification Service |
| `OrderDelivered` | Delivery Service | Transaction Service, Review Service |
| `WalletCredited` | Wallet Service | - |
| `WalletDebited` | Wallet Service | - |
| `ReportCreated` | Admin Service | - |

#### 2.3.2. Mécanismes de communication asynchrone

**RabbitMQ Configuration:**
- **Exchange:** `swapit_events` (Topic Exchange)
- **Pattern:** Publish-Subscribe
- **Routing:** Par type d'événement (routing key = nom de l'événement)
- **Durabilité:** Queues durables, messages persistants
- **Acknowledgment:** Manuel (ack après traitement)

**Exemple de flux:**
```
Catalog Service → Publie "ItemCreated" → RabbitMQ Exchange
                                    ↓
                            Search Service (consomme)
                            → Indexe dans Elasticsearch
```

### 2.4. Diagrammes de séquence

#### 2.4.1. Flux de création d'annonce

```
Client → API Gateway → Catalog Service
                          ↓
                    PostgreSQL (INSERT)
                          ↓
                    RabbitMQ (ItemCreated)
                          ↓
                    Search Service
                          ↓
                    Elasticsearch (INDEX)
```

#### 2.4.2. Flux d'achat

```
Client → API Gateway → Transaction Service
                          ↓
                    Catalog Service (vérification)
                          ↓
                    PostgreSQL (INSERT order)
                          ↓
                    RabbitMQ (OrderPlaced)
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
    Notification Service      Wallet Service
    (email vendeur)           (débit acheteur)
```

#### 2.4.3. Flux de messagerie

```
Client A → API Gateway → Messaging Service
                            ↓
                      MongoDB (INSERT message)
                            ↓
                      RabbitMQ (MessageSent)
                            ↓
                      Notification Service
                            ↓
                      Email/Socket.IO → Client B
```

### 2.5. Gestion des erreurs

#### 2.5.1. Stratégie de retry

- **Tentatives:** 3 tentatives avec backoff exponentiel (1s, 2s, 4s)
- **Dead Letter Queue:** Messages en échec après 3 tentatives
- **Logging:** Tous les échecs loggés avec contexte

#### 2.5.2. Transactions distribuées

**Pattern Saga:**
- Pas de transactions distribuées ACID
- Compensation en cas d'échec
- Exemple: Création order → Échec paiement → Annulation order

**Idempotence:**
- Tous les endpoints doivent être idempotents
- Utilisation d'IDs uniques pour les opérations
- Vérification d'existence avant création

**Exemple de compensation:**
```
OrderPlaced → PaymentFailed
    ↓
CancelOrder → UpdateProductStatus(available)
```

---

## 3. Couche Infrastructure

### 3.1. Composants techniques

#### 3.1.1. Persistance

- **PostgreSQL 15:** Services User, Catalog, Transaction, Review, Favorite, Delivery, Wallet, Admin
- **MongoDB 7:** Service Messaging (documents flexibles)
- **Elasticsearch 8.11:** Service Search (indexation)

#### 3.1.2. Bus de messages

- **RabbitMQ 3:** Communication asynchrone entre services
- **Exchange:** Topic (`swapit_events`)
- **Management UI:** Port 15672

#### 3.1.3. API Gateway

- **Express.js** avec `http-proxy-middleware`
- Routage, CORS, gestion d'erreurs, timeouts

#### 3.1.4. Cache (futur)

- **Redis:** Cache des requêtes fréquentes (non implémenté actuellement)

### 3.2. Choix technologiques

#### 3.2.1. Langages et frameworks

- **Node.js 20 + TypeScript:** Tous les services
  - Justification: Écosystème riche, performance, développement rapide
- **Express.js:** Framework web
  - Justification: Léger, flexible, bien documenté

#### 3.2.2. Bases de données

- **PostgreSQL:** Données relationnelles structurées
  - Justification: ACID, transactions, relations complexes
- **MongoDB:** Messages et conversations
  - Justification: Flexibilité schéma, performance écriture
- **Elasticsearch:** Recherche
  - Justification: Recherche plein texte, scalabilité horizontale

#### 3.2.3. Orchestrateur

- **Docker Compose:** Développement local
- **Kubernetes (futur):** Production

### 3.3. Topologie de déploiement

#### 3.3.1. Architecture actuelle (Docker Compose)

```
┌─────────────────────────────────────────┐
│         Docker Network                  │
│  ┌──────────┐  ┌──────────┐            │
│  │PostgreSQL│  │ MongoDB  │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │Elastic   │  │ RabbitMQ │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  ┌──────────────────────────────────┐ │
│  │      Microservices (12)          │ │
│  │  API Gateway + 11 Services       │ │
│  └──────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 3.3.2. Architecture cible (Production)

- **Kubernetes Cluster**
- **Service Mesh** (Istio/Linkerd) pour mTLS
- **Load Balancer** (NGINX/Traefik)
- **Ingress Controller** pour routing externe

### 3.4. Sécurité

#### 3.4.1. Authentification

- **JWT:** Tokens pour authentification utilisateur
- **bcrypt:** Hachage des mots de passe (10 rounds)

#### 3.4.2. Autorisation

- **RBAC:** Rôles utilisateur (user, admin, moderator)
- **Middleware:** Vérification JWT sur endpoints protégés

#### 3.4.3. Chiffrement

- **HTTPS:** En production (TLS 1.3)
- **mTLS:** Communication inter-services (futur)

#### 3.4.4. Conformité RGPD

- **Données personnelles:** Stockées de manière sécurisée
- **Droit à l'oubli:** Endpoint de suppression utilisateur
- **Portabilité:** Export des données utilisateur
- **Consentement:** Gestion des préférences

#### 3.4.5. Gestion des secrets

- **Variables d'environnement:** Développement
- **Secrets Kubernetes:** Production
- **Vault (futur):** Gestion centralisée

---

## 4. Couche Opérationnelle

### 4.1. Stratégie de déploiement

#### 4.1.1. CI/CD Pipeline (futur)

**GitHub Actions / GitLab CI:**

```yaml
Stages:
  1. Build → Docker images
  2. Test → Tests unitaires/intégration
  3. Security Scan → Vulnerability scanning
  4. Deploy → Kubernetes deployment
  5. Smoke Tests → Vérification post-déploiement
```

#### 4.1.2. Stratégie de rollback

- **Blue-Green Deployment:** Basculer entre versions
- **Canary Releases:** Déploiement progressif
- **Rollback automatique:** Si health checks échouent

#### 4.1.3. Versioning

- **Semantic Versioning:** MAJOR.MINOR.PATCH
- **Tags Docker:** `swapit-service:1.2.3`
- **Database Migrations:** Versionnées et réversibles

### 4.2. Supervision

#### 4.2.1. Logs

- **Format:** JSON structuré
- **Agrégation:** ELK Stack (Elasticsearch, Logstash, Kibana) ou Loki
- **Niveaux:** ERROR, WARN, INFO, DEBUG
- **Corrélation:** Request ID pour tracer les requêtes

#### 4.2.2. Métriques

- **Prometheus:** Collecte des métriques
- **Grafana:** Visualisation et dashboards
- **Métriques clés:**
  - Taux de requêtes par service
  - Latence (p50, p95, p99)
  - Taux d'erreur
  - Utilisation ressources (CPU, mémoire)
  - Longueur des queues RabbitMQ

#### 4.2.3. Traces

- **Jaeger / Zipkin:** Distributed tracing
- **Corrélation:** Suivi des requêtes à travers les services
- **Performance:** Identification des goulots d'étranglement

#### 4.2.4. Alertes

- **Règles:**
  - Taux d'erreur > 5%
  - Latence p95 > 1s
  - Service down
  - Queue RabbitMQ > 1000 messages
- **Canaux:** Email, Slack, PagerDuty

### 4.3. Scalabilité et résilience

#### 4.3.1. Autoscaling

- **HPA (Horizontal Pod Autoscaler):** Basé sur CPU/mémoire
- **VPA (Vertical Pod Autoscaler):** Ajustement ressources
- **Seuils:** CPU > 70% → Scale up

#### 4.3.2. Résilience

- **Circuit Breaker:** Arrêt des appels si service en panne
- **Retry:** 3 tentatives avec backoff exponentiel
- **Timeouts:** 10s pour requêtes HTTP
- **Bulkheads:** Isolation des ressources par service

#### 4.3.3. Health Checks

- **Liveness:** `/health` endpoint
- **Readiness:** Vérification dépendances (DB, RabbitMQ)
- **Startup:** Vérification initialisation

### 4.4. Maintenance

#### 4.4.1. Sauvegardes

- **PostgreSQL:** pg_dump quotidien, rétention 30 jours
- **MongoDB:** mongodump quotidien, rétention 30 jours
- **Elasticsearch:** Snapshots quotidiens
- **Stockage:** Cloud storage (S3/GCS)

#### 4.4.2. Mises à jour

- **Rolling Updates:** Mise à jour progressive sans interruption
- **Maintenance Windows:** Planifiées en heures creuses
- **Tests:** Environnement de staging avant production

#### 4.4.3. Surveillance des coûts

- **Métriques:** Utilisation ressources par service
- **Alertes:** Coûts anormaux
- **Optimisation:** Right-sizing des instances

#### 4.4.4. Plan de reprise d'activité (PRA)

- **RTO (Recovery Time Objective):** 4 heures
- **RPO (Recovery Point Objective):** 1 heure
- **Backup:** Restauration depuis dernières sauvegardes
- **Failover:** Bascule vers site secondaire si nécessaire

---

## Annexes

### A. Glossaire

- **Bounded Context:** Limite d'un modèle de domaine
- **Saga Pattern:** Pattern pour transactions distribuées
- **Circuit Breaker:** Pattern de résilience
- **Dead Letter Queue:** Queue pour messages en échec

### B. Références

- [Microservices Patterns](https://microservices.io/patterns/)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [12-Factor App](https://12factor.net/)

---

**Document approuvé par:** Équipe Architecture SwapIt  
**Prochaine révision:** 2025-12-15

