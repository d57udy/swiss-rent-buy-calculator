# Testing Documentation

This document describes the comprehensive test suite for the Swiss Rent vs Buy Calculator.

## Quick Start

### Run All Tests (Recommended)

```bash
# Using Node.js test runner (detailed reporting)
npm run test:all

# Using shell script (simple output)
npm run test:shell
# or directly: ./run-tests.sh
```

### Run Individual Tests

```bash
# Backend validation (8,415 test cases)
npm run test:backend

# Auto-calculation validation
npm run test:auto-calc

# Realistic parameter testing
npm run test:realistic

# Quick validation only
npm test
```

## Test Suite Overview

### 1. Backend Validation Test (`backend-validation-test.js`)
- **Purpose**: Validates calculation accuracy against moneyland.ch data
- **Test Cases**: 8,415 real scenarios from moneyland.ch
- **Coverage**: All parameter combinations and edge cases
- **Expected Result**: 100% accuracy (±CHF 0.05)
- **Duration**: ~30 seconds
- **Critical**: ✅ Yes

### 2. Auto-Calculation Consistency Test (`test-auto-calculation-consistency.js`)
- **Purpose**: Tests frontend auto-calculation consistency
- **Test Cases**: 5 realistic Swiss property scenarios
- **Coverage**: 
  - Down payment auto-calculation (20%)
  - Maintenance cost auto-calculation (1.25%)
  - Amortization auto-calculation
  - Imputed rental value auto-calculation (65%)
- **Expected Result**: All auto-calculations match Swiss standards
- **Duration**: ~60 seconds
- **Critical**: ✅ Yes

### 3. Realistic Parameter Validation (`realistic-parameter-validation.js`)
- **Purpose**: Tests realistic Swiss parameters with UI-backend alignment
- **Test Cases**: 5 randomly generated realistic scenarios
- **Coverage**: Frontend-backend calculation consistency
- **Expected Result**: 100% decision match, <CHF 1,000 value differences
- **Duration**: ~45 seconds
- **Critical**: ⚠️ No

### 4. Backend Auto-Calculation Capabilities (`test-backend-auto-calculations.js`)
- **Purpose**: Tests backend auto-calculation scaling and break-even finding
- **Test Cases**: Parameter scaling across price ranges, break-even calculation
- **Coverage**: 
  - Auto-calculation scaling (1.25% maintenance, 20% down payment)
  - Parameter sweep compatibility
  - Break-even price finding
- **Expected Result**: Perfect scaling, working break-even logic
- **Duration**: ~15 seconds
- **Critical**: ✅ Yes

### 5. Complete Auto-Calculation Suite (`test-complete-auto-calculations.js`)
- **Purpose**: Comprehensive auto-calculation validation across all components
- **Test Cases**: Frontend + backend auto-calculation integration
- **Coverage**: End-to-end auto-calculation workflow
- **Expected Result**: Complete system validation
- **Duration**: ~90 seconds
- **Critical**: ✅ Yes

### 6. Equal-Savings Scenario Tests (`test-equal-savings.js`)
- **Purpose**: Validates the optional Equal-Savings comparison mode ("invest the difference")
- **Checks**:
  - Enabling equal-savings reduces `TotalRentalCost` compared to equal-consumption
  - Renter is credited with amortization-equivalent contributions and their growth
  - Investment income tax is applied to renter gains
- **Duration**: ~10 seconds
- **Critical**: ✅ Yes

## Test Results Interpretation

### Success Criteria

#### Critical Tests (Must Pass)
- ✅ **Backend Validation**: 100% accuracy against moneyland.ch
- ✅ **Auto-Calculation Consistency**: All auto-calculations match standards
- ✅ **Backend Auto-Calculation**: Perfect parameter scaling
- ✅ **Complete Auto-Calculation Suite**: End-to-end validation

#### Non-Critical Tests (Optional)
- ⚠️ **Realistic Parameter Validation**: May have minor UI timing issues

### Expected Outputs

#### ✅ All Tests Pass
```
🎉 ALL TESTS PASSED! 🎉
✅ The Swiss Rent vs Buy Calculator is fully validated
✅ All automatic parameter calculations work correctly
✅ Frontend and backend calculations are consistent
✅ Parameter sweeps and max-bid calculations are reliable
```

