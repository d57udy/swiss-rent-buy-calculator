/**
 * Backend Validation Test for Swiss Rent vs Buy Calculator
 * Tests calculation accuracy against static data example
 * 
 * This script validates our JavaScript calculations against all rows in output-002.csv
 * without requiring browser/UI testing - pure backend mathematical validation.
 */

const fs = require('fs');
const path = require('path');

// Import our calculator (we'll need to make it Node.js compatible)
class SwissRentBuyCalculatorNode {
    static calculate(params) {
        const {
            purchasePrice,
            downPayment,
            mortgageRate,
            monthlyRent,
            propertyAppreciationRate,
            investmentYieldRate,
            marginalTaxRate,
            termYears,
            annualMaintenanceCosts,
            amortizationYears,
            annualAmortization,
            totalRenovations,
            additionalPurchaseCosts,
            imputedRentalValue,
            propertyTaxDeductions,
            annualRentalCosts
        } = params;

        // Calculate mortgage amount
        const mortgageAmount = purchasePrice - downPayment;

        // Calculate interest costs using declining balance method
        let totalInterestPaid = 0;
        let remainingBalance = mortgageAmount;
        
        for (let year = 0; year < termYears; year++) {
            const annualInterest = remainingBalance * mortgageRate;
            totalInterestPaid += annualInterest;
            remainingBalance -= annualAmortization;
            if (remainingBalance < 0) remainingBalance = 0;
        }

        const interestCosts = totalInterestPaid;

        // Maintenance costs over the term
        const supplementalMaintenanceCosts = annualMaintenanceCosts * termYears;

        // Amortization costs over the term
        const amortizationCosts = annualAmortization * termYears;

        // Renovation and additional purchase expenses
        const renovationExpenses = totalRenovations;
        const additionalPurchaseExpensesOutput = additionalPurchaseCosts;

        // General cost of purchase
        const generalCostOfPurchase = (
            interestCosts + 
            supplementalMaintenanceCosts + 
            amortizationCosts + 
            renovationExpenses + 
            additionalPurchaseExpensesOutput
        );
        // ML-style aggregates (diagnostics)
        const purchaseCostsWithinObservationPeriod = (
            interestCosts +
            supplementalMaintenanceCosts +
            amortizationCosts +
            renovationExpenses +
            additionalPurchaseExpensesOutput
        );

        // Property value at end of term with appreciation
        const propertyValueEnd = purchasePrice * Math.pow(1 + propertyAppreciationRate, termYears);

        // Remaining mortgage at end of term
        const mortgageAtEnd = Math.max(0, mortgageAmount - amortizationCosts);

        // Tax difference calculation
        let totalTaxDifference = 0;
        let remainingMortgage = mortgageAmount;
        
        // Investment income tax calculation
        const investableAmount = downPayment + additionalPurchaseCosts;
        
        // Simple interest over term
        const simpleInterestTotal = investableAmount * investmentYieldRate * termYears;
        
        // Compound interest over term  
        const compoundInterestTotal = investableAmount * (Math.pow(1 + investmentYieldRate, termYears) - 1);
        
        // Tax on simple interest
        const simpleInterestTaxTotal = simpleInterestTotal * marginalTaxRate;
        
        // Tax on compound interest gains
        const compoundInterestGains = compoundInterestTotal - simpleInterestTotal;
        const compoundInterestGainsTax = compoundInterestGains * marginalTaxRate;
        
        // Total investment income tax
        const totalInvestmentIncomeTax = simpleInterestTaxTotal + compoundInterestGainsTax;
        const annualInvestmentIncomeTax = totalInvestmentIncomeTax / termYears;

        for (let year = 0; year < termYears; year++) {
            // Annual interest payment (tax deductible)
            const annualInterest = remainingMortgage * mortgageRate;
            const annualTaxSavingsInterest = annualInterest * marginalTaxRate;
            
            // Imputed rental value (taxable)
            const annualTaxCostImputedRental = imputedRentalValue * marginalTaxRate;
            
            // Property expenses (tax deductible)
            const annualTaxSavingsPropertyExpenses = propertyTaxDeductions * marginalTaxRate;
            
            // Net annual tax difference
            const annualNetTaxDifference = (
                annualTaxCostImputedRental - 
                annualTaxSavingsInterest - 
                annualTaxSavingsPropertyExpenses -
                annualInvestmentIncomeTax
            );
            
            totalTaxDifference += annualNetTaxDifference;
            
            // Reduce mortgage balance for next year
            remainingMortgage -= annualAmortization;
            if (remainingMortgage < 0) remainingMortgage = 0;
        }

        const taxDifferenceToRental = totalTaxDifference;

        // Total purchase cost calculation
        const totalPurchaseCost = (
            generalCostOfPurchase +
            taxDifferenceToRental -
            propertyValueEnd +
            mortgageAtEnd
        );

        // RENTAL SCENARIO CALCULATIONS
        const generalCostOfRental = (monthlyRent * 12 * termYears) + (annualRentalCosts * termYears);
        const rentalCostsWithinObservationPeriod = generalCostOfRental;
        
        // Investment yields on down payment and additional costs
        const yieldsOnAssets = investableAmount * (Math.pow(1 + investmentYieldRate, termYears) - 1);
        
        // Total rental cost
        const totalRentalCost = generalCostOfRental - yieldsOnAssets - downPayment;

        // Final comparison
        const resultValue = totalRentalCost - totalPurchaseCost;
        
        let decision;
        let compareText;
        
        if (resultValue > 0) {
            decision = "BUY";
            compareText = `Buying your home will work out CHF ${Math.abs(resultValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} cheaper than renting over the relevant time frame.`;
        } else if (resultValue < 0) {
            decision = "RENT";
            compareText = `Renting is CHF ${Math.abs(resultValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} cheaper than buying over the relevant time frame.`;
        } else {
            decision = "EVEN";
            compareText = "Buying and renting have the same cost over the relevant time frame.";
        }

        return {
            // Input parameters
            PurchasePrice: Math.round(purchasePrice),
            PurchasePriceM: Math.round(purchasePrice / 1000000 * 10) / 10,
            DownPayment: Math.round(downPayment),
            MortgageInterestRatePercent: mortgageRate * 100,
            AnnualSupplementalMaintenanceCosts: Math.round(annualMaintenanceCosts),
            AmortizationPeriodYears: Math.round(amortizationYears),
            AnnualAmortizationAmount: Math.round(annualAmortization),
            TotalRenovations: Math.round(totalRenovations),
            AdditionalPurchaseExpenses: Math.round(additionalPurchaseCosts),
            ImputedRentalValue: Math.round(imputedRentalValue),
            PropertyExpenseTaxDeductions: Math.round(propertyTaxDeductions),
            MarginalTaxRatePercent: Math.round(marginalTaxRate * 100),
            AnnualPropertyValueIncreasePercent: propertyAppreciationRate * 100,
            MonthlyRentDue: Math.round(monthlyRent),
            AnnualSupplementalCostsRent: Math.round(annualRentalCosts),
            InvestmentYieldRatePercent: investmentYieldRate * 100,
            TermYears: Math.round(termYears),
            
            // Main results
            CompareText: compareText,
            ResultValue: resultValue,
            Decision: decision,
            
            // Purchase cost breakdown
            InterestCosts: interestCosts,
            SupplementalMaintenanceCosts: supplementalMaintenanceCosts,
            AmortizationCosts: amortizationCosts,
            RenovationExpenses: renovationExpenses,
            AdditionalPurchaseExpensesOutput: additionalPurchaseExpensesOutput,
            GeneralCostOfPurchase: generalCostOfPurchase,
            TaxDifferenceToRental: taxDifferenceToRental,
            MinusPropertyValue: -propertyValueEnd,
            MortgageAtEndOfRelevantTimePeriod: mortgageAtEnd,
            TotalPurchaseCost: totalPurchaseCost,
            PurchaseCostsWithinObservationPeriod: purchaseCostsWithinObservationPeriod,
            
            // Rental cost breakdown
            GeneralCostOfRental: generalCostOfRental,
            ExcludingYieldsOnAssets: -yieldsOnAssets,
            ExcludingDownPayment: -downPayment,
            TotalRentalCost: totalRentalCost,
            RentalCostsWithinObservationPeriod: rentalCostsWithinObservationPeriod,
            
            // Metadata
            MortgageAmount: Math.round(mortgageAmount),
            ErrorMsg: null
        };
    }
}

