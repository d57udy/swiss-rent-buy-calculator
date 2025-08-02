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
 * @license CC BY-SA 4.0
 * 
 * This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 
 * International License. To view a copy of this license, visit 
 * http://creativecommons.org/licenses/by-sa/4.0/ or send a letter to 
 * Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
 * 
 * You are free to:
 * - Share: copy and redistribute the material in any medium or format
 * - Adapt: remix, transform, and build upon the material for any purpose
 * 
 * Under the following terms:
 * - Attribution: You must give appropriate credit to d57udy, provide a link to 
 *   the license, and indicate if changes were made.
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
            annualMaintenanceCosts = 20000,    // CHF 20K - typical maintenance
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
            termYears = 10                     // 10 years - standard analysis period
        } = params;

        // ============================================================================
        // PURCHASE SCENARIO CALCULATIONS
        // ============================================================================
        
        // Calculate the mortgage amount (property price minus down payment)
        const mortgageAmount = purchasePrice - downPayment;
        
        // Calculate interest costs using declining balance method
        // This is crucial for Swiss mortgages where interest is calculated on the
        // remaining balance after each amortization payment, not the original amount
        let totalInterestPaid = 0;
        let remainingBalance = mortgageAmount;
        
        for (let year = 0; year < termYears; year++) {
            if (remainingBalance > 0) {
                // Calculate interest on current remaining balance
                const annualInterest = remainingBalance * mortgageRate;
                totalInterestPaid += annualInterest;
                
                // Only reduce balance during amortization period
                if (year < amortizationYears) {
                    // Reduce balance by annual amortization payment
                    remainingBalance -= annualAmortization;
                    
                    // Prevent negative balance (mortgage fully paid)
                    if (remainingBalance < 0) remainingBalance = 0;
                }
            }
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
            additionalPurchaseExpensesOutput; // One-time purchase costs
        
        // Calculate property value at end of analysis period with compound appreciation
        // This represents the asset value you'll have when selling/evaluating
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
        
        // Calculate tax on investment income for rental scenario
        // This is the amount that would be invested if not buying (down payment + costs)
        const investableAmount = downPayment + additionalPurchaseCosts;
        
        // Simple interest calculation for tax purposes
        const simpleInterestTotal = investableAmount * investmentYieldRate * termYears;
        
        // Compound interest calculation (actual investment growth)
        const compoundInterestTotal = investableAmount * (Math.pow(1 + investmentYieldRate, termYears) - 1);
        
        // Tax on simple interest portion
        const simpleInterestTaxTotal = simpleInterestTotal * marginalTaxRate;
        
        // Tax on compound interest gains (growth beyond simple interest)
        const compoundInterestGains = compoundInterestTotal - simpleInterestTotal;
        const compoundInterestGainsTax = compoundInterestGains * marginalTaxRate;
        
        // Total tax on investment income
        const totalInvestmentIncomeTax = simpleInterestTaxTotal + compoundInterestGainsTax;
        
        // Annual average investment income tax
        const annualInvestmentIncomeTax = totalInvestmentIncomeTax / termYears;
        
        // Calculate year-by-year tax differences between buying and renting
        for (let year = 0; year < termYears; year++) {
            // Annual mortgage interest (tax-deductible for homeowners)
            // Calculate if mortgage exists (interest continues even after amortization period)
            let annualInterest = 0;
            if (remainingMortgage > 0) {
                annualInterest = remainingMortgage * mortgageRate;
            }
            const annualTaxSavingsInterest = annualInterest * marginalTaxRate;
            
            // Imputed rental value (taxable income for homeowners)
            // Swiss tax authorities assess this as the benefit of living in your own property
            const annualTaxCostImputedRental = imputedRentalValue * marginalTaxRate;
            
            // Property expenses (tax-deductible for homeowners)
            // Includes maintenance, insurance, property management
            const annualTaxSavingsPropertyExpenses = propertyTaxDeductions * marginalTaxRate;
            
            // Net annual tax difference: buying vs renting
            // Positive value means buying costs more in taxes
            const annualNetTaxDifference = 
                annualTaxCostImputedRental -      // Tax cost of imputed rental value
                annualTaxSavingsInterest -        // Tax savings from mortgage interest
                annualTaxSavingsPropertyExpenses - // Tax savings from property expenses
                annualInvestmentIncomeTax;        // Tax cost of investment income (rental scenario)
            
            totalTaxDifference += annualNetTaxDifference;
            
            // Reduce mortgage balance for next year's interest calculation
            // Only during amortization period
            if (year < amortizationYears && remainingMortgage > 0) {
                remainingMortgage -= annualAmortization;
                if (remainingMortgage < 0) remainingMortgage = 0;
            }
        }
        
        // Total tax difference over the analysis period
        const taxDifferenceToRental = totalTaxDifference;
        
        // Calculate total net cost of the purchase scenario
        // This represents the total financial impact of buying
        const totalPurchaseCost = 
            generalCostOfPurchase +    // All direct costs (interest, maintenance, amortization, etc.)
            taxDifferenceToRental -    // Net tax impact (could be positive or negative)
            propertyValueEnd +         // Subtract final property value (asset gained)
            mortgageAtEnd;            // Add remaining mortgage debt
        
        // RENTAL SCENARIO CALCULATIONS
        const generalCostOfRental = (monthlyRent * 12 * termYears) + (annualRentalCosts * termYears);
        const yieldsOnAssets = investableAmount * (Math.pow(1 + investmentYieldRate, termYears) - 1);
        const downPaymentOutput = downPayment;
        const totalRentalCost = generalCostOfRental - yieldsOnAssets - downPaymentOutput;
        
        // FINAL COMPARISON
        const resultValue = totalRentalCost - totalPurchaseCost;
        let decision, compareText;
        
        if (resultValue > 0) {
            decision = "BUY";
            compareText = `Buying your home will work out CHF ${resultValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} cheaper than renting over the relevant time frame.`;
        } else if (resultValue < 0) {
            decision = "RENT";
            compareText = `Renting is CHF ${Math.abs(resultValue).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} cheaper than buying over the relevant time frame.`;
        } else {
            decision = "EVEN";
            compareText = "Buying and renting have the same cost over the relevant time frame.";
        }
        
        // Calculate monthly expenses for buying scenario
        const monthlyInterestPayment = Math.round((mortgageAmount * mortgageRate) / 12);
        const monthlyAmortizationPayment = Math.round(annualAmortization / 12);
        const monthlyMaintenanceCosts = Math.round(annualMaintenanceCosts / 12);
        const totalMonthlyExpenses = monthlyInterestPayment + monthlyAmortizationPayment + monthlyMaintenanceCosts;

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
            
            // Rental cost breakdown
            GeneralCostOfRental: generalCostOfRental,
            ExcludingYieldsOnAssets: -yieldsOnAssets,
            ExcludingDownPayment: -downPaymentOutput,
            TotalRentalCost: totalRentalCost,
            
            // Metadata
            MortgageAmount: Math.round(mortgageAmount),
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
                const newParams = { ...params, [key]: value };
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