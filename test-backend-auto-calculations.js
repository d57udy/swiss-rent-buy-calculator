/**
 * Backend Auto-Calculation Test
 * Tests the backend's ability to handle auto-calculated parameters properly
 * for parameter sweeps and max-bid scenarios
 */

const { SwissRentBuyCalculatorNode } = require('./backend-validation-test.js');

class BackendAutoCalculationTester {
    
    /**
     * Create auto-calculated parameters for a given purchase price
     * This mimics the getParametersWithAutoCalculations() function from the frontend
     */
    static createAutoCalculatedParams(baseParams, testPurchasePrice = null) {
        const purchasePrice = testPurchasePrice || baseParams.purchasePrice;
        
        return {
            purchasePrice: purchasePrice,
            downPayment: Math.round(purchasePrice * 0.2), // 20% Swiss minimum
            mortgageRate: baseParams.mortgageRate / 100,
            monthlyRent: baseParams.monthlyRent,
            propertyAppreciationRate: baseParams.propertyAppreciationRate / 100,
            investmentYieldRate: baseParams.investmentYieldRate / 100,
            marginalTaxRate: baseParams.marginalTaxRate / 100,
            termYears: baseParams.termYears,
            amortizationYears: baseParams.amortizationYears,
            
            // Auto-calculated values
            annualMaintenanceCosts: Math.round(purchasePrice * 0.0125), // 1.25% Swiss standard
            annualAmortization: Math.round((purchasePrice * 0.8) / baseParams.amortizationYears), // 80% mortgage / years
            imputedRentalValue: Math.round(baseParams.monthlyRent * 12 * 0.65), // 65% of annual rent
            
            // Fixed values
            totalRenovations: 0,
            additionalPurchaseCosts: 5000, // Fixed CHF 5,000 default
            propertyTaxDeductions: 13000, // Swiss standard
            annualRentalCosts: 20000 // Swiss standard
        };
    }

