/*
 Generates 50 Moneyland renovation test cases (permutations over existing CSV rows)
 Calls Moneyland API and our calculator, writes a comparison report.
 */

const fs = require('fs');
const path = require('path');
const SwissRentBuyCalculator = require('./calculator.js');

const MONEYLAND_API_URL = 'https://api.moneyland.ch/en/formulaStructure/result';
const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'Mozilla/5.0',
  'Origin': 'https://www.moneyland.ch',
  'Referer': 'https://www.moneyland.ch/'
};

function urlencode(data) {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

function loadCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(l => {
    const vals = parseCsvLine(l);
    const obj = {};
    headers.forEach((h, i) => {
      const v = vals[i];
      obj[h] = v === '' || v === undefined ? null : (isNaN(v) ? v : parseFloat(v));
    });
    return obj;
  });
  return rows;
}

function buildMoneylandPayload(p) {
  const payload = {
    widget: 'WCalculatorPurchaseOrRent',
    'CalculatorPurchaseOrRent[widget]': 'CalculatorPurchaseOrRent',
    'CalculatorPurchaseOrRent[HeadlinePurchase]': '',
    'CalculatorPurchaseOrRent[HeadlineRent]': '',
    'CalculatorPurchaseOrRent[AdditionalInputsPurchase]': 'on',
    'CalculatorPurchaseOrRent[AdditionalInputsRent]': 'on',
    // Ensure undefined keys are not sent for toggles
    'CalculatorPurchaseOrRent[TotalRenovationInput]': 0,
    'CalculatorPurchaseOrRent[AdditionalPurchaseCostsInput]': 0,
    'CalculatorPurchaseOrRent[AdditionalCostsPerYearRent]': 0
  };
  const params = {
    PurchasePrice: p.PurchasePrice,
    DownPaymentInput: p.DownPayment,
    MortgageInterestRate: p.MortgageInterestRatePercent,
    AdditionalCostsAnnualInput: p.AnnualSupplementalMaintenanceCosts || 0,
    // Use only one amortization control: schedule OR annual
    AmortizationSchedule: (p.AnnualAmortizationAmount && p.AnnualAmortizationAmount > 0) ? undefined : p.AmortizationPeriodYears,
    AmortizationAnnual: (p.AnnualAmortizationAmount && p.AnnualAmortizationAmount > 0) ? p.AnnualAmortizationAmount : undefined,
    TotalRenovationInput: p.TotalRenovations || 0,
    AdditionalPurchaseCostsInput: p.AdditionalPurchaseExpenses || 0,
    ImputedRentalValue: p.ImputedRentalValue || 0,
    TaxDeductionPropertyExpenses: p.PropertyExpenseTaxDeductions || 0,
    MarginalTaxRate: p.MarginalTaxRatePercent || 0,
    IncreaseInValueProperty: p.AnnualPropertyValueIncreasePercent || 0,
    RentPerMonth: p.MonthlyRentDue || 0,
    AdditionalCostsPerYearRent: p.AnnualSupplementalCostsRent || 0,
    InvestmentInterestRate: p.InvestmentYieldRatePercent || 0,
    ObservationPeriod: p.TermYears || 10
  };
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) payload[`CalculatorPurchaseOrRent[${k}]`] = v;
  }
  return payload;
}

