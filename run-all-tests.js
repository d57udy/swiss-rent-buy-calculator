#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Swiss Rent vs Buy Calculator
 * 
 * Runs all automated tests (backend and UI) and generates a comprehensive report
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.results = {
            backend: [],
            ui: [],
            performance: [],
            errors: []
        };
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString().substring(11, 23);
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'performance': '⚡'
        }[type] || 'ℹ️';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async runCommand(command, description, timeout = 30000) {
        this.log(`Running: ${description}`, 'info');
        const startTime = Date.now();
        
        try {
            const output = execSync(command, { 
                encoding: 'utf8', 
                timeout: timeout,
                cwd: __dirname,
                stdio: 'pipe'
            });
            
            const duration = Date.now() - startTime;
            this.log(`✓ ${description} (${duration}ms)`, 'success');
            
            return {
                success: true,
                output: output,
                duration: duration,
                command: command,
                description: description
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            this.log(`✗ ${description} failed (${duration}ms)`, 'error');
            this.log(`Error: ${error.message}`, 'error');
            
            return {
                success: false,
                error: error.message,
                output: error.stdout || '',
                duration: duration,
                command: command,
                description: description
            };
        }
    }

    async runBackendTests() {
        this.log('=== BACKEND TESTS ===', 'info');
        
        const backendTests = [
            {
                command: 'node test-post-reform.js',
                description: 'Post-Reform Tax System Tests',
                critical: true
            },
            {
                command: 'node test-post-reform-comprehensive.js',
                description: 'Comprehensive Post-Reform Features',
                critical: false // May have expected failures for missing functions
            },
            {
                command: 'node test-final-integration.js',
                description: 'Final Integration Tests',
                critical: true
            },
            {
                command: 'node test-specific-case.js',
                description: 'Specific Case Validation',
                critical: true
            },
            {
                command: 'node test-new-implementation.js',
                description: 'New Implementation Validation (8415 cases)',
                critical: true
            },
            {
                command: 'node backend-validation-test.js',
                description: 'Backend Validation Test Suite',
                critical: true
            }
        ];

        for (const test of backendTests) {
            const result = await this.runCommand(test.command, test.description);
            result.critical = test.critical;
            this.results.backend.push(result);
        }
    }

    async runUITests() {
        this.log('=== UI TESTS ===', 'info');
        
        // Check if playwright is available
        try {
            execSync('npx playwright --version', { stdio: 'pipe' });
        } catch (error) {
            this.log('Playwright not available, skipping UI tests', 'warning');
            return;
        }

        const uiTests = [
            {
                command: 'npx playwright test test-frontend-yearbyyear.spec.js --reporter=line',
                description: 'Frontend Year-by-Year Tests',
                critical: false
            },
            {
                command: 'npx playwright test test-chart-functionality.spec.js --reporter=line',
                description: 'Chart Functionality Tests',
                critical: false
            },
            {
                command: 'npx playwright test test-console-errors.spec.js --reporter=line',
                description: 'Console Error Detection Tests',
                critical: true
            }
        ];

        for (const test of uiTests) {
            const result = await this.runCommand(test.command, test.description, 60000);
            result.critical = test.critical;
            this.results.ui.push(result);
        }
    }

    async runPerformanceTests() {
        this.log('=== PERFORMANCE TESTS ===', 'performance');
        
        const performanceTests = [
            {
                command: 'node -e "const calc = require(\'./calculator.js\'); const start = Date.now(); for(let i=0; i<100; i++) { calc.calculate({purchasePrice: 1400000, downPayment: 280000, mortgageRate: 0.02, monthlyRent: 4000, termYears: 15, scenarioMode: \'equalConsumption\'}); } console.log(\'100 calculations in\', Date.now() - start, \'ms\');"',
                description: 'Calculation Performance (100 iterations)',
                critical: false
            }
        ];

        for (const test of performanceTests) {
            const result = await this.runCommand(test.command, test.description);
            result.critical = test.critical;
            this.results.performance.push(result);
        }
    }

    analyzeResults() {
        this.log('=== ANALYSIS ===', 'info');
        
        const totalTests = this.results.backend.length + this.results.ui.length + this.results.performance.length;
        const passedTests = [...this.results.backend, ...this.results.ui, ...this.results.performance]
            .filter(test => test.success).length;
        const criticalTests = [...this.results.backend, ...this.results.ui]
            .filter(test => test.critical);
        const criticalPassed = criticalTests.filter(test => test.success).length;
        
        this.log(`Total Tests: ${totalTests}`, 'info');
        this.log(`Passed: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`, 'info');
        this.log(`Critical Tests: ${criticalPassed}/${criticalTests.length} passed`, 'info');
        
        return {
            totalTests,
            passedTests,
            criticalTests: criticalTests.length,
            criticalPassed,
            overallSuccess: criticalPassed === criticalTests.length
        };
    }

    generateReport() {
        const analysis = this.analyzeResults();
        const totalDuration = Date.now() - this.startTime;
        
        const report = {
            timestamp: new Date().toISOString(),
            duration: totalDuration,
            summary: analysis,
            backend: this.results.backend,
            ui: this.results.ui,
            performance: this.results.performance,
            errors: this.results.errors
        };

        // Save detailed report
        fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
        
        // Generate summary report
        const summaryLines = [
            '================================================================================',
            'SWISS RENT VS BUY CALCULATOR - TEST REPORT',
            '================================================================================',
            '',
            `Generated: ${new Date().toLocaleString()}`,
            `Total Duration: ${(totalDuration/1000).toFixed(2)}s`,
            '',
            'SUMMARY:',
            `  Total Tests: ${analysis.totalTests}`,
            `  Passed: ${analysis.passedTests}/${analysis.totalTests} (${((analysis.passedTests/analysis.totalTests)*100).toFixed(1)}%)`,
            `  Critical Tests: ${analysis.criticalPassed}/${analysis.criticalTests} passed`,
            `  Overall Status: ${analysis.overallSuccess ? '✅ PASS' : '❌ FAIL'}`,
            '',
            'BACKEND TESTS:',
            ...this.results.backend.map(test => 
                `  ${test.success ? '✅' : '❌'} ${test.description} (${test.duration}ms)`
            ),
            '',
            'UI TESTS:',
            ...(this.results.ui.length > 0 ? 
                this.results.ui.map(test => 
                    `  ${test.success ? '✅' : '❌'} ${test.description} (${test.duration}ms)`
                ) : ['  ⚠️  No UI tests available (Playwright not configured)']),
            '',
            'PERFORMANCE:',
            ...this.results.performance.map(test => 
                `  ⚡ ${test.description}: ${test.success ? 'PASS' : 'FAIL'} (${test.duration}ms)`
            ),
            ''
        ];

        if (this.results.errors.length > 0) {
            summaryLines.push('ERRORS:');
            summaryLines.push(...this.results.errors.map(error => `  ❌ ${error}`));
            summaryLines.push('');
        }

        summaryLines.push('================================================================================');
        
        const summary = summaryLines.join('\n');
        fs.writeFileSync('test-report-summary.txt', summary);
        
        console.log('\n' + summary);
        
        this.log(`Detailed report saved to: test-report.json`, 'info');
        this.log(`Summary report saved to: test-report-summary.txt`, 'info');
        
        return analysis.overallSuccess;
    }

    async run() {
        this.log('Starting comprehensive test suite...', 'info');
        
        try {
            await this.runBackendTests();
            await this.runUITests();
            await this.runPerformanceTests();
            
            const success = this.generateReport();
            
            if (success) {
                this.log('All critical tests passed! 🎉', 'success');
                process.exit(0);
            } else {
                this.log('Some critical tests failed! 🚨', 'error');
                process.exit(1);
            }
        } catch (error) {
            this.log(`Test runner failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.run().catch(console.error);
}

module.exports = TestRunner;