#### ⚠️ Some Non-Critical Tests Fail
```
⚠️ SOME NON-CRITICAL TESTS FAILED
✅ All critical functionality is working correctly
✅ Core calculations and auto-parameters are validated
⚠️ Some advanced features may have minor issues
```

#### ❌ Critical Tests Fail
```
🚨 CRITICAL TEST FAILURES DETECTED
❌ Core functionality issues found
❌ Calculator reliability may be compromised
🔧 Immediate investigation and fixes required
```

## Auto-Calculation Validation

The test suite specifically validates these automatic calculations:

### Swiss Standards Applied
- **Down Payment**: 20% of purchase price (Swiss banking minimum)
- **Maintenance Costs**: 1.25% of purchase price annually (Swiss standard)
- **Amortization**: Mortgage amount ÷ amortization years
- **Imputed Rental Value**: 65% of annual market rent
- **Additional Purchase Costs**: Fixed CHF 5,000 (user-editable)

### Parameter Scaling Tests
- ✅ CHF 1.2M property → CHF 15,000 maintenance (1.25%)
- ✅ CHF 1.5M property → CHF 18,750 maintenance (1.25%)
- ✅ CHF 2.0M property → CHF 25,000 maintenance (1.25%)

### Integration Verification
- ✅ Frontend UI auto-calculations work correctly
- ✅ Backend handles auto-calculated parameters properly
- ✅ Parameter sweeps scale auto-calculations with purchase price
- ✅ Max-bid calculations use scaled maintenance costs

## Troubleshooting

### Common Issues

#### Test Timeouts
- **Cause**: Slow browser automation or system performance
- **Solution**: Run tests individually, check system resources

#### Missing Dependencies
```bash
# Install required dependencies
npm install
```

#### Playwright Issues
```bash
# Install Playwright browsers
npx playwright install
```

### Test File Locations
```
run-all-tests.js                     # Comprehensive test runner
run-tests.sh                         # Shell script test runner
backend-validation-test.js           # Core validation (8,415 cases)
test-auto-calculation-consistency.js # Frontend auto-calc tests
realistic-parameter-validation.js    # Realistic scenario tests
test-backend-auto-calculations.js    # Backend auto-calc tests
test-complete-auto-calculations.js   # Complete auto-calc suite
```

### Logs and Reports
- Test results are saved to `test-results-[timestamp].json`
- Real-time output shows progress and failures
- Detailed error messages for debugging

## Test Data

### CSV Test Data
- **File**: `output-002.csv`
- **Source**: moneyland.ch calculator results
- **Size**: 8,415 test cases
- **Coverage**: All parameter combinations from Swiss market

### Generated Test Data
- Realistic Swiss property prices (CHF 800K - CHF 3M)
- Market-appropriate rent-to-price ratios
- Current Swiss mortgage rates (0.5% - 3.0%)
- Swiss tax rates by canton (15% - 45%)

## Continuous Integration

### GitHub Actions (Example)
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
```

### Local Pre-commit Hook
```bash
#!/bin/sh
# Run critical tests before commit
npm run test:backend && npm run test:auto-calc
```

## Performance Benchmarks

### Expected Test Durations
- Backend Validation: ~30s (8,415 calculations)
- Auto-Calculation Tests: ~60s (browser automation)
- Realistic Parameters: ~45s (browser + calculations)
- Backend Auto-Calc: ~15s (pure calculations)
- Complete Suite: ~90s (comprehensive)

### **Total Suite Duration**: ~4-5 minutes

## Validation Standards

### Numerical Accuracy
- **Tolerance**: ±CHF 0.05 (5 centimes)
- **Precision**: 99.9999% accuracy required
- **Rounding**: Swiss rounding standards applied

### Decision Accuracy
- **Requirement**: 100% decision match (BUY/RENT)
- **Validation**: Against 8,415 moneyland.ch results
- **Edge Cases**: Break-even scenarios handled correctly

### Auto-Calculation Standards
- **Swiss Banking**: 20% minimum down payment enforced
- **Maintenance**: 1.25% Swiss standard applied
- **Imputed Rental**: 65% of market rent (tax calculation)
- **Scaling**: Perfect proportional scaling with price changes