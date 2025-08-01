/**
 * Random Parameter Test for Swiss Rent vs Buy Calculator
 * Generates realistic Swiss real estate parameters and compares results
 * between moneyland.ch and our calculator using Playwright automation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Swiss Real Estate Parameter Generator
 * Generates realistic parameters based on current Swiss market conditions
 */
class SwissParameterGenerator {
    constructor() {
        // Swiss market realistic ranges (2024/2025)
        this.ranges = {
            // Property prices in CHF - realistic Swiss ranges by region
            purchasePrice: {
                min: 800000,    // Lower end apartments
                max: 3000000,   // High-end properties
                typical: [1200000, 1800000] // Most common range
            },
            
            // Down payment percentage (Swiss banking requirements)
            downPaymentPercent: {
                min: 20,        // Legal minimum
                max: 50,        // High equity buyers
                typical: [20, 30] // Most common
            },
            
            // Mortgage interest rates (current Swiss market)
            mortgageRatePercent: {
                min: 0.5,       // Best rates
                max: 3.0,       // Higher rates
                typical: [0.8, 2.2] // Current range
            },
            
            // Monthly rent (based on purchase price ratios)
            rentToPriceRatio: {
                min: 0.0035,    // 3.5% annual yield
                max: 0.0065,    // 6.5% annual yield
                typical: [0.004, 0.0055] // 4-5.5% typical
            },
            
            // Property appreciation (Swiss historical data)
            propertyAppreciationPercent: {
                min: 0.0,       // No appreciation
                max: 4.0,       // High appreciation
                typical: [0.5, 2.5] // Historical average
            },
            
            // Investment yield (Swiss investment options)
            investmentYieldPercent: {
                min: 0.0,       // No yield scenarios
                max: 7.0,       // Aggressive investments
                typical: [1.5, 4.5] // Conservative to moderate
            },
            
            // Marginal tax rates (Swiss cantons)
            marginalTaxPercent: {
                min: 15,        // Low tax cantons
                max: 45,        // High tax cantons
                typical: [22, 32] // Most cantons
            },
            
            // Analysis term
            termYears: {
                min: 5,         // Short term
                max: 25,        // Long term
                typical: [8, 15] // Most common analysis periods
            },
            
            // Maintenance costs (Swiss standards)
            maintenancePercent: {
                min: 0.8,       // Low maintenance
                max: 2.0,       // High maintenance
                typical: [1.0, 1.5] // Swiss standard
            },
            
            // Amortization period (Swiss banking rules)
            amortizationYears: {
                min: 10,        // Fast amortization
                max: 20,        // Maximum period
                typical: [12, 17] // Common terms
            }
        };
    }

    /**
     * Generate a random value within a range, with bias toward typical values
     */
    randomInRange(range, biasToTypical = 0.7) {
        if (Math.random() < biasToTypical && range.typical) {
            // Generate within typical range
            const [min, max] = range.typical;
            return min + Math.random() * (max - min);
        } else {
            // Generate within full range
            return range.min + Math.random() * (range.max - range.min);
        }
    }

