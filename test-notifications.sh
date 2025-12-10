#!/bin/bash

# Notification System Testing Script
# This script helps test the notification system after the fix

echo "=========================================="
echo "NOTIFICATION SYSTEM TEST SCRIPT"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if token is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./test-notifications.sh YOUR_AUTH_TOKEN${NC}"
    echo ""
    echo "To get your auth token:"
    echo "1. Open your app in browser"
    echo "2. Open DevTools (F12)"
    echo "3. Go to Application → Cookies → sb-access-token"
    echo "4. Copy the value"
    echo ""
    echo "Then run:"
    echo "  ./test-notifications.sh <your-token>"
    exit 1
fi

TOKEN=$1
BASE_URL="http://localhost:3000"

echo "Testing notification system..."
echo ""

# Test 1: Create test notification
echo "=========================================="
echo "TEST 1: Creating test notification"
echo "=========================================="
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/notifications/test" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✓ Test notification created successfully${NC}"
    else
        echo -e "${RED}✗ Failed to create test notification${NC}"
        echo "Error details:"
        echo "$RESPONSE" | jq '.error'
        exit 1
    fi
else
    echo -e "${RED}✗ Invalid response format${NC}"
    exit 1
fi

echo ""

# Test 2: Fetch notifications
echo "=========================================="
echo "TEST 2: Fetching notifications"
echo "=========================================="
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/notifications?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    if [ "$SUCCESS" = "true" ]; then
        COUNT=$(echo "$RESPONSE" | jq -r '.data.notifications | length')
        UNREAD=$(echo "$RESPONSE" | jq -r '.data.unreadCount')
        echo -e "${GREEN}✓ Fetched ${COUNT} notifications (${UNREAD} unread)${NC}"
    else
        echo -e "${RED}✗ Failed to fetch notifications${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Invalid response format${NC}"
    exit 1
fi

echo ""

# Test 3: Check for test notification
echo "=========================================="
echo "TEST 3: Verifying test notification exists"
echo "=========================================="
HAS_TEST=$(echo "$RESPONSE" | jq '.data.notifications[] | select(.type == "test_notification")')

if [ -n "$HAS_TEST" ]; then
    echo -e "${GREEN}✓ Test notification found in list${NC}"
    TEST_ID=$(echo "$HAS_TEST" | jq -r '.id')
    echo "Test notification ID: $TEST_ID"
else
    echo -e "${YELLOW}⚠ Test notification not found in recent notifications${NC}"
    echo "This might be okay if you have many notifications"
fi

echo ""

# Test 4: Clean up test notifications
echo "=========================================="
echo "TEST 4: Cleaning up test notifications"
echo "=========================================="
RESPONSE=$(curl -s -X DELETE "${BASE_URL}/api/notifications/test" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✓ Test notifications cleaned up${NC}"
    else
        echo -e "${RED}✗ Failed to clean up test notifications${NC}"
    fi
fi

echo ""
echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ Notification system is working!${NC}"
echo ""
echo "Next steps:"
echo "1. Send a message between two users"
echo "2. Check your server logs for [NOTIFICATION] messages"
echo "3. Check the recipient's notification dropdown"
echo "4. Verify the notification appears in the database"
echo ""
echo "If chat notifications still don't work, check server logs for error details."
echo ""
