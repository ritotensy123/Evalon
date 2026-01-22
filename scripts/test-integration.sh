#!/bin/bash
# =============================================================================
# EVALON - INTEGRATION TEST SCRIPT
# =============================================================================
# Tests all services and their communication
# Usage: ./scripts/test-integration.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default ports
BACKEND_PORT=${PORT:-5001}
REALTIME_PORT=${REALTIME_PORT:-5004}
AI_SERVICE_PORT=${AI_SERVICE_PORT:-5002}
FRONTEND_PORT=${FRONTEND_PORT:-3001}

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           EVALON - Integration Test Suite                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    elif [ "$response" = "000" ]; then
        echo -e "${YELLOW}⏭️ SKIP${NC} (Service not running)"
        ((SKIPPED++))
        return 2
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected, got $response)"
        ((FAILED++))
        return 1
    fi
}

# Test JSON response
test_json_endpoint() {
    local name="$1"
    local url="$2"
    local key="$3"
    local expected="$4"
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null || echo "{}")
    
    if echo "$response" | grep -q "\"$key\""; then
        actual=$(echo "$response" | grep -o "\"$key\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
        if [ "$actual" = "$expected" ] || [ -z "$expected" ]; then
            echo -e "${GREEN}✅ PASS${NC} ($key: $actual)"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}❌ FAIL${NC} (Expected $key=$expected, got $actual)"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${YELLOW}⏭️ SKIP${NC} (Service not running)"
        ((SKIPPED++))
        return 2
    fi
}

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}                     Backend API Tests                          ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"

# Backend API Tests
test_endpoint "Backend Root" "http://localhost:$BACKEND_PORT/" "200"
test_endpoint "Backend Health" "http://localhost:$BACKEND_PORT/api/v1/health" "200"
test_json_endpoint "Backend Health JSON" "http://localhost:$BACKEND_PORT/api/v1/health" "status" "healthy"
test_endpoint "Backend Health Detailed" "http://localhost:$BACKEND_PORT/api/v1/health/detailed" "200"
test_endpoint "Backend Liveness" "http://localhost:$BACKEND_PORT/api/v1/health/live" "200"
test_endpoint "Backend Readiness" "http://localhost:$BACKEND_PORT/api/v1/health/ready" "200"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}                     AI Service Tests                           ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"

# AI Service Tests
test_endpoint "AI Service Health" "http://localhost:$AI_SERVICE_PORT/health" "200"
test_json_endpoint "AI Service Health JSON" "http://localhost:$AI_SERVICE_PORT/health" "status" "healthy"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}                     Frontend Tests                             ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"

# Frontend Tests
test_endpoint "Frontend" "http://localhost:$FRONTEND_PORT/" "200"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}                     API Endpoint Tests                         ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"

# API Endpoint Tests (should return 401 without auth)
test_endpoint "Organizations API (Auth Required)" "http://localhost:$BACKEND_PORT/api/v1/organizations" "401"
test_endpoint "Teachers API (Auth Required)" "http://localhost:$BACKEND_PORT/api/v1/teachers" "401"
test_endpoint "Students API (Auth Required)" "http://localhost:$BACKEND_PORT/api/v1/students" "401"
test_endpoint "Exams API (Auth Required)" "http://localhost:$BACKEND_PORT/api/v1/exams" "401"

# Public API Tests
test_endpoint "Location Countries API" "http://localhost:$BACKEND_PORT/api/v1/locations/countries" "200"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                        Test Results                            ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC}  $PASSED"
echo -e "  ${RED}Failed:${NC}  $FAILED"
echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
echo ""

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    PERCENT=$((PASSED * 100 / TOTAL))
    echo -e "  Success Rate: $PERCENT%"
fi

echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
elif [ $PASSED -eq 0 ]; then
    echo -e "${YELLOW}⚠️ No services running - start services and rerun${NC}"
    exit 2
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi





