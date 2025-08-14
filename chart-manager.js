/**
 * Swiss Chart Manager
 * 
 * Interactive chart component for the Swiss Rent vs Buy Calculator
 * Provides visualization of year-over-year financial data
 * 
 * @version 1.1.0
 * @author Claude Code
 * @license CC BY-NC-SA 4.0
 */

class SwissChartManager {
    constructor() {
        this.chart = null;
        this.chartData = null;
        this.isInitialized = false;
        this.defaultSettings = {
            activeLines: ['cumBuyCost', 'cumRentCost'],
            zoomLevel: { min: null, max: null },
            panPosition: { x: 0, y: 0 },
            isExpanded: true
        };
        this.currentSettings = { ...this.defaultSettings };
        
        // Chart configuration - expanded to include all year-by-year table columns
        this.lineConfigs = {
            cumBuyCost: {
                label: 'Cumulative Buy Cost',
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                yAxisID: 'y'
            },
            cumRentCost: {
                label: 'Cumulative Rent Cost',
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                yAxisID: 'y'
            },
            advantage: {
                label: 'Advantage (Rent - Buy)',
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                yAxisID: 'y'
            },
            propertyValue: {
                label: 'Property Value',
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                yAxisID: 'y'
            },
            portfolioEnd: {
                label: 'Investment Portfolio',
                borderColor: '#fd7e14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                yAxisID: 'y'
            },
            interest: {
                label: 'Annual Interest',
                borderColor: '#e83e8c',
                backgroundColor: 'rgba(232, 62, 140, 0.1)',
                yAxisID: 'y'
            },
            mortgageBalance: {
                label: 'Mortgage Balance',
                borderColor: '#20c997',
                backgroundColor: 'rgba(32, 201, 151, 0.1)',
                yAxisID: 'y'
            },
            annualRent: {
                label: 'Annual Rent',
                borderColor: '#17a2b8',
                backgroundColor: 'rgba(23, 162, 184, 0.1)',
                yAxisID: 'y'
            },
            annualAmortization: {
                label: 'Annual Amortization',
                borderColor: '#6610f2',
                backgroundColor: 'rgba(102, 16, 242, 0.1)',
                yAxisID: 'y'
            },
            annualMaintenance: {
                label: 'Annual Maintenance',
                borderColor: '#d63384',
                backgroundColor: 'rgba(214, 51, 132, 0.1)',
                yAxisID: 'y'
            },
            annualRentalCosts: {
                label: 'Annual Rental Costs',
                borderColor: '#fd7e14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                yAxisID: 'y'
            },
            annualTaxDifference: {
                label: 'Annual Tax Difference',
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                yAxisID: 'y'
            },
            homeownerEquity: {
                label: 'Homeowner Equity',
                borderColor: '#20c997',
                backgroundColor: 'rgba(32, 201, 151, 0.1)',
                yAxisID: 'y'
            },
            investmentGainsThisYear: {
                label: 'Investment Gains This Year',
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                yAxisID: 'y'
            },
            cumulativeInvestmentGains: {
                label: 'Cumulative Investment Gains',
                borderColor: '#fd7e14',
                backgroundColor: 'rgba(253, 126, 20, 0.1)',
                yAxisID: 'y'
            },
            buyAnnualCashOutlay: {
                label: 'Buy Annual Cash Outlay',
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                yAxisID: 'y'
            },
            rentAnnualCashOutlay: {
                label: 'Rent Annual Cash Outlay',
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                yAxisID: 'y'
            }
        };
        
        this.init();
    }
    
    async init() {
        // Wait for Chart.js to be available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available, retrying...');
            setTimeout(() => this.init(), 500);
            return;
        }
        
        console.log('Chart.js available, initializing chart manager');
        
        // Zoom plugin should register automatically with Chart.js
        console.log('Chart.js zoom plugin should be automatically available');
        
        this.setupEventListeners();
        this.isInitialized = true;
        
