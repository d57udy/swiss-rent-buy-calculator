/**
 * Deep Debug Analysis - Find Exact Sources of >CHF 1K Differences
 * Line-by-line comparison of each calculation component
 */

const fs = require('fs');
const path = require('path');
const SwissRentBuyCalculator = require('./calculator.js');

class DeepDebugAnalyzer {
    constructor() {
        this.testCases = [];
    }

    loadTestCases() {
        const testFilePath = path.join(__dirname, 'moneyland-manual-test-cases.json');
        const rawData = fs.readFileSync(testFilePath, 'utf8');
        this.testCases = JSON.parse(rawData);
    }

    analyzeTestCase(testCaseNum) {
        const testCase = this.testCases.find(tc => tc.testCase === testCaseNum);
        if (!testCase) return;

        console.log(`🔬 DEEP ANALYSIS - TEST CASE ${testCaseNum}`);
        console.log('='.repeat(80));
        console.log(testCase.description);
        console.log('');

        const params = testCase.params;
        const moneyland = testCase.moneylandResult;

        // Convert parameters for our calculator
        const calculatorParams = {
            ...params,
            mortgageRate: params.mortgageRate / 100,
            marginalTaxRate: params.marginalTaxRate / 100,
            propertyAppreciationRate: params.propertyAppreciationRate / 100,
            investmentYieldRate: params.investmentYieldRate / 100
        };

        const result = SwissRentBuyCalculator.calculate(calculatorParams);

        // Get the exact moneyland breakdown for this test case
        const moneylandBreakdowns = this.getMoneylandBreakdown(testCaseNum);

        console.log('📊 DETAILED COMPONENT COMPARISON:');
        console.log('─'.repeat(80));
        console.log('Component                    | Our Calc      | Moneyland     | Difference    | Status');
        console.log('─'.repeat(80));

        // BUY COST COMPONENTS
        this.compareComponent('Interest Costs', result.InterestCosts, moneylandBreakdowns.buy.interest, 50);
        this.compareComponent('Maintenance Costs', result.SupplementalMaintenanceCosts, moneylandBreakdowns.buy.maintenance, 50);
        this.compareComponent('Amortization', result.AmortizationCosts, moneylandBreakdowns.buy.amortization, 50);
        this.compareComponent('Renovations', result.RenovationExpenses, moneylandBreakdowns.buy.renovation, 50);
        this.compareComponent('Additional Purchase', result.AdditionalPurchaseExpensesOutput, moneylandBreakdowns.buy.additional, 50);
        this.compareComponent('Tax Difference', result.TaxDifferenceToRental, moneylandBreakdowns.buy.taxDiff, 200);
        this.compareComponent('Property Value (end)', -result.MinusPropertyValue, moneylandBreakdowns.buy.propertyValue, 200);
        this.compareComponent('Remaining Mortgage', result.MortgageAtEndOfRelevantTimePeriod, moneylandBreakdowns.buy.remainingMortgage, 50);

        console.log('─'.repeat(80));
        this.compareComponent('TOTAL BUY COST', result.TotalPurchaseCost, moneyland.buyTotalCost, 1000);

        console.log('');
        console.log('─'.repeat(80));

        // RENT COST COMPONENTS  
        this.compareComponent('Rental Costs', result.GeneralCostOfRental, moneylandBreakdowns.rent.rental, 50);
        this.compareComponent('Investment Yields', result.ExcludingYieldsOnAssets, moneylandBreakdowns.rent.yields, 1000);
        this.compareComponent('Down Payment Opport.', result.ExcludingDownPayment, moneylandBreakdowns.rent.downPayment, 50);

        console.log('─'.repeat(80));
        this.compareComponent('TOTAL RENT COST', result.TotalRentalCost, moneyland.rentTotalCost, 1000);

        console.log('');
        console.log('─'.repeat(80));
        this.compareComponent('FINAL ADVANTAGE', Math.abs(result.ResultValue), moneyland.advantage, 1000);

        console.log('');
        console.log('🎯 CRITICAL DIFFERENCES (>CHF 1K):');
        console.log('─'.repeat(50));
        
        // Identify critical differences
        const criticalDiffs = [];
        
        if (Math.abs(result.ExcludingYieldsOnAssets - moneylandBreakdowns.rent.yields) > 1000) {
            criticalDiffs.push(`Investment Yields: CHF ${Math.abs(result.ExcludingYieldsOnAssets - moneylandBreakdowns.rent.yields).toLocaleString()}`);
        }
        if (Math.abs(result.TotalRentalCost - moneyland.rentTotalCost) > 1000) {
            criticalDiffs.push(`Total Rent Cost: CHF ${Math.abs(result.TotalRentalCost - moneyland.rentTotalCost).toLocaleString()}`);
        }
        if (Math.abs(result.TotalPurchaseCost - moneyland.buyTotalCost) > 1000) {
            criticalDiffs.push(`Total Buy Cost: CHF ${Math.abs(result.TotalPurchaseCost - moneyland.buyTotalCost).toLocaleString()}`);
        }

        if (criticalDiffs.length > 0) {
            criticalDiffs.forEach(diff => console.log(`❌ ${diff}`));
        } else {
            console.log('✅ No critical differences >CHF 1K found');
        }

        return {
            testCase: testCaseNum,
            criticalDiffs: criticalDiffs.length,
            maxDifference: Math.max(
                Math.abs(result.ExcludingYieldsOnAssets - moneylandBreakdowns.rent.yields),
                Math.abs(result.TotalRentalCost - moneyland.rentTotalCost),
                Math.abs(result.TotalPurchaseCost - moneyland.buyTotalCost)
            )
        };
    }