    /**
     * Generate a complete set of realistic Swiss real estate parameters
     */
    generateParameters() {
        // Base property price
        const purchasePrice = Math.round(this.randomInRange(this.ranges.purchasePrice));
        
        // Down payment based on property price
        const downPaymentPercent = this.randomInRange(this.ranges.downPaymentPercent);
        const downPayment = Math.round(purchasePrice * downPaymentPercent / 100);
        
        // Mortgage amount and rate
        const mortgageAmount = purchasePrice - downPayment;
        const mortgageRate = this.randomInRange(this.ranges.mortgageRatePercent) / 100;
        
        // Monthly rent based on property price (realistic rent-to-price ratios)
        const rentRatio = this.randomInRange(this.ranges.rentToPriceRatio);
        const monthlyRent = Math.round(purchasePrice * rentRatio / 12);
        
        // Market conditions
        const propertyAppreciationRate = this.randomInRange(this.ranges.propertyAppreciationPercent) / 100;
        const investmentYieldRate = this.randomInRange(this.ranges.investmentYieldPercent) / 100;
        
        // Tax and term parameters
        const marginalTaxRate = this.randomInRange(this.ranges.marginalTaxPercent) / 100;
        const termYears = Math.round(this.randomInRange(this.ranges.termYears));
        
        // Property costs - realistic Swiss maintenance rates (1-2% of purchase price)
        const maintenanceRate = this.randomInRange(this.ranges.maintenancePercent) / 100;
        const annualMaintenanceCosts = Math.round(purchasePrice * maintenanceRate);
        
        // Amortization
        const amortizationYears = Math.round(this.randomInRange(this.ranges.amortizationYears));
        const annualAmortization = Math.round(mortgageAmount / amortizationYears);
        
        // Swiss-specific parameters (based on typical values)
        const additionalPurchaseCosts = 5000; // Fixed CHF 5,000 default (user-editable)
        const imputedRentalValue = Math.round(monthlyRent * 12 * 0.65); // 65% of market rent
        const propertyTaxDeductions = 13000; // Swiss standard deduction
        const annualRentalCosts = 20000; // Typical supplemental rental costs
        const totalRenovations = 0; // Simplify for now
        
        return {
            // Core parameters
            purchasePrice,
            downPayment,
            mortgageRate: mortgageRate * 100, // Convert back to percentage for display
            monthlyRent,
            propertyAppreciationRate: propertyAppreciationRate * 100,
            investmentYieldRate: investmentYieldRate * 100,
            marginalTaxRate: marginalTaxRate * 100,
            termYears,
            
            // Derived parameters
            mortgageAmount,
            annualMaintenanceCosts,
            amortizationYears,
            annualAmortization,
            additionalPurchaseCosts,
            imputedRentalValue,
            propertyTaxDeductions,
            annualRentalCosts,
            totalRenovations,
            
            // Metadata
            downPaymentPercent: Math.round(downPaymentPercent * 10) / 10,
            maintenancePercent: Math.round(maintenanceRate * 1000) / 10,
            rentToPrice: Math.round((monthlyRent * 12 / purchasePrice) * 10000) / 100, // Annual rent-to-price ratio as percentage
            generated: new Date().toISOString()
        };
    }

    /**
     * Generate multiple parameter sets
     */
    generateParameterSets(count = 10) {
        const parameterSets = [];
        
        for (let i = 0; i < count; i++) {
            const params = this.generateParameters();
            params.testId = `random-${i + 1}`;
            parameterSets.push(params);
        }
        
        return parameterSets;
    }
}

/**
 * Playwright automation for moneyland.ch calculator
 */
class MoneylandCalculatorTester {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        this.browser = await chromium.launch({ headless: true });
        this.page = await this.browser.newPage();
        
