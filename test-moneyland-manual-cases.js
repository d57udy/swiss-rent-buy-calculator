/**
 * Manual Test Cases Validation - Moneyland.ch Comparison
 * Tests manually collected scenarios from moneyland.ch against our calculator
 */

const fs = require('fs');
const path = require('path');

// Import calculator
let SwissRentBuyCalculator;
try {
    SwissRentBuyCalculator = require('./calculator.js');
} catch (error) {
    console.error('❌ Error loading calculator:', error.message);
    process.exit(1);
}

class MoneylandManualTester {
    constructor() {
        this.tolerance = 1000; // CHF 1000 tolerance for manual test cases
        this.testCases = [];
        this.results = [];
    }

    /**
     * Load test cases from JSON file
     */
    loadTestCases() {
        const testFilePath = path.join(__dirname, 'moneyland-manual-test-cases.json');
        
        try {
            const rawData = fs.readFileSync(testFilePath, 'utf8');
            this.testCases = JSON.parse(rawData);
            console.log(`✅ Loaded ${this.testCases.length} manual test cases from moneyland.ch`);
        } catch (error) {
            console.error('❌ Error loading test cases:', error.message);
            throw error;
        }
    }

    /**
     * Run a single test case comparison
     */
    runSingleTest(testCase) {
        console.log(`\\n📋 TEST CASE ${testCase.testCase}: ${testCase.description}`);
        console.log('─'.repeat(70));
        
        // Display key parameters
        const params = testCase.params;
        console.log(`📊 PARAMETERS:`);
        console.log(`  Purchase Price: CHF ${params.purchasePrice.toLocaleString()}`);
        console.log(`  Down Payment: CHF ${params.downPayment.toLocaleString()} (${((params.downPayment/params.purchasePrice)*100).toFixed(1)}%)`);
        console.log(`  Monthly Rent: CHF ${params.monthlyRent.toLocaleString()}`);
        console.log(`  Mortgage Rate: ${params.mortgageRate}%`);
        console.log(`  Term: ${params.termYears} years`);
        console.log(`  Property Appreciation: ${params.propertyAppreciationRate}%`);
        console.log(`  Investment Yield: ${params.investmentYieldRate}%`);
        console.log('');

        // Run our calculator - convert percentages to decimals (calculator expects decimal form)
        const calculatorParams = {
            ...params,
            // Convert percentage rates from percentage to decimal form
            mortgageRate: params.mortgageRate / 100,  // 2% -> 0.02
            marginalTaxRate: params.marginalTaxRate / 100,  // 30% -> 0.30
            propertyAppreciationRate: params.propertyAppreciationRate / 100, // 1% -> 0.01
            investmentYieldRate: params.investmentYieldRate / 100 // 3% -> 0.03
        };
        
        const ourResult = SwissRentBuyCalculator.calculate(calculatorParams);
        
        // Compare results
        const moneylandResult = testCase.moneylandResult;
        
        console.log(`🔍 RESULTS COMPARISON:`);
        console.log('─'.repeat(50));
        console.log(`Decision:`)
        console.log(`  Our Calculator:    ${ourResult.Decision}`);
        console.log(`  Moneyland.ch:      ${moneylandResult.decision}`);
        
        const decisionMatch = ourResult.Decision === moneylandResult.decision;
        console.log(`  Decision Match:    ${decisionMatch ? '✅' : '❌'}`);
        
        console.log('');
        console.log(`Advantage Amount:`)
        console.log(`  Our Calculator:    CHF ${Math.abs(ourResult.ResultValue).toLocaleString()}`);
        console.log(`  Moneyland.ch:      CHF ${moneylandResult.advantage.toLocaleString()}`);
        
        const advantageDiff = Math.abs(Math.abs(ourResult.ResultValue) - moneylandResult.advantage);
        console.log(`  Difference:        CHF ${advantageDiff.toLocaleString()}`);
        
        const advantageMatch = advantageDiff <= this.tolerance;
        console.log(`  Advantage Match:   ${advantageMatch ? '✅' : '❌'} (tolerance: CHF ${this.tolerance.toLocaleString()})`);
        
        console.log('');
        console.log(`Total Costs (Our Calculator):`)
        console.log(`  Buy Total Cost:    CHF ${ourResult.TotalPurchaseCost.toLocaleString()}`);
        console.log(`  Rent Total Cost:   CHF ${ourResult.TotalRentalCost.toLocaleString()}`);
        
        console.log('');
        console.log(`Total Costs (Moneyland.ch):`)
        console.log(`  Buy Total Cost:    CHF ${moneylandResult.buyTotalCost.toLocaleString()}`);
        console.log(`  Rent Total Cost:   CHF ${moneylandResult.rentTotalCost.toLocaleString()}`);
        
        // Calculate cost differences
        const buyDiff = Math.abs(ourResult.TotalPurchaseCost - moneylandResult.buyTotalCost);
        const rentDiff = Math.abs(ourResult.TotalRentalCost - moneylandResult.rentTotalCost);
        
        console.log('');
        console.log(`Cost Differences:`)
        console.log(`  Buy Cost Diff:     CHF ${buyDiff.toLocaleString()}`);
        console.log(`  Rent Cost Diff:    CHF ${rentDiff.toLocaleString()}`);
        
        const buyMatch = buyDiff <= this.tolerance;
        const rentMatch = rentDiff <= this.tolerance;
        
        console.log(`  Buy Cost Match:    ${buyMatch ? '✅' : '❌'}`);
        console.log(`  Rent Cost Match:   ${rentMatch ? '✅' : '❌'}`);
        
        // Overall assessment
        const overallMatch = decisionMatch && advantageMatch && buyMatch && rentMatch;
        
        console.log('');
        console.log(`🎯 OVERALL ASSESSMENT: ${overallMatch ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (!overallMatch) {
            const issues = [];
            if (!decisionMatch) issues.push('Decision mismatch');
            if (!advantageMatch) issues.push('Advantage amount mismatch');
            if (!buyMatch) issues.push('Buy cost mismatch');
            if (!rentMatch) issues.push('Rent cost mismatch');
            console.log(`  Issues: ${issues.join(', ')}`);
        }
        
        return {
            testCase: testCase.testCase,
            description: testCase.description,
            ourResult,
            moneylandResult,
            decisionMatch,
            advantageMatch,
            buyMatch,
            rentMatch,
            overallMatch,
            differences: {
                advantage: advantageDiff,
                buyCost: buyDiff,
                rentCost: rentDiff
            }
        };
    }

    /**
     * Run all manual test cases
     */
    runAllTests() {
        console.log('🧪 MONEYLAND.CH MANUAL TEST CASES VALIDATION');
        console.log('='.repeat(80));
        console.log('Comparing manually collected moneyland.ch scenarios with our calculator');
        console.log('');
        
        this.loadTestCases();
        
        let totalTests = 0;
        let passedTests = 0;
        let decisionMatches = 0;
        let advantageMatches = 0;
        
        // Run each test case
        for (const testCase of this.testCases) {
            const result = this.runSingleTest(testCase);
            this.results.push(result);
            
            totalTests++;
            if (result.overallMatch) passedTests++;
            if (result.decisionMatch) decisionMatches++;
            if (result.advantageMatch) advantageMatches++;
        }
        
        // Summary
        console.log('\\n\\n📊 MANUAL TEST CASES SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Test Cases:     ${totalTests}`);
        console.log(`Overall Passed:       ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
        console.log(`Decision Matches:     ${decisionMatches} (${((decisionMatches/totalTests)*100).toFixed(1)}%)`);
        console.log(`Advantage Matches:    ${advantageMatches} (${((advantageMatches/totalTests)*100).toFixed(1)}%)`);
        console.log('');
        
        // Detailed accuracy analysis
        console.log('🎯 ACCURACY ANALYSIS:');
        console.log('─'.repeat(30));
        
        const advantageDiffs = this.results.map(r => r.differences.advantage);
        const avgAdvantageDiff = advantageDiffs.reduce((a, b) => a + b, 0) / advantageDiffs.length;
        const maxAdvantageDiff = Math.max(...advantageDiffs);
        
        console.log(`Average Advantage Diff: CHF ${avgAdvantageDiff.toLocaleString()}`);
        console.log(`Maximum Advantage Diff: CHF ${maxAdvantageDiff.toLocaleString()}`);
        console.log(`Tolerance Used:         CHF ${this.tolerance.toLocaleString()}`);
        console.log('');
        
        // Failed test details
        const failedTests = this.results.filter(r => !r.overallMatch);
        if (failedTests.length > 0) {
            console.log('❌ FAILED TESTS DETAILS:');
            console.log('─'.repeat(40));
            
            failedTests.forEach(test => {
                console.log(`🔸 Test Case ${test.testCase}: ${test.description}`);
                console.log(`   Decision: ${test.decisionMatch ? '✅' : '❌'} | Advantage: ${test.advantageMatch ? '✅' : '❌'} | Buy Cost: ${test.buyMatch ? '✅' : '❌'} | Rent Cost: ${test.rentMatch ? '✅' : '❌'}`);
                console.log(`   Advantage Diff: CHF ${test.differences.advantage.toLocaleString()}`);
                console.log('');
            });
        }
        
        // Overall assessment
        console.log('🏁 FINAL ASSESSMENT:');
        console.log('─'.repeat(30));
        
        const overallSuccess = passedTests === totalTests;
        const highAccuracy = decisionMatches === totalTests && advantageMatches >= totalTests * 0.8;
        
        if (overallSuccess) {
            console.log('🎉 ALL MANUAL TEST CASES PASSED!');
            console.log('✅ Our calculator perfectly matches moneyland.ch results');
            console.log('✅ All decisions and calculations are accurate');
        } else if (highAccuracy) {
            console.log('⚠️ HIGH ACCURACY WITH MINOR DIFFERENCES');
            console.log('✅ All decisions match moneyland.ch');
            console.log('✅ Most calculations are within tolerance');
            console.log('⚠️ Some minor discrepancies in cost calculations');
        } else {
            console.log('🚨 SIGNIFICANT DIFFERENCES DETECTED');
            console.log('❌ Calculator results differ significantly from moneyland.ch');
            console.log('🔧 Manual review and adjustments may be needed');
        }
        
        return {
            totalTests,
            passedTests,
            decisionMatches,
            advantageMatches,
            overallSuccess,
            highAccuracy,
            results: this.results
        };
    }
}

// Run if called directly
if (require.main === module) {
    const tester = new MoneylandManualTester();
    const results = tester.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.overallSuccess ? 0 : 1);
}

module.exports = { MoneylandManualTester };