    compareComponent(name, ourValue, moneylandValue, threshold) {
        const diff = Math.abs(ourValue - moneylandValue);
        const status = diff <= threshold ? '✅' : '❌';
        const nameFormatted = name.padEnd(28);
        const ourFormatted = `CHF ${ourValue.toLocaleString()}`.padEnd(13);
        const moneylandFormatted = `CHF ${moneylandValue.toLocaleString()}`.padEnd(13);
        const diffFormatted = `CHF ${diff.toLocaleString()}`.padEnd(13);
        
        console.log(`${nameFormatted} | ${ourFormatted} | ${moneylandFormatted} | ${diffFormatted} | ${status}`);
    }

    getMoneylandBreakdown(testCaseNum) {
        // Moneyland breakdown data for each test case
        const breakdowns = {
            1: {
                buy: {
                    interest: 181500,
                    maintenance: 210000,
                    amortization: 1650000,
                    renovation: 200000,
                    additional: 1000,
                    taxDiff: -11281.90,
                    propertyValue: 2319706.45,
                    remainingMortgage: 0
                },
                rent: {
                    rental: 860000,
                    yields: -155106.30,
                    downPayment: -450000
                }
            },
            2: {
                buy: {
                    interest: 93150,
                    maintenance: 120000,
                    amortization: 1150000,
                    renovation: 10000,
                    additional: 5000,
                    taxDiff: 17485.50,
                    propertyValue: 1624285.05,
                    remainingMortgage: 0
                },
                rent: {
                    rental: 436000,
                    yields: -87765,
                    downPayment: -350000
                }
            },
            3: {
                buy: {
                    interest: 791343.75,
                    maintenance: 675000,
                    amortization: 2156250,
                    renovation: 10000,
                    additional: 10000,
                    taxDiff: -462800.75,
                    propertyValue: 5224360.30,
                    remainingMortgage: 1143750
                },
                rent: {
                    rental: 1599000,
                    yields: -1199825.50,
                    downPayment: -1200000
                }
            },
            4: {
                buy: {
                    interest: 91375,
                    maintenance: 88000,
                    amortization: 175000,
                    renovation: 300,
                    additional: 6250,
                    taxDiff: 15675.30,
                    propertyValue: 1027358.35,
                    remainingMortgage: 425000
                },
                rent: {
                    rental: 391600,
                    yields: -185274.10,
                    downPayment: -200000
                }
            },
            5: {
                buy: {
                    interest: 242340,
                    maintenance: 200000,
                    amortization: 315000,
                    renovation: 2000,
                    additional: 7150,
                    taxDiff: -38854.60,
                    propertyValue: 2344051.10,
                    remainingMortgage: 1285000
                },
                rent: {
                    rental: 670000,
                    yields: -167175.30,
                    downPayment: -400000
                }
            },
            6: {
                buy: {
                    interest: 525357,
                    maintenance: 315000,
                    amortization: 1080000,
                    renovation: 7000,
                    additional: 9000,
                    taxDiff: -55115.90,
                    propertyValue: 4219876.35,
                    remainingMortgage: 2270000
                },
                rent: {
                    rental: 786636,
                    yields: -109627.15,
                    downPayment: -150000
                }
            },
            7: {
                buy: {
                    interest: 36288,
                    maintenance: 65000,
                    amortization: 110000,
                    renovation: 10000,
                    additional: 7646,
                    taxDiff: 170259.10,
                    propertyValue: 655095.55,
                    remainingMortgage: 240000
                },
                rent: {
                    rental: 299000,
                    yields: -138150.25,
                    downPayment: -150000
                }
            },
            8: {
                buy: {
                    interest: 1206000,
                    maintenance: 1360000,
                    amortization: 750000,
                    renovation: 20000,
                    additional: 11000,
                    taxDiff: -1271211.75,
                    propertyValue: 10125988.15,
                    remainingMortgage: 5250000
                },
                rent: {
                    rental: 2137600,
                    yields: -2805517.35,
                    downPayment: -2500000
                }
            },
            9: {
                buy: {
                    interest: 222432,
                    maintenance: 350000,
                    amortization: 420000,
                    renovation: 10000,
                    additional: 6000,
                    taxDiff: -152718.15,
                    propertyValue: 2913776.15,
                    remainingMortgage: 1430000
                },
                rent: {
                    rental: 1428000,
                    yields: -827153.00,
                    downPayment: -650000
                }
            },
            10: {
                buy: {
                    interest: 187026.55,
                    maintenance: 200000,
                    amortization: 283000,
                    renovation: 10000,
                    additional: 7352,
                    taxDiff: 10448.85,
                    propertyValue: 2353296.00,
                    remainingMortgage: 1317000
                },
                rent: {
                    rental: 858440,
                    yields: -256181.50,
                    downPayment: -400000
                }
            }
        };

        return breakdowns[testCaseNum] || {};
    }

