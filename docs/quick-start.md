# Guide de démarrage rapide

## 🚀 Démarrer en 5 minutes

### 1. Tout démarrer

```bash
docker-compose up --build
```

Attendre que tous les services démarrent (environ 2-3 minutes au premier lancement).

### 2. Vérifier les services

```bash
# Vérifier que tous les services sont en cours d'exécution
docker-compose ps

# Tester l'API Gateway
curl http://localhost:3000/health
```

### 3. Inscrire un utilisateur

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Sauvegarder l'`id` de la réponse.

### 4. Se connecter

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

Sauvegarder le `token` de la réponse.

### 5. Créer un produit

```bash
curl -X POST http://localhost:3000/api/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "VOTRE_USER_ID_ICI",
    "title": "T-Shirt vintage",
    "description": "T-shirt vintage en excellent état",
    "price": 25.99,
    "category": "shirts",
    "size": "M",
    "condition": "good"
  }'
```

### 6. Rechercher des produits

```bash
curl "http://localhost:3000/api/search/search?q=t-shirt"
```

## 📊 Surveiller les services

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f user-service
```

### RabbitMQ Management

Ouvrir http://localhost:15672

- Nom d'utilisateur: `swapit`
- Mot de passe: `swapit123`

### Elasticsearch

```bash
curl http://localhost:9200/_cat/indices
```

## 🛑 Tout arrêter

```bash
docker-compose down

# Supprimer les volumes (efface toutes les données)
docker-compose down -v
```

## 🔧 Problèmes courants

### Port déjà utilisé

Si un port est déjà utilisé, soit :

1. Arrêter le service en conflit
2. Changer le port dans `docker-compose.yml`

### Les services ne démarrent pas

1. Vérifier que Docker a suffisamment de ressources (8GB RAM recommandé)
2. Vérifier les logs: `docker-compose logs <service-name>`
3. S'assurer que tous les ports requis sont disponibles

### Erreurs de connexion à la base de données

Attendre un peu plus longtemps - les bases de données ont besoin de temps pour s'initialiser. Vérifier avec :

```bash
docker-compose ps
```

Tous les services doivent afficher le statut "Up".

## 🧪 Tests automatisés

Un script de test en français est disponible pour tester tous les endpoints :

```bash
# Rendre le script exécutable (première fois)
chmod +x ../test-routes-fr.sh

# Exécuter les tests
../test-routes-fr.sh
```

Le script teste automatiquement tous les services et affiche les résultats avec des codes couleur.

## 📝 Prochaines étapes

1. Lire la [Documentation API](./api-documentation.md)
2. Explorer l'[Architecture](./architecture.md)
3. Consulter le [Guide de déploiement](./deployment.md) pour la configuration de production
4. Exécuter le script de test pour valider tous les endpoints
