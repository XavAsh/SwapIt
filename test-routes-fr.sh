#!/bin/bash

# Script de test des routes SwapIt
# Teste toutes les routes directement (en contournant l'API Gateway)

BASE_URL=""
VERT='\033[0;32m'
ROUGE='\033[0;31m'
JAUNE='\033[1;33m'
BLEU='\033[0;34m'
NC='\033[0m' # Pas de couleur

# Stocker les IDs
USER1_ID=""
USER2_ID=""
TOKEN1=""
PRODUCT_ID=""
CONVERSATION_ID=""
MESSAGE_ID=""
ORDER_ID=""

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${VERT}✓${NC} $2"
    else
        echo -e "${ROUGE}✗${NC} $2"
    fi
}

echo -e "${BLEU}=========================================="
echo "Suite de tests SwapIt"
echo "==========================================${NC}"
echo ""

# ==========================================
# TESTS USER SERVICE
# ==========================================
echo -e "${BLEU}1. TESTS USER SERVICE${NC}"
echo ""

# Générer des identifiants uniques pour cette exécution
TIMESTAMP=$(date +%s)
RANDOM_ID=$((RANDOM % 9000 + 1000))

# Inscrire User 1
echo "Test: POST /register (User 1)"
RESPONSE=$(curl -s -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"user1${TIMESTAMP}${RANDOM_ID}@test.com\",
    \"username\": \"user1${TIMESTAMP}${RANDOM_ID}\",
    \"password\": \"password123\",
    \"firstName\": \"Jean\",
    \"lastName\": \"Dupont\"
  }")
USER1_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$USER1_ID" ]; then
    test_result 0 "Inscription User 1"
    echo "  ID Utilisateur: $USER1_ID"
else
    test_result 1 "Inscription User 1"
    echo "  Réponse: $RESPONSE"
fi
echo ""

# Inscrire User 2
echo "Test: POST /register (User 2)"
RESPONSE=$(curl -s -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"user2${TIMESTAMP}${RANDOM_ID}@test.com\",
    \"username\": \"user2${TIMESTAMP}${RANDOM_ID}\",
    \"password\": \"password123\",
    \"firstName\": \"Marie\",
    \"lastName\": \"Martin\"
  }")
USER2_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$USER2_ID" ]; then
    test_result 0 "Inscription User 2"
    echo "  ID Utilisateur: $USER2_ID"
else
    test_result 1 "Inscription User 2"
fi
echo ""

# Connexion User 1
echo "Test: POST /login"
RESPONSE=$(curl -s -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"user1${TIMESTAMP}${RANDOM_ID}@test.com\",
    \"password\": \"password123\"
  }")
TOKEN1=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN1" ]; then
    test_result 0 "Connexion User 1"
    echo "  Token reçu"
else
    test_result 1 "Connexion User 1"
fi
echo ""