    analyzeAllCases() {
        console.log('🔬 DEEP ANALYSIS - ALL TEST CASES');
        console.log('Finding exact sources of differences >CHF 1K');
        console.log('='.repeat(80));

        this.loadTestCases();
        
        const results = [];
        for (let i = 1; i <= 10; i++) {
            const result = this.analyzeTestCase(i);
            results.push(result);
            console.log('\n' + '='.repeat(80) + '\n');
        }

        // Summary
        console.log('📋 SUMMARY OF CRITICAL DIFFERENCES:');
        console.log('─'.repeat(50));
        results.forEach(r => {
            const status = r.criticalDiffs === 0 ? '✅' : '❌';
            console.log(`Test Case ${r.testCase}: ${status} ${r.criticalDiffs} critical differences, max: CHF ${r.maxDifference.toLocaleString()}`);
        });

        const totalCritical = results.reduce((sum, r) => sum + r.criticalDiffs, 0);
        console.log(`\nTotal Critical Issues: ${totalCritical}`);

        return results;
    }
}

// Run analysis
if (require.main === module) {
    const analyzer = new DeepDebugAnalyzer();
    
    const caseToAnalyze = process.argv[2];
    if (caseToAnalyze && !isNaN(caseToAnalyze)) {
        analyzer.loadTestCases();
        analyzer.analyzeTestCase(parseInt(caseToAnalyze));
    } else {
        analyzer.analyzeAllCases();
    }
}

module.exports = { DeepDebugAnalyzer };