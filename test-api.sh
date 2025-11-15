#!/bin/bash

# SwapIt API Test Script
# Tests all routes: POST, GET, PUT, DELETE

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "SwapIt API Test Suite"
echo "=========================================="
echo ""

# Function to print test results
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data"
        else
            curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint"
        fi
    fi
}

# Extract JSON value
extract_json() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

# Extract JSON value (number)
extract_json_num() {
    echo "$1" | grep -o "\"$2\":[0-9]*" | cut -d':' -f2
}

echo "=========================================="
echo "1. USER SERVICE TESTS"
echo "=========================================="
echo ""

# Test 1: Register User 1
echo "Testing: POST /api/users/register (User 1)"
RESPONSE=$(api_call "POST" "/api/users/register" '{
  "email": "testuser1@example.com",
  "username": "testuser1",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
USER1_ID=$(extract_json "$BODY" "id")
if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Register User 1 (HTTP $HTTP_CODE)"
    echo "  User ID: $USER1_ID"
else
    test_result 1 "Register User 1 (HTTP $HTTP_CODE)"
    echo "  Response: $BODY"
fi
echo ""

# Test 2: Register User 2
echo "Testing: POST /api/users/register (User 2)"
RESPONSE=$(api_call "POST" "/api/users/register" '{
  "email": "testuser2@example.com",
  "username": "testuser2",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith"
}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
USER2_ID=$(extract_json "$BODY" "id")
if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Register User 2 (HTTP $HTTP_CODE)"
    echo "  User ID: $USER2_ID"
else
    test_result 1 "Register User 2 (HTTP $HTTP_CODE)"
    echo "  Response: $BODY"
fi
echo ""

# Test 3: Login User 1
echo "Testing: POST /api/users/login (User 1)"
RESPONSE=$(api_call "POST" "/api/users/login" '{
  "email": "testuser1@example.com",
  "password": "password123"
}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
TOKEN1=$(extract_json "$BODY" "token")
if [ "$HTTP_CODE" -eq 200 ] && [ -n "$TOKEN1" ]; then
    test_result 0 "Login User 1 (HTTP $HTTP_CODE)"
    echo "  Token received"
else
    test_result 1 "Login User 1 (HTTP $HTTP_CODE)"
    echo "  Response: $BODY"
fi
echo ""

# Test 4: Get User Profile
if [ -n "$USER1_ID" ]; then
    echo "Testing: GET /api/users/profile/$USER1_ID"
    RESPONSE=$(api_call "GET" "/api/users/profile/$USER1_ID" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get User Profile (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get User Profile (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 5: Get User by ID
if [ -n "$USER1_ID" ]; then
    echo "Testing: GET /api/users/$USER1_ID"
    RESPONSE=$(api_call "GET" "/api/users/$USER1_ID" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get User by ID (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get User by ID (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 6: Update Profile
if [ -n "$USER1_ID" ] && [ -n "$TOKEN1" ]; then
    echo "Testing: PUT /api/users/profile/$USER1_ID"
    RESPONSE=$(api_call "PUT" "/api/users/profile/$USER1_ID" '{
      "firstName": "Johnny",
      "lastName": "Doe"
    }' "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Update Profile (HTTP $HTTP_CODE)"
    else
        test_result 1 "Update Profile (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

echo "=========================================="
echo "2. CATALOG SERVICE TESTS"
echo "=========================================="
echo ""

# Test 7: Create Product
if [ -n "$USER1_ID" ]; then
    echo "Testing: POST /api/catalog"
    RESPONSE=$(api_call "POST" "/api/catalog" "{
      \"userId\": \"$USER1_ID\",
      \"title\": \"Vintage Denim Jacket\",
      \"description\": \"Great condition vintage jacket from the 90s\",
      \"price\": 45.99,
      \"category\": \"jackets\",
      \"size\": \"M\",
      \"condition\": \"good\",
      \"images\": [\"https://example.com/image1.jpg\"],
      \"location\": \"Paris, France\"
    }" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    PRODUCT_ID=$(extract_json "$BODY" "id")
    if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Create Product (HTTP $HTTP_CODE)"
        echo "  Product ID: $PRODUCT_ID"
    else
        test_result 1 "Create Product (HTTP $HTTP_CODE)"
        echo "  Response: $BODY"
    fi
    echo ""
fi

# Test 8: Get All Products
echo "Testing: GET /api/catalog"
RESPONSE=$(api_call "GET" "/api/catalog")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Get All Products (HTTP $HTTP_CODE)"
else
    test_result 1 "Get All Products (HTTP $HTTP_CODE)"
fi
echo ""

# Test 9: Get Products with Filters
echo "Testing: GET /api/catalog?category=jackets&minPrice=20&maxPrice=100"
RESPONSE=$(api_call "GET" "/api/catalog?category=jackets&minPrice=20&maxPrice=100")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Get Products with Filters (HTTP $HTTP_CODE)"
else
    test_result 1 "Get Products with Filters (HTTP $HTTP_CODE)"
fi
echo ""

# Test 10: Get Product by ID
if [ -n "$PRODUCT_ID" ]; then
    echo "Testing: GET /api/catalog/$PRODUCT_ID"
    RESPONSE=$(api_call "GET" "/api/catalog/$PRODUCT_ID")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get Product by ID (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get Product by ID (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 11: Get Products by User
if [ -n "$USER1_ID" ]; then
    echo "Testing: GET /api/catalog/user/$USER1_ID"
    RESPONSE=$(api_call "GET" "/api/catalog/user/$USER1_ID")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get Products by User (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get Products by User (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 12: Update Product
if [ -n "$PRODUCT_ID" ] && [ -n "$TOKEN1" ]; then
    echo "Testing: PUT /api/catalog/$PRODUCT_ID"
    RESPONSE=$(api_call "PUT" "/api/catalog/$PRODUCT_ID" '{
      "price": 40.00,
      "status": "available"
    }' "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Update Product (HTTP $HTTP_CODE)"
    else
        test_result 1 "Update Product (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

echo "=========================================="
echo "3. SEARCH SERVICE TESTS"
echo "=========================================="
echo ""

# Test 13: Search Products
echo "Testing: GET /api/search/search?q=jacket&category=jackets&minPrice=20&maxPrice=100"
RESPONSE=$(api_call "GET" "/api/search/search?q=jacket&category=jackets&minPrice=20&maxPrice=100")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Search Products (HTTP $HTTP_CODE)"
else
    test_result 1 "Search Products (HTTP $HTTP_CODE)"
fi
echo ""

# Test 14: Get Search Suggestions
echo "Testing: GET /api/search/suggest?q=jack"
RESPONSE=$(api_call "GET" "/api/search/suggest?q=jack")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Get Search Suggestions (HTTP $HTTP_CODE)"
else
    test_result 1 "Get Search Suggestions (HTTP $HTTP_CODE)"
fi
echo ""

echo "=========================================="
echo "4. MESSAGING SERVICE TESTS"
echo "=========================================="
echo ""

# Test 15: Create Conversation
if [ -n "$USER1_ID" ] && [ -n "$USER2_ID" ] && [ -n "$PRODUCT_ID" ]; then
    echo "Testing: POST /api/messages/conversations"
    RESPONSE=$(api_call "POST" "/api/messages/conversations" "{
      \"participant1Id\": \"$USER1_ID\",
      \"participant2Id\": \"$USER2_ID\",
      \"productId\": \"$PRODUCT_ID\"
    }" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    CONVERSATION_ID=$(extract_json "$BODY" "id")
    if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Create Conversation (HTTP $HTTP_CODE)"
        echo "  Conversation ID: $CONVERSATION_ID"
    else
        test_result 1 "Create Conversation (HTTP $HTTP_CODE)"
        echo "  Response: $BODY"
    fi
    echo ""
fi

# Test 16: Get User Conversations
if [ -n "$USER1_ID" ]; then
    echo "Testing: GET /api/messages/conversations/$USER1_ID"
    RESPONSE=$(api_call "GET" "/api/messages/conversations/$USER1_ID" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get User Conversations (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get User Conversations (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 17: Send Message
if [ -n "$CONVERSATION_ID" ] && [ -n "$USER1_ID" ] && [ -n "$USER2_ID" ]; then
    echo "Testing: POST /api/messages/conversations/$CONVERSATION_ID/messages"
    RESPONSE=$(api_call "POST" "/api/messages/conversations/$CONVERSATION_ID/messages" "{
      \"senderId\": \"$USER1_ID\",
      \"receiverId\": \"$USER2_ID\",
      \"content\": \"Hello, is this still available?\"
    }" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    MESSAGE_ID=$(extract_json "$BODY" "id")
    if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Send Message (HTTP $HTTP_CODE)"
        echo "  Message ID: $MESSAGE_ID"
    else
        test_result 1 "Send Message (HTTP $HTTP_CODE)"
        echo "  Response: $BODY"
    fi
    echo ""
fi

# Test 18: Get Messages
if [ -n "$CONVERSATION_ID" ]; then
    echo "Testing: GET /api/messages/conversations/$CONVERSATION_ID/messages"
    RESPONSE=$(api_call "GET" "/api/messages/conversations/$CONVERSATION_ID/messages" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get Messages (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get Messages (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 19: Mark Message as Read
if [ -n "$MESSAGE_ID" ]; then
    echo "Testing: PUT /api/messages/messages/$MESSAGE_ID/read"
    RESPONSE=$(api_call "PUT" "/api/messages/messages/$MESSAGE_ID/read" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Mark Message as Read (HTTP $HTTP_CODE)"
    else
        test_result 1 "Mark Message as Read (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

echo "=========================================="
echo "5. TRANSACTION SERVICE TESTS"
echo "=========================================="
echo ""

# Test 20: Create Order
if [ -n "$USER1_ID" ] && [ -n "$USER2_ID" ] && [ -n "$PRODUCT_ID" ]; then
    echo "Testing: POST /api/transactions"
    RESPONSE=$(api_call "POST" "/api/transactions" "{
      \"buyerId\": \"$USER2_ID\",
      \"sellerId\": \"$USER1_ID\",
      \"productId\": \"$PRODUCT_ID\",
      \"amount\": 40.00
    }" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    ORDER_ID=$(extract_json "$BODY" "id")
    if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Create Order (HTTP $HTTP_CODE)"
        echo "  Order ID: $ORDER_ID"
    else
        test_result 1 "Create Order (HTTP $HTTP_CODE)"
        echo "  Response: $BODY"
    fi
    echo ""
fi

# Test 21: Get Order by ID
if [ -n "$ORDER_ID" ]; then
    echo "Testing: GET /api/transactions/$ORDER_ID"
    RESPONSE=$(api_call "GET" "/api/transactions/$ORDER_ID" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get Order by ID (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get Order by ID (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 22: Get User Orders (as buyer)
if [ -n "$USER2_ID" ]; then
    echo "Testing: GET /api/transactions/user/$USER2_ID?role=buyer"
    RESPONSE=$(api_call "GET" "/api/transactions/user/$USER2_ID?role=buyer" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get User Orders as Buyer (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get User Orders as Buyer (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 23: Get User Orders (as seller)
if [ -n "$USER1_ID" ]; then
    echo "Testing: GET /api/transactions/user/$USER1_ID?role=seller"
    RESPONSE=$(api_call "GET" "/api/transactions/user/$USER1_ID?role=seller" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Get User Orders as Seller (HTTP $HTTP_CODE)"
    else
        test_result 1 "Get User Orders as Seller (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 24: Update Order Status
if [ -n "$ORDER_ID" ]; then
    echo "Testing: PUT /api/transactions/$ORDER_ID/status"
    RESPONSE=$(api_call "PUT" "/api/transactions/$ORDER_ID/status" '{
      "status": "paid"
    }' "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ]; then
        test_result 0 "Update Order Status (HTTP $HTTP_CODE)"
    else
        test_result 1 "Update Order Status (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 25: Process Payment
if [ -n "$ORDER_ID" ]; then
    echo "Testing: POST /api/transactions/$ORDER_ID/payment"
    RESPONSE=$(api_call "POST" "/api/transactions/$ORDER_ID/payment" '{
      "paymentIntentId": "test-payment-intent-123"
    }' "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
        test_result 0 "Process Payment (HTTP $HTTP_CODE)"
    else
        test_result 1 "Process Payment (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

# Test 26: Delete Product (cleanup)
if [ -n "$PRODUCT_ID" ] && [ -n "$TOKEN1" ]; then
    echo "Testing: DELETE /api/catalog/$PRODUCT_ID"
    RESPONSE=$(api_call "DELETE" "/api/catalog/$PRODUCT_ID" "" "$TOKEN1")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 204 ]; then
        test_result 0 "Delete Product (HTTP $HTTP_CODE)"
    else
        test_result 1 "Delete Product (HTTP $HTTP_CODE)"
    fi
    echo ""
fi

echo "=========================================="
echo "Test Suite Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - User Service: 6 tests"
echo "  - Catalog Service: 6 tests"
echo "  - Search Service: 2 tests"
echo "  - Messaging Service: 5 tests"
echo "  - Transaction Service: 6 tests"
echo ""
echo "Total: 25+ API endpoint tests"
echo ""

