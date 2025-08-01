/**
 * Deep analysis of discrepancies between frontend and backend calculations
 * Compares step-by-step calculations to identify exact divergence points
 */

const { chromium } = require('playwright');
const { SwissParameterGenerator } = require('./random-parameter-test.js');
const { SwissRentBuyCalculatorNode } = require('./backend-validation-test.js');
const path = require('path');

class DiscrepancyAnalyzer {
    constructor() {
        this.generator = new SwissParameterGenerator();
    }

    /**
     * Extract detailed calculation results from frontend using browser console
     */
    async extractFrontendCalculationDetails(page, params) {
        // Fill the form
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
        
        await page.waitForTimeout(1000);
        
        // Get the actual UI input values
        const uiInputs = {};
        const fieldIds = [
            'purchasePrice', 'downPayment', 'mortgageRate', 'monthlyRent',
            'propertyAppreciation', 'investmentYield', 'marginalTaxRate', 'termYears',
            'amortizationYears', 'annualMaintenanceCosts', 'imputedRentalValue',
            'propertyTaxDeductions', 'annualRentalCosts', 'annualAmortization'
        ];
        
        for (const fieldId of fieldIds) {
            try {
                uiInputs[fieldId] = await page.inputValue(`#${fieldId}`);
            } catch (e) {
                uiInputs[fieldId] = '0';
            }
        }
        
        // Inject detailed logging into the frontend calculation
        const detailedResults = await page.evaluate(() => {
            // Re-run the calculation with detailed logging
            const params = {
                purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
                downPayment: parseFloat(document.getElementById('downPayment').value),
                mortgageRate: parseFloat(document.getElementById('mortgageRate').value) / 100,
                monthlyRent: parseFloat(document.getElementById('monthlyRent').value),
                propertyAppreciationRate: parseFloat(document.getElementById('propertyAppreciation').value) / 100,
                investmentYieldRate: parseFloat(document.getElementById('investmentYield').value) / 100,
                marginalTaxRate: parseFloat(document.getElementById('marginalTaxRate').value) / 100,
                termYears: parseInt(document.getElementById('termYears').value),
                annualMaintenanceCosts: parseFloat(document.getElementById('annualMaintenanceCosts').value),
                amortizationYears: parseInt(document.getElementById('amortizationYears').value),
                annualAmortization: parseFloat(document.getElementById('annualAmortization').value),
                totalRenovations: 0,
                additionalPurchaseCosts: 5000, // Fixed CHF 5,000 default
                imputedRentalValue: parseFloat(document.getElementById('imputedRentalValue').value),
                propertyTaxDeductions: parseFloat(document.getElementById('propertyTaxDeductions').value),
                annualRentalCosts: parseFloat(document.getElementById('annualRentalCosts').value)
            };
            
            const details = {
                inputs: params,
                calculations: {}
            };
            
            // Try to access the SwissRentBuyCalculator class if it exists
            if (typeof SwissRentBuyCalculator !== 'undefined') {
                try {
                    const result = SwissRentBuyCalculator.calculate(params);
                    details.frontendResult = result;
                    details.calculations.frontendAvailable = true;
                } catch (e) {
                    details.calculations.frontendError = e.message;
                    details.calculations.frontendAvailable = false;
                }
            } else {
                details.calculations.frontendAvailable = false;
                details.calculations.note = 'SwissRentBuyCalculator class not accessible from browser console';
            }
            
            return details;
        });
        
        // Click calculate to get UI result
        await page.click('button:has-text("Calculate")');
        await page.waitForSelector('#singleResults', { state: 'visible' });
        await page.waitForTimeout(1000);
        
        // Extract final UI results
        const resultsContent = await page.textContent('#singleResults');
        
        let uiDecision = 'UNKNOWN';
        let uiResultValue = 0;
        
        if (resultsContent.includes('BUY') || resultsContent.toLowerCase().includes('buying')) {
            uiDecision = 'BUY';
        } else if (resultsContent.includes('RENT') || resultsContent.toLowerCase().includes('renting')) {
            uiDecision = 'RENT';
        }
        
        const numericMatches = resultsContent.match(/CHF\s*[\d,]+\.?\d*/g);
        if (numericMatches && numericMatches.length > 0) {
            uiResultValue = parseFloat(numericMatches[0].replace(/[CHF,\s]/g, ''));
        }
        
        return {
            uiInputs,
            detailedResults,
            finalResult: {
                decision: uiDecision,
                resultValue: uiResultValue,
                rawContent: resultsContent
            }
        };
    }