        // Initialize with empty chart
        this.initializeChart();
    }
    
    setupEventListeners() {
        // Let the existing collapsible system handle the chart section toggle
        // We'll just monitor for changes to update our settings
        const chartSection = document.getElementById('section-chart');
        if (chartSection) {
            // Use a MutationObserver to track when the section visibility changes
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const isVisible = chartSection.style.display !== 'none';
                        this.currentSettings.isExpanded = isVisible;
                        
                        // Initialize chart when section becomes visible for the first time
                        if (isVisible && this.chartData && this.chart) {
                            setTimeout(() => this.updateChart(), 100);
                        }
                    }
                });
            });
            observer.observe(chartSection, { attributes: true });
        }
        
        // Line toggle checkboxes
        document.querySelectorAll('[data-line]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const lineKey = e.target.dataset.line;
                if (e.target.checked) {
                    if (!this.currentSettings.activeLines.includes(lineKey)) {
                        this.currentSettings.activeLines.push(lineKey);
                    }
                } else {
                    this.currentSettings.activeLines = this.currentSettings.activeLines.filter(l => l !== lineKey);
                }
                this.updateChart();
            });
        });
        
        // Reset zoom button
        const resetZoomBtn = document.getElementById('resetZoom');
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => {
                if (this.chart && this.chart.resetZoom) {
                    this.chart.resetZoom();
                    this.currentSettings.zoomLevel = { min: null, max: null };
                    console.log('Chart zoom reset');
                } else {
                    console.log('Chart zoom functionality not available');
                }
            });
        }
        
        // Export chart button
        const exportBtn = document.getElementById('exportChart');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportChart();
            });
        }
    }
    
    initializeChart() {
        const canvas = document.getElementById('financialChart');
        if (!canvas) {
            console.warn('Chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        console.log('Initializing chart with Canvas:', canvas, 'Chart.js available:', typeof Chart);
        
        try {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Financial Timeline Comparison',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: false // Remove legend - use checkboxes only
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            filter: function(tooltipItem) {
                                // Only show tooltip for visible datasets with valid data
                                return tooltipItem.parsed && tooltipItem.parsed.y !== null && tooltipItem.parsed.y !== undefined;
                            },
                            callbacks: {
                                title: function(context) {
                                    return context[0] ? `Year ${context[0].label}` : '';
                                },
                                label: function(context) {
                                    const value = context.parsed && context.parsed.y !== null ? context.parsed.y : 0;
                                    const formattedValue = new Intl.NumberFormat('de-CH', {
                                        style: 'currency',
                                        currency: 'CHF',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                    return `${context.dataset.label}: ${formattedValue}`;
                                }
                            }
                        },
                        zoom: {
                            zoom: {
                                wheel: { 
                                    enabled: true,
                                    speed: 0.05  // Reduce from default 0.1 to make zoom less sensitive
                                },
                                pinch: { enabled: true },
                                mode: 'x',
                                drag: {
                                    enabled: true,
                                    borderColor: 'rgba(54, 162, 235, 0.3)',
                                    borderWidth: 1,
                                    backgroundColor: 'rgba(54, 162, 235, 0.1)'
                                }
                            },
                            pan: {
                                enabled: true,
                                mode: 'x'
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year'
                            },
                            grid: {
                                display: true,
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Amount (CHF)'
                            },
                            grid: {
                                display: true,
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('de-CH', {
                                        style: 'currency',
                                        currency: 'CHF',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing chart:', error);
            // Create a minimal fallback chart
            this.chart = null;
        }
    }
    
    updateFromCalculation(calculationResult) {
        if (!calculationResult || !calculationResult.YearlyBreakdown) return;
        
        this.chartData = this.processYearByYearData(calculationResult.YearlyBreakdown);
        
        // Auto-reset zoom when new calculation data comes in
        if (this.chart && this.chart.resetZoom) {
            this.chart.resetZoom();
            this.currentSettings.zoomLevel = { min: null, max: null };
        }
        
        this.updateChart();
    }
    
    processYearByYearData(yearByYearArray) {
        if (!Array.isArray(yearByYearArray) || yearByYearArray.length === 0) {
            return { labels: [], datasets: {} };
        }
        
        const labels = [];
        const datasets = {};
        
        // Initialize datasets for all available line types
        Object.keys(this.lineConfigs).forEach(key => {
            datasets[key] = [];
        });
        
        yearByYearArray.forEach(row => {
            labels.push(row.year.toString());
            
            // Calculate cash outlay the same way as the HTML table
            const ownerNetTax = (row.taxImputedRent || 0) - (row.taxSavingsInterest || 0) - (row.taxSavingsPropertyExpenses || 0);
            const buyOutlayNet = (row.annualInterest || 0) + (row.annualAmortization || 0) + (row.annualMaintenance || 0) + ownerNetTax;
            
            // Get rental costs - need to get current value from the input field
            const rentSuppCostsInput = (() => {
                const elem = document.getElementById('annualRentalCosts');
                return elem ? (parseFloat(elem.value) || 0) : 0;
            })();
            const rentOutlayNet = (row.annualRent || 0) + rentSuppCostsInput;
            
            // Map the data from the year-by-year calculation using all available fields
            datasets.cumBuyCost.push(row.totalPurchaseCostToDate || 0);
            datasets.cumRentCost.push(row.totalRentalCostToDate || 0);
            datasets.advantage.push(row.cumulativeAdvantage || 0);
            datasets.propertyValue.push(row.propertyValueEndOfYear || 0);
            datasets.portfolioEnd.push(row.portfolioValueEndOfYear || 0);
            datasets.interest.push(row.annualInterest || 0);
            datasets.mortgageBalance.push(row.endingBalance || 0);
            datasets.annualRent.push(row.annualRent || 0);
            datasets.annualAmortization.push(row.annualAmortization || 0);
            datasets.annualMaintenance.push(row.annualMaintenance || 0);
            datasets.annualRentalCosts.push(row.annualRentalCosts || 0);
            datasets.annualTaxDifference.push(row.annualTaxDifference || 0);
            datasets.homeownerEquity.push(row.homeownerEquityEndOfYear || 0);
            datasets.investmentGainsThisYear.push(row.investmentGainsThisYear || 0);
            datasets.cumulativeInvestmentGains.push(row.cumulativeInvestmentGains || 0);
            datasets.buyAnnualCashOutlay.push(buyOutlayNet);
            datasets.rentAnnualCashOutlay.push(rentOutlayNet);
        });
        
        return { labels, datasets };
    }
    
    updateChart() {
        if (!this.chart || !this.chartData) return;
        
        // Update labels
        this.chart.data.labels = this.chartData.labels;
        
        // Update datasets based on active lines
        const activeDatasets = [];
        this.currentSettings.activeLines.forEach(lineKey => {
            if (this.chartData.datasets[lineKey] && this.lineConfigs[lineKey]) {
                const config = this.lineConfigs[lineKey];
                activeDatasets.push({
                    label: config.label,
                    data: this.chartData.datasets[lineKey],
                    borderColor: config.borderColor,
                    backgroundColor: config.backgroundColor,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    yAxisID: config.yAxisID,
                    lineKey: lineKey
                });
            }
        });
        
        this.chart.data.datasets = activeDatasets;
        
        // Apply saved zoom/pan settings
        if (this.currentSettings.zoomLevel.min !== null) {
            this.chart.options.scales.x.min = this.currentSettings.zoomLevel.min;
            this.chart.options.scales.x.max = this.currentSettings.zoomLevel.max;
        }
        
        this.chart.update();
    }
    
    exportChart() {
        if (!this.chart) return;
        
        const link = document.createElement('a');
        link.download = `swiss-rent-buy-chart-${new Date().toISOString().split('T')[0]}.png`;
        link.href = this.chart.toBase64Image('image/png', 1.0);
        link.click();
    }
    
    getSettings() {
        return { ...this.currentSettings };
    }
    
    loadSettings(settings) {
        if (!settings) return;
        
        this.currentSettings = { ...this.defaultSettings, ...settings };
        
        // Update checkbox states
        Object.keys(this.lineConfigs).forEach(lineKey => {
            const checkbox = document.getElementById(`toggle-${lineKey}`);
            if (checkbox) {
                checkbox.checked = this.currentSettings.activeLines.includes(lineKey);
            }
        });
        
        // Update section visibility
        const chartSection = document.getElementById('section-chart');
        if (chartSection) {
            chartSection.style.display = this.currentSettings.isExpanded ? 'block' : 'none';
        }
        
        // Update chart if data is available
        if (this.chartData) {
            this.updateChart();
        }
    }
    
    // Method to be called when calculation is performed
    static updateFromCalculation(calculationResult) {
        if (window.swissChartManager) {
            window.swissChartManager.updateFromCalculation(calculationResult);
        }
    }
    
    // Method to get chart settings for save/load functionality
    static getSettings() {
        return window.swissChartManager ? window.swissChartManager.getSettings() : null;
    }
    
    // Method to load chart settings
    static loadSettings(settings) {
        if (window.swissChartManager) {
            window.swissChartManager.loadSettings(settings);
        }
    }
}

// Initialize chart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.swissChartManager = new SwissChartManager();
    }, 100);
});

// Make it available globally
window.SwissChartManager = SwissChartManager;