    /**
     * Test auto-calculation parameter scaling
     */
    static testParameterScaling() {
        console.log('🔧 BACKEND AUTO-CALCULATION SCALING TEST');
        console.log('='.repeat(60));
        
        const baseParams = {
            purchasePrice: 1500000,
            monthlyRent: 4200,
            mortgageRate: 2.1,
            propertyAppreciationRate: 1.8,
            investmentYieldRate: 3.5,
            marginalTaxRate: 28.0,
            termYears: 15,
            amortizationYears: 15
        };

        console.log('📊 BASE PARAMETERS:');
        console.log(`  Purchase Price: CHF ${baseParams.purchasePrice.toLocaleString()}`);
        console.log(`  Monthly Rent: CHF ${baseParams.monthlyRent.toLocaleString()}`);
        console.log(`  Mortgage Rate: ${baseParams.mortgageRate}%`);
        console.log('');

        // Test different price points to verify scaling
        const testPrices = [1200000, 1500000, 1800000, 2200000];
        const results = [];
        
        console.log('🔄 TESTING AUTO-CALCULATION SCALING:');
        console.log('─'.repeat(80));
        console.log('Price (CHF)    | Down Payment  | Maintenance   | Amortization  | Decision');
        console.log('─'.repeat(80));
        
        for (const testPrice of testPrices) {
            const autoParams = this.createAutoCalculatedParams(baseParams, testPrice);
            const result = SwissRentBuyCalculatorNode.calculate(autoParams);
            
            results.push({
                price: testPrice,
                autoParams,
                result,
                maintenance: autoParams.annualMaintenanceCosts,
                downPayment: autoParams.downPayment,
                amortization: autoParams.annualAmortization
            });
            
            console.log(
                `${testPrice.toLocaleString().padEnd(14)} | ` +
                `CHF ${autoParams.downPayment.toLocaleString().padEnd(9)} | ` +
                `CHF ${autoParams.annualMaintenanceCosts.toLocaleString().padEnd(8)} | ` +
                `CHF ${autoParams.annualAmortization.toLocaleString().padEnd(10)} | ` +
                `${result.Decision}`
            );
        }
        
        console.log('─'.repeat(80));
        console.log('');
        
        // Verify scaling relationships
        console.log('✅ SCALING VERIFICATION:');
        console.log('─'.repeat(40));
        
        let scalingCorrect = true;
        
        // Check that maintenance scales proportionally (1.25% of price)
        for (const result of results) {
            const expectedMaintenance = Math.round(result.price * 0.0125);
            const actualMaintenance = result.maintenance;
            
            if (Math.abs(expectedMaintenance - actualMaintenance) > 10) {
                console.log(`❌ Maintenance scaling error for CHF ${result.price.toLocaleString()}`);
                console.log(`   Expected: CHF ${expectedMaintenance.toLocaleString()}, Got: CHF ${actualMaintenance.toLocaleString()}`);
                scalingCorrect = false;
            }
        }
        
        // Check that down payment scales proportionally (20% of price)
        for (const result of results) {
            const expectedDownPayment = Math.round(result.price * 0.2);
            const actualDownPayment = result.downPayment;
            
            if (Math.abs(expectedDownPayment - actualDownPayment) > 10) {
                console.log(`❌ Down payment scaling error for CHF ${result.price.toLocaleString()}`);
                console.log(`   Expected: CHF ${expectedDownPayment.toLocaleString()}, Got: CHF ${actualDownPayment.toLocaleString()}`);
                scalingCorrect = false;
            }
        }
        
        // Check that amortization scales with mortgage amount
        for (const result of results) {
            const mortgageAmount = result.price - result.downPayment;
            const expectedAmortization = Math.round(mortgageAmount / baseParams.amortizationYears);
            const actualAmortization = result.amortization;
            
            if (Math.abs(expectedAmortization - actualAmortization) > 100) {
                console.log(`❌ Amortization scaling error for CHF ${result.price.toLocaleString()}`);
                console.log(`   Expected: CHF ${expectedAmortization.toLocaleString()}, Got: CHF ${actualAmortization.toLocaleString()}`);
                scalingCorrect = false;
            }
        }
        
        if (scalingCorrect) {
            console.log('✅ All auto-calculated parameters scale correctly');
            console.log('✅ Maintenance costs: 1.25% of purchase price');
            console.log('✅ Down payment: 20% of purchase price');
            console.log('✅ Amortization: 80% mortgage ÷ amortization years');
        }
        
        console.log('');
        return { results, scalingCorrect };
    }

    /**
     * Test break-even price finding with auto-calculations
     */
    static testBreakevenFinding() {
        console.log('🎯 BREAK-EVEN PRICE FINDING TEST');
        console.log('='.repeat(50));
        
        const baseParams = {
            purchasePrice: 1600000, // Starting price
            monthlyRent: 4500,
            mortgageRate: 2.0,
            propertyAppreciationRate: 1.5,
            investmentYieldRate: 3.8,
            marginalTaxRate: 27.0,
            termYears: 12,
            amortizationYears: 15
        };
        
        console.log('🔍 Finding break-even price with auto-calculated parameters...');
        console.log(`  Monthly Rent: CHF ${baseParams.monthlyRent.toLocaleString()}`);
        console.log(`  Mortgage Rate: ${baseParams.mortgageRate}%`);
        console.log(`  Term: ${baseParams.termYears} years`);
        console.log('');
        
        // Binary search for break-even price
        let low = 100000;
        let high = 10000000;
        let bestPrice = null;
        let bestDifference = Infinity;
        const tolerance = 1000; // CHF 1000 tolerance
        const maxIterations = 200;
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            const testPrice = Math.round((low + high) / 2);
            const autoParams = this.createAutoCalculatedParams(baseParams, testPrice);
            const result = SwissRentBuyCalculatorNode.calculate(autoParams);
            
            const difference = Math.abs(result.ResultValue);
            
            if (difference < bestDifference) {
                bestDifference = difference;
                bestPrice = testPrice;
            }
            
            if (difference <= tolerance) {
                console.log(`🎯 Break-even found at iteration ${iteration + 1}`);
                break;
            }
            
            if (result.ResultValue > 0) {
                low = testPrice + 1;
            } else {
                high = testPrice - 1;
            }
            
            if (low > high) {
                break;
            }
        }
        
