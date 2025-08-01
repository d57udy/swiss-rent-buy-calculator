/**
 * Compare auto-calculated parameters between frontend UI and backend test parameters
 * to identify differences in auto-calculation logic
 */

const { chromium } = require('playwright');
const { SwissParameterGenerator } = require('./random-parameter-test.js');
const path = require('path');

class AutoCalculationComparator {
    constructor() {
        this.generator = new SwissParameterGenerator();
    }

    /**
     * Extract all parameter values after UI auto-calculations
     */
    async extractUIAutoCalculatedValues(page, baseParams) {
        // Fill the form with base parameters - let UI auto-calculate others
        await page.click('button:has-text("Single Calculation")');
        await page.check('#manualDownPayment');
        
        console.log('🔧 Setting base parameters and letting UI auto-calculate...');
        
        // Fill only the core parameters - let UI calculate the rest
        await page.fill('#purchasePrice', baseParams.purchasePrice.toString());
        await page.fill('#downPayment', baseParams.downPayment.toString());
        await page.fill('#mortgageRate', baseParams.mortgageRate.toString());
        await page.fill('#monthlyRent', baseParams.monthlyRent.toString());
        await page.fill('#propertyAppreciation', baseParams.propertyAppreciationRate.toString());
        await page.fill('#investmentYield', baseParams.investmentYieldRate.toString());
        await page.fill('#marginalTaxRate', baseParams.marginalTaxRate.toString());
        await page.fill('#termYears', baseParams.termYears.toString());
        await page.fill('#amortizationYears', baseParams.amortizationYears.toString());
        
        // Wait for auto-calculations to complete
        await page.waitForTimeout(2000);
        
        // Extract all calculated values
        const uiValues = {};
        const allFieldIds = [
            'purchasePrice', 'downPayment', 'mortgageRate', 'monthlyRent',
            'propertyAppreciation', 'investmentYield', 'marginalTaxRate', 'termYears',
            'amortizationYears', 'annualMaintenanceCosts', 'annualAmortization',
            'additionalPurchaseCosts', 'totalRenovations', 'imputedRentalValue',
            'propertyTaxDeductions', 'annualRentalCosts'
        ];
        
        for (const fieldId of allFieldIds) {
            try {
                const value = await page.inputValue(`#${fieldId}`);
                uiValues[fieldId] = parseFloat(value) || 0;
            } catch (e) {
                uiValues[fieldId] = 0;
                console.log(`   Warning: Could not read field ${fieldId}`);
            }
        }
        
        return uiValues;
    }

    /**
     * Generate backend parameters using same auto-calculation logic as our generator
     */
    generateBackendAutoCalculatedValues(baseParams) {
        console.log('🔧 Generating backend auto-calculated parameters...');
        
        const backendValues = {
            // Core parameters (same as input)
            purchasePrice: baseParams.purchasePrice,
            downPayment: baseParams.downPayment,
            mortgageRate: baseParams.mortgageRate,
            monthlyRent: baseParams.monthlyRent,
            propertyAppreciation: baseParams.propertyAppreciationRate,
            investmentYield: baseParams.investmentYieldRate,
            marginalTaxRate: baseParams.marginalTaxRate,
            termYears: baseParams.termYears,
            amortizationYears: baseParams.amortizationYears,
            
            // Auto-calculated parameters (backend logic)
            annualMaintenanceCosts: Math.round(baseParams.purchasePrice * 0.0125), // 1.25% Swiss standard
            annualAmortization: Math.round((baseParams.purchasePrice - baseParams.downPayment) / baseParams.amortizationYears),
            additionalPurchaseCosts: 5000, // Fixed CHF 5,000 default (user-editable)
            totalRenovations: 0, // Default
            imputedRentalValue: Math.round(baseParams.monthlyRent * 12 * 0.65), // 65% of market rent
            propertyTaxDeductions: 13000, // Swiss standard
            annualRentalCosts: 20000 // Swiss standard
        };
        
        return backendValues;
    }