# Obtenir le profil
if [ -n "$USER1_ID" ]; then
    echo "Test: GET /profile/$USER1_ID"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/profile/$USER1_ID)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir profil (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir profil (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Mettre à jour le profil avec bio, préférences et adresse
if [ -n "$USER1_ID" ]; then
    echo "Test: PUT /profile/$USER1_ID (avec bio, préférences, adresse)"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT http://localhost:3001/profile/$USER1_ID \
      -H "Content-Type: application/json" \
      -d '{
        "bio": "Passionné de mode vintage",
        "preferences": {"notifications": true, "language": "fr"},
        "address": {"street": "123 Rue Example", "city": "Paris", "postalCode": "75001", "country": "France"}
      }')
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Mettre à jour profil complet (HTTP $HTTP_CODE)"
    else
        test_result 1 "Mettre à jour profil complet (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Obtenir l'historique
if [ -n "$USER1_ID" ]; then
    echo "Test: GET /$USER1_ID/history"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/$USER1_ID/history)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir historique (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir historique (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Obtenir User par ID
if [ -n "$USER1_ID" ]; then
    echo "Test: GET /$USER1_ID"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/$USER1_ID)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir User par ID (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir User par ID (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# ==========================================
# TESTS CATALOG SERVICE
# ==========================================
echo -e "${BLEU}2. TESTS CATALOG SERVICE${NC}"
echo ""

# Créer un produit
if [ -n "$USER1_ID" ]; then
    echo "Test: POST / (Créer produit)"
    RESPONSE=$(curl -s -X POST http://localhost:3002/ \
      -H "Content-Type: application/json" \
      -d "{
        \"userId\": \"$USER1_ID\",
        \"title\": \"Veste en jean vintage\",
        \"description\": \"Veste vintage en excellent état\",
        \"price\": 45.99,
        \"category\": \"jackets\",
        \"size\": \"M\",
        \"condition\": \"good\",
        \"images\": [\"https://example.com/image.jpg\"],
        \"location\": \"Paris, France\"
      }")
    PRODUCT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$PRODUCT_ID" ]; then
        test_result 0 "Créer produit"
        echo "  ID Produit: $PRODUCT_ID"
    else
        test_result 1 "Créer produit"
        echo "  Réponse: $RESPONSE"
    fi
    echo ""
fi

# Obtenir tous les produits
echo "Test: GET / (Obtenir tous les produits)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/)
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Obtenir tous les produits (HTTP $HTTP_CODE)"
else
    test_result 1 "Obtenir tous les produits (HTTP $HTTP_CODE)"
fi
echo ""

# Obtenir produits avec filtres
echo "Test: GET /?category=jackets&minPrice=20&maxPrice=100"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/?category=jackets&minPrice=20&maxPrice=100")
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Obtenir produits avec filtres (HTTP $HTTP_CODE)"
else
    test_result 1 "Obtenir produits avec filtres (HTTP $HTTP_CODE)"
fi
echo ""

# Obtenir produit par ID
if [ -n "$PRODUCT_ID" ]; then
    echo "Test: GET /$PRODUCT_ID"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/$PRODUCT_ID)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir produit par ID (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir produit par ID (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Obtenir produits par utilisateur
if [ -n "$USER1_ID" ]; then
    echo "Test: GET /user/$USER1_ID"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/user/$USER1_ID)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir produits par utilisateur (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir produits par utilisateur (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Mettre à jour produit
if [ -n "$PRODUCT_ID" ]; then
    echo "Test: PUT /$PRODUCT_ID"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT http://localhost:3002/$PRODUCT_ID \
      -H "Content-Type: application/json" \
      -d '{"price": 40.00}')
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Mettre à jour produit (HTTP $HTTP_CODE)"
    else
        test_result 1 "Mettre à jour produit (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# ==========================================
# TESTS SEARCH SERVICE
# ==========================================
echo -e "${BLEU}3. TESTS SEARCH SERVICE${NC}"
echo ""

# Rechercher produits
echo "Test: GET /search?q=veste&category=jackets"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3003/search?q=veste&category=jackets&minPrice=20&maxPrice=100")
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Rechercher produits (HTTP $HTTP_CODE)"
else
    test_result 1 "Rechercher produits (HTTP $HTTP_CODE)"
fi
echo ""

# Obtenir suggestions de recherche
echo "Test: GET /suggest?q=vest"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3003/suggest?q=vest")
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Obtenir suggestions de recherche (HTTP $HTTP_CODE)"
else
    test_result 1 "Obtenir suggestions de recherche (HTTP $HTTP_CODE)"
fi
echo ""

# ==========================================
# TESTS MESSAGING SERVICE
# ==========================================
echo -e "${BLEU}4. TESTS MESSAGING SERVICE${NC}"
echo ""

# Créer conversation
if [ -n "$USER1_ID" ] && [ -n "$USER2_ID" ] && [ -n "$PRODUCT_ID" ]; then
    echo "Test: POST /conversations"
    RESPONSE=$(curl -s -X POST http://localhost:3004/conversations \
      -H "Content-Type: application/json" \
      -d "{
        \"participant1Id\": \"$USER1_ID\",
        \"participant2Id\": \"$USER2_ID\",
        \"productId\": \"$PRODUCT_ID\"
      }")
    CONVERSATION_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$CONVERSATION_ID" ]; then
        CONVERSATION_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    fi
    if [ -n "$CONVERSATION_ID" ]; then
        test_result 0 "Créer conversation"
        echo "  ID Conversation: $CONVERSATION_ID"
    else
        if echo "$RESPONSE" | grep -q '"success":true'; then
            test_result 0 "Créer conversation (succès, extraction ID échouée)"
            CONVERSATION_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
        else
            test_result 1 "Créer conversation"
            echo "  Réponse: $RESPONSE"
        fi
    fi
    echo ""
fi

# Obtenir conversations utilisateur
if [ -n "$USER1_ID" ]; then
    echo "Test: GET /conversations/$USER1_ID"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/conversations/$USER1_ID)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir conversations utilisateur (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir conversations utilisateur (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Envoyer message
if [ -n "$CONVERSATION_ID" ] && [ -n "$USER1_ID" ] && [ -n "$USER2_ID" ]; then
    echo "Test: POST /conversations/$CONVERSATION_ID/messages"
    RESPONSE=$(curl -s -X POST http://localhost:3004/conversations/$CONVERSATION_ID/messages \
      -H "Content-Type: application/json" \
      -d "{
        \"senderId\": \"$USER1_ID\",
        \"receiverId\": \"$USER2_ID\",
        \"content\": \"Bonjour, est-ce que c'est encore disponible ?\"
      }")
    MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
    if [ -z "$MESSAGE_ID" ]; then
        MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    fi
    if [ -n "$MESSAGE_ID" ]; then
        test_result 0 "Envoyer message"
        echo "  ID Message: $MESSAGE_ID"
    else
        if echo "$RESPONSE" | grep -q '"success":true'; then
            test_result 0 "Envoyer message (succès, extraction ID échouée)"
            MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
        else
            test_result 1 "Envoyer message"
            echo "  Réponse: $RESPONSE"
        fi
    fi
    echo ""
fi

# Obtenir messages
if [ -n "$CONVERSATION_ID" ]; then
    echo "Test: GET /conversations/$CONVERSATION_ID/messages"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/conversations/$CONVERSATION_ID/messages)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir messages (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir messages (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Marquer message comme lu
if [ -n "$MESSAGE_ID" ]; then
    echo "Test: PUT /messages/$MESSAGE_ID/read"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT http://localhost:3004/messages/$MESSAGE_ID/read)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Marquer message comme lu (HTTP $HTTP_CODE)"
    else
        test_result 1 "Marquer message comme lu (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# ==========================================
# TESTS TRANSACTION SERVICE
# ==========================================
echo -e "${BLEU}5. TESTS TRANSACTION SERVICE${NC}"
echo ""

# Créer commande
if [ -n "$USER1_ID" ] && [ -n "$USER2_ID" ] && [ -n "$PRODUCT_ID" ]; then
    echo "Test: POST / (Créer commande)"
    RESPONSE=$(curl -s -X POST http://localhost:3005/ \
      -H "Content-Type: application/json" \
      -d "{
        \"buyerId\": \"$USER2_ID\",
        \"sellerId\": \"$USER1_ID\",
        \"productId\": \"$PRODUCT_ID\",
        \"amount\": 40.00
      }")
    ORDER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ORDER_ID" ]; then
        test_result 0 "Créer commande"
        echo "  ID Commande: $ORDER_ID"
    else
        test_result 1 "Créer commande"
        echo "  Réponse: $RESPONSE"
    fi
    echo ""
fi

# Obtenir commande par ID
if [ -n "$ORDER_ID" ]; then
    echo "Test: GET /$ORDER_ID"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/$ORDER_ID)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir commande par ID (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir commande par ID (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Obtenir commandes utilisateur (acheteur)
if [ -n "$USER2_ID" ]; then
    echo "Test: GET /user/$USER2_ID?role=buyer"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3005/user/$USER2_ID?role=buyer")
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir commandes utilisateur (acheteur) (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir commandes utilisateur (acheteur) (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Obtenir commandes utilisateur (vendeur)
if [ -n "$USER1_ID" ]; then
    echo "Test: GET /user/$USER1_ID?role=seller"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3005/user/$USER1_ID?role=seller")
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Obtenir commandes utilisateur (vendeur) (HTTP $HTTP_CODE)"
    else
        test_result 1 "Obtenir commandes utilisateur (vendeur) (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Mettre à jour statut commande
if [ -n "$ORDER_ID" ]; then
    echo "Test: PUT /$ORDER_ID/status"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT http://localhost:3005/$ORDER_ID/status \
      -H "Content-Type: application/json" \
      -d '{"status": "paid"}')
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Mettre à jour statut commande (HTTP $HTTP_CODE)"
    else
        test_result 1 "Mettre à jour statut commande (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Traiter paiement
if [ -n "$ORDER_ID" ]; then
    echo "Test: POST /$ORDER_ID/payment"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3005/$ORDER_ID/payment \
      -H "Content-Type: application/json" \
      -d '{"paymentIntentId": "test-payment-123"}')
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        test_result 0 "Traiter paiement (HTTP $HTTP_CODE)"
    else
        test_result 1 "Traiter paiement (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# ==========================================
# NETTOYAGE - Supprimer produit
# ==========================================
if [ -n "$PRODUCT_ID" ]; then
    echo "Test: DELETE /$PRODUCT_ID (Nettoyage)"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3002/$PRODUCT_ID)
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 204 ]; then
        test_result 0 "Supprimer produit (HTTP $HTTP_CODE)"
    else
        test_result 1 "Supprimer produit (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

echo -e "${BLEU}=========================================="
echo "Suite de tests terminée !"
echo "==========================================${NC}"
echo ""
echo "Résumé:"
echo "  - User Service: 7 tests"
echo "  - Catalog Service: 6 tests"
echo "  - Search Service: 2 tests"
echo "  - Messaging Service: 5 tests"
echo "  - Transaction Service: 6 tests"
echo ""
echo "Total: 26+ tests d'endpoints API"
echo ""

