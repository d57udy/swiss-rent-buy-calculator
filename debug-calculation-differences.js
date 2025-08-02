/**
 * Debug Calculation Differences
 * Deep dive analysis to identify sources of differences between moneyland.ch and our calculator
 */

const fs = require('fs');
const path = require('path');
const SwissRentBuyCalculator = require('./calculator.js');

class CalculationDebugger {
    constructor() {
        this.testCases = [];
    }

    loadTestCases() {
        const testFilePath = path.join(__dirname, 'moneyland-manual-test-cases.json');
        const rawData = fs.readFileSync(testFilePath, 'utf8');
        this.testCases = JSON.parse(rawData);
    }

    debugSingleCase(testCaseNum) {
        const testCase = this.testCases.find(tc => tc.testCase === testCaseNum);
        if (!testCase) {
            console.error(`Test case ${testCaseNum} not found`);
            return;
        }

        console.log(`🔍 DEBUGGING TEST CASE ${testCaseNum}: ${testCase.description}`);
        console.log('='.repeat(80));
        
        const params = testCase.params;
        console.log('📊 INPUT PARAMETERS:');
        console.log(`  Purchase Price: CHF ${params.purchasePrice.toLocaleString()}`);
        console.log(`  Down Payment: CHF ${params.downPayment.toLocaleString()}`);
        console.log(`  Mortgage Rate: ${params.mortgageRate}%`);
        console.log(`  Monthly Rent: CHF ${params.monthlyRent.toLocaleString()}`);
        console.log(`  Term: ${params.termYears} years`);
        console.log(`  Amortization Years: ${params.amortizationYears} years`);
        console.log(`  Annual Amortization: CHF ${params.annualAmortization.toLocaleString()}`);
        console.log(`  Property Appreciation: ${params.propertyAppreciationRate}%`);
        console.log(`  Investment Yield: ${params.investmentYieldRate}%`);
        console.log(`  Marginal Tax Rate: ${params.marginalTaxRate}%`);
        console.log('');

        // Convert parameters for our calculator
        const calculatorParams = {
            ...params,
            mortgageRate: params.mortgageRate / 100,
            marginalTaxRate: params.marginalTaxRate / 100,
            propertyAppreciationRate: params.propertyAppreciationRate / 100,
            investmentYieldRate: params.investmentYieldRate / 100
        };

        // Run our calculator
        const result = SwissRentBuyCalculator.calculate(calculatorParams);
        
        console.log('🔧 CALCULATION BREAKDOWN:');
        console.log('─'.repeat(50));
        
        // Key calculated values from our calculator
        const mortgageAmount = params.purchasePrice - params.downPayment;
        console.log(`Mortgage Amount: CHF ${mortgageAmount.toLocaleString()}`);
        console.log(`Monthly Interest Rate: ${(params.mortgageRate/100/12*100).toFixed(4)}%`);
        console.log(`Monthly Amortization: CHF ${(params.annualAmortization/12).toLocaleString()}`);
        console.log('');

        // Compare BUY costs breakdown
        console.log('💰 BUY COSTS COMPARISON:');
        console.log('─'.repeat(40));
        console.log('Our Calculator:');
        console.log(`  Interest Costs: CHF ${result.InterestCosts.toLocaleString()}`);
        console.log(`  Maintenance Costs: CHF ${result.SupplementalMaintenanceCosts.toLocaleString()}`);
        console.log(`  Amortization: CHF ${result.AmortizationCosts.toLocaleString()}`);
        console.log(`  Renovation: CHF ${result.RenovationExpenses.toLocaleString()}`);
        console.log(`  Additional Purchase: CHF ${result.AdditionalPurchaseExpensesOutput.toLocaleString()}`);
        console.log(`  General Cost of Purchase: CHF ${result.GeneralCostOfPurchase.toLocaleString()}`);
        console.log(`  Tax Difference: CHF ${result.TaxDifferenceToRental.toLocaleString()}`);
        console.log(`  Property Value (end): CHF ${(-result.MinusPropertyValue).toLocaleString()}`);
        console.log(`  Remaining Mortgage: CHF ${result.MortgageAtEndOfRelevantTimePeriod.toLocaleString()}`);
        console.log(`  TOTAL BUY COST: CHF ${result.TotalPurchaseCost.toLocaleString()}`);
        console.log('');

        console.log('Moneyland.ch (from breakdown):');
        console.log(`  Interest Costs: CHF 181,500.00`);
        console.log(`  Maintenance Costs: CHF 210,000.00`);
        console.log(`  Amortization: CHF 1,650,000.00`);
        console.log(`  Renovation: CHF 200,000.00`);
        console.log(`  Additional Purchase: CHF 1,000.00`);
        console.log(`  General Cost of Purchase: CHF 2,242,500.00`);
        console.log(`  Tax Difference: CHF -11,281.90`);
        console.log(`  Property Value (end): CHF 2,319,706.45`);
        console.log(`  Remaining Mortgage: CHF 0`);
        console.log(`  TOTAL BUY COST: CHF -88,488.35`);
        console.log('');

        // Compare RENT costs breakdown
        console.log('🏠 RENT COSTS COMPARISON:');
        console.log('─'.repeat(40));
        console.log('Our Calculator:');
        console.log(`  General Cost of Rental: CHF ${result.GeneralCostOfRental.toLocaleString()}`);
        console.log(`  Investment Yields: CHF ${result.ExcludingYieldsOnAssets.toLocaleString()}`);
        console.log(`  Down Payment Opportunity: CHF ${result.ExcludingDownPayment.toLocaleString()}`);
        console.log(`  TOTAL RENT COST: CHF ${result.TotalRentalCost.toLocaleString()}`);
        console.log('');

        console.log('Moneyland.ch (from breakdown):');
        console.log(`  General Cost of Rental: CHF 860,000.00`);
        console.log(`  Investment Yields: CHF -155,106.30`);
        console.log(`  Down Payment Opportunity: CHF -450,000.00`);
        console.log(`  TOTAL RENT COST: CHF 254,893.70`);
        console.log('');

        // Identify major differences
        console.log('🚨 MAJOR DIFFERENCES IDENTIFIED:');
        console.log('─'.repeat(50));
        
        // Check if major calculation differences exist
        const interestDiff = Math.abs(result.InterestCosts - 181500);
        const maintenanceDiff = Math.abs(result.SupplementalMaintenanceCosts - 210000);
        const amortizationDiff = Math.abs(result.AmortizationCosts - 1650000);
        const rentalCostDiff = Math.abs(result.GeneralCostOfRental - 860000);
        const investmentYieldDiff = Math.abs(result.ExcludingYieldsOnAssets - (-155106.30));

        if (interestDiff > 1000) {
            console.log(`❌ Interest Costs: CHF ${interestDiff.toLocaleString()} difference`);
        }
        if (maintenanceDiff > 1000) {
            console.log(`❌ Maintenance Costs: CHF ${maintenanceDiff.toLocaleString()} difference`);
        }
        if (amortizationDiff > 1000) {
            console.log(`❌ Amortization: CHF ${amortizationDiff.toLocaleString()} difference`);
        }
        if (rentalCostDiff > 1000) {
            console.log(`❌ Rental Costs: CHF ${rentalCostDiff.toLocaleString()} difference`);
        }
        if (investmentYieldDiff > 1000) {
            console.log(`❌ Investment Yields: CHF ${investmentYieldDiff.toLocaleString()} difference`);
        }

        console.log('');
        console.log('🎯 FINAL COMPARISON:');
        console.log(`Our Result: BUY advantage CHF ${Math.abs(result.ResultValue).toLocaleString()}`);
        console.log(`Moneyland: BUY advantage CHF ${testCase.moneylandResult.advantage.toLocaleString()}`);
        console.log(`Difference: CHF ${Math.abs(Math.abs(result.ResultValue) - testCase.moneylandResult.advantage).toLocaleString()}`);

        return {
            testCase: testCaseNum,
            ourResult: result,
            moneylandResult: testCase.moneylandResult,
            differences: {
                interest: interestDiff,
                maintenance: maintenanceDiff,
                amortization: amortizationDiff,
                rental: rentalCostDiff,
                investmentYield: investmentYieldDiff
            }
        };
    }

    debugAllCases() {
        console.log('🔍 DEBUGGING ALL TEST CASES - FINDING SOURCES OF DIFFERENCES');
        console.log('='.repeat(80));
        
        this.loadTestCases();
        
        for (let i = 1; i <= 5; i++) {
            console.log(`\n${'='.repeat(20)} TEST CASE ${i} ${'='.repeat(20)}`);
            this.debugSingleCase(i);
        }
    }
}

// Run debugging
if (require.main === module) {
    const analyzer = new CalculationDebugger();
    
    // Debug specific case or all cases
    const caseToDebug = process.argv[2];
    if (caseToDebug && !isNaN(caseToDebug)) {
        analyzer.loadTestCases();
        analyzer.debugSingleCase(parseInt(caseToDebug));
    } else {
        analyzer.debugAllCases();
    }
}

module.exports = { CalculationDebugger };