/**
 * Test harness to compare new calculator implementation vs current one
 * across:
 * - All Moneyland CSV cases (output-002.csv)
 * - Provided manual cases
 * - Randomly generated scenarios
 */

const fs = require('fs');
const path = require('path');

const OldCalc = require('./calculator.js');
const { calculateNew } = require('./new-calculator-prototype.js');
const { loadCsvData } = require('./backend-validation-test.js');

function compareResults(oldR, newR, tolerance = 1e-6) {
    const fields = [
        'TotalPurchaseCost',
        'TotalRentalCost',
        'ResultValue',
        'Decision'
    ];
    const diffs = [];
    for (const f of fields) {
        const a = oldR[f];
        const b = newR[f];
        if (f === 'Decision') {
            if (a !== b) diffs.push(`Decision mismatch: ${a} vs ${b}`);
        } else {
            const da = Math.abs((a ?? 0) - (b ?? 0));
            if (da > tolerance) diffs.push(`${f} diff ${da.toFixed(2)} (old=${a}, new=${b})`);
        }
    }
    return diffs;
}

function runMoneylandParity() {
    const csvPath = path.join(__dirname, 'output-002.csv');
    const data = loadCsvData(csvPath);
    let total = 0, mismatches = 0;
    for (const row of data) {
        total++;
        const params = {
            purchasePrice: row.PurchasePrice,
            downPayment: row.DownPayment,
            mortgageRate: row.MortgageInterestRatePercent / 100,
            monthlyRent: row.MonthlyRentDue,
            propertyAppreciationRate: row.AnnualPropertyValueIncreasePercent / 100,
            investmentYieldRate: row.InvestmentYieldRatePercent / 100,
            marginalTaxRate: row.MarginalTaxRatePercent / 100,
            termYears: row.TermYears,
            annualMaintenanceCosts: row.AnnualSupplementalMaintenanceCosts,
            amortizationYears: row.AmortizationPeriodYears,
            annualAmortization: row.AnnualAmortizationAmount,
            totalRenovations: row.TotalRenovations,
            additionalPurchaseCosts: row.AdditionalPurchaseExpenses,
            imputedRentalValue: row.ImputedRentalValue,
            propertyTaxDeductions: row.PropertyExpenseTaxDeductions,
            annualRentalCosts: row.AnnualSupplementalCostsRent,
            scenarioMode: 'equalConsumption'
        };
        const oldR = OldCalc.calculate(params);
        const newR = calculateNew(params);
        const diffs = compareResults(oldR, newR, 0.001); // 1 cent tolerance
        if (diffs.length) {
            mismatches++;
            if (mismatches <= 5) {
                console.log('Mismatch example:', { index: total, diffs });
            }
        }
    }
    console.log(`Moneyland parity check vs old: ${total - mismatches}/${total} match`);
    return mismatches === 0;
}

function runRandomComparisons(samples = 200) {
    function rnd(min, max) { return min + Math.random() * (max - min); }
    let ok = true;
    for (let i = 0; i < samples; i++) {
        const params = {
            purchasePrice: Math.round(rnd(400000, 5000000)),
            downPayment: Math.round(rnd(0.2, 0.6) * 1000000),
            mortgageRate: rnd(0.002, 0.04),
            monthlyRent: Math.round(rnd(1200, 15000)),
            propertyAppreciationRate: rnd(-0.02, 0.05),
            investmentYieldRate: rnd(-0.02, 0.08),
            marginalTaxRate: rnd(0.1, 0.45),
            termYears: Math.round(rnd(5, 30)),
            annualMaintenanceCosts: Math.round(rnd(2000, 35000)),
            amortizationYears: Math.round(rnd(0, 20)),
            annualAmortization: Math.round(rnd(0, 50000)),
            totalRenovations: Math.round(rnd(0, 300000)),
            additionalPurchaseCosts: Math.round(rnd(0, 100000)),
            imputedRentalValue: Math.round(rnd(5000, 80000)),
            propertyTaxDeductions: Math.round(rnd(0, 20000)),
            annualRentalCosts: Math.round(rnd(0, 15000)),
            scenarioMode: Math.random() < 0.33 ? 'equalConsumption' : (Math.random() < 0.5 ? 'equalSavings' : 'cashflowParity')
        };
        const oldR = OldCalc.calculate(params);
        const newR = calculateNew(params);
        const diffs = compareResults(oldR, newR, 0.001);
        if (diffs.length) {
            ok = false;
            if (i < 5) console.log('Random mismatch:', { i, diffs });
        }
    }
    console.log(`Random comparisons vs old: ${ok ? 'all match within tolerance' : 'mismatches found'}`);
    return ok;
}

function main() {
    console.log('🧪 New Implementation Test Harness');
    const mlOk = runMoneylandParity();
    const rndOk = runRandomComparisons();
    if (!mlOk || !rndOk) process.exit(1);
}

if (require.main === module) main();

module.exports = { runMoneylandParity, runRandomComparisons };


