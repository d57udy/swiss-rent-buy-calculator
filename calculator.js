/**
 * Swiss Rent vs Buy Calculator
 * 
 * A comprehensive financial calculator for Swiss real estate decisions
 * Created by d57udy to facilitate informed home purchase decisions in Switzerland
 * 
 * Inspired by moneyland.ch methodology with enhanced functionality:
 * - Maximum bid price finder (break-even analysis)
 * - Parameter sweep capabilities for scenario modeling
 * - Swiss-specific tax and mortgage calculations
 * 
 * Inspired by moneyland.ch methodology with enhanced functionality
 * 
 * @version 2.1.0
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
     * It compares the total cost of buying vs renting over a specified time period,
     * accounting for:
     * - Declining balance mortgage interest calculations
     * - Swiss tax implications (imputed rental value, deductions)
     * - Property appreciation and investment opportunity costs
     * - All transaction and maintenance costs
     * 
     * @param {Object} params - Calculation parameters
     * @param {number} params.purchasePrice - Property purchase price in CHF
     * @param {number} params.downPayment - Down payment amount in CHF (typically 20%)
     * @param {number} params.mortgageRate - Annual mortgage interest rate (decimal, e.g., 0.009 = 0.9%)
     * @param {number} params.annualMaintenanceCosts - Annual property maintenance in CHF
     * @param {number} params.amortizationYears - Mortgage amortization period in years
     * @param {number} params.annualAmortization - Annual amortization payment in CHF
     * @param {number} params.totalRenovations - One-time renovation costs in CHF
     * @param {number} params.additionalPurchaseCosts - Notary, fees, taxes in CHF
     * @param {number} params.imputedRentalValue - Taxable rental value for homeowners in CHF
     * @param {number} params.propertyTaxDeductions - Annual tax-deductible expenses in CHF
     * @param {number} params.marginalTaxRate - Personal marginal tax rate (decimal)
     * @param {number} params.propertyAppreciationRate - Annual property appreciation (decimal)
     * @param {number} params.monthlyRent - Monthly rent for comparable property in CHF
     * @param {number} params.annualRentalCosts - Additional annual rental costs in CHF
     * @param {number} params.investmentYieldRate - Expected investment return (decimal)
     * @param {number} params.termYears - Analysis period in years
     * @returns {Object} Comprehensive calculation results with Swiss formatting
     */
    static calculate(params) {
        // Extract and set default parameters (typical Swiss market values)
        const {
            purchasePrice = 2000000,           // CHF 2M - typical Swiss property price
            downPayment = 347000,              // Variable down payment
            mortgageRate = 0.009,              // 0.9% - current Swiss mortgage rates
            annualMaintenanceCosts = 20000,    // CHF per year: maintenance and utilities/admin combined
            amortizationYears = 10,            // 10 years - common amortization period
            annualAmortization = 22199,        // Variable amortization amount
            totalRenovations = 0,              // No renovations by default
            additionalPurchaseCosts = 0,       // No additional costs by default
            imputedRentalValue = 42900,        // Typically 65% of annual rent
            propertyTaxDeductions = 13000,     // CHF 13K - typical deductions
            marginalTaxRate = 0.30,            // 30% - example marginal tax rate
            propertyAppreciationRate = 0.00,   // 0% - conservative assumption
            monthlyRent = 5500,                // CHF 5.5K - comparable rent
            annualRentalCosts = 20000,         // CHF 20K - rental supplemental costs
            investmentYieldRate = 0.00,        // 0% - conservative investment return
            termYears = 10,                    // 10 years - standard analysis period
            // Comparison scenario mode:
            // 'equalConsumption' (baseline), 'cashflowParity' (invest actual monthly difference),
            // or 'equalSavings' (amortization-equivalent contributions)
            scenarioMode = 'equalConsumption',
            // Post-reform tax system (2027+): no Eigenmietwert, no deductions for primary residence
            postReform = false
        } = params;

        // ============================================================================
        // PURCHASE SCENARIO CALCULATIONS
        // ============================================================================
        
        // Calculate the mortgage amount (property price minus down payment)
        const mortgageAmount = purchasePrice - downPayment;
        
        // Calculate interest costs using declining balance method and capture yearly breakdown
        // This is crucial for Swiss mortgages where interest is calculated on the
        // remaining balance after each amortization payment, not the original amount
        let totalInterestPaid = 0;
        let remainingBalance = mortgageAmount;
        const yearlyBreakdown = [];
        
        for (let year = 0; year < termYears; year++) {
            const yearData = {
                year: year + 1,
                startingBalance: remainingBalance,
                annualInterest: 0,
                annualAmortization: 0,
                annualMaintenance: annualMaintenanceCosts,
                endingBalance: remainingBalance
            };
            
            if (remainingBalance > 0) {
                // Calculate interest on current remaining balance
                const annualInterest = remainingBalance * mortgageRate;
                totalInterestPaid += annualInterest;
                yearData.annualInterest = annualInterest;
                
                // Only reduce balance during amortization period
                if (year < amortizationYears) {
                    // Reduce balance by annual amortization payment
                    yearData.annualAmortization = annualAmortization;
                    remainingBalance -= annualAmortization;
                    
                    // Prevent negative balance (mortgage fully paid)
                    if (remainingBalance < 0) remainingBalance = 0;
                    yearData.endingBalance = remainingBalance;
                }
            }
            
            yearlyBreakdown.push(yearData);
        }
        
        // Total interest paid over the mortgage term
        const interestCosts = totalInterestPaid;
        
        // Total maintenance costs over analysis period
        const supplementalMaintenanceCosts = annualMaintenanceCosts * termYears;
        
        // Total amortization payments (principal reduction)
        // Amortization only happens during the amortization period, not the full term
        const actualAmortizationYears = Math.min(amortizationYears, termYears);
        const amortizationCosts = annualAmortization * actualAmortizationYears;
        
        // One-time renovation expenses
        const renovationExpenses = totalRenovations;
        
        // One-time additional purchase expenses (notary, taxes, fees)
        const additionalPurchaseExpensesOutput = additionalPurchaseCosts;
        
        // Sum all direct costs of purchasing and owning the property
        const generalCostOfPurchase = 
            interestCosts +                    // Interest payments
            supplementalMaintenanceCosts +     // Maintenance over term
            amortizationCosts +               // Principal payments
            renovationExpenses +              // One-time renovations
            additionalPurchaseExpensesOutput;  // One-time purchase costs
        // ML-style aggregates (diagnostics)
        const purchaseCostsWithinObservationPeriod = interestCosts + supplementalMaintenanceCosts + amortizationCosts + renovationExpenses + additionalPurchaseExpensesOutput;
        
        // Calculate property value at end of analysis period with compound appreciation
        // Equal-consumption (Moneyland-aligned): do NOT capitalize one-off renovations into property value end
        const propertyValueEnd = purchasePrice * Math.pow(1 + propertyAppreciationRate, termYears);
        
        // Calculate remaining mortgage balance at end of term
        // This is debt that still needs to be paid off
        const mortgageAtEnd = Math.max(0, mortgageAmount - amortizationCosts);
        
        // ============================================================================
        // SWISS TAX CALCULATIONS
        // ============================================================================
        
        // Tax implications are crucial in Swiss rent vs buy decisions
        // Homeowners get deductions but pay imputed rental value tax
        // Renters pay tax on investment income from alternative investments
        
        let totalTaxDifference = 0;
        let remainingMortgage = mortgageAmount;
        
        // Calculate renter investment base and contributions depending on scenario
        const investableAmount = downPayment + additionalPurchaseCosts; // upfront capital not tied in house
        const contributionYears = Math.min(amortizationYears, termYears);
        let totalSavingsContributions = 0;        // Principal contributed by renter (scenario dependent)
        let contributionsPerYear = new Array(termYears).fill(0);

        if (scenarioMode === 'equalSavings') {
            // Amortization-equivalent savings for the amortization period
            totalSavingsContributions = annualAmortization * contributionYears;
            for (let year = 0; year < contributionYears; year++) {
                contributionsPerYear[year] = annualAmortization;
            }
        } else if (scenarioMode === 'cashflowParity') {
            // Cash-flow parity: invest the ACTUAL difference in annual cash outflows.
            // Contribution can be positive (investment) or negative (withdrawal) when renter's
            // cash outflow exceeds the buyer's. This models drawing down the savings pot.
            for (let year = 0; year < termYears; year++) {
                const buyerAnnualCashCosts = (yearlyBreakdown[year].annualInterest) +
                    (year < amortizationYears ? annualAmortization : 0) +
                    annualMaintenanceCosts;
                const renterAnnualCashCosts = (monthlyRent * 12) + annualRentalCosts;
                const contribution = (buyerAnnualCashCosts - renterAnnualCashCosts);
                contributionsPerYear[year] = contribution;
                totalSavingsContributions += contribution;
            }
        }

        // Future value of initial investable amount at end of term
        // Include day-0 capex/renovations as investable for renter ONLY in cash-flow parity mode
        const investableIncludingRenovations = investableAmount + (scenarioMode === 'cashflowParity' ? totalRenovations : 0);
        const fvInitial = investableIncludingRenovations * Math.pow(1 + investmentYieldRate, termYears);
        const gainsInitial = fvInitial - investableIncludingRenovations;

        // Future value of annual contributions
        // - Equal-savings (amortization-equivalent): ordinary annuity closed form
        // - Cash-flow parity: variable contributions → sum of each year's FV
        let fvContribs = 0;
        let gainsContribs = 0;
        if (scenarioMode === 'equalSavings' && annualAmortization > 0 && contributionYears > 0) {
            if (investmentYieldRate === 0) {
                // No growth; FV is just principal contributions
                fvContribs = annualAmortization * contributionYears;
            } else {
                fvContribs = annualAmortization * ((Math.pow(1 + investmentYieldRate, contributionYears) - 1) / investmentYieldRate) * Math.pow(1 + investmentYieldRate, termYears - contributionYears);
            }
            gainsContribs = fvContribs - (annualAmortization * contributionYears);
        } else if (scenarioMode === 'cashflowParity' && totalSavingsContributions !== 0) {
            if (investmentYieldRate === 0) {
                // With zero growth, the future value equals the algebraic sum of contributions
                fvContribs = totalSavingsContributions;
            } else {
                // Variable contributions: accumulate each year's contribution with appropriate growth.
                for (let year = 0; year < termYears; year++) {
                    const contrib = contributionsPerYear[year];
                    if (contrib !== 0) {
                        const growthYears = termYears - (year + 1);
                        fvContribs += contrib * Math.pow(1 + investmentYieldRate, growthYears);
                    }
                }
            }
            // Gains are FV minus algebraic principal (positive investments minus withdrawals)
            gainsContribs = fvContribs - totalSavingsContributions;
        }

        // Total investment gains for renter
        const totalInvestmentGains = gainsInitial + gainsContribs;
        
        // Total tax on renter's investment income over the term (computed later from portfolio simulation)
        let totalInvestmentIncomeTax = 0;
        let annualInvestmentIncomeTax = 0; // For owner vs renter tax difference loop, keep 0 here; adjust after portfolio sim
        
        // Calculate year-by-year tax differences and add to yearly breakdown
        for (let year = 0; year < termYears; year++) {
            // Annual mortgage interest (tax-deductible for homeowners in current system only)
            // Calculate if mortgage exists (interest continues even after amortization period)
            let annualInterest = 0;
            if (remainingMortgage > 0) {
                annualInterest = remainingMortgage * mortgageRate;
            }
            const annualTaxSavingsInterest = postReform ? 0 : (annualInterest * marginalTaxRate);
            
            // Imputed rental value (taxable income for homeowners in current system only)
            // Swiss tax authorities assess this as the benefit of living in your own property
            const annualTaxCostImputedRental = postReform ? 0 : (imputedRentalValue * marginalTaxRate);
            
            // Property expenses (tax-deductible for homeowners in current system only)
            // Includes maintenance, insurance, property management
            const annualTaxSavingsPropertyExpenses = postReform ? 0 : (propertyTaxDeductions * marginalTaxRate);
            
            // Net annual tax difference: buying vs renting
            // Positive value means buying costs more in taxes
            // Owner-side net tax only (renter investment tax handled separately via portfolio)
            const annualNetTaxDifference = 
                annualTaxCostImputedRental -      // Tax cost of imputed rental value
                annualTaxSavingsInterest -        // Tax savings from mortgage interest
                annualTaxSavingsPropertyExpenses; // Tax savings from property expenses
            
            totalTaxDifference += annualNetTaxDifference;
            
            // Add tax and rental information to yearly breakdown
            yearlyBreakdown[year].annualRent = monthlyRent * 12;
            yearlyBreakdown[year].annualRentalCosts = annualRentalCosts;
            yearlyBreakdown[year].annualTaxDifference = annualNetTaxDifference;
            // Owner running costs are merged into annualMaintenanceCosts
            // Expose tax components for auditing (owner side)
            yearlyBreakdown[year].taxImputedRent = annualTaxCostImputedRental; // +
            yearlyBreakdown[year].taxSavingsInterest = annualTaxSavingsInterest; // -
            yearlyBreakdown[year].taxSavingsPropertyExpenses = annualTaxSavingsPropertyExpenses; // -
            yearlyBreakdown[year].totalPurchaseCostToDate = 0; // Will calculate below
            yearlyBreakdown[year].totalRentalCostToDate = 0; // Will calculate below
            yearlyBreakdown[year].cumulativeAdvantage = 0; // Will calculate below
            
            // Reduce mortgage balance for next year's interest calculation
            // Only during amortization period
            if (year < amortizationYears && remainingMortgage > 0) {
                remainingMortgage -= annualAmortization;
                if (remainingMortgage < 0) remainingMortgage = 0;
            }
        }
        
        // Total tax difference over the analysis period
        // We'll adjust this after we simulate renter investment taxes from portfolio growth
        let taxDifferenceToRental = totalTaxDifference;
        
        // Calculate total net cost of the purchase scenario
        // This represents the total financial impact of buying
        // Defer final totalPurchaseCost computation until after renter investment tax is computed
        let totalPurchaseCost = 0;
        
        // RENTAL SCENARIO CALCULATIONS
        const generalCostOfRental = (monthlyRent * 12 * termYears) + (annualRentalCosts * termYears);
        const rentalCostsWithinObservationPeriod = generalCostOfRental;
        const yieldsOnAssets = totalInvestmentGains; // gains only (gross, taxes handled via taxDifference)
        const downPaymentOutput = downPayment;
        const savingsContributionsOutput = totalSavingsContributions; // principal contributed by renter in equal-savings/cashflow-parity
        // Equal consumption (Moneyland-compatible): do NOT subtract investment yields; subtract down payment only
        let totalRentalCost = 0; // compute after renter investment tax so we ensure consistency
        
        // Defer final comparison until after totals are computed (done later)
        let resultValue = 0;
        let decision = "EVEN";
        let compareText = "Buying and renting have the same cost over the relevant time frame.";
        
        // Calculate monthly expenses for buying scenario
        const monthlyInterestPayment = Math.round((mortgageAmount * mortgageRate) / 12);
        const monthlyAmortizationPayment = Math.round(annualAmortization / 12);
        const monthlyMaintenanceCosts = Math.round(annualMaintenanceCosts / 12);
        const totalMonthlyExpenses = monthlyInterestPayment + monthlyAmortizationPayment + monthlyMaintenanceCosts;

        // Calculate monthly expenses for renting scenario
        const monthlyRentPayment = Math.round(monthlyRent);
        const monthlyRentalCosts = Math.round(annualRentalCosts / 12);
        const monthlySavingsContribution = (scenarioMode === 'equalSavings' && amortizationYears > 0)
            ? Math.round(annualAmortization / 12)
            : (scenarioMode === 'cashflowParity' 
                ? Math.round(((monthlyInterestPayment + monthlyAmortizationPayment + monthlyMaintenanceCosts) - (monthlyRentPayment + monthlyRentalCosts)))
                : 0);
        const totalMonthlyRentingExpenses = monthlyRentPayment + monthlyRentalCosts + monthlySavingsContribution;
        
        // Calculate cumulative costs for yearly breakdown - ensure final year matches main calculation exactly
        // Also enrich with detailed analytics for transparency (portfolio, equity, taxes, cash-flow)
        const renterInitialCapital = investableIncludingRenovations; // include renovations at t=0 only for cash-flow parity
        let portfolioValueSoFar = renterInitialCapital; // renter portfolio starts with initial capital
        let cumulativePrincipalFromContribs = 0;    // algebraic sum of renter contributions (excl. initial)
        let cumulativeInvestmentGainsSoFar = 0;
        let cumulativeAmortizationSoFar = 0;
        let priorCumulativeAdvantage = 0;
        let renterInvestmentTaxTotal = 0;
        for (let year = 0; year < termYears; year++) {
            const yearData = yearlyBreakdown[year];
            const yearsToDate = year + 1;
            // Mode-aware renter contribution for this year
            let renterContributionThisYear = 0;
            if (scenarioMode === 'equalSavings' && year < contributionYears) {
                renterContributionThisYear = annualAmortization;
            } else if (scenarioMode === 'cashflowParity') {
                renterContributionThisYear = contributionsPerYear[year] || 0;
            }

            // Investment portfolio tracking (simple model: gains on start-of-year balance; contribution at end of year)
            const gainsThisYear = portfolioValueSoFar * investmentYieldRate;
            cumulativeInvestmentGainsSoFar += gainsThisYear;
            cumulativePrincipalFromContribs += renterContributionThisYear;
            const investmentIncomeTaxThisYear = gainsThisYear * marginalTaxRate; // renter pre-tax yield taxed in all modes
            portfolioValueSoFar = portfolioValueSoFar + gainsThisYear + renterContributionThisYear;
            renterInvestmentTaxTotal += investmentIncomeTaxThisYear;

            // Buyer amortization accumulation
            cumulativeAmortizationSoFar += yearData.annualAmortization;
            
            // Property value & equity at end of this year
            const propertyValueCurrentYear = purchasePrice * Math.pow(1 + propertyAppreciationRate, yearsToDate);
            const homeownerTaxThisYear = postReform ? 0 : ((imputedRentalValue * marginalTaxRate) - (yearData.annualInterest * marginalTaxRate) - (propertyTaxDeductions * marginalTaxRate));
            const buyAnnualCashOutlay = yearData.annualInterest + yearData.annualMaintenance + homeownerTaxThisYear;
            const rentAnnualCashOutlay = yearData.annualRent + yearData.annualRentalCosts + investmentIncomeTaxThisYear;
            const netMonthlyDiffThisYear = (buyAnnualCashOutlay - rentAnnualCashOutlay) / 12;
            
            if (yearsToDate !== termYears) {
                // For intermediate years, calculate proportionally
                // Calculate what fraction of the total term this represents
                const termFraction = yearsToDate / termYears;
                
                // Calculate cumulative purchase costs up to this year
                // IMPORTANT: Down payment is NOT an unrecoverable cost in the main formula
                // (it is captured via -propertyValue + remaining mortgage), so we do not
                // add downPayment here to avoid a discontinuity in the final year.
                let cumulativePurchaseCosts = additionalPurchaseCosts + totalRenovations;
                
                // Add up all costs from year 1 to current year
                for (let y = 0; y <= year; y++) {
                    cumulativePurchaseCosts += yearlyBreakdown[y].annualInterest + 
                                             yearlyBreakdown[y].annualAmortization + 
                                             yearlyBreakdown[y].annualMaintenance + 
                                             yearlyBreakdown[y].annualTaxDifference;
                }
                
                // Calculate property value at end of this year
                const propertyValueCurrentYear = purchasePrice * Math.pow(1 + propertyAppreciationRate, yearsToDate);
                
                // Calculate cumulative rental costs up to this year
                const cumulativeRentalCosts = yearsToDate * (monthlyRent * 12 + annualRentalCosts);
                
                // Calculate investment returns for renter scenario up to this year (mode-aware)
                const initialInvestableForSeries = investableAmount + (scenarioMode === 'cashflowParity' ? totalRenovations : 0);
                const fvInitialToDate = initialInvestableForSeries * Math.pow(1 + investmentYieldRate, yearsToDate);
                const gainsInitialToDate = fvInitialToDate - initialInvestableForSeries;

                const contribYearsToDate = scenarioMode === 'equalSavings' ? Math.min(contributionYears, yearsToDate) : 0;
                let fvContribsToDate = 0;
                let principalContribsToDate = 0;
                if (scenarioMode === 'equalSavings' && annualAmortization > 0 && contribYearsToDate > 0) {
                    if (investmentYieldRate === 0) {
                        fvContribsToDate = annualAmortization * contribYearsToDate;
                    } else {
                        fvContribsToDate = annualAmortization * ((Math.pow(1 + investmentYieldRate, contribYearsToDate) - 1) / investmentYieldRate);
                    }
                    principalContribsToDate = annualAmortization * contribYearsToDate;
                } else if (scenarioMode === 'cashflowParity') {
                    // Sum variable contributions (positive = invest, negative = withdraw) with growth to date
                    for (let i = 0; i < yearsToDate; i++) {
                        const c = contributionsPerYear[i] || 0;
                        principalContribsToDate += c;
                        if (investmentYieldRate === 0) {
                            fvContribsToDate += c;
                        } else {
                            const growthYears = yearsToDate - (i + 1);
                            fvContribsToDate += c * Math.pow(1 + investmentYieldRate, growthYears);
                        }
                    }
                }
                const gainsContribsToDate = fvContribsToDate - principalContribsToDate;
                const investmentGains = gainsInitialToDate + gainsContribsToDate;
                
                // Apply tax on realized gains up to this year using same rate
                const totalInvestmentTax = investmentGains * marginalTaxRate;
                
                // Mark-to-market net worth approach for continuity
                // Owner: equity minus cumulative owner cash outlays (interest + maintenance + owner net tax + initial capex)
                const cumulativeOwnerNetTax = yearlyBreakdown.slice(0, yearsToDate).reduce((sum, r) => sum + r.annualTaxDifference, 0);
                const initialOwnerCapex = additionalPurchaseCosts + totalRenovations;
                const cumulativeOwnerCashOutlays = yearlyBreakdown.slice(0, yearsToDate).reduce((sum, r) => sum + r.annualInterest + r.annualMaintenance, 0) + cumulativeOwnerNetTax + initialOwnerCapex;
                const wealthBuyToDate = (propertyValueCurrentYear - yearData.endingBalance) - cumulativeOwnerCashOutlays;

                // Renter: portfolio after tax minus cumulative rent + supplemental + renter investment-income tax
                const renterInvestmentTaxToDate = (gainsInitialToDate + gainsContribsToDate) * marginalTaxRate;
                const portfolioAfterTaxToDate = fvInitialToDate + fvContribsToDate - renterInvestmentTaxToDate;
                const cumulativeRenterCashOutlays = cumulativeRentalCosts;
                const wealthRentToDate = portfolioAfterTaxToDate - cumulativeRenterCashOutlays;

                // Advantage (mark-to-market) for smooth series
                yearData.totalPurchaseCostToDate = wealthBuyToDate; // repurpose fields to display series
                yearData.totalRentalCostToDate = wealthRentToDate;
                yearData.cumulativeAdvantage = wealthBuyToDate - wealthRentToDate;
                yearData.advantageDeltaFromPriorYear = yearsToDate > 1 ? (yearData.cumulativeAdvantage - priorCumulativeAdvantage) : yearData.cumulativeAdvantage;
            }

            // Enrich row with analytics common to both branches
            if (year === 0) {
                yearData.renterInitialCapital = renterInitialCapital;
            }
            yearData.renterContribution = renterContributionThisYear;
            yearData.cumulativeRenterPrincipal = cumulativePrincipalFromContribs;
            yearData.investmentGainsThisYear = gainsThisYear;
            yearData.cumulativeInvestmentGains = cumulativeInvestmentGainsSoFar;
            yearData.investmentIncomeTaxThisYear = investmentIncomeTaxThisYear;
            yearData.portfolioValueEndOfYear = portfolioValueSoFar;
            yearData.cumulativeAmortizationToDate = cumulativeAmortizationSoFar;
            yearData.propertyValueEndOfYear = propertyValueCurrentYear;
            yearData.homeownerEquityEndOfYear = propertyValueCurrentYear - yearData.endingBalance;
            yearData.ltvPercentEndOfYear = propertyValueCurrentYear > 0 ? (yearData.endingBalance / propertyValueCurrentYear) * 100 : 0;
            yearData.buyAnnualCashOutlay = buyAnnualCashOutlay;
            yearData.rentAnnualCashOutlay = rentAnnualCashOutlay;
            yearData.netMonthlyDiffThisYear = netMonthlyDiffThisYear;

            priorCumulativeAdvantage = yearData.cumulativeAdvantage;
        }

        // After simulating renter portfolio taxes across the term, adjust tax difference (owner minus renter)
        // totalTaxDifference currently contains owner-side net taxes only. Subtract renter investment taxes.
        totalInvestmentIncomeTax = renterInvestmentTaxTotal;
        taxDifferenceToRental = totalTaxDifference - totalInvestmentIncomeTax;

        // Now compute final totals using the adjusted tax difference
        totalPurchaseCost = (scenarioMode === 'equalConsumption')
            ? (purchaseCostsWithinObservationPeriod + taxDifferenceToRental - propertyValueEnd + mortgageAtEnd)
            : (generalCostOfPurchase + taxDifferenceToRental - propertyValueEnd + mortgageAtEnd);

        totalRentalCost = (scenarioMode === 'equalSavings' || scenarioMode === 'cashflowParity')
            ? (generalCostOfRental - yieldsOnAssets - downPaymentOutput - savingsContributionsOutput)
            : (rentalCostsWithinObservationPeriod - yieldsOnAssets - downPaymentOutput);

        // FINAL COMPARISON (after totals are ready)
        resultValue = totalRentalCost - totalPurchaseCost;
        const evenTolerance = 5000; // CHF
        if (Math.abs(resultValue) < evenTolerance) {
            decision = "EVEN";
            compareText = `Buying and renting are effectively even (within CHF ${evenTolerance.toLocaleString()}) over the relevant time frame.`;
        } else if (resultValue > 0) {
            decision = "BUY";
            compareText = `Buying your home will work out CHF ${resultValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} cheaper than renting over the relevant time frame.`;
        } else if (resultValue < 0) {
            decision = "RENT";
            compareText = `Renting is CHF ${Math.abs(resultValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} cheaper than buying over the relevant time frame.`;
        }

        // Do not overwrite final year; series already reflects mark-to-market and is continuous

        return {
            // Input parameters
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
            
            // Purchase cost breakdown
            InterestCosts: interestCosts,
            SupplementalMaintenanceCosts: supplementalMaintenanceCosts,
            AmortizationCosts: amortizationCosts,
            RenovationExpenses: renovationExpenses,
            AdditionalPurchaseExpensesOutput: additionalPurchaseExpensesOutput,
            GeneralCostOfPurchase: generalCostOfPurchase,
            TaxDifferenceToRental: taxDifferenceToRental,
            MinusPropertyValue: -propertyValueEnd,
            MortgageAtEndOfRelevantTimePeriod: mortgageAtEnd,
            TotalPurchaseCost: totalPurchaseCost,
            
            // Monthly expenses for buying scenario
            MonthlyInterestPayment: monthlyInterestPayment,
            MonthlyAmortizationPayment: monthlyAmortizationPayment,
            MonthlyMaintenanceCosts: monthlyMaintenanceCosts,
            TotalMonthlyExpenses: totalMonthlyExpenses,

            // Monthly expenses for renting scenario
            MonthlyRentPayment: monthlyRentPayment,
            MonthlyRentalCosts: monthlyRentalCosts,
            MonthlySavingsContribution: monthlySavingsContribution,
            TotalMonthlyRentingExpenses: totalMonthlyRentingExpenses,
            
            // Rental cost breakdown
            GeneralCostOfRental: generalCostOfRental,
            ExcludingYieldsOnAssets: (scenarioMode === 'equalConsumption') ? 0 : -yieldsOnAssets,
            ExcludingDownPayment: -downPaymentOutput,
            ExcludingSavingsContributions: (scenarioMode === 'equalSavings' || scenarioMode === 'cashflowParity') ? -savingsContributionsOutput : 0,
            TotalRentalCost: totalRentalCost,
            // ML aggregates (for compatibility diagnostics)
            PurchaseCostsWithinObservationPeriod: purchaseCostsWithinObservationPeriod,
            RentalCostsWithinObservationPeriod: rentalCostsWithinObservationPeriod,
            
            // Metadata
            MortgageAmount: Math.round(mortgageAmount),
            YearlyBreakdown: yearlyBreakdown,
            ScenarioMode: scenarioMode,
            PostReform: postReform,
            ErrorMsg: null
        };
    }

    /**
     * Find Maximum Bid Price (Break-even Point Analysis)
     * 
     * Uses binary search algorithm to find the maximum purchase price where
     * buying and renting have equivalent total costs (NPV = 0).
     * 
     * This is crucial for property bidding as it shows the maximum price
     * you should pay to break even with renting, helping set realistic
     * bidding limits and avoid overpaying.
     * 
     * @param {Object} params - Base calculation parameters (same as calculate method)
     * @param {Object} options - Search configuration options
     * @param {number} options.minPrice - Minimum search price in CHF (default: 100,000)
     * @param {number} options.maxPrice - Maximum search price in CHF (default: 10,000,000)
     * @param {number} options.tolerance - Acceptable difference in CHF (default: 1,000)
     * @param {number} options.maxIterations - Maximum search iterations (default: 200)
     * @returns {Object} Break-even analysis results with price, iterations, and accuracy
     */
    static findBreakevenPrice(params, options = {}) {
        // Extract search parameters with Swiss market defaults
        const {
            minPrice = 100000,         // CHF 100K - minimum search bound
            maxPrice = 10000000,       // CHF 10M - maximum search bound  
            tolerance = 1000,          // CHF 1K - acceptable accuracy range
            maxIterations = 200        // Maximum search iterations to prevent infinite loops
        } = options;

        // Initialize binary search variables
        let low = minPrice;            // Lower bound of search range
        let high = maxPrice;           // Upper bound of search range
        let iterations = 0;            // Track number of iterations for performance
        let bestResult = null;         // Best result found so far
        let bestDifference = Infinity; // Smallest difference from break-even (0)

        // Binary search for break-even point (where buying cost ≈ renting cost)
        while (low <= high && iterations < maxIterations) {
            // Calculate midpoint price for this iteration
            const testPrice = Math.round((low + high) / 2);
            const testParams = { ...params, purchasePrice: testPrice };
            
            // Adjust down payment if a fixed mortgage amount is specified
            // This maintains consistent loan-to-value ratios across different prices
            if (params.mortgageAmount) {
                testParams.downPayment = testPrice - params.mortgageAmount;
            }
            
            // Run calculation with test price
            const result = this.calculate(testParams);
            const difference = Math.abs(result.ResultValue); // Distance from break-even (0)
            
            // Track the best result (closest to break-even)
            if (difference < bestDifference) {
                bestDifference = difference;
                bestResult = {
                    breakevenFound: difference <= tolerance,  // Within acceptable range?
                    breakevenPrice: testPrice,               // Maximum bid price
                    downPayment: testParams.downPayment,     // Required down payment
                    ltvPercent: params.mortgageAmount ?      // Loan-to-value ratio
                        (params.mortgageAmount / testPrice * 100) : 
                        ((testPrice - testParams.downPayment) / testPrice * 100),
                    resultValue: result.ResultValue,         // Actual difference from break-even
                    decision: result.Decision,               // BUY/RENT/EVEN
                    difference: difference                   // Absolute difference
                };
            }
            
            // Exit early if we've found an acceptable result
            if (difference <= tolerance) {
                break;
            }
            
            // Binary search logic: adjust search range based on result
            if (result.ResultValue > 0) {
                // Buying is cheaper than renting at this price
                // We can afford to bid higher, so search upper range
                low = testPrice + 1;
            } else {
                // Renting is cheaper than buying at this price
                // Price is too high, so search lower range
                high = testPrice - 1;
            }
            
            iterations++; // Track iterations for performance monitoring
        }

        if (!bestResult) {
            return {
                breakevenFound: false,
                message: `No break-even found in range ${minPrice.toLocaleString()}-${maxPrice.toLocaleString()} CHF`,
                iterations: iterations
            };
        }

        return {
            ...bestResult,
            iterations: iterations,
            message: bestResult.breakevenFound ? 
                `Break-even found at ${bestResult.breakevenPrice.toLocaleString()} CHF` :
                `Closest match found at ${bestResult.breakevenPrice.toLocaleString()} CHF (difference: ${bestResult.difference.toLocaleString()} CHF)`
        };
    }

    /**
     * Parameter Sweep Analysis - Scenario Modeling
     * 
     * Generates comprehensive analysis across multiple parameter combinations
     * to understand how market conditions affect the rent vs buy decision.
     * 
     * This is invaluable for:
     * - Understanding decision sensitivity to market changes
     * - Stress-testing assumptions with different scenarios
     * - Visualizing outcomes across parameter ranges
     * - Risk assessment and scenario planning
     * 
     * Example: Test property appreciation (0-3%), investment yields (2-6%),
     * and mortgage rates (0.5-2.5%) to generate 200+ scenario combinations.
     * 
     * @param {Object} baseParams - Base calculation parameters (same as calculate method)
     * @param {Object} sweepRanges - Parameter ranges to sweep
     * @param {Object} sweepRanges.propertyAppreciationRate - {min, max, step} for appreciation
     * @param {Object} sweepRanges.investmentYieldRate - {min, max, step} for investment yields
     * @param {Object} sweepRanges.mortgageRate - {min, max, step} for mortgage rates
     * @returns {Array} Array of calculation results with all parameter combinations
     */
    static parameterSweep(baseParams, sweepRanges) {
        const results = [];                           // Store all combination results
        const paramKeys = Object.keys(sweepRanges);   // Parameters to sweep
        
        /**
         * Recursive function to generate all parameter combinations
         * Uses recursive approach to handle variable number of parameters
         * 
         * @param {Object} params - Current parameter set
         * @param {number} keyIndex - Current parameter index being processed
         */
        const generateCombinations = (params, keyIndex) => {
            // Base case: all parameters processed, run calculation
            if (keyIndex >= paramKeys.length) {
                const result = this.calculate(params);
                results.push({
                    ...params,    // Include input parameters
                    ...result     // Include calculation results
                });
                return;
            }
            
            // Get current parameter and its range
            const key = paramKeys[keyIndex];
            const range = sweepRanges[key];
            
            // Generate all values in range with specified step size
            for (let value = range.min; value <= range.max; value += range.step) {
                // Special handling for boolean parameters
                const paramValue = (key === 'postReform') ? Boolean(value) : value;
                const newParams = { ...params, [key]: paramValue };
                // Recursively process next parameter
                generateCombinations(newParams, keyIndex + 1);
            }
        };
        
        // Start recursive generation from base parameters
        generateCombinations(baseParams, 0);
        return results; // Return all scenario results
    }

    /**
     * Export Results to CSV Format
     * 
     * Converts calculation results to CSV format for external analysis.
     * Handles proper CSV formatting including comma escaping and headers.
     * 
     * The exported CSV includes:
     * - All input parameters for reproducibility
     * - All calculated outputs for analysis
     * - Decision and financial impact data
     * - Compatible with Excel, Google Sheets, and analysis tools
     * 
     * @param {Array} results - Array of calculation results from calculate() or parameterSweep()
     * @returns {string} CSV formatted string ready for download/export
     */
    static resultsToCsv(results) {
        // Handle empty results gracefully
        if (results.length === 0) return '';
        
        // Extract headers from first result object
        const headers = Object.keys(results[0]);
        
        // Generate CSV content with proper formatting
        const csvContent = [
            // Header row
            headers.join(','),
            
            // Data rows with proper comma handling
            ...results.map(row => 
                headers.map(header => {
                    const value = row[header];
                    
                    // Escape string values that contain commas
                    // This prevents CSV parsing errors
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`; // Wrap in quotes
                    }
                    
                    return value; // Return as-is for numbers and simple strings
                }).join(',')
            )
        ].join('\n');  // Join all rows with newlines
        
        return csvContent;
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