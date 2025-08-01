/**
 * Simple test to validate parameter generation
 */

const { SwissParameterGenerator } = require('./random-parameter-test.js');

function testParameterGeneration() {
    console.log('🎲 Testing Swiss Parameter Generation');
    console.log('=' .repeat(50));
    
    const generator = new SwissParameterGenerator();
    
    // Generate 10 parameter sets
    const paramSets = generator.generateParameterSets(10);
    
    console.log(`✅ Generated ${paramSets.length} parameter sets`);
    console.log('');
    
    // Display each parameter set
    paramSets.forEach((params, index) => {
        console.log(`📊 Parameter Set ${index + 1} (${params.testId}):`);
        console.log(`   Purchase Price: CHF ${params.purchasePrice.toLocaleString()}`);
        console.log(`   Down Payment: CHF ${params.downPayment.toLocaleString()} (${params.downPaymentPercent}%)`);
        console.log(`   Mortgage Rate: ${params.mortgageRate.toFixed(2)}%`);
        console.log(`   Monthly Rent: CHF ${params.monthlyRent.toLocaleString()}`);
        console.log(`   Property Appreciation: ${params.propertyAppreciationRate.toFixed(2)}%`);
        console.log(`   Investment Yield: ${params.investmentYieldRate.toFixed(2)}%`);
        console.log(`   Marginal Tax Rate: ${params.marginalTaxRate.toFixed(1)}%`);
        console.log(`   Term: ${params.termYears} years`);
        console.log(`   Maintenance: CHF ${params.annualMaintenanceCosts.toLocaleString()} (${params.maintenancePercent}%)`);
        console.log(`   Amortization: ${params.amortizationYears} years`);
        console.log(`   Rent-to-Price Ratio: ${params.rentToPrice}%`);
        console.log('');
    });
    
    // Validate realistic ranges
    console.log('🔍 Validating realistic ranges...');
    let validationErrors = 0;
    
    paramSets.forEach((params, index) => {
        const errors = [];
        
        // Check realistic ranges
        if (params.purchasePrice < 500000 || params.purchasePrice > 5000000) {
            errors.push('Purchase price outside realistic range');
        }
        if (params.downPaymentPercent < 20 || params.downPaymentPercent > 80) {
            errors.push('Down payment percentage outside realistic range');
        }
        if (params.mortgageRate < 0.1 || params.mortgageRate > 10) {
            errors.push('Mortgage rate outside realistic range');
        }
        if (params.rentToPrice < 0.3 || params.rentToPrice > 0.8) {
            errors.push('Rent-to-price ratio outside realistic range');
        }
        
        if (errors.length > 0) {
            console.log(`❌ Parameter Set ${index + 1} validation errors:`);
            errors.forEach(error => console.log(`   - ${error}`));
            validationErrors += errors.length;
        }
    });
    
    if (validationErrors === 0) {
        console.log('✅ All parameter sets pass validation');
    } else {
        console.log(`⚠️  Found ${validationErrors} validation issues`);
    }
    
    console.log('');
    console.log('🎉 Parameter generation test complete!');
    
    return paramSets;
}

// Run test
if (require.main === module) {
    testParameterGeneration();
}

module.exports = { testParameterGeneration };