    /**
     * Compare auto-calculation results
     */
    async compareAutoCalculations() {
        console.log('🔍 AUTO-CALCULATION COMPARISON ANALYSIS');
        console.log('=' .repeat(80));
        
        // Generate test parameters
        const baseParams = this.generator.generateParameters();
        baseParams.testId = 'auto-calc-comparison';
        
        console.log('📊 BASE TEST PARAMETERS:');
        console.log('─'.repeat(50));
        console.log(`Purchase Price: CHF ${baseParams.purchasePrice.toLocaleString()}`);
        console.log(`Down Payment: CHF ${baseParams.downPayment.toLocaleString()}`);
        console.log(`Mortgage Rate: ${baseParams.mortgageRate.toFixed(3)}%`);
        console.log(`Monthly Rent: CHF ${baseParams.monthlyRent.toLocaleString()}`);
        console.log(`Property Appreciation: ${baseParams.propertyAppreciationRate.toFixed(3)}%`);
        console.log(`Investment Yield: ${baseParams.investmentYieldRate.toFixed(3)}%`);
        console.log(`Marginal Tax Rate: ${baseParams.marginalTaxRate.toFixed(3)}%`);
        console.log(`Term Years: ${baseParams.termYears}`);
        console.log(`Amortization Years: ${baseParams.amortizationYears}`);
        console.log('');
        
        // Initialize browser
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();
        
        try {
            const indexPath = path.join(__dirname, 'index.html');
            await page.goto(`file://${indexPath}`);
            await page.waitForLoadState('networkidle');
            
            // Get UI auto-calculated values
            const uiValues = await this.extractUIAutoCalculatedValues(page, baseParams);
            
            // Get backend auto-calculated values  
            const backendValues = this.generateBackendAutoCalculatedValues(baseParams);
            
            // Compare auto-calculated fields
            console.log('📋 AUTO-CALCULATION COMPARISON:');
            console.log('─'.repeat(90));
            console.log('Parameter                     | UI Auto-Calc      | Backend Auto-Calc | Difference    | Match');
            console.log('─'.repeat(90));
            
            const autoCalculatedFields = [
                'annualMaintenanceCosts',
                'annualAmortization', 
                'additionalPurchaseCosts',
                'totalRenovations',
                'imputedRentalValue',
                'propertyTaxDeductions',
                'annualRentalCosts'
            ];
            
            const differences = {};
            let significantDifferences = 0;
            
            autoCalculatedFields.forEach(field => {
                const uiVal = uiValues[field] || 0;
                const backendVal = backendValues[field] || 0;
                const diff = Math.abs(uiVal - backendVal);
                const match = diff < 100 ? '✅' : diff < 1000 ? '⚠️' : '❌';
                
                if (diff >= 100) significantDifferences++;
                differences[field] = { ui: uiVal, backend: backendVal, diff, match };
                
                const uiStr = uiVal >= 1000 ? `CHF ${uiVal.toLocaleString()}` : uiVal.toFixed(0);
                const backendStr = backendVal >= 1000 ? `CHF ${backendVal.toLocaleString()}` : backendVal.toFixed(0);
                const diffStr = diff >= 1000 ? `CHF ${diff.toLocaleString()}` : diff.toFixed(0);
                
                console.log(
                    `${field.padEnd(29)} | ${uiStr.padEnd(17)} | ${backendStr.padEnd(17)} | ${diffStr.padEnd(13)} | ${match}`
                );
            });
            
            console.log('─'.repeat(90));
            console.log('');
            
            // Analysis
            console.log('🔍 AUTO-CALCULATION ANALYSIS:');
            console.log('─'.repeat(50));
            console.log(`Significant Differences: ${significantDifferences}/${autoCalculatedFields.length}`);
            
            if (significantDifferences === 0) {
                console.log('✅ All auto-calculations match - discrepancy must be in calculation logic');
            } else {
                console.log('❌ Auto-calculation differences found - this likely explains the discrepancy');
                console.log('');
                console.log('📊 KEY DIFFERENCES:');
                
                Object.entries(differences).forEach(([field, data]) => {
                    if (data.diff >= 100) {
                        const percentage = data.backend !== 0 ? (data.diff / Math.abs(data.backend) * 100).toFixed(1) : 'N/A';
                        console.log(`   ${field}:`);
                        console.log(`      Difference: CHF ${data.diff.toLocaleString()} (${percentage}%)`);
                        console.log(`      UI uses: CHF ${data.ui.toLocaleString()}`);
                        console.log(`      Backend uses: CHF ${data.backend.toLocaleString()}`);
                        
                        // Suggest likely cause
                        if (field === 'annualMaintenanceCosts') {
                            const uiRate = (data.ui / baseParams.purchasePrice * 100).toFixed(3);
                            const backendRate = (data.backend / baseParams.purchasePrice * 100).toFixed(3);
                            console.log(`      UI maintenance rate: ${uiRate}%`);
                            console.log(`      Backend maintenance rate: ${backendRate}%`);
                        }
                        console.log('');
                    }
                });
            }
            
            // Show calculation method insights
            console.log('💡 AUTO-CALCULATION METHODS:');
            console.log('─'.repeat(50));
            console.log('UI Maintenance Rate:     ' + 
                      `${(uiValues.annualMaintenanceCosts / baseParams.purchasePrice * 100).toFixed(3)}%`);
            console.log('Backend Maintenance Rate: 1.250% (hardcoded Swiss standard)');
            console.log('');
            console.log('UI Imputed Rental:       ' + 
                      `CHF ${uiValues.imputedRentalValue.toLocaleString()} ` +
                      `(${(uiValues.imputedRentalValue / (baseParams.monthlyRent * 12) * 100).toFixed(1)}% of annual rent)`);
            console.log('Backend Imputed Rental:  ' + 
                      `CHF ${backendValues.imputedRentalValue.toLocaleString()} ` +
                      `(65.0% of annual rent)`);
            console.log('');
            
            // Keep browser open for inspection
            console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            return {
                uiValues,
                backendValues,
                differences,
                significantDifferences
            };
            
        } finally {
            await browser.close();
        }
    }
}

// Run if called directly
if (require.main === module) {
    const comparator = new AutoCalculationComparator();
    comparator.compareAutoCalculations().catch(console.error);
}

module.exports = { AutoCalculationComparator };