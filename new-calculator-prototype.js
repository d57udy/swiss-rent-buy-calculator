/**
 * New Calculator Prototype (single-loop implementation)
 *
 * Mirrors the public API of calculator.js: calculate(params) → result
 *
 * Goals:
 * - Compute totals from a single yearly loop (source of truth)
 * - Keep final totals/decision exactly matching existing implementation
 * - Emit rich YearlyBreakdown rows that are consistent and continuous
 */

function calculateNew(params) {
    const {
        purchasePrice = 2000000,
        downPayment = 347000,
        mortgageRate = 0.009,
        annualMaintenanceCosts = 20000,
        amortizationYears = 10,
        annualAmortization = 22199,
        totalRenovations = 0,
        additionalPurchaseCosts = 0,
        imputedRentalValue = 42900,
        propertyTaxDeductions = 13000,
        marginalTaxRate = 0.30,
        propertyAppreciationRate = 0.00,
        monthlyRent = 5500,
        annualRentalCosts = 20000,
        investmentYieldRate = 0.00,
        termYears = 10,
        scenarioMode = 'equalConsumption'
    } = params;

    const mortgageAmount = purchasePrice - downPayment;

    // Accumulators (owners)
    let remainingBalance = mortgageAmount;
    let interestCosts = 0;
    let amortizationCosts = 0;
    let supplementalMaintenanceCosts = annualMaintenanceCosts * termYears;
    let totalOwnerNetTax = 0; // owner net tax over term

    // Accumulators (rent)
    const investableInitial = downPayment + additionalPurchaseCosts + (scenarioMode === 'cashflowParity' ? totalRenovations : 0);
    let portfolio = investableInitial;
    let cumulativeInvestmentGains = 0;
    let cumulativeRenterInvestmentTax = 0;
    let cumulativeContribPrincipal = 0; // renter contributions (principal), can be negative in cashflowParity
    let cumulativeRentalCosts = 0;

    // Pre-calc values
    const contributionYears = Math.min(amortizationYears, termYears);
    const yearly = [];

    for (let year = 1; year <= termYears; year++) {
        // Mortgage schedule
        const interest = remainingBalance > 0 ? remainingBalance * mortgageRate : 0;
        interestCosts += interest;
        const amort = year <= amortizationYears ? annualAmortization : 0;
        amortizationCosts += amort;
        remainingBalance = Math.max(0, remainingBalance - amort);

        // Owner taxes (owner side only)
        const ownerNetTax = (imputedRentalValue * marginalTaxRate)
            - (interest * marginalTaxRate)
            - (propertyTaxDeductions * marginalTaxRate);
        totalOwnerNetTax += ownerNetTax;

        // Renter contributions (mode-aware)
        let renterContrib = 0;
        if (scenarioMode === 'equalSavings' && year <= contributionYears) {
            renterContrib = annualAmortization;
        } else if (scenarioMode === 'cashflowParity') {
            const buyerAnnualCash = interest + (year <= amortizationYears ? annualAmortization : 0) + annualMaintenanceCosts;
            const renterAnnualCash = (monthlyRent * 12) + annualRentalCosts;
            renterContrib = buyerAnnualCash - renterAnnualCash; // positive invest, negative withdraw
        }

        // Renter portfolio growth (pre-tax gains on start-of-year balance, contribute at end)
        const gains = portfolio * investmentYieldRate;
        cumulativeInvestmentGains += gains;
        const renterTax = gains * marginalTaxRate;
        cumulativeRenterInvestmentTax += renterTax;
        portfolio = portfolio + gains + renterContrib;
        cumulativeContribPrincipal += renterContrib;

        // Rental costs
        const rent = monthlyRent * 12;
        const supp = annualRentalCosts;
        cumulativeRentalCosts += (rent + supp);

        // Snapshot per-year
        const propertyValue = purchasePrice * Math.pow(1 + propertyAppreciationRate, year);
        const equity = propertyValue - remainingBalance;
        const ltvPercent = propertyValue > 0 ? (remainingBalance / propertyValue) * 100 : 0;

        yearly.push({
            year,
            startingBalance: year === 1 ? mortgageAmount : yearly[year - 2].endingBalance,
            annualInterest: interest,
            annualAmortization: amort,
            annualMaintenance: annualMaintenanceCosts,
            endingBalance: remainingBalance,
            annualRent: rent,
            annualRentalCosts: supp,
            annualTaxDifference: ownerNetTax, // owner net tax only
            taxImputedRent: imputedRentalValue * marginalTaxRate,
            taxSavingsInterest: interest * marginalTaxRate,
            taxSavingsPropertyExpenses: propertyTaxDeductions * marginalTaxRate,
            renterContribution: renterContrib,
            cumulativeRenterPrincipal: cumulativeContribPrincipal,
            investmentGainsThisYear: gains,
            investmentIncomeTaxThisYear: renterTax,
            cumulativeInvestmentGains: cumulativeInvestmentGains,
            portfolioValueEndOfYear: portfolio,
            cumulativeAmortizationToDate: amortizationCosts,
            propertyValueEndOfYear: propertyValue,
            homeownerEquityEndOfYear: equity,
            ltvPercentEndOfYear: ltvPercent
        });
    }

    // End-of-term values
    const propertyValueEnd = purchasePrice * Math.pow(1 + propertyAppreciationRate, termYears);
    const mortgageAtEnd = Math.max(0, mortgageAmount - amortizationCosts);

    // Build totals from the single loop (match existing implementation)
    const purchaseCostsWithinObservationPeriod = interestCosts + supplementalMaintenanceCosts + amortizationCosts + totalRenovations + additionalPurchaseCosts;
    const generalCostOfPurchase = purchaseCostsWithinObservationPeriod; // same composition
    const generalCostOfRental = cumulativeRentalCosts;
    const rentalCostsWithinObservationPeriod = generalCostOfRental;

    const yieldsOnAssets = cumulativeInvestmentGains; // gains only, pre-tax; renter tax handled below
    const downPaymentOutput = downPayment;
    const savingsContributionsOutput = cumulativeContribPrincipal;
    const taxDifferenceToRental = totalOwnerNetTax - cumulativeRenterInvestmentTax;

    let totalPurchaseCost;
    if (scenarioMode === 'equalConsumption') {
        totalPurchaseCost = purchaseCostsWithinObservationPeriod + taxDifferenceToRental - propertyValueEnd + mortgageAtEnd;
    } else {
        totalPurchaseCost = generalCostOfPurchase + taxDifferenceToRental - propertyValueEnd + mortgageAtEnd;
    }

    let totalRentalCost;
    if (scenarioMode === 'equalSavings' || scenarioMode === 'cashflowParity') {
        totalRentalCost = generalCostOfRental - yieldsOnAssets - downPaymentOutput - savingsContributionsOutput;
    } else {
        totalRentalCost = rentalCostsWithinObservationPeriod - yieldsOnAssets - downPaymentOutput;
    }

    const resultValue = totalRentalCost - totalPurchaseCost;
    const evenTolerance = 5000;
    let decision = 'EVEN';
    let compareText = `Buying and renting are effectively even (within CHF ${evenTolerance.toLocaleString()}) over the relevant time frame.`;
    if (Math.abs(resultValue) >= evenTolerance) {
        if (resultValue > 0) {
            decision = 'BUY';
            compareText = `Buying your home will work out CHF ${resultValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} cheaper than renting over the relevant time frame.`;
        } else {
            decision = 'RENT';
            compareText = `Renting is CHF ${Math.abs(resultValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} cheaper than buying over the relevant time frame.`;
        }
    }

    // Monthly snapshot (to keep UI compatible)
    const MonthlyInterestPayment = Math.round((mortgageAmount * mortgageRate) / 12);
    const MonthlyAmortizationPayment = Math.round(annualAmortization / 12);
    const MonthlyMaintenanceCosts = Math.round(annualMaintenanceCosts / 12);
    const TotalMonthlyExpenses = MonthlyInterestPayment + MonthlyAmortizationPayment + MonthlyMaintenanceCosts;
    const MonthlyRentPayment = Math.round(monthlyRent);
    const MonthlyRentalCosts = Math.round(annualRentalCosts / 12);
    const MonthlySavingsContribution = (scenarioMode === 'equalSavings' && amortizationYears > 0)
        ? Math.round(annualAmortization / 12)
        : (scenarioMode === 'cashflowParity'
            ? Math.round((MonthlyInterestPayment + MonthlyAmortizationPayment + MonthlyMaintenanceCosts) - (MonthlyRentPayment + MonthlyRentalCosts))
            : 0);
    const TotalMonthlyRentingExpenses = MonthlyRentPayment + MonthlyRentalCosts + MonthlySavingsContribution;

    // Derive to-date totals series consistent with final formulas
    let cumInterest = 0, cumMaint = 0, cumAmort = 0, cumOwnerNet = 0, cumRent = 0, cumSupp = 0, cumGains = 0, cumRenterTax = 0, cumContrib = 0;
    for (let i = 0; i < yearly.length; i++) {
        const y = yearly[i];
        const t = i + 1;
        cumInterest += y.annualInterest;
        cumAmort += y.annualAmortization;
        cumMaint += y.annualMaintenance;
        cumOwnerNet += y.annualTaxDifference;
        cumRent += y.annualRent;
        cumSupp += y.annualRentalCosts;
        cumGains += y.investmentGainsThisYear;
        cumRenterTax += y.investmentIncomeTaxThisYear; // included only to compute owner minus renter if needed
        cumContrib += y.renterContribution;

        const propertyValue = purchasePrice * Math.pow(1 + propertyAppreciationRate, t);
        const purchaseToDate = (additionalPurchaseCosts + totalRenovations + cumInterest + cumMaint + cumAmort) + (cumOwnerNet - cumRenterTax) - propertyValue + y.endingBalance;
        const rentalToDate = (cumRent + cumSupp) - cumGains - downPayment - ((scenarioMode === 'equalSavings' || scenarioMode === 'cashflowParity') ? cumContrib : 0);
        const adv = rentalToDate - purchaseToDate;
        const prev = i > 0 ? (yearly[i - 1].cumulativeAdvantage || 0) : 0;

        y.totalPurchaseCostToDate = purchaseToDate;
        y.totalRentalCostToDate = rentalToDate;
        y.cumulativeAdvantage = adv;
        y.advantageDeltaFromPriorYear = adv - prev;
    }

    return {
        PurchasePrice: Math.round(purchasePrice),
        PurchasePriceM: Math.round(purchasePrice / 1000000 * 10) / 10,
        DownPayment: Math.round(downPayment),
        MortgageInterestRatePercent: mortgageRate * 100,
        AnnualSupplementalMaintenanceCosts: Math.round(annualMaintenanceCosts),
        AmortizationPeriodYears: Math.round(amortizationYears),
        AnnualAmortizationAmount: Math.round(annualAmortization),
        TotalRenovations: Math.round(totalRenovations),
        AdditionalPurchaseExpenses: Math.round(additionalPurchaseCosts),
        ImputedRentalValue: Math.round(imputedRentalValue),
        PropertyExpenseTaxDeductions: Math.round(propertyTaxDeductions),
        MarginalTaxRatePercent: Math.round(marginalTaxRate * 100),
        AnnualPropertyValueIncreasePercent: propertyAppreciationRate * 100,
        MonthlyRentDue: Math.round(monthlyRent),
        AnnualSupplementalCostsRent: Math.round(annualRentalCosts),
        InvestmentYieldRatePercent: investmentYieldRate * 100,
        TermYears: Math.round(termYears),

        CompareText: compareText,
        ResultValue: resultValue,
        Decision: decision,

        InterestCosts: interestCosts,
        SupplementalMaintenanceCosts: supplementalMaintenanceCosts,
        AmortizationCosts: amortizationCosts,
        RenovationExpenses: totalRenovations,
        AdditionalPurchaseExpensesOutput: additionalPurchaseCosts,
        GeneralCostOfPurchase: generalCostOfPurchase,
        TaxDifferenceToRental: taxDifferenceToRental,
        MinusPropertyValue: -propertyValueEnd,
        MortgageAtEndOfRelevantTimePeriod: mortgageAtEnd,
        TotalPurchaseCost: totalPurchaseCost,

        // Monthly expenses for buying scenario
        MonthlyInterestPayment,
        MonthlyAmortizationPayment,
        MonthlyMaintenanceCosts,
        TotalMonthlyExpenses,

        // Monthly expenses for renting scenario
        MonthlyRentPayment,
        MonthlyRentalCosts,
        MonthlySavingsContribution,
        TotalMonthlyRentingExpenses,

        GeneralCostOfRental: generalCostOfRental,
        ExcludingYieldsOnAssets: (scenarioMode === 'equalConsumption') ? 0 : -yieldsOnAssets,
        ExcludingDownPayment: -downPaymentOutput,
        ExcludingSavingsContributions: (scenarioMode === 'equalSavings' || scenarioMode === 'cashflowParity') ? -savingsContributionsOutput : 0,
        TotalRentalCost: totalRentalCost,
        PurchaseCostsWithinObservationPeriod: purchaseCostsWithinObservationPeriod,
        RentalCostsWithinObservationPeriod: rentalCostsWithinObservationPeriod,

        MortgageAmount: Math.round(mortgageAmount),
        YearlyBreakdown: yearly,
        ScenarioMode: scenarioMode,
        ErrorMsg: null
    };
}

// Exports for Node and Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateNew };
} else if (typeof window !== 'undefined') {
    window.SwissRentBuyCalculatorNew = {
        calculate: calculateNew
    };
}


