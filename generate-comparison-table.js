/**
 * Generate Comparison Table - Moneyland vs Our Calculator
 * Creates a formatted table showing the differences between moneyland.ch and our calculator
 */

const { MoneylandManualTester } = require('./test-moneyland-manual-cases.js');

class ComparisonTableGenerator {
    constructor() {
        this.tester = new MoneylandManualTester();
    }

    generateTable() {
        console.log('📊 MONEYLAND.CH vs OUR CALCULATOR COMPARISON TABLE');
        console.log('='.repeat(100));
        console.log('');

        // Load and run tests
        this.tester.loadTestCases();
        
        const results = [];
        for (const testCase of this.tester.testCases) {
            const result = this.tester.runSingleTest(testCase);
            results.push(result);
        }

        // Generate table header
        console.log('| Test Case | Moneyland Output | Calculator Output | Differences |');
        console.log('|-----------|------------------|-------------------|-------------|');

        // Generate table rows
        for (const result of results) {
            const testNum = result.testCase;
            const moneyland = result.moneylandResult;
            const calculator = result.ourResult;

            console.log(`| **${testNum}** | **Decision:** ${moneyland.decision}<br>**Advantage:** CHF ${moneyland.advantage.toLocaleString()}<br>**Buy Cost:** CHF ${moneyland.buyTotalCost.toLocaleString()}<br>**Rent Cost:** CHF ${moneyland.rentTotalCost.toLocaleString()} | **Decision:** ${calculator.Decision}<br>**Advantage:** CHF ${Math.abs(calculator.ResultValue).toLocaleString()}<br>**Buy Cost:** CHF ${calculator.TotalPurchaseCost.toLocaleString()}<br>**Rent Cost:** CHF ${calculator.TotalRentalCost.toLocaleString()} | **Decision:** ${result.decisionMatch ? '✅ Match' : '❌ Diff'}<br>**Advantage Diff:** CHF ${result.differences.advantage.toLocaleString()}<br>**Buy Cost Diff:** CHF ${result.differences.buyCost.toLocaleString()}<br>**Rent Cost Diff:** CHF ${result.differences.rentCost.toLocaleString()} |`);
        }

        console.log('');
        console.log('## Summary Statistics');
        console.log('');
        
        const avgAdvantage = results.reduce((sum, r) => sum + r.differences.advantage, 0) / results.length;
        const avgBuyCost = results.reduce((sum, r) => sum + r.differences.buyCost, 0) / results.length;
        const avgRentCost = results.reduce((sum, r) => sum + r.differences.rentCost, 0) / results.length;

        console.log(`- **Decision Match Rate:** ${results.filter(r => r.decisionMatch).length}/${results.length} (${(results.filter(r => r.decisionMatch).length/results.length*100).toFixed(1)}%)`);
        console.log(`- **Average Advantage Difference:** CHF ${avgAdvantage.toLocaleString()}`);
        console.log(`- **Average Buy Cost Difference:** CHF ${avgBuyCost.toLocaleString()}`);
        console.log(`- **Average Rent Cost Difference:** CHF ${avgRentCost.toLocaleString()}`);
        
        const maxAdvantage = Math.max(...results.map(r => r.differences.advantage));
        const maxBuyCost = Math.max(...results.map(r => r.differences.buyCost));
        const maxRentCost = Math.max(...results.map(r => r.differences.rentCost));

        console.log(`- **Maximum Advantage Difference:** CHF ${maxAdvantage.toLocaleString()}`);
        console.log(`- **Maximum Buy Cost Difference:** CHF ${maxBuyCost.toLocaleString()}`);
        console.log(`- **Maximum Rent Cost Difference:** CHF ${maxRentCost.toLocaleString()}`);

        return results;
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new ComparisonTableGenerator();
    generator.generateTable();
}

module.exports = { ComparisonTableGenerator };