function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function loadCsvData(filePath) {
    try {
        const csvContent = fs.readFileSync(filePath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = parseCsvLine(lines[0]);
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCsvLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    const value = values[index];
                    // Try to parse as number, fallback to string
                    if (value === '' || value === 'null') {
                        row[header] = null;
                    } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
                        row[header] = parseFloat(value);
                    } else {
                        row[header] = value;
                    }
                });
                data.push(row);
            }
        }
        
        return data;
    } catch (error) {
        console.error('Error loading CSV data:', error.message);
        throw error;
    }
}

function validateCalculation(ourResult, moneylandResult, tolerance = 0.01) {
    const validationResults = {
        passed: true,
        errors: [],
        metrics: {}
    };

    // Key fields to validate
    const fieldsToValidate = [
        'ResultValue',
        'Decision',
        'InterestCosts',
        'TotalPurchaseCost',
        'TotalRentalCost',
        'TaxDifferenceToRental'
    ];

    fieldsToValidate.forEach(field => {
        const ourValue = ourResult[field];
        const moneylandValue = moneylandResult[field];

        if (field === 'Decision') {
            // Exact match required for decision
            if (ourValue !== moneylandValue) {
                validationResults.passed = false;
                validationResults.errors.push(`Decision mismatch: ${ourValue} vs ${moneylandValue}`);
            }
            validationResults.metrics[field] = { match: ourValue === moneylandValue };
        } else if (typeof ourValue === 'number' && typeof moneylandValue === 'number') {
            // Numerical comparison with tolerance
            const difference = Math.abs(ourValue - moneylandValue);
            const relativeDifference = moneylandValue !== 0 ? difference / Math.abs(moneylandValue) : 0;
            
            if (relativeDifference > tolerance) {
                validationResults.passed = false;
                validationResults.errors.push(
                    `${field} outside tolerance: ${ourValue.toFixed(2)} vs ${moneylandValue.toFixed(2)} ` +
                    `(diff: ${difference.toFixed(2)}, ${(relativeDifference * 100).toFixed(3)}%)`
                );
            }
            
            validationResults.metrics[field] = {
                ourValue,
                moneylandValue,
                difference,
                relativeDifference,
                withinTolerance: relativeDifference <= tolerance
            };
        }
    });

    return validationResults;
}