    /**
     * Perform detailed backend calculation with step-by-step breakdown
     */
    performDetailedBackendCalculation(params) {
        const details = {
            inputs: params,
            steps: {},
            intermediateResults: {}
        };
        
        // Step 1: Basic calculations
        const mortgageAmount = params.purchasePrice - params.downPayment;
        details.steps.mortgageAmount = mortgageAmount;
        
        // Step 2: Interest calculation (declining balance)
        let totalInterestPaid = 0;
        let remainingBalance = mortgageAmount;
        const interestByYear = [];
        
        for (let year = 0; year < params.termYears; year++) {
            const annualInterest = remainingBalance * params.mortgageRate;
            totalInterestPaid += annualInterest;
            interestByYear.push({
                year: year + 1,
                remainingBalance,
                annualInterest,
                totalInterestSoFar: totalInterestPaid
            });
            remainingBalance -= params.annualAmortization;
            if (remainingBalance < 0) remainingBalance = 0;
        }
        
        details.steps.interestCalculation = {
            totalInterestPaid,
            interestByYear,
            finalBalance: remainingBalance
        };
        
        // Step 3: Purchase costs
        const supplementalMaintenanceCosts = params.annualMaintenanceCosts * params.termYears;
        const amortizationCosts = params.annualAmortization * params.termYears;
        const generalCostOfPurchase = totalInterestPaid + supplementalMaintenanceCosts + amortizationCosts + 
                                    params.totalRenovations + params.additionalPurchaseCosts;
        
        details.steps.purchaseCosts = {
            totalInterestPaid,
            supplementalMaintenanceCosts,
            amortizationCosts,
            renovationExpenses: params.totalRenovations,
            additionalPurchaseExpenses: params.additionalPurchaseCosts,
            generalCostOfPurchase
        };
        
        // Step 4: Property value and remaining mortgage
        const propertyValueEnd = params.purchasePrice * Math.pow(1 + params.propertyAppreciationRate, params.termYears);
        const mortgageAtEnd = Math.max(0, mortgageAmount - amortizationCosts);
        
        details.steps.endValues = {
            propertyValueEnd,
            mortgageAtEnd
        };
        
        // Step 5: Tax calculations (year by year)
        let totalTaxDifference = 0;
        let remainingMortgage = mortgageAmount;
        const investableAmount = params.downPayment + params.additionalPurchaseCosts;
        
        // Investment tax calculations
        const simpleInterestTotal = investableAmount * params.investmentYieldRate * params.termYears;
        const compoundInterestTotal = investableAmount * (Math.pow(1 + params.investmentYieldRate, params.termYears) - 1);
        const simpleInterestTaxTotal = simpleInterestTotal * params.marginalTaxRate;
        const compoundInterestGains = compoundInterestTotal - simpleInterestTotal;
        const compoundInterestGainsTax = compoundInterestGains * params.marginalTaxRate;
        const totalInvestmentIncomeTax = simpleInterestTaxTotal + compoundInterestGainsTax;
        const annualInvestmentIncomeTax = totalInvestmentIncomeTax / params.termYears;
        
        details.steps.investmentTax = {
            investableAmount,
            simpleInterestTotal,
            compoundInterestTotal,
            simpleInterestTaxTotal,
            compoundInterestGains,
            compoundInterestGainsTax,
            totalInvestmentIncomeTax,
            annualInvestmentIncomeTax
        };
        
        const taxByYear = [];
        for (let year = 0; year < params.termYears; year++) {
            const annualInterest = remainingMortgage * params.mortgageRate;
            const annualTaxSavingsInterest = annualInterest * params.marginalTaxRate;
            const annualTaxCostImputedRental = params.imputedRentalValue * params.marginalTaxRate;
            const annualTaxSavingsPropertyExpenses = params.propertyTaxDeductions * params.marginalTaxRate;
            
            const annualNetTaxDifference = (
                annualTaxCostImputedRental - 
                annualTaxSavingsInterest - 
                annualTaxSavingsPropertyExpenses -
                annualInvestmentIncomeTax
            );
            
            totalTaxDifference += annualNetTaxDifference;
            
            taxByYear.push({
                year: year + 1,
                remainingMortgage,
                annualInterest,
                annualTaxSavingsInterest,
                annualTaxCostImputedRental,
                annualTaxSavingsPropertyExpenses,
                annualInvestmentIncomeTax,
                annualNetTaxDifference,
                totalTaxDifferenceSoFar: totalTaxDifference
            });
            
            remainingMortgage -= params.annualAmortization;
            if (remainingMortgage < 0) remainingMortgage = 0;
        }
        
        details.steps.taxCalculation = {
            totalTaxDifference,
            taxByYear
        };
        
        // Step 6: Total costs
        const totalPurchaseCost = generalCostOfPurchase + totalTaxDifference - propertyValueEnd + mortgageAtEnd;
        
        // Rental calculations
        const generalCostOfRental = (params.monthlyRent * 12 * params.termYears) + (params.annualRentalCosts * params.termYears);
        const yieldsOnAssets = investableAmount * (Math.pow(1 + params.investmentYieldRate, params.termYears) - 1);
        const totalRentalCost = generalCostOfRental - yieldsOnAssets - params.downPayment;
        
        details.steps.rentalCosts = {
            generalCostOfRental,
            yieldsOnAssets,
            totalRentalCost
        };
        
        // Final result
        const resultValue = totalRentalCost - totalPurchaseCost;
        const decision = resultValue > 0 ? "BUY" : resultValue < 0 ? "RENT" : "EVEN";
        
        details.finalResult = {
            totalPurchaseCost,
            totalRentalCost,
            resultValue,
            decision
        };
        
        // Run the actual backend calculation for comparison
        const backendResult = SwissRentBuyCalculatorNode.calculate(params);
        details.backendResult = backendResult;
        
        return details;
    }

