/**
 * Debug parameter comparison between UI and backend
 * Shows exactly what parameters are being used in each calculation
 */

const { chromium } = require('playwright');
const { SwissParameterGenerator } = require('./random-parameter-test.js');
const { SwissRentBuyCalculatorNode } = require('./backend-validation-test.js');
const path = require('path');

async function debugParameterComparison() {
    console.log('🔍 PARAMETER COMPARISON DEBUG');
    console.log('=' .repeat(80));
    
    const generator = new SwissParameterGenerator();
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to local calculator
        const indexPath = path.join(__dirname, 'index.html');
        await page.goto(`file://${indexPath}`);
        await page.waitForLoadState('networkidle');
        
        // Generate one test case
        const params = generator.generateParameters();
        params.testId = 'debug-1';
        
        console.log('📊 GENERATED PARAMETERS:');
        console.log('─'.repeat(50));
        console.log(`Purchase Price: CHF ${params.purchasePrice.toLocaleString()}`);
        console.log(`Down Payment: CHF ${params.downPayment.toLocaleString()} (${params.downPaymentPercent}%)`);
        console.log(`Mortgage Rate: ${params.mortgageRate.toFixed(3)}%`);
        console.log(`Monthly Rent: CHF ${params.monthlyRent.toLocaleString()}`);
        console.log(`Property Appreciation: ${params.propertyAppreciationRate.toFixed(3)}%`);
        console.log(`Investment Yield: ${params.investmentYieldRate.toFixed(3)}%`);
        console.log(`Marginal Tax Rate: ${params.marginalTaxRate.toFixed(3)}%`);
        console.log(`Term Years: ${params.termYears}`);
        console.log(`Amortization Years: ${params.amortizationYears}`);
        console.log(`Generated Maintenance: CHF ${params.annualMaintenanceCosts.toLocaleString()}`);
        console.log(`Generated Imputed Rental: CHF ${params.imputedRentalValue.toLocaleString()}`);
        console.log('');
        
        // Fill the UI form
        console.log('🖥️ FILLING UI FORM...');
        await page.click('button:has-text("Single Calculation")');
        await page.check('#manualDownPayment');
        
        await page.fill('#purchasePrice', params.purchasePrice.toString());
        await page.fill('#downPayment', params.downPayment.toString());
        await page.fill('#mortgageRate', params.mortgageRate.toString());
        await page.fill('#monthlyRent', params.monthlyRent.toString());
        await page.fill('#propertyAppreciation', params.propertyAppreciationRate.toString());
        await page.fill('#investmentYield', params.investmentYieldRate.toString());
        await page.fill('#marginalTaxRate', params.marginalTaxRate.toString());
        await page.fill('#termYears', params.termYears.toString());
        await page.fill('#amortizationYears', params.amortizationYears.toString());
        await page.fill('#propertyTaxDeductions', params.propertyTaxDeductions.toString());
        await page.fill('#annualRentalCosts', params.annualRentalCosts.toString());
        
        // Wait a moment for auto-calculations
        await page.waitForTimeout(1000);
        
        // Extract the actual values being used by the UI
        console.log('📋 ACTUAL UI VALUES (after auto-calculation):');
        console.log('─'.repeat(50));
        
        const uiValues = {
            purchasePrice: await page.inputValue('#purchasePrice'),
            downPayment: await page.inputValue('#downPayment'),
            mortgageRate: await page.inputValue('#mortgageRate'),
            monthlyRent: await page.inputValue('#monthlyRent'),
            propertyAppreciation: await page.inputValue('#propertyAppreciation'),
            investmentYield: await page.inputValue('#investmentYield'),
            marginalTaxRate: await page.inputValue('#marginalTaxRate'),
            termYears: await page.inputValue('#termYears'),
            amortizationYears: await page.inputValue('#amortizationYears'),
            annualMaintenanceCosts: await page.inputValue('#annualMaintenanceCosts'),
            imputedRentalValue: await page.inputValue('#imputedRentalValue'),
            propertyTaxDeductions: await page.inputValue('#propertyTaxDeductions'),
            annualRentalCosts: await page.inputValue('#annualRentalCosts'),
            annualAmortization: await page.inputValue('#annualAmortization')
        };
        
        Object.entries(uiValues).forEach(([key, value]) => {
            const numValue = parseFloat(value);
            if (numValue >= 1000) {
                console.log(`   ${key.padEnd(25)}: ${numValue.toLocaleString()}`);
            } else {
                console.log(`   ${key.padEnd(25)}: ${value}`);
            }
        });
        
        // Calculate using UI values
        console.log('\n🧮 RUNNING UI CALCULATION...');
        await page.click('button:has-text("Calculate")');
        await page.waitForSelector('#singleResults', { state: 'visible' });
        await page.waitForTimeout(1000);
        
        const uiResultContent = await page.textContent('#singleResults');
        console.log('UI Result Content (first 200 chars):');
        console.log(uiResultContent.substring(0, 200) + '...');
        
        // Parse UI results
        let uiDecision = 'UNKNOWN';
        let uiResultValue = 0;
        
        if (uiResultContent.includes('BUY') || uiResultContent.toLowerCase().includes('buying')) {
            uiDecision = 'BUY';
        } else if (uiResultContent.includes('RENT') || uiResultContent.toLowerCase().includes('renting')) {
            uiDecision = 'RENT';
        }
        
        const uiNumericMatches = uiResultContent.match(/CHF\s*[\d,]+\.?\d*/g);
        if (uiNumericMatches && uiNumericMatches.length > 0) {
            uiResultValue = parseFloat(uiNumericMatches[0].replace(/[CHF,\s]/g, ''));
        }
        
        console.log(`UI Decision: ${uiDecision}`);
        console.log(`UI Result Value: CHF ${uiResultValue.toLocaleString()}`);
        console.log('');
        
        // Prepare backend parameters using ORIGINAL generated values
        console.log('🔧 BACKEND CALCULATION (using generated parameters):');
        console.log('─'.repeat(50));
        
        const backendParamsOriginal = {
            purchasePrice: params.purchasePrice,
            downPayment: params.downPayment,
            mortgageRate: params.mortgageRate / 100,
            monthlyRent: params.monthlyRent,
            propertyAppreciationRate: params.propertyAppreciationRate / 100,
            investmentYieldRate: params.investmentYieldRate / 100,
            marginalTaxRate: params.marginalTaxRate / 100,
            termYears: params.termYears,
            annualMaintenanceCosts: params.annualMaintenanceCosts, // Generated value
            amortizationYears: params.amortizationYears,
            annualAmortization: params.annualAmortization,
            totalRenovations: params.totalRenovations,
            additionalPurchaseCosts: params.additionalPurchaseCosts,
            imputedRentalValue: params.imputedRentalValue, // Generated value
            propertyTaxDeductions: params.propertyTaxDeductions,
            annualRentalCosts: params.annualRentalCosts
        };
        
        const backendResultOriginal = SwissRentBuyCalculatorNode.calculate(backendParamsOriginal);
        
        console.log(`Backend Decision (original): ${backendResultOriginal.Decision}`);
        console.log(`Backend Result Value (original): CHF ${backendResultOriginal.ResultValue.toLocaleString()}`);
        console.log('');
        
        // Prepare backend parameters using ACTUAL UI values
        console.log('🔧 BACKEND CALCULATION (using actual UI values):');
        console.log('─'.repeat(50));
        
        const backendParamsUI = {
            purchasePrice: parseFloat(uiValues.purchasePrice),
            downPayment: parseFloat(uiValues.downPayment),
            mortgageRate: parseFloat(uiValues.mortgageRate) / 100,
            monthlyRent: parseFloat(uiValues.monthlyRent),
            propertyAppreciationRate: parseFloat(uiValues.propertyAppreciation) / 100,
            investmentYieldRate: parseFloat(uiValues.investmentYield) / 100,
            marginalTaxRate: parseFloat(uiValues.marginalTaxRate) / 100,
            termYears: parseInt(uiValues.termYears),
            annualMaintenanceCosts: parseFloat(uiValues.annualMaintenanceCosts), // UI calculated value
            amortizationYears: parseInt(uiValues.amortizationYears),
            annualAmortization: parseFloat(uiValues.annualAmortization),
            totalRenovations: 0,
            additionalPurchaseCosts: 5000, // Fixed CHF 5,000 default (user-editable)
            imputedRentalValue: parseFloat(uiValues.imputedRentalValue), // UI calculated value
            propertyTaxDeductions: parseFloat(uiValues.propertyTaxDeductions),
            annualRentalCosts: parseFloat(uiValues.annualRentalCosts)
        };
        
        const backendResultUI = SwissRentBuyCalculatorNode.calculate(backendParamsUI);
        
        console.log(`Backend Decision (UI values): ${backendResultUI.Decision}`);
        console.log(`Backend Result Value (UI values): CHF ${backendResultUI.ResultValue.toLocaleString()}`);
        console.log('');
        
        // Show key differences
        console.log('🔍 KEY PARAMETER DIFFERENCES:');
        console.log('─'.repeat(50));
        
        const keyFields = [
            'annualMaintenanceCosts',
            'imputedRentalValue',
            'annualAmortization'
        ];
        
        keyFields.forEach(field => {
            const generated = params[field] || backendParamsOriginal[field];
            const uiValue = parseFloat(uiValues[field]) || backendParamsUI[field];
            const diff = Math.abs(generated - uiValue);
            
            console.log(`   ${field}:`);
            console.log(`      Generated: CHF ${generated.toLocaleString()}`);
            console.log(`      UI Value:  CHF ${uiValue.toLocaleString()}`);
            console.log(`      Difference: CHF ${diff.toLocaleString()}`);
            console.log('');
        });
        
        // Summary comparison
        console.log('📊 RESULTS COMPARISON:');
        console.log('─'.repeat(50));
        console.log(`UI Result:                 ${uiDecision} CHF ${uiResultValue.toLocaleString()}`);
        console.log(`Backend (generated params): ${backendResultOriginal.Decision} CHF ${backendResultOriginal.ResultValue.toLocaleString()}`);
        console.log(`Backend (UI params):       ${backendResultUI.Decision} CHF ${backendResultUI.ResultValue.toLocaleString()}`);
        console.log('');
        
        const uiBackendDiff = Math.abs(uiResultValue - backendResultUI.ResultValue);
        console.log(`Difference (UI vs Backend with UI params): CHF ${uiBackendDiff.toLocaleString()}`);
        
        if (uiBackendDiff < 100) {
            console.log('✅ UI and Backend calculations match when using same parameters!');
        } else {
            console.log('❌ UI and Backend calculations still differ - deeper investigation needed');
        }
        
        // Keep browser open for inspection
        console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } finally {
        await browser.close();
    }
}

// Run if called directly
if (require.main === module) {
    debugParameterComparison().catch(console.error);
}

module.exports = { debugParameterComparison };