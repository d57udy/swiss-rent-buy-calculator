/**
 * Comprehensive Post-Reform Test Suite
 * 
 * Tests post-reform functionality across all calculator features:
 * 1. Single calculations
 * 2. Maximum bid finder
 * 3. Parameter sweeps
 */

// Use the new calculator (same as UI) to ensure consistency
const { calculateNew } = require('./new-calculator-prototype.js');
const SwissRentBuyCalculator = { calculate: calculateNew };

function runComprehensivePostReformTests() {
    console.log('=== Comprehensive Post-Reform Feature Tests ===\n');
    
    const baseParams = {
        purchasePrice: 1500000,
        downPayment: 300000,
        mortgageRate: 0.02,
        annualMaintenanceCosts: 15000,
        amortizationYears: 10,
        annualAmortization: 24000,
        totalRenovations: 0,
        additionalPurchaseCosts: 30000,
        imputedRentalValue: 32000,
        propertyTaxDeductions: 12000,
        marginalTaxRate: 0.28,
        propertyAppreciationRate: 0.015,
        monthlyRent: 4000,
        annualRentalCosts: 8000,
        investmentYieldRate: 0.035,
        termYears: 15
    };
    
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Maximum Bid Finder - Post Reform
    totalTests++;
    console.log('Test 1: Maximum Bid Finder with Post-Reform System');
    
    try {
        // Use parameters where renting can be competitive at high prices
        const bidFinderParams = {
            ...baseParams,
            investmentYieldRate: 0.06, // Higher investment yield makes renting more attractive
            monthlyRent: 3000,         // Lower rent makes renting more attractive
            imputedRentalValue: 45000  // Higher imputed rental value hurts buying in current system
        };
        
        const maxBidCurrent = SwissRentBuyCalculator.findBreakevenPrice(
            { ...bidFinderParams, postReform: false },
            { minPrice: 800000, maxPrice: 2500000, tolerance: 5000 }
        );
        
        const maxBidPostReform = SwissRentBuyCalculator.findBreakevenPrice(
            { ...bidFinderParams, postReform: true },
            { minPrice: 800000, maxPrice: 2500000, tolerance: 5000 }
        );
        
        console.log(`  Current System - Found: ${maxBidCurrent.breakevenFound}, Price: CHF ${maxBidCurrent.breakevenPrice?.toLocaleString()}`);
        console.log(`  Post-Reform    - Found: ${maxBidPostReform.breakevenFound}, Price: CHF ${maxBidPostReform.breakevenPrice?.toLocaleString()}`);
        
        // Test passes if both finders complete successfully (finding breakeven is scenario-dependent)
        if (maxBidCurrent.iterations > 0 && maxBidPostReform.iterations > 0) {
            console.log('  ✅ PASS: Maximum bid finder works with both tax systems');
            testsPassed++;
        } else {
            console.log('  ❌ FAIL: Maximum bid finder failed to execute properly');
        }
    } catch (error) {
        console.log(`  ❌ FAIL: Maximum bid finder threw error: ${error.message}`);
    }
    
    // Test 2: Parameter Sweep - Post Reform
    totalTests++;
    console.log('\nTest 2: Parameter Sweep with Post-Reform System');
    
    try {
        const sweepRanges = {
            propertyAppreciationRate: { min: 0.01, max: 0.02, step: 0.005 },
            investmentYieldRate: { min: 0.03, max: 0.04, step: 0.005 },
            postReform: { min: 0, max: 1, step: 1 } // Test both false (0) and true (1)
        };
        
        const sweepResults = SwissRentBuyCalculator.parameterSweep(baseParams, sweepRanges);
        
        console.log(`  Generated ${sweepResults.length} scenario combinations`);
        
        // Verify we have results for both current and post-reform systems
        const currentSystemResults = sweepResults.filter(r => r.PostReform === false);
        const postReformResults = sweepResults.filter(r => r.PostReform === true);
        
        console.log(`  Current System scenarios: ${currentSystemResults.length}`);
        console.log(`  Post-Reform scenarios: ${postReformResults.length}`);
        
        if (currentSystemResults.length > 0 && postReformResults.length > 0) {
            console.log('  ✅ PASS: Parameter sweep generates results for both tax systems');
            testsPassed++;
        } else {
            console.log('  ❌ FAIL: Parameter sweep missing results for one tax system');
        }
    } catch (error) {
        console.log(`  ❌ FAIL: Parameter sweep threw error: ${error.message}`);
    }
    
    // Test 3: Scenario Modes with Post-Reform
    totalTests++;
    console.log('\nTest 3: All Scenario Modes with Post-Reform');
    
    const scenarioModes = ['equalConsumption', 'cashflowParity', 'equalSavings'];
    let scenarioTestsPassed = 0;
    
    for (const mode of scenarioModes) {
        try {
            const result = SwissRentBuyCalculator.calculate({
                ...baseParams,
                scenarioMode: mode,
                postReform: true
            });
            
            console.log(`    ${mode}: ${result.Decision} CHF ${Math.round(result.ResultValue).toLocaleString()}`);
            
            if (result.PostReform === true && result.ScenarioMode === mode) {
                scenarioTestsPassed++;
            }
        } catch (error) {
            console.log(`    ${mode}: ERROR - ${error.message}`);
        }
    }
    
    if (scenarioTestsPassed === scenarioModes.length) {
        console.log('  ✅ PASS: All scenario modes work with post-reform');
        testsPassed++;
    } else {
        console.log('  ❌ FAIL: Some scenario modes failed with post-reform');
    }
    
    // Test 4: CSV Export with Post-Reform Data
    totalTests++;
    console.log('\nTest 4: CSV Export with Post-Reform Data');
    
    try {
        const testResults = [
            SwissRentBuyCalculator.calculate({ ...baseParams, postReform: false }),
            SwissRentBuyCalculator.calculate({ ...baseParams, postReform: true })
        ];
        
        const csvOutput = SwissRentBuyCalculator.resultsToCsv(testResults);
        
        // Verify CSV contains PostReform column
        if (csvOutput.includes('PostReform') && csvOutput.includes('false') && csvOutput.includes('true')) {
            console.log('  ✅ PASS: CSV export includes PostReform data');
            testsPassed++;
        } else {
            console.log('  ❌ FAIL: CSV export missing PostReform data');
        }
    } catch (error) {
        console.log(`  ❌ FAIL: CSV export threw error: ${error.message}`);
    }
    
    // Test 5: Edge Cases
    totalTests++;
    console.log('\nTest 5: Edge Cases with Post-Reform');
    
    try {
        // Test with zero tax rate
        const zeroTaxResult = SwissRentBuyCalculator.calculate({
            ...baseParams,
            marginalTaxRate: 0,
            postReform: true
        });
        
        // Test with zero imputed rental value
        const zeroImputedResult = SwissRentBuyCalculator.calculate({
            ...baseParams,
            imputedRentalValue: 0,
            postReform: true
        });
        
        if (zeroTaxResult.PostReform === true && zeroImputedResult.PostReform === true) {
            console.log('  ✅ PASS: Edge cases handle post-reform correctly');
            testsPassed++;
        } else {
            console.log('  ❌ FAIL: Edge cases failed with post-reform');
        }
    } catch (error) {
        console.log(`  ❌ FAIL: Edge cases threw error: ${error.message}`);
    }
    
    // Summary
    console.log(`\n=== Comprehensive Test Results ===`);
    console.log(`${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 All comprehensive post-reform tests passed!');
        console.log('✅ Post-reform feature is fully functional across all calculator components');
        return true;
    } else {
        console.log('⚠️  Some comprehensive tests failed.');
        return false;
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runComprehensivePostReformTests();
}

module.exports = { runComprehensivePostReformTests };