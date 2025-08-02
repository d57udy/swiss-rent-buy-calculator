#!/bin/bash

# Swiss Rent vs Buy Calculator - Test Runner
# Executes all automated tests and provides summary

echo "🚀 Swiss Rent vs Buy Calculator - Automated Test Suite"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_script="$2"
    local description="$3"
    
    echo -e "${BLUE}🧪 Running: $test_name${NC}"
    echo "   $description"
    echo "   Script: $test_script"
    echo ""
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Check if test file exists
    if [ ! -f "$test_script" ]; then
        echo -e "${RED}❌ ERROR: Test file not found: $test_script${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo ""
        return 1
    fi
    
    # Run the test
    if node "$test_script"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
    echo "────────────────────────────────────────────────────"
    echo ""
}

# Change to script directory
cd "$(dirname "$0")"

echo "📅 Test execution started: $(date)"
echo ""

# Run all tests
run_test "Backend Validation" \
         "backend-validation-test.js" \
         "Validates 8,415 calculations against moneyland.ch data + auto-calculations"

run_test "Auto-Calculation Consistency" \
         "test-auto-calculation-consistency.js" \
         "Tests frontend auto-calculation consistency across realistic scenarios"

run_test "Realistic Parameter Validation" \
         "realistic-parameter-validation.js" \
         "Tests realistic Swiss parameters with frontend-backend alignment"

run_test "Backend Auto-Calculation Capabilities" \
         "test-backend-auto-calculations.js" \
         "Tests backend auto-calculation scaling and break-even finding"

run_test "Complete Auto-Calculation Suite" \
         "test-complete-auto-calculations.js" \
         "Comprehensive auto-calculation validation across all components"

# Summary
echo ""
echo "=========================================="
echo "📊 TEST EXECUTION SUMMARY"
echo "=========================================="
echo "Total Tests:  $TOTAL_TESTS"
echo "Passed Tests: $PASSED_TESTS"
echo "Failed Tests: $FAILED_TESTS"
echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo "Completed:    $(date)"
echo ""

# Overall result
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}✅ The Swiss Rent vs Buy Calculator is fully validated${NC}"
    echo -e "${GREEN}✅ All automatic parameter calculations work correctly${NC}"
    echo -e "${GREEN}✅ Frontend and backend calculations are consistent${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}🔧 Please review the failed tests above${NC}"
    exit 1
fi