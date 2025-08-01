/**
 * Display the exact parameters being generated and used for testing
 */

const { SwissParameterGenerator } = require('./random-parameter-test.js');

function showTestParameters() {
    console.log('📊 SWISS RENT VS BUY CALCULATOR - TEST PARAMETERS');
    console.log('=' .repeat(80));
    
    const generator = new SwissParameterGenerator();
    
    // Show the parameter ranges being used
    console.log('🎯 PARAMETER GENERATION RANGES:');
    console.log('');
    
    console.log('💰 FINANCIAL PARAMETERS:');
    console.log(`   Purchase Price: CHF ${generator.ranges.purchasePrice.min.toLocaleString()} - ${generator.ranges.purchasePrice.max.toLocaleString()}`);
    console.log(`   Typical Range:  CHF ${generator.ranges.purchasePrice.typical[0].toLocaleString()} - ${generator.ranges.purchasePrice.typical[1].toLocaleString()}`);
    console.log(`   Down Payment:   ${generator.ranges.downPaymentPercent.min}% - ${generator.ranges.downPaymentPercent.max}%`);
    console.log(`   Typical Range:  ${generator.ranges.downPaymentPercent.typical[0]}% - ${generator.ranges.downPaymentPercent.typical[1]}%`);
    console.log('');
    
    console.log('📈 MARKET CONDITIONS:');
    console.log(`   Mortgage Rate:       ${generator.ranges.mortgageRatePercent.min}% - ${generator.ranges.mortgageRatePercent.max}%`);
    console.log(`   Typical Range:       ${generator.ranges.mortgageRatePercent.typical[0]}% - ${generator.ranges.mortgageRatePercent.typical[1]}%`);
    console.log(`   Property Appreciation: ${generator.ranges.propertyAppreciationPercent.min}% - ${generator.ranges.propertyAppreciationPercent.max}%`);
    console.log(`   Typical Range:       ${generator.ranges.propertyAppreciationPercent.typical[0]}% - ${generator.ranges.propertyAppreciationPercent.typical[1]}%`);
    console.log(`   Investment Yield:    ${generator.ranges.investmentYieldPercent.min}% - ${generator.ranges.investmentYieldPercent.max}%`);
    console.log(`   Typical Range:       ${generator.ranges.investmentYieldPercent.typical[0]}% - ${generator.ranges.investmentYieldPercent.typical[1]}%`);
    console.log('');
    
    console.log('🏛️ SWISS SPECIFIC:');
    console.log(`   Marginal Tax Rate:   ${generator.ranges.marginalTaxPercent.min}% - ${generator.ranges.marginalTaxPercent.max}%`);
    console.log(`   Typical Range:       ${generator.ranges.marginalTaxPercent.typical[0]}% - ${generator.ranges.marginalTaxPercent.typical[1]}%`);
    console.log(`   Maintenance Rate:    ${generator.ranges.maintenancePercent.min}% - ${generator.ranges.maintenancePercent.max}%`);
    console.log(`   Typical Range:       ${generator.ranges.maintenancePercent.typical[0]}% - ${generator.ranges.maintenancePercent.typical[1]}%`);
    console.log(`   Amortization Period: ${generator.ranges.amortizationYears.min} - ${generator.ranges.amortizationYears.max} years`);
    console.log(`   Typical Range:       ${generator.ranges.amortizationYears.typical[0]} - ${generator.ranges.amortizationYears.typical[1]} years`);
    console.log('');
    
    console.log('⏱️ ANALYSIS TERMS:');
    console.log(`   Term Years:     ${generator.ranges.termYears.min} - ${generator.ranges.termYears.max} years`);
    console.log(`   Typical Range:  ${generator.ranges.termYears.typical[0]} - ${generator.ranges.termYears.typical[1]} years`);
    console.log('');
    
    // Generate and show detailed examples
    console.log('📋 GENERATED PARAMETER EXAMPLES:');
    console.log('=' .repeat(80));
    
    const examples = generator.generateParameterSets(3);
    
    examples.forEach((params, index) => {
        console.log(`\n🏠 EXAMPLE ${index + 1} (Test ID: ${params.testId}):`);
        console.log('─'.repeat(50));
        
        console.log('💰 Purchase Information:');
        console.log(`   Purchase Price:        CHF ${params.purchasePrice.toLocaleString()}`);
        console.log(`   Down Payment:          CHF ${params.downPayment.toLocaleString()} (${params.downPaymentPercent}%)`);
        console.log(`   Mortgage Amount:       CHF ${params.mortgageAmount.toLocaleString()}`);
        console.log(`   Mortgage Rate:         ${params.mortgageRate.toFixed(3)}%`);
        console.log(`   Additional Costs:      CHF ${params.additionalPurchaseCosts.toLocaleString()}`);
        console.log('');
        
        console.log('🏡 Property Details:');
        console.log(`   Annual Maintenance:    CHF ${params.annualMaintenanceCosts.toLocaleString()} (${params.maintenancePercent}%)`);
        console.log(`   Property Appreciation: ${params.propertyAppreciationRate.toFixed(2)}%`);
        console.log(`   Amortization Period:   ${params.amortizationYears} years`);
        console.log(`   Annual Amortization:   CHF ${params.annualAmortization.toLocaleString()}`);
        console.log('');
        
        console.log('🏢 Rental Scenario:');
        console.log(`   Monthly Rent:          CHF ${params.monthlyRent.toLocaleString()}`);
        console.log(`   Annual Rent:           CHF ${(params.monthlyRent * 12).toLocaleString()}`);
        console.log(`   Rent-to-Price Ratio:   ${params.rentToPrice.toFixed(2)}%`);
        console.log(`   Annual Rental Costs:   CHF ${params.annualRentalCosts.toLocaleString()}`);
        console.log(`   Investment Yield:      ${params.investmentYieldRate.toFixed(2)}%`);
        console.log('');
        
        console.log('🏛️ Swiss Tax Parameters:');
        console.log(`   Marginal Tax Rate:     ${params.marginalTaxRate.toFixed(2)}%`);
        console.log(`   Imputed Rental Value:  CHF ${params.imputedRentalValue.toLocaleString()}`);
        console.log(`   Property Tax Deductions: CHF ${params.propertyTaxDeductions.toLocaleString()}`);
        console.log('');
        
        console.log('⏱️ Analysis:');
        console.log(`   Term Years:            ${params.termYears} years`);
        console.log(`   Total Renovations:     CHF ${params.totalRenovations.toLocaleString()}`);
        console.log('');
        
        // Show the parameters as they would be sent to backend calculator
        console.log('🔧 BACKEND CALCULATOR PARAMETERS:');
        const backendParams = {
            purchasePrice: params.purchasePrice,
            downPayment: params.downPayment,
            mortgageRate: params.mortgageRate / 100, // Convert to decimal
            monthlyRent: params.monthlyRent,
            propertyAppreciationRate: params.propertyAppreciationRate / 100, // Convert to decimal
            investmentYieldRate: params.investmentYieldRate / 100, // Convert to decimal
            marginalTaxRate: params.marginalTaxRate / 100, // Convert to decimal
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
        
        Object.entries(backendParams).forEach(([key, value]) => {
            if (typeof value === 'number') {
                if (key.includes('Rate') && value < 1) {
                    console.log(`   ${key.padEnd(25)}: ${(value * 100).toFixed(3)}% (${value.toFixed(6)})`);
                } else if (value >= 1000) {
                    console.log(`   ${key.padEnd(25)}: ${Math.round(value).toLocaleString()}`);
                } else {
                    console.log(`   ${key.padEnd(25)}: ${value.toFixed(2)}`);
                }
            } else {
                console.log(`   ${key.padEnd(25)}: ${value}`);
            }
        });
        
        // Show UI form field mappings
        console.log('');
        console.log('🖥️ UI FORM FIELD MAPPINGS:');
        const uiMappings = {
            '#purchasePrice': params.purchasePrice,
            '#downPayment': params.downPayment,
            '#mortgageRate': params.mortgageRate,
            '#monthlyRent': params.monthlyRent,
            '#propertyAppreciation': params.propertyAppreciationRate,
            '#investmentYield': params.investmentYieldRate,
            '#marginalTaxRate': params.marginalTaxRate,
            '#termYears': params.termYears,
            '#amortizationYears': params.amortizationYears,
            // Note: Some fields are auto-calculated and disabled
            '#annualMaintenanceCosts': `${params.annualMaintenanceCosts} (auto-calculated)`,
            '#imputedRentalValue': `${params.imputedRentalValue} (auto-calculated)`,
            '#propertyTaxDeductions': params.propertyTaxDeductions,
            '#annualRentalCosts': params.annualRentalCosts
        };
        
        Object.entries(uiMappings).forEach(([field, value]) => {
            console.log(`   ${field.padEnd(25)}: ${value}`);
        });
    });
    
    console.log('\n🎯 KEY INSIGHTS:');
    console.log('─'.repeat(50));
    console.log('• Parameters are generated with Swiss market realism in mind');
    console.log('• 70% bias toward "typical" ranges, 30% full range coverage');
    console.log('• Rent-to-price ratios calculated to be realistic (3-7% annual yield)');
    console.log('• All Swiss-specific parameters included (imputed rental value, tax deductions)');
    console.log('• Backend uses decimal rates (0.02) while UI uses percentages (2.0%)');
    console.log('• Some UI fields are auto-calculated and may differ from generated values');
    console.log('');
    
    return examples;
}

// Run if called directly
if (require.main === module) {
    showTestParameters();
}

module.exports = { showTestParameters };