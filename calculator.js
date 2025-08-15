/**
 * Swiss Rent vs Buy Calculator
 * 
 * A comprehensive financial calculator for Swiss real estate decisions
 * Created by d57udy to facilitate informed home purchase decisions in Switzerland
 * 
 * Enhanced with single-loop implementation for improved performance and maintainability:
 * - Single-pass calculation engine for consistency
 * - Swiss-specific tax and mortgage calculations
 * - Post-reform tax system support (2027+ Eigenmietwert changes)
 * - Year-by-year financial breakdown with rich analytics
 * 
 * @version 2.2.0
 * @author d57udy
 * @license CC BY-NC-SA 4.0
 * 
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit 
 * https://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to 
 * Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
 * 
 * You are free to:
 * - Share: copy and redistribute the material in any medium or format
 * - Adapt: remix, transform, and build upon the material for any purpose
 * 
 * Under the following terms:
 * - Attribution: You must give appropriate credit to d57udy, provide a link to 
 *   the license, and indicate if changes were made.
 * - NonCommercial: You may not use the material for commercial purposes.
 * - ShareAlike: If you remix, transform, or build upon the material, you must 
 *   distribute your contributions under the same license as the original.
 */

class SwissRentBuyCalculator {
    /**
     * Calculate rent vs buy decision using comprehensive Swiss methodology
     * 
     * This is the core calculation engine that implements Swiss mortgage and tax standards.
     * It compares the total cost of buying vs renting over a specified time period using
     * a single-loop implementation for optimal performance and consistency.
     * 
     * Key Features:
     * - Declining balance mortgage interest calculations
     * - Swiss tax implications (current and post-reform systems)
     * - Property appreciation and investment opportunity costs
     * - Multiple scenario modes (equal consumption, cashflow parity, equal savings)
     * - Comprehensive year-by-year breakdown with rich analytics
     * - All transaction and maintenance costs
     * 
     * @param {Object} params - Calculation parameters
     * @param {number} params.purchasePrice - Property purchase price in CHF (default: 2,000,000)
     * @param {number} params.downPayment - Down payment amount in CHF (default: 347,000)
     * @param {number} params.mortgageRate - Annual mortgage interest rate as decimal (default: 0.009 = 0.9%)
     * @param {number} params.annualMaintenanceCosts - Annual property maintenance in CHF (default: 20,000)
     * @param {number} params.amortizationYears - Mortgage amortization period in years (default: 10)
     * @param {number} params.annualAmortization - Annual amortization payment in CHF (default: 22,199)
     * @param {number} params.totalRenovations - One-time renovation costs in CHF (default: 0)
     * @param {number} params.additionalPurchaseCosts - Notary, fees, taxes in CHF (default: 0)
     * @param {number} params.imputedRentalValue - Taxable rental value for homeowners in CHF (default: 42,900)
     * @param {number} params.propertyTaxDeductions - Annual tax-deductible expenses in CHF (default: 13,000)
     * @param {number} params.marginalTaxRate - Personal marginal tax rate as decimal (default: 0.30 = 30%)
     * @param {number} params.propertyAppreciationRate - Annual property appreciation as decimal (default: 0.00 = 0%)
     * @param {number} params.monthlyRent - Monthly rent for comparable property in CHF (default: 5,500)
     * @param {number} params.annualRentalCosts - Additional annual rental costs in CHF (default: 20,000)
     * @param {number} params.investmentYieldRate - Expected investment return as decimal (default: 0.00 = 0%)
     * @param {number} params.termYears - Analysis period in years (default: 10)
     * @param {string} params.scenarioMode - Comparison scenario: 'equalConsumption', 'cashflowParity', or 'equalSavings' (default: 'equalConsumption')
     * @param {boolean} params.postReform - Use post-reform tax system (2027+) without Eigenmietwert (default: false)
     * @returns {Object} Comprehensive calculation results with Swiss formatting and year-by-year breakdown
     */
    static calculate(params) {
        // ============================================================================
        // PARAMETER EXTRACTION AND DEFAULTS
        // ============================================================================
        
        // Extract parameters with Swiss market defaults (updated for 2024-2025)
        const {
            purchasePrice = 2000000,           // CHF 2M - typical Swiss property price
            downPayment = 347000,              // Variable down payment (typically 20%)
            mortgageRate = 0.009,              // 0.9% - historical low Swiss mortgage rates
            annualMaintenanceCosts = 20000,    // CHF per year: maintenance and utilities/admin combined
            amortizationYears = 10,            // 10 years - common amortization period
            annualAmortization = 22199,        // Variable amortization amount
            totalRenovations = 0,              // No renovations by default
            additionalPurchaseCosts = 0,       // No additional costs by default
            imputedRentalValue = 42900,        // Typically 65% of annual rent (Eigenmietwert)
            propertyTaxDeductions = 13000,     // CHF 13K - typical deductions
            marginalTaxRate = 0.30,            // 30% - example marginal tax rate
            propertyAppreciationRate = 0.00,   // 0% - conservative assumption
            monthlyRent = 5500,                // CHF 5.5K - comparable rent
            annualRentalCosts = 20000,         // CHF 20K - rental supplemental costs
            investmentYieldRate = 0.00,        // 0% - conservative investment return
            termYears = 10,                    // 10 years - standard analysis period
            // Scenario modes:
            // - 'equalConsumption': Baseline comparison (renter invests down payment only)
            // - 'cashflowParity': Renter invests actual monthly difference between buy vs rent
            // - 'equalSavings': Renter makes amortization-equivalent contributions to investments
            scenarioMode = 'equalConsumption',
            // Post-reform tax system (2027+): eliminates Eigenmietwert and related deductions
            // for primary residences to simplify Swiss tax code
            postReform = false
        } = params;

        // ============================================================================
        // INITIALIZATION AND SETUP
        // ============================================================================
        
        // Calculate mortgage amount (property price minus down payment)
        const mortgageAmount = purchasePrice - downPayment;

        // Initialize accumulators for purchase scenario
        let remainingBalance = mortgageAmount;  // Tracks declining mortgage balance
        let interestCosts = 0;                  // Total interest payments over term
        let amortizationCosts = 0;              // Total principal payments over term
        let totalOwnerNetTax = 0;               // Net tax difference (owner vs renter) over term
        
        // Total maintenance costs over analysis period (fixed annual amount)
        let supplementalMaintenanceCosts = annualMaintenanceCosts * termYears;

        // Initialize accumulators for rental scenario
        // Renter's initial investment pool includes down payment + transaction costs
        // In cashflow parity mode, also include renovations as investable at t=0
        const investableInitial = downPayment + additionalPurchaseCosts + 
                                (scenarioMode === 'cashflowParity' ? totalRenovations : 0);
        let portfolio = investableInitial;               // Renter's investment portfolio value
        let cumulativeInvestmentGains = 0;              // Total investment gains (pre-tax)
        let cumulativeRenterInvestmentTax = 0;          // Total taxes on investment gains
        let cumulativeContribPrincipal = 0;             // Total renter contributions (can be negative)
        let cumulativeRentalCosts = 0;                  // Total rent + supplemental costs

        // Pre-calculate scenario-specific values
        const contributionYears = Math.min(amortizationYears, termYears);
        const yearly = [];  // Array to store year-by-year breakdown

        // ============================================================================
        // MAIN CALCULATION LOOP - SINGLE PASS THROUGH ALL YEARS
        // ============================================================================
        
        // This single loop calculates all values consistently year by year,
        // eliminating potential discrepancies from multiple calculation passes
        for (let year = 1; year <= termYears; year++) {
            
            // ------------------------------------------------------------------------
            // MORTGAGE CALCULATIONS (Declining Balance Method)
            // ------------------------------------------------------------------------
            
            // Calculate annual interest on current remaining balance
            // Interest continues even after amortization period ends
            const interest = remainingBalance > 0 ? remainingBalance * mortgageRate : 0;
            interestCosts += interest;
            
            // Calculate annual amortization (principal payment)
            // Only occurs during amortization period, then stops
            const amort = year <= amortizationYears ? annualAmortization : 0;
            amortizationCosts += amort;
            
            // Update remaining mortgage balance after amortization payment
            remainingBalance = Math.max(0, remainingBalance - amort);

            // ------------------------------------------------------------------------
            // TAX CALCULATIONS (Swiss System with Post-Reform Support)
            // ------------------------------------------------------------------------
            
            // Calculate owner-side tax components based on current or post-reform system
            // Post-reform (2027+) eliminates Eigenmietwert and related deductions for primary residences
            const taxImputedRent = postReform ? 0 : (imputedRentalValue * marginalTaxRate);
            const taxSavingsInterest = postReform ? 0 : (interest * marginalTaxRate);
            const taxSavingsPropertyExpenses = postReform ? 0 : (propertyTaxDeductions * marginalTaxRate);
            
            // Net owner tax burden (positive = costs more than renting)
            const ownerNetTax = taxImputedRent - taxSavingsInterest - taxSavingsPropertyExpenses;
            totalOwnerNetTax += ownerNetTax;

            // ------------------------------------------------------------------------
            // RENTER SCENARIO CALCULATIONS (Mode-Aware)
            // ------------------------------------------------------------------------
            
            // Calculate renter's annual investment contribution based on scenario mode
            let renterContrib = 0;
            
            if (scenarioMode === 'equalSavings' && year <= contributionYears) {
                // Equal savings: renter contributes same amount as buyer's amortization
                renterContrib = annualAmortization;
            } else if (scenarioMode === 'cashflowParity') {
                // Cashflow parity: renter invests the actual difference in annual cash outflows
                const buyerAnnualCash = interest + (year <= amortizationYears ? annualAmortization : 0) + annualMaintenanceCosts;
                const renterAnnualCash = (monthlyRent * 12) + annualRentalCosts;
                renterContrib = buyerAnnualCash - renterAnnualCash; // Can be negative (withdrawal)
            }
            // Note: equalConsumption mode has renterContrib = 0 (no additional contributions)

            // ------------------------------------------------------------------------
            // INVESTMENT PORTFOLIO SIMULATION
            // ------------------------------------------------------------------------
            
            // Calculate investment gains on start-of-year portfolio balance
            const gains = portfolio * investmentYieldRate;
            cumulativeInvestmentGains += gains;
            
            // Calculate tax on investment gains (renter pays tax on investment income)
            const renterTax = gains * marginalTaxRate;
            cumulativeRenterInvestmentTax += renterTax;
            
            // Update portfolio: add gains and contributions (portfolio grows at end of year)
            portfolio = portfolio + gains + renterContrib;
            cumulativeContribPrincipal += renterContrib;

            // ------------------------------------------------------------------------
            // RENTAL COST ACCUMULATION
            // ------------------------------------------------------------------------
            
            const rent = monthlyRent * 12;      // Annual rent
            const supp = annualRentalCosts;     // Annual supplemental costs
            cumulativeRentalCosts += (rent + supp);

            // ------------------------------------------------------------------------
            // YEAR-END ANALYTICS AND REPORTING
            // ------------------------------------------------------------------------
            
            // Calculate property value and equity at end of current year
            const propertyValue = purchasePrice * Math.pow(1 + propertyAppreciationRate, year);
            const equity = propertyValue - remainingBalance;
            const ltvPercent = propertyValue > 0 ? (remainingBalance / propertyValue) * 100 : 0;

            // Store comprehensive year-by-year data for detailed analysis
            yearly.push({
                year,
                startingBalance: year === 1 ? mortgageAmount : yearly[year - 2].endingBalance,
                annualInterest: interest,
                annualAmortization: amort,
                annualMaintenance: annualMaintenanceCosts,
                endingBalance: remainingBalance,
                
                // Rental scenario data
                annualRent: rent,
                annualRentalCosts: supp,
                
                // Tax breakdown (for transparency and debugging)
                annualTaxDifference: ownerNetTax,           // Net owner tax burden
                taxImputedRent: taxImputedRent,             // Eigenmietwert tax cost
                taxSavingsInterest: taxSavingsInterest,     // Mortgage interest deduction
                taxSavingsPropertyExpenses: taxSavingsPropertyExpenses, // Property expense deduction
                
                // Investment scenario tracking
                renterContribution: renterContrib,
                cumulativeRenterPrincipal: cumulativeContribPrincipal,
                investmentGainsThisYear: gains,
                investmentIncomeTaxThisYear: renterTax,
                cumulativeInvestmentGains: cumulativeInvestmentGains,
                portfolioValueEndOfYear: portfolio,
                
                // Property scenario tracking
                cumulativeAmortizationToDate: amortizationCosts,
                propertyValueEndOfYear: propertyValue,
                homeownerEquityEndOfYear: equity,
                ltvPercentEndOfYear: ltvPercent
            });
        }

        // ============================================================================
        // END-OF-TERM CALCULATIONS
        // ============================================================================
        
        // Calculate final property value and remaining mortgage at end of analysis period
        const propertyValueEnd = purchasePrice * Math.pow(1 + propertyAppreciationRate, termYears);
        const mortgageAtEnd = Math.max(0, mortgageAmount - amortizationCosts);

        // ============================================================================
        // TOTAL COST CALCULATIONS (Scenario-Aware)
        // ============================================================================
        
        // Build total costs using single-loop results for perfect consistency
        const purchaseCostsWithinObservationPeriod = interestCosts + supplementalMaintenanceCosts + 
                                                   amortizationCosts + totalRenovations + additionalPurchaseCosts;
        const generalCostOfPurchase = purchaseCostsWithinObservationPeriod;
        const generalCostOfRental = cumulativeRentalCosts;
        const rentalCostsWithinObservationPeriod = generalCostOfRental;

        // Calculate net values for final comparison
        const yieldsOnAssets = cumulativeInvestmentGains;       // Pre-tax investment gains
        const downPaymentOutput = downPayment;                  // Down payment opportunity cost
        const savingsContributionsOutput = cumulativeContribPrincipal; // Net renter contributions
        
        // Net tax difference: owner taxes minus renter investment taxes
        const taxDifferenceToRental = totalOwnerNetTax - cumulativeRenterInvestmentTax;

        // Calculate total purchase cost based on scenario mode
        let totalPurchaseCost;
        if (scenarioMode === 'equalConsumption') {
            // Equal consumption: basic comparison with property appreciation and remaining mortgage
            totalPurchaseCost = purchaseCostsWithinObservationPeriod + taxDifferenceToRental - 
                              propertyValueEnd + mortgageAtEnd;
        } else {
            // Equal savings or cashflow parity: same formula structure
            totalPurchaseCost = generalCostOfPurchase + taxDifferenceToRental - 
                              propertyValueEnd + mortgageAtEnd;
        }

        // Calculate total rental cost based on scenario mode
        let totalRentalCost;
        if (scenarioMode === 'equalSavings' || scenarioMode === 'cashflowParity') {
            // Advanced scenarios: subtract investment gains, down payment, and contributions
            totalRentalCost = generalCostOfRental - yieldsOnAssets - downPaymentOutput - savingsContributionsOutput;
        } else {
            // Equal consumption: subtract investment gains and down payment only
            totalRentalCost = rentalCostsWithinObservationPeriod - yieldsOnAssets - downPaymentOutput;
        }

        // ============================================================================
        // DECISION LOGIC AND RESULT FORMATTING
        // ============================================================================
        
        // Calculate final result (positive = buying is better, negative = renting is better)
        const resultValue = totalRentalCost - totalPurchaseCost;
        const evenTolerance = 5000; // CHF tolerance for "even" decision
        
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

        // ============================================================================
        // MONTHLY EXPENSE CALCULATIONS (UI Compatibility)
        // ============================================================================
        
        // Calculate representative monthly expenses for UI display
        const MonthlyInterestPayment = Math.round((mortgageAmount * mortgageRate) / 12);
        const MonthlyAmortizationPayment = Math.round(annualAmortization / 12);
        const MonthlyMaintenanceCosts = Math.round(annualMaintenanceCosts / 12);
        const TotalMonthlyExpenses = MonthlyInterestPayment + MonthlyAmortizationPayment + MonthlyMaintenanceCosts;
        
        const MonthlyRentPayment = Math.round(monthlyRent);
        const MonthlyRentalCosts = Math.round(annualRentalCosts / 12);
        const MonthlySavingsContribution = (scenarioMode === 'equalSavings' && amortizationYears > 0)
            ? Math.round(annualAmortization / 12)
            : (scenarioMode === 'cashflowParity'
                ? Math.round((MonthlyInterestPayment + MonthlyAmortizationPayment + MonthlyMaintenanceCosts) - 
                           (MonthlyRentPayment + MonthlyRentalCosts))
                : 0);
        const TotalMonthlyRentingExpenses = MonthlyRentPayment + MonthlyRentalCosts + MonthlySavingsContribution;

        // ============================================================================
        // CUMULATIVE SERIES CALCULATION FOR CHARTS
        // ============================================================================
        
        // Calculate running totals for each year to enable smooth chart visualization
        // This ensures the year-by-year breakdown is consistent with final totals
        let cumInterest = 0, cumMaint = 0, cumAmort = 0, cumOwnerNet = 0;
        let cumRent = 0, cumSupp = 0, cumGains = 0, cumRenterTax = 0, cumContrib = 0;
        
        for (let i = 0; i < yearly.length; i++) {
            const y = yearly[i];
            const t = i + 1;
            
            // Accumulate costs and benefits to date
            cumInterest += y.annualInterest;
            cumAmort += y.annualAmortization;
            cumMaint += y.annualMaintenance;
            cumOwnerNet += y.annualTaxDifference;
            cumRent += y.annualRent;
            cumSupp += y.annualRentalCosts;
            cumGains += y.investmentGainsThisYear;
            cumRenterTax += y.investmentIncomeTaxThisYear;
            cumContrib += y.renterContribution;

            // Calculate to-date totals using same formula structure as final calculation
            const propertyValue = purchasePrice * Math.pow(1 + propertyAppreciationRate, t);
            const purchaseToDate = (additionalPurchaseCosts + totalRenovations + cumInterest + cumMaint + cumAmort) + 
                                 (cumOwnerNet - cumRenterTax) - propertyValue + y.endingBalance;
            const rentalToDate = (cumRent + cumSupp) - cumGains - downPayment - 
                               ((scenarioMode === 'equalSavings' || scenarioMode === 'cashflowParity') ? cumContrib : 0);
            const adv = rentalToDate - purchaseToDate;
            const prev = i > 0 ? (yearly[i - 1].cumulativeAdvantage || 0) : 0;

            // Store cumulative data for charting and analysis
            y.totalPurchaseCostToDate = purchaseToDate;
            y.totalRentalCostToDate = rentalToDate;
            y.cumulativeAdvantage = adv;
            y.advantageDeltaFromPriorYear = adv - prev;
        }

        // ============================================================================
        // RETURN COMPREHENSIVE RESULTS
        // ============================================================================
        
        return {
            // Input parameters (for reference and validation)
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

            // Main results
            CompareText: compareText,
            ResultValue: resultValue,
            Decision: decision,
            PostReform: postReform,

            // Purchase cost breakdown
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

            // Rental cost breakdown
            GeneralCostOfRental: generalCostOfRental,
            ExcludingYieldsOnAssets: (scenarioMode === 'equalConsumption') ? 0 : -yieldsOnAssets,
            ExcludingDownPayment: -downPaymentOutput,
            ExcludingSavingsContributions: (scenarioMode === 'equalSavings' || scenarioMode === 'cashflowParity') ? -savingsContributionsOutput : 0,
            TotalRentalCost: totalRentalCost,
            PurchaseCostsWithinObservationPeriod: purchaseCostsWithinObservationPeriod,
            RentalCostsWithinObservationPeriod: rentalCostsWithinObservationPeriod,

            // Metadata and detailed breakdown
            MortgageAmount: Math.round(mortgageAmount),
            YearlyBreakdown: yearly,
            ScenarioMode: scenarioMode,
            ErrorMsg: null
        };
    }
}

// ============================================================================
// MODULE EXPORTS - Universal Compatibility
// ============================================================================

// Export for use in both browsers and Node.js environments
// This enables the calculator to work in:
// - Web browsers (frontend)
// - Node.js scripts (backend testing)  
// - Testing frameworks
// - Build tools

if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (CommonJS)
    module.exports = SwissRentBuyCalculator;
} else if (typeof window !== 'undefined') {
    // Browser environment (global object)
    window.SwissRentBuyCalculator = SwissRentBuyCalculator;
}

// ============================================================================
// END OF SWISS RENT VS BUY CALCULATOR
// ============================================================================