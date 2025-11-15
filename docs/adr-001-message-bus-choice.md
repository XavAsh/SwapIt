# ADR-001: Choix du bus de messages pour la communication inter-services

**Date:** 2025-11-15  
**Statut:** Accepté  
**Décideurs:** Équipe Architecture SwapIt  
**Contexte technique:** Architecture microservices distribuée

## Contexte

SwapIt est une plateforme d'échange et de vente de vêtements d'occasion construite sur une architecture microservices. Les services doivent communiquer de manière asynchrone pour :

- Découplage des services
- Scalabilité indépendante
- Résilience aux pannes
- Traitement asynchrone des événements métier (notifications, indexation, etc.)

Les échanges inter-services concernent :
- Événements métier (UserRegistered, ItemCreated, OrderPlaced, MessageSent, etc.)
- Notifications asynchrones
- Indexation de recherche
- Mise à jour de caches

## Problématique

Nous avons besoin d'un mécanisme de messagerie asynchrone qui permette :
1. **Découplage temporel** : Les services ne doivent pas attendre la réponse d'autres services
2. **Fiabilité** : Garantir la livraison des messages même en cas de panne temporaire
3. **Scalabilité** : Gérer des pics de charge sans bloquer les services
4. **Patterns avancés** : Pub/Sub, routing, priorités
5. **Observabilité** : Monitoring et debugging des messages

## Options envisagées

### Option 1: RabbitMQ

**Description:** Message broker open-source écrit en Erlang, supportant AMQP et autres protocoles.

**Avantages:**
- ✅ Maturité et stabilité (depuis 2007)
- ✅ Support natif de multiples patterns (pub/sub, work queues, routing)
- ✅ Interface de management intégrée (UI web)
- ✅ Persistance des messages (durable queues)
- ✅ Gestion fine des acknowledgments et retry
- ✅ Faible latence
- ✅ Support de clustering et haute disponibilité
- ✅ Communauté active et documentation complète
- ✅ Légèreté pour notre cas d'usage

**Inconvénients:**
- ❌ Performance limitée à très haute charge (vs Kafka)
- ❌ Pas de rétention longue durée par défaut
- ❌ Configuration plus complexe pour clustering avancé

**Coût:** Gratuit (open-source)

### Option 2: Apache Kafka

**Description:** Plateforme de streaming distribuée conçue pour traiter de grandes quantités de données en temps réel.

**Avantages:**
- ✅ Très haute performance et débit
- ✅ Rétention longue durée des messages
- ✅ Replay des messages
- ✅ Excellent pour event sourcing
- ✅ Scalabilité horizontale native
- ✅ Durabilité garantie

**Inconvénients:**
- ❌ Complexité opérationnelle élevée
- ❌ Overkill pour notre volume actuel
- ❌ Configuration et maintenance plus complexes
- ❌ Courbe d'apprentissage plus importante
- ❌ Ressources système importantes (Zookeeper, brokers)
- ❌ Latence plus élevée que RabbitMQ pour petits messages

**Coût:** Gratuit (open-source), mais coût opérationnel plus élevé

### Option 3: NATS / NATS Streaming

**Description:** Système de messagerie léger et performant, orienté cloud-native.

**Avantages:**
- ✅ Très léger et performant
- ✅ Simple à déployer et opérer
- ✅ Faible latence
- ✅ Bon pour microservices cloud-native
- ✅ Support de JetStream (streaming persistant)

**Inconvénients:**
- ❌ Maturité moindre que RabbitMQ
- ❌ Communauté plus petite
- ❌ Fonctionnalités avancées moins riches
- ❌ Documentation moins complète
- ❌ Moins d'outils de monitoring intégrés

**Coût:** Gratuit (open-source)

### Option 4: Redis Pub/Sub

**Description:** Utilisation de Redis comme bus de messages via son mécanisme Pub/Sub.

**Avantages:**
- ✅ Très simple si Redis est déjà utilisé
- ✅ Très performant
- ✅ Faible latence

**Inconvénients:**
- ❌ Pas de persistance des messages (perte en cas de redémarrage)
- ❌ Pas de garantie de livraison
- ❌ Pas de patterns avancés (routing, priorités)
- ❌ Pas d'acknowledgment
- ❌ Non adapté pour notre besoin de fiabilité

