#!/bin/bash

echo "=== Testing Landing Page Email Flow ==="
echo ""

# Test 1: Check Email API - Existing Email
echo "Test 1: Checking existing email (test@example.com)..."
curl -X POST http://localhost:3000/api/landing/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

echo ""
echo "---"
echo ""

# Test 2: Check Email API - Non-existing Email
echo "Test 2: Checking non-existing email (newuser@example.com)..."
curl -X POST http://localhost:3000/api/landing/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

echo ""
echo "---"
echo ""

# Test 3: Submit Webhook - Existing User
echo "Test 3: Triggering webhook for existing user..."
curl -X POST http://localhost:3000/api/landing/submit-webhook \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","exists":true,"source":"insider-access"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

echo ""
echo "---"
echo ""

# Test 4: Submit Webhook - New User
echo "Test 4: Triggering webhook for new user..."
curl -X POST http://localhost:3000/api/landing/submit-webhook \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","exists":false,"source":"future-insider"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null

echo ""
echo "=== Tests Complete ==="
