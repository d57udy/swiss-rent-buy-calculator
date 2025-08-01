/**
 * Test our local calculator with random parameters
 * Validates that the UI works and produces results
 */

const { chromium } = require('playwright');
const { SwissParameterGenerator } = require('./random-parameter-test.js');
const { SwissRentBuyCalculatorNode } = require('./backend-validation-test.js');
const path = require('path');

class LocalCalculatorTester {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        this.browser = await chromium.launch({ headless: false }); // Show browser for debugging
        this.page = await this.browser.newPage();
        
        // Navigate to local calculator
        const indexPath = path.join(__dirname, 'index.html');
        await this.page.goto(`file://${indexPath}`);
        await this.page.waitForLoadState('networkidle');
    }

    async fillParameters(params) {
        try {
            // Switch to Single Calculation tab if not already active
            await this.page.click('button:has-text("Single Calculation")');
            
            // Set manual down payment mode first
            await this.page.check('#manualDownPayment');
            
            // Fill all form fields
            await this.page.fill('#purchasePrice', params.purchasePrice.toString());
            await this.page.fill('#downPayment', params.downPayment.toString());
            await this.page.fill('#mortgageRate', params.mortgageRate.toString());
            await this.page.fill('#monthlyRent', params.monthlyRent.toString());
            await this.page.fill('#propertyAppreciation', params.propertyAppreciationRate.toString());
            await this.page.fill('#investmentYield', params.investmentYieldRate.toString());
            await this.page.fill('#marginalTaxRate', params.marginalTaxRate.toString());
            await this.page.fill('#termYears', params.termYears.toString());
            // Skip maintenance costs - it's auto-calculated and disabled
            await this.page.fill('#amortizationYears', params.amortizationYears.toString());
            
            // Click calculate button
            await this.page.click('button:has-text("Calculate")');
            
            // Wait for results
            await this.page.waitForSelector('#singleResults', { timeout: 5000 });
            
        } catch (error) {
            console.error('Error filling local calculator parameters:', error.message);
            throw error;
        }
    }

    async extractResults() {
        try {
            // Wait for calculation to complete and results to be visible
            await this.page.waitForSelector('#singleResults', { state: 'visible' });
            await this.page.waitForTimeout(1000);
            
            // Extract the full results content
            const resultsContent = await this.page.textContent('#singleResults');
            
            // Parse the results using simple string matching
            const lines = resultsContent.split('\n').map(line => line.trim()).filter(line => line);
            
            // Find decision and value
            let decision = 'UNKNOWN';
            let resultValue = 0;
            let compareText = '';
            
            // Look for decision indicators
            if (resultsContent.includes('BUY') || resultsContent.toLowerCase().includes('buying')) {
                decision = 'BUY';
            } else if (resultsContent.includes('RENT') || resultsContent.toLowerCase().includes('renting')) {
                decision = 'RENT';
            }
            
            // Extract numeric values using regex
            const numericMatches = resultsContent.match(/CHF\s*[\d,]+\.?\d*/g);
            if (numericMatches && numericMatches.length > 0) {
                // The main result value is typically the largest or first prominent number
                const values = numericMatches.map(match => this.extractNumericValue(match));
                resultValue = values[0] || 0; // Take the first significant value
            }
            
            compareText = lines.find(line => 
                line.toLowerCase().includes('cheaper') || 
                line.toLowerCase().includes('better') ||
                line.toLowerCase().includes('saves')
            ) || '';
            
            return {
                decision,
                resultValue,
                compareText,
                breakdown: {
                    totalResults: lines.length,
                    numericValues: numericMatches?.length || 0
                },
                rawData: {
                    fullContent: resultsContent,
                    lines: lines
                }
            };
            
        } catch (error) {
            console.error('Error extracting local calculator results:', error.message);
            return null;
        }
    }

    extractNumericValue(text) {
        if (!text) return 0;
        
        // Remove CHF, commas, and extract number (handle negative values)
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

async function testLocalCalculator() {
    console.log('🏠 Testing Local Swiss Rent vs Buy Calculator');
    console.log('=' .repeat(60));
    
    const generator = new SwissParameterGenerator();
    const tester = new LocalCalculatorTester();
    
    try {
        // Generate test parameters
        console.log('📊 Generating 5 random parameter sets...');
        const parameterSets = generator.generateParameterSets(5);
        console.log('');
        
        // Initialize browser
        console.log('🌐 Opening local calculator...');
        await tester.initialize();
        console.log('');
        
        // Test each parameter set
        let passedTests = 0;
        let failedTests = 0;
        
        for (let i = 0; i < parameterSets.length; i++) {
            const params = parameterSets[i];
            console.log(`🧮 Test ${i + 1}: CHF ${params.purchasePrice.toLocaleString()}, ${params.mortgageRate.toFixed(2)}% rate, ${params.termYears}y`);
            
            try {
                // Fill parameters in UI
                await tester.fillParameters(params);
                
                // Extract UI results
                const uiResult = await tester.extractResults();
                
                // Calculate backend result for comparison
                const backendParams = {
                    purchasePrice: params.purchasePrice,
                    downPayment: params.downPayment,
                    mortgageRate: params.mortgageRate / 100,
                    monthlyRent: params.monthlyRent,
                    propertyAppreciationRate: params.propertyAppreciationRate / 100,
                    investmentYieldRate: params.investmentYieldRate / 100,
                    marginalTaxRate: params.marginalTaxRate / 100,
                    termYears: params.termYears,
                    annualMaintenanceCosts: params.annualMaintenanceCosts,
                    amortizationYears: params.amortizationYears,
                    annualAmortization: params.annualAmortization,
                    totalRenovations: params.totalRenovations,
                    additionalPurchaseCosts: params.additionalPurchaseCosts,
                    imputedRentalValue: params.imputedRentalValue,
                    propertyTaxDeductions: params.propertyTaxDeductions,
                    annualRentalCosts: params.annualRentalCosts
                };
                
                const backendResult = SwissRentBuyCalculatorNode.calculate(backendParams);
                
                // Compare results
                const uiDecision = uiResult.decision;
                const backendDecision = backendResult.Decision;
                const uiValue = uiResult.resultValue;
                const backendValue = backendResult.ResultValue;
                
                const decisionMatch = uiDecision === backendDecision;
                const valueDiff = Math.abs(uiValue - backendValue);
                const valueMatch = valueDiff < 1; // Allow 1 CHF difference for rounding
                
                if (decisionMatch && valueMatch) {
                    passedTests++;
                    console.log(`   ✅ PASSED - ${uiDecision} CHF ${Math.abs(uiValue).toLocaleString()}`);
                } else {
                    failedTests++;
                    console.log(`   ❌ FAILED`);
                    if (!decisionMatch) {
                        console.log(`      Decision: UI=${uiDecision}, Backend=${backendDecision}`);
                    }
                    if (!valueMatch) {
                        console.log(`      Value diff: CHF ${valueDiff.toFixed(2)} (UI=${uiValue.toFixed(2)}, Backend=${backendValue.toFixed(2)})`);
                    }
                }
                
                // Show some breakdown details
                console.log(`      Purchase Cost: CHF ${uiResult.breakdown.totalPurchaseCost?.toLocaleString()}`);
                console.log(`      Rental Cost: CHF ${uiResult.breakdown.totalRentalCost?.toLocaleString()}`);
                
            } catch (error) {
                failedTests++;
                console.log(`   💥 ERROR: ${error.message}`);
            }
            
            console.log('');
        }
        
        // Summary
        console.log('📊 LOCAL CALCULATOR TEST SUMMARY');
        console.log('=' .repeat(40));
        console.log(`Total Tests:     ${parameterSets.length}`);
        console.log(`Passed Tests:    ${passedTests} (${((passedTests/parameterSets.length)*100).toFixed(1)}%)`);
        console.log(`Failed Tests:    ${failedTests} (${((failedTests/parameterSets.length)*100).toFixed(1)}%)`);
        console.log('');
        console.log(passedTests === parameterSets.length ? '🎉 ALL TESTS PASSED! 🎉' : '⚠️  SOME TESTS FAILED');
        
    } finally {
        // Keep browser open for a moment to see results
        console.log('');
        console.log('📋 Browser will close in 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await tester.cleanup();
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LocalCalculatorTester,
        testLocalCalculator
    };
}

// Run if called directly
if (require.main === module) {
    testLocalCalculator().catch(console.error);
}