function parseCompareText(text) {
  if (!text) return { result: 0, decision: 'EVEN' };
  const m = text.match(/CHF ([\d,\.']+)/);
  const value = m ? parseFloat(m[1].replace(/[,']/g, '')) : 0;
  let decision = 'EVEN';
  let result = 0;
  // Prefer leading keyword to avoid misclassification when both words appear
  if (/^\s*Buying\b/i.test(text)) { decision = 'BUY'; result = value; }
  else if (/^\s*Renting\b/i.test(text)) { decision = 'RENT'; result = -value; }
  return { result, decision };
}

async function callMoneyland(payload) {
  const body = urlencode(payload);
  const res = await fetch(MONEYLAND_API_URL, { method: 'POST', headers: HEADERS, body });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function extractMlComponents(apiJson) {
  // Best-effort extraction of numeric fields from Moneyland response
  // We normalize by scanning keys for likely component names
  const out = {};
  if (!apiJson || typeof apiJson !== 'object') return out;
  const flat = apiJson;
  const set = (name, keyRx) => {
    const k = Object.keys(flat).find(k => keyRx.test(k));
    if (k && typeof flat[k] === 'number') out[name] = flat[k];
  };
  // Common components (heuristic)
  set('interest', /interest/i);
  set('maintenance', /maintenance|additionalcostsannual/i);
  set('amortization', /amortization(?!.*percent)|amortizationannual/i);
  set('renovations', /renovation/i);
  set('purchaseFees', /additionalpurchase(cost|expenses)/i);
  set('taxDiff', /tax.*difference|tax.*net/i);
  set('purchaseTotal', /total.*purchase|purchase.*total/i);
  set('rentalTotal', /total.*rent|rent.*total/i);
  set('propertyValueEnd', /property.*value.*(end|final|after)/i);
  set('mortgageEnd', /mortgage.*(end|remaining)/i);
  return out;
}

function pickRows(rows, n) {
  const out = [];
  const step = Math.max(1, Math.floor(rows.length / n));
  for (let i = 0; i < rows.length && out.length < n; i += step) out.push(rows[i]);
  return out;
}

async function main() {
  const csvPath = path.join(__dirname, 'output-002.csv');
  const rows = loadCsv(csvPath);
  const baseRows = pickRows(rows, 10);
  const renovationLevels = [0, 20000, 100000, 200000, 350000, 500000];
  const results = [];
  let baseIndex = 0;

  for (const base of baseRows) {
    baseIndex += 1;
    for (const ren of renovationLevels) {
      const p = { ...base, TotalRenovations: ren };
      const payload = buildMoneylandPayload(p);
      try {
        const apiJson = await callMoneyland(payload);
        const { result: mlResult, decision: mlDecision } = parseCompareText(apiJson.CompareText || '');
        const mlComponents = extractMlComponents(apiJson);
        const ourParams = {
          purchasePrice: p.PurchasePrice,
          downPayment: p.DownPayment,
          mortgageRate: (p.MortgageInterestRatePercent || 0) / 100,
          monthlyRent: p.MonthlyRentDue || 0,
          propertyAppreciationRate: (p.AnnualPropertyValueIncreasePercent || 0) / 100,
          investmentYieldRate: (p.InvestmentYieldRatePercent || 0) / 100,
          marginalTaxRate: (p.MarginalTaxRatePercent || 0) / 100,
          termYears: p.TermYears || 10,
          annualMaintenanceCosts: p.AnnualSupplementalMaintenanceCosts || 0,
          amortizationYears: p.AmortizationPeriodYears || 10,
          annualAmortization: p.AnnualAmortizationAmount || 0,
          totalRenovations: ren,
          additionalPurchaseCosts: p.AdditionalPurchaseExpenses || 0,
          imputedRentalValue: p.ImputedRentalValue || 0,
          propertyTaxDeductions: p.PropertyExpenseTaxDeductions || 0,
          annualRentalCosts: p.AnnualSupplementalCostsRent || 0,
          ownerRunningCosts: 0,
          scenarioMode: 'equalConsumption'
        };
        const our = SwissRentBuyCalculator.calculate(ourParams);
        results.push({
          renovations: ren,
          baseIndex,
          ml: { decision: mlDecision, result: mlResult, components: mlComponents, raw: apiJson },
          ours: {
            decision: our.Decision,
            result: our.ResultValue,
            purchaseWithinObservation: our.PurchaseCostsWithinObservationPeriod,
            rentalWithinObservation: our.RentalCostsWithinObservationPeriod,
            interest: our.InterestCosts,
            maintenance: our.SupplementalMaintenanceCosts,
            amortization: our.AmortizationCosts,
            renovations: our.RenovationExpenses,
            purchaseFees: our.AdditionalPurchaseExpensesOutput,
            taxDiff: our.TaxDifferenceToRental,
            propertyValueEnd: -our.MinusPropertyValue,
            mortgageEnd: our.MortgageAtEndOfRelevantTimePeriod
          },
          params: { purchasePrice: p.PurchasePrice, downPayment: p.DownPayment, rent: p.MonthlyRentDue },
          mlPayload: payload,
          ourParams
        });
        await new Promise(r => setTimeout(r, 250));
      } catch (e) {
        results.push({ error: e.message, renovations: ren, baseIndex });
      }
    }
  }

  const outJson = path.join(__dirname, 'validation-renovations-results.json');
  fs.writeFileSync(outJson, JSON.stringify(results, null, 2));
  console.log(`Saved: ${outJson} (${results.length} cases)`);

  // Build diagnostics summary
  const ok = results.filter(r => !r.error && r.ml && typeof r.ml.result === 'number' && r.ours && typeof r.ours.result === 'number');
  const groups = {};
  for (const r of ok) {
    const key = r.baseIndex;
    groups[key] = groups[key] || [];
    groups[key].push(r);
  }
  const slopes = [];
  Object.values(groups).forEach(arr => {
    const sorted = arr.slice().sort((a, b) => a.renovations - b.renovations);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const dRen = curr.renovations - prev.renovations;
      if (dRen !== 0) {
        const mlSlope = (curr.ml.result - prev.ml.result) / dRen;
        const ourSlope = (curr.ours.result - prev.ours.result) / dRen;
        slopes.push({ mlSlope, ourSlope, dRen });
      }
    }
  });
  const avg = arr => arr.reduce((s, x) => s + x, 0) / (arr.length || 1);
  const avgMlSlope = avg(slopes.map(s => s.mlSlope));
  const avgOurSlope = avg(slopes.map(s => s.ourSlope));
  const slopeDiff = avgOurSlope - avgMlSlope;
  const deltas = ok.map(r => r.ours.result - r.ml.result);
  const meanAbsDelta = avg(deltas.map(x => Math.abs(x)));
  const maxAbsDelta = Math.max(...deltas.map(x => Math.abs(x)));
  const summary = {
    cases: ok.length,
    baseGroups: Object.keys(groups).length,
    avgMlSlopePerChfRenovation: avgMlSlope,
    avgOurSlopePerChfRenovation: avgOurSlope,
    slopeDiff: slopeDiff,
    meanAbsResultDelta: meanAbsDelta,
    maxAbsResultDelta: maxAbsDelta
  };
  const summaryPath = path.join(__dirname, 'validation-renovations-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log('Summary:', summary);

  // Per-component diffs (best-effort based on ML extraction)
  const diffs = ok.map(r => {
    const mlc = r.ml.components || {};
    const ours = r.ours;
    const diff = (a, b) => (typeof a === 'number' && typeof b === 'number') ? (a - b) : null;
    return {
      baseIndex: r.baseIndex,
      renovations: r.renovations,
      resultDiff: r.ours.result - r.ml.result,
      interestDiff: diff(ours.interest, mlc.interest),
      maintenanceDiff: diff(ours.maintenance, mlc.maintenance),
      amortizationDiff: diff(ours.amortization, mlc.amortization),
      renovationsDiff: diff(ours.renovations, mlc.renovations),
      purchaseFeesDiff: diff(ours.purchaseFees, mlc.purchaseFees),
      taxDiffDiff: diff(ours.taxDiff, mlc.taxDiff),
      propertyValueEndDiff: diff(ours.propertyValueEnd, mlc.propertyValueEnd),
      mortgageEndDiff: diff(ours.mortgageEnd, mlc.mortgageEnd),
      purchaseWithinObservationDiff: diff(ours.purchaseWithinObservation, mlc.purchaseTotal),
      rentalWithinObservationDiff: diff(ours.rentalWithinObservation, mlc.rentalTotal)
    };
  });
  const diffsPath = path.join(__dirname, 'validation-renovations-diffs.json');
  fs.writeFileSync(diffsPath, JSON.stringify(diffs, null, 2));

  // Also emit CSV for quick inspection
  const headers = [
    'baseIndex','renovations','resultDiff','interestDiff','maintenanceDiff','amortizationDiff','renovationsDiff','purchaseFeesDiff','taxDiffDiff','propertyValueEndDiff','mortgageEndDiff','purchaseWithinObservationDiff','rentalWithinObservationDiff'
  ];
  const csvLines = [headers.join(',')];
  for (const d of diffs) {
    const row = headers.map(h => {
      const v = d[h];
      return (v === null || v === undefined) ? '' : (typeof v === 'number' ? v.toFixed(2) : String(v));
    }).join(',');
    csvLines.push(row);
  }
  const diffsCsvPath = path.join(__dirname, 'validation-renovations-diffs.csv');
  fs.writeFileSync(diffsCsvPath, csvLines.join('\n'));
  
  // Print top-5 largest absolute result diffs with component diffs
  const top = diffs.slice().sort((a,b)=>Math.abs(b.resultDiff)-Math.abs(a.resultDiff)).slice(0,5);
  console.log('Top 5 result deltas (ours - ML):');
  for (const t of top) {
    console.log(`Base ${t.baseIndex}, Renovations ${t.renovations}: ΔResult = ${t.resultDiff.toFixed(2)} | ΔPurchaseWithinObs=${t.purchaseWithinObservationDiff ?? 'n/a'} | ΔRentalWithinObs=${t.rentalWithinObservationDiff ?? 'n/a'} | ΔRenov=${t.renovationsDiff ?? 'n/a'} | ΔTax=${t.taxDiffDiff ?? 'n/a'} | ΔPVEnd=${t.propertyValueEndDiff ?? 'n/a'} | ΔMortEnd=${t.mortgageEndDiff ?? 'n/a'}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });


