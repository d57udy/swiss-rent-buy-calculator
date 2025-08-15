# Default Values Update - Swiss Rent vs Buy Calculator

## Overview
Updated default values based on comprehensive research of Swiss real estate and financial markets for 2024-2025.

## Research Sources & Market Data

### Property Prices
- **Median house price**: CHF 1,379,868 (2024-2025)
- **Property appreciation**: 3-4% annually (2024-2025 forecasts)
- **Source**: RealAdvisor, UBS, Wüest Partner

### Mortgage Rates
- **Current rates**: ~2.0% (stabilized in 2024-2025)
- **10-year fixed**: 1.63-1.66%
- **SARON mortgages**: 1.64%+
- **Source**: UBS, Comparis, Swiss National Bank

### Transaction Costs
- **Total costs**: 2.5-5% of purchase price
- **Typical range**: 3% for most transactions
- **Source**: Swiss real estate transaction studies

### Tax Rates
- **Average marginal rate**: ~25% (federal + cantonal + municipal)
- **Range**: 21-46% depending on canton
- **Source**: PWC Tax Summaries, Swiss Federal Tax Administration

### Rental Market
- **Median monthly rent**: CHF 3,246 (apartments), CHF 4,733 (houses)
- **Recent growth**: 6.3% increase in Q1 2024
- **Source**: Federal Statistical Office, RealAdvisor

### Investment Returns
- **Swiss equities**: 6.2% (2024)
- **Swiss bonds**: 5.3% (2024)
- **10-year government bonds**: ~0.26% (2025)
- **Conservative assumption**: 3.0%
- **Source**: Pictet, Swiss Performance Index

## Changes Implemented

### Major Parameter Updates

| Parameter | Old Default | New Default | Change | Rationale |
|-----------|-------------|-------------|---------|-----------|
| **Purchase Price** | CHF 2,000,000 | CHF 1,400,000 | -30% | Closer to median market price |
| **Mortgage Rate** | 0.9% | 2.0% | +122% | Current market rates |
| **Property Appreciation** | 1.0% | 3.5% | +250% | 2024-2025 market growth |
| **Additional Purchase Costs** | CHF 5,000 | CHF 42,000 | +740% | Realistic 3% transaction costs |
| **Monthly Rent** | CHF 5,500 | CHF 4,000 | -27% | Closer to median rents |
| **Marginal Tax Rate** | 30.0% | 25.0% | -17% | Average Swiss tax burden |
| **Investment Yield** | 3.5% | 3.0% | -14% | Conservative in low-yield environment |
| **Term Years** | 10 | 15 | +50% | Longer analysis period |
| **Amortization Years** | 10 | 15 | +50% | Typical Swiss practice |

### Automatic Adjustments
- **Down Payment**: CHF 280,000 (20% of new purchase price)
- **Mortgage Amount**: CHF 1,120,000 (80% of new purchase price)
- **Annual Amortization**: CHF 22,400 (based on 15-year period)
- **Maintenance Costs**: CHF 17,500 (1.25% of purchase price)
- **Imputed Rental Value**: CHF 30,000 (more conservative)
- **Annual Rental Costs**: CHF 8,000 (reduced supplemental costs)

### Analysis Tools Updates
- **Break-even Min Price**: CHF 1,000,000 (was CHF 1,500,000)
- **Break-even Max Price**: CHF 2,500,000 (was CHF 10,000,000)

## Impact Assessment

### Before (Old Defaults)
- Purchase price above market median
- Unrealistically low mortgage rates
- Conservative property appreciation
- High transaction cost assumption errors

### After (New Defaults)
- ✅ Market-representative property prices
- ✅ Current mortgage rate environment
- ✅ Realistic appreciation expectations
- ✅ Accurate transaction cost modeling
- ✅ Conservative but realistic returns

## Validation
The new defaults produce realistic results:
- **Decision**: BUY (CHF 1,054,519 advantage over 15 years)
- **Monthly costs**: CHF 5,192 (buy) vs CHF 4,000 rent + savings
- **Mortgage rate**: 2.0% (market rate)
- **Appreciation**: 3.5% (forecast range)

## Benefits
1. **User Experience**: More realistic starting point for analysis
2. **Market Accuracy**: Reflects current Swiss market conditions  
3. **Decision Quality**: Better baseline for rent vs buy comparisons
4. **Educational Value**: Teaches users realistic market parameters

---
*Last Updated: August 2025*
*Sources: UBS, RealAdvisor, Swiss Federal Statistical Office, PWC, Pictet*