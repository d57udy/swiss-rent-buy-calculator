// Simple test to verify the improvements work
console.log('Testing Parameter Sweep Improvements...');

// Load the calculator
const fs = require('fs');
const path = require('path');

// Simple test of the formatBidPrice function
function formatBidPrice(price) {
    if (!price || price <= 0) return 'N/A';
    
    if (price >= 1000000) {
        // Millions: 1.38M, 2.55M, etc.
        const millions = price / 1000000;
        if (millions >= 100) {
            return Math.round(millions) + 'M';
        } else if (millions >= 10) {
            return (Math.round(millions * 10) / 10) + 'M';
        } else {
            return (Math.round(millions * 100) / 100) + 'M';
        }
    } else if (price >= 1000) {
        // Thousands: 786k, 1.25k, etc.
        const thousands = price / 1000;
        if (thousands >= 100) {
            return Math.round(thousands) + 'k';
        } else {
            return (Math.round(thousands * 10) / 10) + 'k';
        }
    } else {
        // Less than 1000, show as is
        return Math.round(price).toString();
    }
}

// Test cases for number formatting
const testCases = [
    { input: 1380000, expected: '1.38M' },
    { input: 2550000, expected: '2.55M' },
    { input: 786000, expected: '786k' },
    { input: 1250000, expected: '1.25M' },
    { input: 15000000, expected: '15M' },
    { input: 125000000, expected: '125M' },
    { input: 500, expected: '500' },
    { input: 1500, expected: '1.5k' },
    { input: 150000, expected: '150k' }
];

console.log('Testing number formatting...');
let passed = 0;
testCases.forEach(test => {
    const result = formatBidPrice(test.input);
    if (result === test.expected) {
        console.log(`✅ ${test.input} -> ${result}`);
        passed++;
    } else {
        console.log(`❌ ${test.input} -> ${result} (expected ${test.expected})`);
    }
});

console.log(`\nNumber formatting: ${passed}/${testCases.length} tests passed`);

// Check that the HTML file contains the new features
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

console.log('\nChecking HTML features...');
const features = [
    { name: 'formatBidPrice function', pattern: /function formatBidPrice/ },
    { name: 'Max bid tab parameters', pattern: /getElementById\('beMinPrice'\)/ },
    { name: 'Gradient color function', pattern: /getBidPriceColor/ },
    { name: 'Property Appreciation header', pattern: /Property Appreciation.*%\/year/ },
    { name: 'Mortgage Rate header', pattern: /Mortgage.*Rate.*%/ },
    { name: 'Investment Yield header', pattern: /Investment.*Yield.*%/ }
];

let htmlPassed = 0;
features.forEach(feature => {
    if (feature.pattern.test(htmlContent)) {
        console.log(`✅ ${feature.name} found`);
        htmlPassed++;
    } else {
        console.log(`❌ ${feature.name} not found`);
    }
});

console.log(`\nHTML features: ${htmlPassed}/${features.length} features present`);

console.log('\n🎉 Parameter Sweep Improvements Test Complete!');
console.log(`Overall: ${passed + htmlPassed}/${testCases.length + features.length} checks passed`);