    /**
     * Compare frontend and backend calculations step by step
     */
    async analyzeDiscrepancy() {
        console.log('🔍 FRONTEND vs BACKEND DISCREPANCY ANALYSIS');
        console.log('=' .repeat(80));
        
        // Generate a test scenario
        const testParams = this.generator.generateParameters();
        testParams.testId = 'discrepancy-analysis';
        
        console.log('📊 TEST SCENARIO:');
        console.log('─'.repeat(50));
        console.log(`Purchase Price: CHF ${testParams.purchasePrice.toLocaleString()}`);
        console.log(`Down Payment: CHF ${testParams.downPayment.toLocaleString()}`);
        console.log(`Mortgage Rate: ${testParams.mortgageRate.toFixed(3)}%`);
        console.log(`Monthly Rent: CHF ${testParams.monthlyRent.toLocaleString()}`);
        console.log(`Term: ${testParams.termYears} years`);
        console.log('');
        
        // Initialize browser
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();
        
        try {
            const indexPath = path.join(__dirname, 'index.html');
            await page.goto(`file://${indexPath}`);
            await page.waitForLoadState('networkidle');
            
            console.log('🖥️ ANALYZING FRONTEND CALCULATION...');
            const frontendAnalysis = await this.extractFrontendCalculationDetails(page, testParams);
            
            console.log('🔧 ANALYZING BACKEND CALCULATION...');
            
            // Create backend parameters using the actual UI values
            const backendParams = {
                purchasePrice: parseFloat(frontendAnalysis.uiInputs.purchasePrice),
                downPayment: parseFloat(frontendAnalysis.uiInputs.downPayment),
                mortgageRate: parseFloat(frontendAnalysis.uiInputs.mortgageRate) / 100,
                monthlyRent: parseFloat(frontendAnalysis.uiInputs.monthlyRent),
                propertyAppreciationRate: parseFloat(frontendAnalysis.uiInputs.propertyAppreciation) / 100,
                investmentYieldRate: parseFloat(frontendAnalysis.uiInputs.investmentYield) / 100,
                marginalTaxRate: parseFloat(frontendAnalysis.uiInputs.marginalTaxRate) / 100,
                termYears: parseInt(frontendAnalysis.uiInputs.termYears),
                annualMaintenanceCosts: parseFloat(frontendAnalysis.uiInputs.annualMaintenanceCosts),
                amortizationYears: parseInt(frontendAnalysis.uiInputs.amortizationYears),
                annualAmortization: parseFloat(frontendAnalysis.uiInputs.annualAmortization),
                totalRenovations: 0,
                additionalPurchaseCosts: 5000, // Fixed CHF 5,000 default
                imputedRentalValue: parseFloat(frontendAnalysis.uiInputs.imputedRentalValue),
                propertyTaxDeductions: parseFloat(frontendAnalysis.uiInputs.propertyTaxDeductions),
                annualRentalCosts: parseFloat(frontendAnalysis.uiInputs.annualRentalCosts)
            };
            
            const backendAnalysis = this.performDetailedBackendCalculation(backendParams);
            
            // Display comprehensive comparison
            console.log('📋 PARAMETER COMPARISON:');
            console.log('─'.repeat(80));
            console.log('Parameter                    | Frontend Value      | Backend Value       | Match');
            console.log('─'.repeat(80));
            
            const parameterNames = [
                'purchasePrice', 'downPayment', 'mortgageRate', 'monthlyRent',
                'propertyAppreciationRate', 'investmentYieldRate', 'marginalTaxRate',
                'termYears', 'annualMaintenanceCosts', 'annualAmortization',
                'imputedRentalValue', 'propertyTaxDeductions', 'annualRentalCosts'
            ];
            
            parameterNames.forEach(param => {
                let frontendVal, backendVal;
                
                // Map parameter names to correct UI field IDs
                const fieldMappings = {
                    'mortgageRate': 'mortgageRate',
                    'propertyAppreciationRate': 'propertyAppreciation', 
                    'investmentYieldRate': 'investmentYield',
                    'marginalTaxRate': 'marginalTaxRate'
                };
                
                if (param === 'mortgageRate' || param === 'propertyAppreciationRate' || 
                    param === 'investmentYieldRate' || param === 'marginalTaxRate') {
                    const fieldId = fieldMappings[param];
                    frontendVal = parseFloat(frontendAnalysis.uiInputs[fieldId]) || 0;
                    backendVal = backendParams[param] * 100; // Backend uses decimals, UI uses percentages
                } else {
                    frontendVal = parseFloat(frontendAnalysis.uiInputs[param]) || 0;
                    backendVal = backendParams[param] || 0;
                }
                
                const match = Math.abs(frontendVal - backendVal) < 0.01 ? '✅' : '❌';
                const frontendStr = frontendVal >= 1000 ? frontendVal.toLocaleString() : frontendVal.toFixed(3);
                const backendStr = backendVal >= 1000 ? backendVal.toLocaleString() : backendVal.toFixed(3);
                
                console.log(
                    `${param.padEnd(28)} | ${frontendStr.padEnd(19)} | ${backendStr.padEnd(19)} | ${match}`
                );
            });
            
            console.log('─'.repeat(80));
            console.log('');
            
            // Display calculation step comparison
            console.log('🧮 CALCULATION BREAKDOWN:');
            console.log('─'.repeat(80));
            
            console.log('📊 INTERMEDIATE CALCULATIONS:');
            console.log(`Mortgage Amount: CHF ${backendAnalysis.steps.mortgageAmount.toLocaleString()}`);
            console.log(`Total Interest: CHF ${backendAnalysis.steps.interestCalculation.totalInterestPaid.toLocaleString()}`);
            console.log(`Maintenance Costs: CHF ${backendAnalysis.steps.purchaseCosts.supplementalMaintenanceCosts.toLocaleString()}`);
            console.log(`Amortization Costs: CHF ${backendAnalysis.steps.purchaseCosts.amortizationCosts.toLocaleString()}`);
            console.log(`Property Value End: CHF ${backendAnalysis.steps.endValues.propertyValueEnd.toLocaleString()}`);
            console.log(`Tax Difference: CHF ${backendAnalysis.steps.taxCalculation.totalTaxDifference.toLocaleString()}`);
            console.log('');
            
            // Final results comparison
            console.log('🎯 FINAL RESULTS COMPARISON:');
            console.log('─'.repeat(80));
            console.log('Metric                | Frontend           | Backend            | Difference');
            console.log('─'.repeat(80));
            
            const frontendValue = frontendAnalysis.finalResult.resultValue;
            const backendValue = backendAnalysis.finalResult.resultValue;
            const difference = Math.abs(frontendValue - backendValue);
            
            console.log(
                `Decision              | ${frontendAnalysis.finalResult.decision.padEnd(18)} | ` +
                `${backendAnalysis.finalResult.decision.padEnd(18)} | ` +
                `${frontendAnalysis.finalResult.decision === backendAnalysis.finalResult.decision ? 'MATCH' : 'DIFFER'}`
            );
            console.log(
                `Result Value          | CHF ${Math.abs(frontendValue).toLocaleString().padEnd(14)} | ` +
                `CHF ${Math.abs(backendValue).toLocaleString().padEnd(14)} | ` +
                `CHF ${difference.toLocaleString()}`
            );
            console.log('─'.repeat(80));
            
            console.log('');
            console.log('🔍 DISCREPANCY ANALYSIS:');
            console.log('─'.repeat(50));
            
            if (difference < 100) {
                console.log('✅ Results are very close - likely rounding differences');
            } else if (difference < 10000) {
                console.log('⚠️  Moderate difference - check calculation methods');
            } else {
                console.log('❌ Significant difference - major calculation divergence');
            }
            
            console.log(`Value difference: CHF ${difference.toLocaleString()}`);
            console.log(`Relative difference: ${(difference / Math.abs(backendValue) * 100).toFixed(2)}%`);
            
            if (frontendAnalysis.finalResult.decision !== backendAnalysis.finalResult.decision) {
                console.log('🚨 CRITICAL: Different decisions - this affects the recommendation!');
            }
            
            // Keep browser open for inspection
            console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            return {
                frontendAnalysis,
                backendAnalysis,
                difference,
                parametersMatch: true // Will implement parameter validation
            };
            
        } finally {
            await browser.close();
        }
    }
}

// Run if called directly
if (require.main === module) {
    const analyzer = new DiscrepancyAnalyzer();
    analyzer.analyzeDiscrepancy().catch(console.error);
}

module.exports = { DiscrepancyAnalyzer };