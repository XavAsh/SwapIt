# Guide de déploiement SwapIt

## Déploiement en développement local

### Prérequis

- Docker Desktop installé et en cours d'exécution
- Docker Compose v3.8+
- Au moins 8GB de RAM disponible
- Ports 3000-3011, 5432, 27017, 9200, 5672, 15672 disponibles

### Déploiement étape par étape

1. **Cloner et naviguer vers le projet:**

   ```bash
   cd SwapIt
   ```

2. **Démarrer tous les services:**

   ```bash
   docker-compose up --build
   ```

3. **Vérifier que les services sont en cours d'exécution:**

   ```bash
   docker-compose ps
   ```

4. **Vérifier les logs des services:**

   ```bash
   docker-compose logs -f <service-name>
   ```

5. **Arrêter les services:**
   ```bash
   docker-compose down
   ```

### Vérifications de santé des services

Vérifier que tous les services sont sains :

```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Catalog Service
curl http://localhost:3002/health

# Search Service
curl http://localhost:3003/health

# Messaging Service
curl http://localhost:3004/health

# Transaction Service
curl http://localhost:3005/health

# Notification Service
curl http://localhost:3006/health

# Review Service
curl http://localhost:3007/health

# Favorite Service
curl http://localhost:3008/health

# Delivery Service
curl http://localhost:3009/health

# Wallet Service
curl http://localhost:3010/health

# Admin Service
curl http://localhost:3011/health
```

### Accès aux bases de données

**PostgreSQL:**

```bash
docker exec -it swapit_postgres_1 psql -U swapit -d swapit_db
```

**MongoDB:**

```bash
docker exec -it swapit_mongodb_1 mongosh -u swapit -p swapit123 --authenticationDatabase admin
```

**Elasticsearch:**

```bash
curl http://localhost:9200/_cluster/health
```

**RabbitMQ Management:**

- URL: http://localhost:15672
- Nom d'utilisateur: swapit
- Mot de passe: swapit123

## Considérations de déploiement en production

### Variables d'environnement

Créer des fichiers `.env` pour chaque service avec des valeurs de production :

- Secrets JWT forts
- URLs de bases de données de production
- Identifiants SMTP pour les emails
- Clés API Stripe
- URLs des services

### Sécurité

1. **Utiliser HTTPS:**

   - Configurer un reverse proxy (NGINX/Traefik)
   - Certificats SSL (Let's Encrypt)

2. **Gestion des secrets:**

   - Utiliser les secrets Kubernetes
   - Ou HashiCorp Vault
   - Ne jamais commiter les secrets dans Git

3. **Sécurité réseau:**
   - Réseaux privés pour la communication inter-services
   - Règles de pare-feu
   - Service mesh (Istio/Linkerd) pour mTLS

### Mise à l'échelle

**Scalabilité horizontale:**

```yaml
# Exemple de déploiement Kubernetes
replicas: 3
```

**Scalabilité des bases de données:**

- Réplicas de lecture pour PostgreSQL
- Replica sets MongoDB
- Cluster Elasticsearch

### Monitoring

1. **Health Checks:**

   - Probes de liveness/readiness Kubernetes
   - Endpoints de health check

2. **Logging:**

   - Logging centralisé (stack ELK)
   - Logging structuré (JSON)

3. **Métriques:**

   - Prometheus pour les métriques
   - Grafana pour la visualisation

4. **Tracing:**
   - Distributed tracing (Jaeger)
   - IDs de corrélation de requêtes

### Stratégie de sauvegarde

1. **Sauvegardes de base de données:**

   - PostgreSQL: jobs planifiés pg_dump
   - MongoDB: jobs planifiés mongodump
   - Elasticsearch: API Snapshot

2. **Stockage des sauvegardes:**
   - Stockage cloud (S3, GCS)
   - Politiques de rétention

### Reprise après sinistre

1. **Déploiement multi-région:**

   - Configuration active-passive
   - Réplication de base de données

2. **Basculement:**
   - Health checks du load balancer
   - Basculement automatique

## Déploiement Kubernetes (Futur)

### Prérequis

- Cluster Kubernetes (v1.24+)
- kubectl configuré
- Images Docker dans le registry

### Étapes de déploiement

1. **Créer un namespace:**

   ```bash
   kubectl create namespace swapit
   ```

2. **Déployer les bases de données:**

   ```bash
   kubectl apply -f k8s/postgres.yaml
   kubectl apply -f k8s/mongodb.yaml
   kubectl apply -f k8s/elasticsearch.yaml
   kubectl apply -f k8s/rabbitmq.yaml
   ```

3. **Déployer les services:**

   ```bash
   kubectl apply -f k8s/services/
   ```

4. **Déployer l'ingress:**
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

### Configuration des services

Chaque service nécessite :

- Manifest de déploiement
- Manifest de service
- ConfigMap pour la configuration
- Secret pour les données sensibles
- Règles Ingress

## Pipeline CI/CD (Futur)

### Exemple GitHub Actions

```yaml
name: Deploy SwapIt

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: docker-compose build
      - name: Push to registry
        run: docker push ...
      - name: Deploy to Kubernetes
        run: kubectl apply -f k8s/
```

## Dépannage

### Le service ne démarre pas

1. Vérifier les logs Docker:

   ```bash
   docker-compose logs <service-name>
   ```

2. Vérifier les dépendances:

   - La base de données est saine
   - RabbitMQ est en cours d'exécution
   - Les ports sont disponibles

3. Vérifier les variables d'environnement:
   ```bash
   docker-compose config
   ```

### Problèmes de connexion à la base de données

1. Vérifier que la base de données est en cours d'exécution:

   ```bash
   docker-compose ps
   ```

2. Vérifier la chaîne de connexion dans les logs du service

3. Tester la connexion manuellement:
   ```bash
   docker exec -it <service-container> npm run test-connection
   ```

### Utilisation mémoire élevée

1. Vérifier les logs du service pour les fuites mémoire

2. Ajuster les limites de ressources Docker:

   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
   ```

3. Réduire l'échelle des services inutilisés

### Problèmes de performance

1. Vérifier les performances des requêtes de base de données
2. Surveiller les longueurs de queue RabbitMQ
3. Examiner les performances de l'index Elasticsearch
4. Ajouter une couche de cache (Redis)

## Maintenance

### Migrations de base de données

Exécuter les migrations au démarrage du service ou via un job de migration séparé.

### Mises à jour de service

1. Construire une nouvelle image Docker
2. Mettre à jour docker-compose.yml avec le nouveau tag d'image
3. Redémarrer le service:
   ```bash
   docker-compose up -d --no-deps <service-name>
   ```

### Nettoyage des données

- Archiver les anciens messages
- Nettoyer les anciennes commandes
- Optimiser les indices Elasticsearch