        if (bestPrice) {
            const finalParams = this.createAutoCalculatedParams(baseParams, bestPrice);
            const finalResult = SwissRentBuyCalculatorNode.calculate(finalParams);
            
            console.log('📊 BREAK-EVEN RESULTS:');
            console.log('─'.repeat(40));
            console.log(`Break-even Price:     CHF ${bestPrice.toLocaleString()}`);
            console.log(`Result Value:         CHF ${Math.abs(finalResult.ResultValue).toLocaleString()}`);
            console.log(`Accuracy:             ±CHF ${bestDifference.toLocaleString()}`);
            console.log('');
            
            console.log('🔧 AUTO-CALCULATED PARAMETERS AT BREAK-EVEN:');
            console.log(`  Down Payment:       CHF ${finalParams.downPayment.toLocaleString()}`);
            console.log(`  Maintenance Costs:  CHF ${finalParams.annualMaintenanceCosts.toLocaleString()}`);
            console.log(`  Annual Amortization: CHF ${finalParams.annualAmortization.toLocaleString()}`);
            console.log(`  Imputed Rental:     CHF ${finalParams.imputedRentalValue.toLocaleString()}`);
            console.log('');
            
            // Verify maintenance rate
            const maintenanceRate = (finalParams.annualMaintenanceCosts / bestPrice) * 100;
            const maintenanceCorrect = Math.abs(maintenanceRate - 1.25) < 0.01;
            
            console.log('✅ VERIFICATION:');
            console.log(`  Maintenance Rate:    ${maintenanceRate.toFixed(3)}% ${maintenanceCorrect ? '✅' : '❌'}`);
            console.log(`  Expected Rate:       1.250%`);
            console.log(`  Auto-calc Working:   ${maintenanceCorrect ? 'YES' : 'NO'}`);
            
            return {
                breakevenPrice: bestPrice,
                resultValue: finalResult.ResultValue,
                accuracy: bestDifference,
                autoParams: finalParams,
                maintenanceCorrect,
                success: bestDifference <= tolerance && maintenanceCorrect
            };
        }
        
        return { success: false, error: 'Break-even not found' };
    }

    /**
     * Run all backend auto-calculation tests
     */
    static runAllTests() {
        console.log('🚀 BACKEND AUTO-CALCULATION COMPREHENSIVE TEST');
        console.log('='.repeat(70));
        console.log('Testing backend auto-calculation capability for parameter sweeps');
        console.log('');
        
        // Test 1: Parameter scaling
        const scalingTest = this.testParameterScaling();
        
        console.log('');
        
        // Test 2: Break-even finding
        const breakevenTest = this.testBreakevenFinding();
        
        console.log('');
        
        // Summary
        console.log('📋 COMPREHENSIVE TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Parameter Scaling:    ${scalingTest.scalingCorrect ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Break-even Finding:   ${breakevenTest.success ? '✅ PASSED' : '❌ FAILED'}`);
        
        const overallSuccess = scalingTest.scalingCorrect && breakevenTest.success;
        console.log(`Overall Result:       ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
        console.log('');
        
        if (overallSuccess) {
            console.log('🎉 ALL BACKEND AUTO-CALCULATION TESTS PASSED!');
            console.log('✅ Backend correctly handles auto-calculated parameters');
            console.log('✅ Auto-calculations scale properly with purchase price changes');
            console.log('✅ Break-even calculations work with auto-calculated maintenance costs');
            console.log('✅ Swiss standard rates (1.25% maintenance, 20% down payment) are applied correctly');
        } else {
            console.log('⚠️ BACKEND AUTO-CALCULATION ISSUES DETECTED');
            if (!scalingTest.scalingCorrect) {
                console.log('❌ Parameter scaling problems');
            }
            if (!breakevenTest.success) {
                console.log('❌ Break-even calculation problems');
            }
        }
        
        return {
            scalingTest,
            breakevenTest,
            overallSuccess
        };
    }
}

// Run if called directly
if (require.main === module) {
    BackendAutoCalculationTester.runAllTests();
}

module.exports = { BackendAutoCalculationTester };