**Coût:** Gratuit (si Redis déjà présent)

### Option 5: Amazon SQS / SNS (Cloud)

**Description:** Services de messagerie managés d'AWS.

**Avantages:**
- ✅ Service managé (pas de maintenance)
- ✅ Scalabilité automatique
- ✅ Intégration native avec autres services AWS
- ✅ Haute disponibilité garantie

**Inconvénients:**
- ❌ Vendor lock-in (AWS)
- ❌ Coût à l'usage (peut devenir élevé)
- ❌ Moins de contrôle sur la configuration
- ❌ Latence réseau potentielle
- ❌ Non adapté pour déploiement on-premise

**Coût:** Payant (à l'usage)

## Comparatif argumenté

| Critère | RabbitMQ | Kafka | NATS | Redis Pub/Sub | AWS SQS/SNS |
|---------|----------|-------|------|---------------|-------------|
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Scalabilité** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Fiabilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Simplicité** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Maturité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Coût** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Documentation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Observabilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

### Analyse détaillée

**Pour notre contexte (plateforme e-commerce avec volume modéré à élevé) :**

1. **Volume attendu** : Modéré à élevé (millions d'événements/jour, pas de streaming massif)
2. **Latence requise** : Faible à modérée (secondes acceptables pour notifications)
3. **Fiabilité** : Critique (ne pas perdre d'événements métier)
4. **Complexité opérationnelle** : Doit rester raisonnable pour une petite équipe
5. **Budget** : Open-source préféré

## Décision

**Technologie retenue : RabbitMQ**

### Justification

1. **Équilibre optimal** : RabbitMQ offre le meilleur compromis entre performance, fiabilité, simplicité et maturité pour notre cas d'usage.

2. **Patterns adaptés** : 
   - Topic Exchange pour le routing flexible des événements
   - Durable queues pour la persistance
   - Acknowledgments pour garantir la livraison
   - Dead Letter Queues pour gérer les erreurs

3. **Observabilité** : Interface de management intégrée permettant de monitorer les queues, les messages, les connexions.

4. **Maturité** : Technologie éprouvée avec une large communauté et une documentation complète.

5. **Scalabilité suffisante** : Capable de gérer notre volume attendu sans complexité excessive.

6. **Simplicité opérationnelle** : Plus simple à opérer que Kafka tout en offrant les fonctionnalités nécessaires.

7. **Coût** : Open-source, pas de coût de licence.

## Conséquences

### Impact sur l'architecture

- **Pattern Pub/Sub** : Utilisation d'un Topic Exchange (`swapit_events`) pour router les événements
- **Découplage** : Les services publient des événements sans connaître les consommateurs
- **Résilience** : Les services peuvent continuer à fonctionner même si un consommateur est en panne
- **Scalabilité** : Possibilité d'ajouter des consommateurs sans modifier les producteurs

### Monitoring et exploitation

- **Interface de management** : Disponible sur `http://localhost:15672`
- **Métriques** : Nombre de messages, taux de consommation, longueur des queues
- **Alertes** : Configurer des alertes sur les queues qui s'accumulent
- **Health checks** : Vérifier la connectivité RabbitMQ dans les health checks des services

### Patterns d'utilisation

1. **Événements métier** : 
   - `UserRegistered` → Notification Service
   - `ItemCreated` → Search Service (indexation)
   - `OrderPlaced` → Notification Service, Wallet Service
   - `MessageSent` → Notification Service

2. **Gestion des erreurs** :
   - Retry automatique avec backoff exponentiel
   - Dead Letter Queue pour les messages en échec répété
   - Logging des événements non traitables

3. **Idempotence** :
   - Les consommateurs doivent être idempotents
   - Utilisation d'IDs uniques pour les événements

### Évolutions futures possibles

- **Migration vers Kafka** : Si le volume devient très élevé (>100M événements/jour), migration possible
- **Multi-région** : Utilisation de RabbitMQ Federation pour la réplication
- **Performance** : Optimisation avec clustering si nécessaire

## Références

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [RabbitMQ Best Practices](https://www.rabbitmq.com/best-practices.html)
- [Microservices Patterns - Messaging](https://microservices.io/patterns/communication-style/messaging.html)

