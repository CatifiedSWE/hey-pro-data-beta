#!/bin/bash

# Deployment Readiness Check Script for Hostinger
# This script verifies your application is ready for deployment

echo "=========================================="
echo "   HeyProData Deployment Readiness Check"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check status
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    check_pass "Node.js version $(node -v) - OK"
else
    check_fail "Node.js version too old. Need v18+, found $(node -v)"
fi

echo ""
echo "2. Checking package.json..."
if [ -f "package.json" ]; then
    check_pass "package.json exists"
else
    check_fail "package.json not found"
fi

echo ""
echo "3. Checking environment files..."
if [ -f ".env.production.example" ]; then
    check_pass ".env.production.example exists"
else
    check_fail ".env.production.example not found"
fi

if [ -f ".env.production" ]; then
    check_pass ".env.production exists"
else
    check_warn ".env.production not found (create before deploying)"
fi

echo ""
echo "4. Checking Next.js configuration..."
if [ -f "next.config.ts" ]; then
    check_pass "next.config.ts exists"
else
    check_fail "next.config.ts not found"
fi

echo ""
echo "5. Checking PM2 configuration..."
if [ -f "ecosystem.config.js" ]; then
    check_pass "ecosystem.config.js exists"
else
    check_fail "ecosystem.config.js not found"
fi

echo ""
echo "6. Checking dependencies..."
if [ -d "node_modules" ]; then
    check_pass "node_modules exists"
else
    check_warn "node_modules not found (run 'npm install')"
fi

echo ""
echo "7. Checking deployment documentation..."
if [ -f "HOSTINGER_DEPLOYMENT_GUIDE.md" ]; then
    check_pass "Deployment guide exists"
else
    check_warn "Deployment guide not found"
fi

if [ -f "DEPLOYMENT_CHECKLIST.md" ]; then
    check_pass "Deployment checklist exists"
else
    check_warn "Deployment checklist not found"
fi

echo ""
echo "8. Testing build (this may take a minute)..."
if npm run build > /dev/null 2>&1; then
    check_pass "Build successful"
else
    check_fail "Build failed (run 'npm run build' to see errors)"
fi

echo ""
echo "=========================================="
echo "            Summary"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "${GREEN}Your application is ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Create .env.production with your Supabase credentials"
    echo "2. Follow the HOSTINGER_DEPLOYMENT_GUIDE.md"
    echo "3. Upload to your Hostinger server"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo "Review warnings above before deploying"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo "Please fix the errors above before deploying"
    exit 1
fi