        // Navigate to moneyland.ch calculator
        await this.page.goto('https://www.moneyland.ch/en/rent-or-buy-calculator');
        await this.page.waitForLoadState('networkidle');
    }

    async fillParameters(params) {
        try {
            // Accept cookies first if present
            try {
                await this.page.click('button:has-text("I Accept")', { timeout: 5000 });
            } catch (e) {
                // Ignore if cookie banner not present
            }

            // Wait for page to be fully loaded
            await this.page.waitForLoadState('networkidle');
            
            // Fill purchase price - ref=e94
            await this.page.fill('css=generic:has-text("Purchase price") + generic textbox', params.purchasePrice.toString());
            
            // Fill down payment - ref=e100  
            await this.page.fill('css=generic:has-text("Down-payment") + generic textbox', params.downPayment.toString());
            
            // Fill mortgage rate - ref=e106
            await this.page.fill('css=generic:has-text("Mortgage interest rate") + generic textbox', params.mortgageRate.toString());
            
            // Fill maintenance costs - ref=e112
            await this.page.fill('css=generic:has-text("Annual supplemental and maintenance costs") + generic textbox', params.annualMaintenanceCosts.toString());
            
            // Fill monthly rent - ref=e254
            await this.page.fill('css=generic:has-text("Monthly rent due") + generic textbox', params.monthlyRent.toString());
            
            // Select term from dropdown - ref=e275
            await this.page.selectOption('css=generic:has-text("Term") + combobox', `${params.termYears} years`);
            
            // The page calculates automatically - no submit button needed
            await this.page.waitForTimeout(2000); // Wait for calculation
            
        } catch (error) {
            console.error('Error filling moneyland.ch parameters:', error.message);
            throw error;
        }
    }

    async extractResults() {
        try {
            // Wait for calculation to complete
            await this.page.waitForTimeout(3000);
            
            // Extract values from the calculation fields
            const totalPurchaseCost = await this.page.inputValue('css=generic:has-text("Total purchase cost") + generic textbox');
            const totalRentalCost = await this.page.inputValue('css=generic:has-text("Total rental cost") + generic textbox');
            
            // Calculate the difference (rental cost - purchase cost)
            const purchaseCostNum = this.extractNumericValue(totalPurchaseCost);
            const rentalCostNum = this.extractNumericValue(totalRentalCost);
            const resultValue = rentalCostNum - purchaseCostNum;
            
            // Determine decision based on which is cheaper
            const decision = resultValue > 0 ? 'BUY' : 'RENT';
            
            const resultText = resultValue > 0 ? 
                `Buying saves CHF ${Math.abs(resultValue).toFixed(2)} compared to renting` :
                `Renting saves CHF ${Math.abs(resultValue).toFixed(2)} compared to buying`;
            
            return {
                decision,
                resultValue,
                resultText,
                rawData: {
                    totalPurchaseCost,
                    totalRentalCost,
                    purchaseCostNum,
                    rentalCostNum
                }
            };
            
        } catch (error) {
            console.error('Error extracting moneyland.ch results:', error.message);
            return null;
        }
    }

    extractNumericValue(text) {
        if (!text) return 0;
        
        // Remove CHF, commas, and extract number
        const match = text.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return 0;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

/**
 * Playwright automation for our local calculator
 */
class LocalCalculatorTester {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        this.browser = await chromium.launch({ headless: true });
        this.page = await this.browser.newPage();
        
        // Navigate to local calculator
        const indexPath = path.join(__dirname, 'index.html');
        await this.page.goto(`file://${indexPath}`);
        await this.page.waitForLoadState('networkidle');
    }

    async fillParameters(params) {
        try {
            // Fill all form fields based on our calculator's structure
            await this.page.fill('#purchasePrice', params.purchasePrice.toString());
            await this.page.fill('#downPayment', params.downPayment.toString());
            await this.page.fill('#mortgageRate', params.mortgageRate.toString());
            await this.page.fill('#monthlyRent', params.monthlyRent.toString());
            await this.page.fill('#propertyAppreciationRate', params.propertyAppreciationRate.toString());
            await this.page.fill('#investmentYieldRate', params.investmentYieldRate.toString());
            await this.page.fill('#marginalTaxRate', params.marginalTaxRate.toString());
            await this.page.fill('#termYears', params.termYears.toString());
            await this.page.fill('#annualMaintenanceCosts', params.annualMaintenanceCosts.toString());
            await this.page.fill('#amortizationYears', params.amortizationYears.toString());
            
            // Click calculate button
            await this.page.click('#calculateBtn, .calculate-btn, button[onclick*="calculate"]');
            
            // Wait for results
            await this.page.waitForSelector('#results, .results-section', { timeout: 5000 });
            
        } catch (error) {
            console.error('Error filling local calculator parameters:', error.message);
            throw error;
        }
    }

    async extractResults() {
        try {
            // Wait for calculation to complete
            await this.page.waitForTimeout(1000);
            
            // Extract results from our calculator
            const decision = await this.page.textContent('#decision, .decision');
            const resultValue = await this.page.textContent('#resultValue, .result-value');
            const resultText = await this.page.textContent('#compareText, .compare-text');
            
            return {
                decision: decision?.trim(),
                resultValue: this.extractNumericValue(resultValue),
                resultText: resultText?.trim(),
                rawData: {
                    decision,
                    resultValue,
                    resultText
                }
            };
            
        } catch (error) {
            console.error('Error extracting local calculator results:', error.message);
            return null;
        }
    }

    extractNumericValue(text) {
        if (!text) return 0;
        
        const match = text.match(/-?[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return 0;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

/**
 * Main test orchestrator
 */
class RandomParameterTester {
    constructor() {
        this.generator = new SwissParameterGenerator();
        this.moneylandTester = new MoneylandCalculatorTester();
        this.localTester = new LocalCalculatorTester();
    }

    async runTests(parameterCount = 10) {
        console.log('🎲 Random Parameter Test - Swiss Rent vs Buy Calculator');
        console.log('=' .repeat(60));
        
        try {
            // Generate random parameters
            console.log(`📊 Generating ${parameterCount} random Swiss real estate parameter sets...`);
            const parameterSets = this.generator.generateParameterSets(parameterCount);
            
            // Save parameters for reference
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const paramFile = `random-parameters-${timestamp}.json`;
            fs.writeFileSync(paramFile, JSON.stringify(parameterSets, null, 2));
            console.log(`💾 Parameters saved to: ${paramFile}`);
            console.log('');
            
            // Initialize browsers
            console.log('🌐 Initializing browsers...');
            await this.moneylandTester.initialize();
            await this.localTester.initialize();
            console.log('');
            
            // Test results
            const testResults = [];
            let passedTests = 0;
            let failedTests = 0;
            
            // Run tests for each parameter set
            for (let i = 0; i < parameterSets.length; i++) {
                const params = parameterSets[i];
                console.log(`🧮 Test ${i + 1}: CHF ${params.purchasePrice.toLocaleString()}, ${params.mortgageRate}% rate, ${params.termYears}y`);
                
                try {
                    // Test moneyland.ch (with retry logic)
                    let moneylandResult = null;
                    for (let retry = 0; retry < 3; retry++) {
                        try {
                            await this.moneylandTester.fillParameters(params);
                            moneylandResult = await this.moneylandTester.extractResults();
                            if (moneylandResult) break;
                        } catch (error) {
                            console.log(`   ⚠️  Moneyland attempt ${retry + 1} failed: ${error.message}`);
                        }
                    }
                    
                    // Test our calculator
                    await this.localTester.fillParameters(params);
                    const localResult = await this.localTester.extractResults();
                    
                    // Compare results
                    const comparison = this.compareResults(localResult, moneylandResult, params);
                    
                    if (comparison.passed) {
                        passedTests++;
                        console.log(`   ✅ PASSED - Both recommend ${localResult.decision}`);
                    } else {
                        failedTests++;
                        console.log(`   ❌ FAILED - ${comparison.reason}`);
                        console.log(`      Local: ${localResult.decision} CHF ${localResult.resultValue?.toLocaleString()}`);
                        console.log(`      Moneyland: ${moneylandResult?.decision} CHF ${moneylandResult?.resultValue?.toLocaleString()}`);
                    }
                    
                    testResults.push({
                        testId: params.testId,
                        parameters: params,
                        localResult,
                        moneylandResult,
                        comparison
                    });
                    
                } catch (error) {
                    failedTests++;
                    console.log(`   💥 ERROR: ${error.message}`);
                }
                
                console.log('');
            }
            
            // Save detailed results
            const resultFile = `random-test-results-${timestamp}.json`;
            fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
            
            // Summary
            console.log('📊 RANDOM PARAMETER TEST SUMMARY');
            console.log('=' .repeat(40));
            console.log(`Total Tests:     ${parameterSets.length}`);
            console.log(`Passed Tests:    ${passedTests} (${((passedTests/parameterSets.length)*100).toFixed(1)}%)`);
            console.log(`Failed Tests:    ${failedTests} (${((failedTests/parameterSets.length)*100).toFixed(1)}%)`);
            console.log(`Results saved:   ${resultFile}`);
            console.log('');
            console.log(passedTests === parameterSets.length ? '🎉 ALL TESTS PASSED! 🎉' : '⚠️  SOME TESTS FAILED');
            
            return testResults;
            
        } finally {
            // Cleanup
            await this.moneylandTester.cleanup();
            await this.localTester.cleanup();
        }
    }

    compareResults(localResult, moneylandResult, params, tolerance = 0.05) {
        if (!localResult || !moneylandResult) {
            return {
                passed: false,
                reason: 'Missing results from one or both calculators'
            };
        }

        // Compare decisions
        if (localResult.decision !== moneylandResult.decision) {
            return {
                passed: false,
                reason: `Decision mismatch: ${localResult.decision} vs ${moneylandResult.decision}`
            };
        }

        // Compare result values (with tolerance)
        const valueDiff = Math.abs(localResult.resultValue - moneylandResult.resultValue);
        const relativeDiff = moneylandResult.resultValue !== 0 ? 
            valueDiff / Math.abs(moneylandResult.resultValue) : 0;

        if (relativeDiff > tolerance) {
            return {
                passed: false,
                reason: `Value difference too large: ${(relativeDiff * 100).toFixed(2)}% (CHF ${valueDiff.toFixed(0)})`
            };
        }

        return {
            passed: true,
            reason: 'Results match within tolerance',
            valueDifference: valueDiff,
            relativeDifference: relativeDiff
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SwissParameterGenerator,
        MoneylandCalculatorTester,
        LocalCalculatorTester,
        RandomParameterTester
    };
}

// Run if called directly
if (require.main === module) {
    const tester = new RandomParameterTester();
    tester.runTests(10).catch(console.error);
}