function runBackendValidation() {
    console.log('🧮 Swiss Rent vs Buy Calculator - Backend Validation Test');
    console.log('=' .repeat(60));
    
    try {
        // Load the CSV data
        const csvPath = path.join(__dirname, 'output-002.csv');
        console.log(`📂 Loading test data from: ${csvPath}`);
        
        const testData = loadCsvData(csvPath);
        console.log(`✅ Loaded ${testData.length} test cases from moneyland.ch data`);
        console.log('');

        // Validation statistics
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        const detailedResults = [];
        const errorSummary = {};

        // Test each row
        console.log('🔍 Running validation tests...');
        console.log('');

        testData.forEach((row, index) => {
            // Validate all test cases

            totalTests++;
            
            try {
                // Prepare parameters for our calculator
                const params = {
                    purchasePrice: row.PurchasePrice,
                    downPayment: row.DownPayment,
                    mortgageRate: row.MortgageInterestRatePercent / 100,
                    monthlyRent: row.MonthlyRentDue,
                    propertyAppreciationRate: row.AnnualPropertyValueIncreasePercent / 100,
                    investmentYieldRate: row.InvestmentYieldRatePercent / 100,
                    marginalTaxRate: row.MarginalTaxRatePercent / 100,
                    termYears: row.TermYears,
                    annualMaintenanceCosts: row.AnnualSupplementalMaintenanceCosts,
                    amortizationYears: row.AmortizationPeriodYears,
                    annualAmortization: row.AnnualAmortizationAmount,
                    totalRenovations: row.TotalRenovations,
                    additionalPurchaseCosts: row.AdditionalPurchaseExpenses,
                    imputedRentalValue: row.ImputedRentalValue,
                    propertyTaxDeductions: row.PropertyExpenseTaxDeductions,
                    annualRentalCosts: row.AnnualSupplementalCostsRent
                };

                // Run our calculation
                const ourResult = SwissRentBuyCalculatorNode.calculate(params);

                // Validate against moneyland.ch result
                const validation = validateCalculation(ourResult, row, 0.01); // 1% tolerance

                if (validation.passed) {
                    passedTests++;
                    if (totalTests <= 10) { // Show first 10 detailed results
                        console.log(`✅ Test ${totalTests}: PASSED`);
                        console.log(`   Parameters: CHF ${row.PurchasePrice.toLocaleString()}, ${row.MortgageInterestRatePercent}% mortgage, ${row.InvestmentYieldRatePercent}% yield`);
                        console.log(`   Result: ${ourResult.Decision} ${ourResult.ResultValue > 0 ? '+' : ''}CHF ${Math.round(ourResult.ResultValue).toLocaleString()}`);
                        console.log(`   vs ML:  ${row.Decision} ${row.ResultValue > 0 ? '+' : ''}CHF ${Math.round(row.ResultValue).toLocaleString()}`);
                        console.log('');
                    } else if (totalTests % 1000 === 0) {
                        console.log(`✅ Progress: ${totalTests} tests completed (${passedTests} passed, ${failedTests} failed)`);
                    }
                } else {
                    failedTests++;
                    console.log(`❌ Test ${totalTests}: FAILED`);
                    console.log(`   Parameters: CHF ${row.PurchasePrice.toLocaleString()}, ${row.MortgageInterestRatePercent}% mortgage, ${row.InvestmentYieldRatePercent}% yield`);
                    validation.errors.forEach(error => {
                        console.log(`   Error: ${error}`);
                        const errorType = error.split(':')[0];
                        errorSummary[errorType] = (errorSummary[errorType] || 0) + 1;
                    });
                    console.log('');
                }

                detailedResults.push({
                    testNumber: totalTests,
                    passed: validation.passed,
                    params: params,
                    ourResult: ourResult,
                    moneylandResult: row,
                    validation: validation
                });

            } catch (error) {
                failedTests++;
                console.log(`💥 Test ${totalTests}: ERROR - ${error.message}`);
                console.log('');
            }
        });

        // Summary statistics
        console.log('📊 VALIDATION SUMMARY');
        console.log('=' .repeat(40));
        console.log(`Total Tests:     ${totalTests}`);
        console.log(`Passed Tests:    ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
        console.log(`Failed Tests:    ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
        console.log('');

        if (failedTests > 0) {
            console.log('❌ ERROR BREAKDOWN:');
            Object.entries(errorSummary).forEach(([errorType, count]) => {
                console.log(`   ${errorType}: ${count} occurrences`);
            });
            console.log('');
        }

        // Accuracy analysis for passed tests
        if (passedTests > 0) {
            console.log('🎯 ACCURACY ANALYSIS (Passed Tests):');
            const accuracyMetrics = detailedResults
                .filter(r => r.passed)
                .map(r => r.validation.metrics.ResultValue)
                .filter(m => m && typeof m.difference === 'number');

            if (accuracyMetrics.length > 0) {
                const avgDifference = accuracyMetrics.reduce((sum, m) => sum + m.difference, 0) / accuracyMetrics.length;
                const maxDifference = Math.max(...accuracyMetrics.map(m => m.difference));
                const avgRelativeDiff = accuracyMetrics.reduce((sum, m) => sum + m.relativeDifference, 0) / accuracyMetrics.length;

                console.log(`   Average Absolute Error: CHF ${avgDifference.toFixed(2)}`);
                console.log(`   Maximum Absolute Error: CHF ${maxDifference.toFixed(2)}`);
                console.log(`   Average Relative Error: ${(avgRelativeDiff * 100).toFixed(4)}%`);
                console.log(`   Accuracy: ${((1 - avgRelativeDiff) * 100).toFixed(4)}%`);
            }
        }

        console.log('');
        console.log(passedTests === totalTests ? '🎉 ALL TESTS PASSED! 🎉' : '⚠️  SOME TESTS FAILED');
        
        // Additional test: Auto-calculation validation
        console.log('');
        console.log('🔧 ADDITIONAL TEST: AUTO-CALCULATION VALIDATION');
        console.log('─'.repeat(60));
        
        try {
            const { CompleteAutoCalculationTestSuite } = require('./test-complete-auto-calculations.js');
            const autoCalcSuccess = CompleteAutoCalculationTestSuite.runQuickValidation();
            
            if (autoCalcSuccess) {
                console.log('✅ Auto-calculation systems validated successfully');
                console.log('✅ Parameter sweeps and max-bid calculations will work correctly');
            } else {
                console.log('❌ Auto-calculation validation failed');
            }
        } catch (error) {
            console.log('❌ Auto-calculation test error:', error.message);
        }
        
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: passedTests / totalTests,
            detailedResults
        };

    } catch (error) {
        console.error('💥 Backend validation failed:', error);
        throw error;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SwissRentBuyCalculatorNode,
        runBackendValidation,
        loadCsvData,
        validateCalculation
    };
}

// Run if called directly
if (require.main === module) {
    runBackendValidation();
}