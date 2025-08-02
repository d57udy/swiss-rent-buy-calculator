#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Swiss Rent vs Buy Calculator
 * Executes all automated tests in proper sequence and provides detailed reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.results = {
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                errors: 0,
                startTime: new Date(),
                endTime: null,
                duration: 0
            }
        };
        
        this.testSuite = [
            {
                name: 'Backend Validation Test',
                description: 'Validates 8,415 calculations against moneyland.ch data + auto-calculations',
                script: 'backend-validation-test.js',
                timeout: 300000, // 5 minutes
                critical: true
            },
            {
                name: 'Auto-Calculation Consistency Test',
                description: 'Tests frontend auto-calculation consistency across realistic scenarios',
                script: 'test-auto-calculation-consistency.js',
                timeout: 180000, // 3 minutes
                critical: true
            },
            {
                name: 'Realistic Parameter Validation',
                description: 'Tests realistic Swiss parameters with frontend-backend alignment',
                script: 'realistic-parameter-validation.js',
                timeout: 120000, // 2 minutes
                critical: false
            },
            {
                name: 'Backend Auto-Calculation Capabilities',
                description: 'Tests backend auto-calculation scaling and break-even finding',
                script: 'test-backend-auto-calculations.js',
                timeout: 60000, // 1 minute
                critical: true
            },
            {
                name: 'Complete Auto-Calculation Test Suite',
                description: 'Comprehensive auto-calculation validation across all components',
                script: 'test-complete-auto-calculations.js',
                timeout: 240000, // 4 minutes
                critical: true
            },
            {
                name: 'Manual Moneyland Test Cases',
                description: 'Manually collected moneyland.ch scenarios validation',
                script: 'test-moneyland-manual-cases.js',
                timeout: 120000, // 2 minutes
                critical: false
            }
        ];
    }

    /**
     * Execute a single test script
     */
    async runSingleTest(test) {
        console.log(`\n🧪 RUNNING: ${test.name}`);
        console.log(`📝 ${test.description}`);
        console.log('─'.repeat(80));

        const startTime = Date.now();
        
        return new Promise((resolve) => {
            // Check if test file exists
            const testPath = path.join(__dirname, test.script);
            if (!fs.existsSync(testPath)) {
                const result = {
                    ...test,
                    status: 'ERROR',
                    exitCode: -1,
                    duration: 0,
                    error: `Test file not found: ${test.script}`,
                    output: '',
                    startTime: new Date(startTime),
                    endTime: new Date()
                };
                console.log(`❌ ERROR: Test file not found: ${test.script}`);
                resolve(result);
                return;
            }

            // Spawn the Node.js process
            const child = spawn('node', [test.script], {
                cwd: __dirname,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            // Collect output
            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                // Stream output in real-time with test prefix
                process.stdout.write(output);
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                // Stream stderr in real-time
                process.stderr.write(output);
            });

            // Set timeout
            const timeout = setTimeout(() => {
                child.kill('SIGTERM');
                console.log(`\n⏰ TEST TIMEOUT: ${test.name} exceeded ${test.timeout/1000}s limit`);
            }, test.timeout);

            // Handle process completion
            child.on('close', (exitCode) => {
                clearTimeout(timeout);
                const endTime = Date.now();
                const duration = endTime - startTime;

                let status;
                if (exitCode === 0) {
                    status = 'PASSED';
                } else if (exitCode === null) {
                    status = 'TIMEOUT';
                } else {
                    status = 'FAILED';
                }

                const result = {
                    ...test,
                    status,
                    exitCode,
                    duration,
                    output: stdout,
                    error: stderr,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime)
                };

                // Print test result summary
                console.log('\n' + '─'.repeat(80));
                console.log(`📊 TEST RESULT: ${this.getStatusEmoji(status)} ${status}`);
                console.log(`⏱️  Duration: ${(duration/1000).toFixed(1)}s`);
                console.log(`🔧 Exit Code: ${exitCode}`);
                
                if (status === 'FAILED' && stderr) {
                    console.log(`❌ Error Output: ${stderr.trim()}`);
                }

                resolve(result);
            });

            child.on('error', (error) => {
                clearTimeout(timeout);
                const endTime = Date.now();
                const duration = endTime - startTime;

                const result = {
                    ...test,
                    status: 'ERROR',
                    exitCode: -1,
                    duration,
                    error: error.message,
                    output: stdout,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime)
                };

                console.log(`\n❌ PROCESS ERROR: ${error.message}`);
                resolve(result);
            });
        });
    }

    /**
     * Get emoji for test status
     */
    getStatusEmoji(status) {
        switch (status) {
            case 'PASSED': return '✅';
            case 'FAILED': return '❌';
            case 'ERROR': return '💥';
            case 'TIMEOUT': return '⏰';
            default: return '❓';
        }
    }

    /**
     * Generate detailed test report
     */
    generateReport() {
        const { results } = this;
        
        console.log('\n\n' + '='.repeat(80));
        console.log('📋 COMPREHENSIVE TEST EXECUTION REPORT');
        console.log('='.repeat(80));
        
        // Summary statistics
        console.log('📊 EXECUTION SUMMARY:');
        console.log('─'.repeat(40));
        console.log(`Total Tests:        ${results.summary.total}`);
        console.log(`Passed Tests:       ${results.summary.passed} (${((results.summary.passed/results.summary.total)*100).toFixed(1)}%)`);
        console.log(`Failed Tests:       ${results.summary.failed} (${((results.summary.failed/results.summary.total)*100).toFixed(1)}%)`);
        console.log(`Error Tests:        ${results.summary.errors} (${((results.summary.errors/results.summary.total)*100).toFixed(1)}%)`);
        console.log(`Total Duration:     ${(results.summary.duration/1000).toFixed(1)}s`);
        console.log(`Start Time:         ${results.summary.startTime.toLocaleString()}`);
        console.log(`End Time:           ${results.summary.endTime.toLocaleString()}`);
        console.log('');

        // Detailed test results
        console.log('📝 DETAILED TEST RESULTS:');
        console.log('─'.repeat(80));
        console.log('Test Name                              | Status    | Duration | Critical');
        console.log('─'.repeat(80));
        
        results.tests.forEach(test => {
            const name = test.name.substring(0, 38).padEnd(38);
            const status = `${this.getStatusEmoji(test.status)} ${test.status}`.padEnd(9);
            const duration = `${(test.duration/1000).toFixed(1)}s`.padEnd(8);
            const critical = test.critical ? 'YES' : 'NO';
            
            console.log(`${name} | ${status} | ${duration} | ${critical}`);
        });
        console.log('─'.repeat(80));
        console.log('');

        // Critical test analysis
        const criticalTests = results.tests.filter(t => t.critical);
        const criticalPassed = criticalTests.filter(t => t.status === 'PASSED').length;
        const criticalFailed = criticalTests.length - criticalPassed;

        console.log('🚨 CRITICAL TEST ANALYSIS:');
        console.log('─'.repeat(40));
        console.log(`Critical Tests:     ${criticalTests.length}`);
        console.log(`Critical Passed:    ${criticalPassed}`);
        console.log(`Critical Failed:    ${criticalFailed}`);
        console.log(`Critical Success:   ${criticalFailed === 0 ? '✅ ALL PASSED' : '❌ FAILURES DETECTED'}`);
        console.log('');

        // Failed test details
        const failedTests = results.tests.filter(t => t.status !== 'PASSED');
        if (failedTests.length > 0) {
            console.log('❌ FAILED TEST DETAILS:');
            console.log('─'.repeat(50));
            
            failedTests.forEach(test => {
                console.log(`🔸 ${test.name}:`);
                console.log(`   Status: ${test.status}`);
                console.log(`   Critical: ${test.critical ? 'YES' : 'NO'}`);
                console.log(`   Duration: ${(test.duration/1000).toFixed(1)}s`);
                
                if (test.error) {
                    console.log(`   Error: ${test.error.trim()}`);
                }
                
                // Show last few lines of output for context
                if (test.output) {
                    const outputLines = test.output.trim().split('\n');
                    const lastLines = outputLines.slice(-3);
                    console.log(`   Last Output:`);
                    lastLines.forEach(line => {
                        console.log(`     ${line}`);
                    });
                }
                console.log('');
            });
        }

        // Overall assessment
        console.log('🎯 OVERALL ASSESSMENT:');
        console.log('─'.repeat(40));
        
        const overallSuccess = results.summary.failed === 0 && results.summary.errors === 0;
        const criticalSuccess = criticalFailed === 0;
        
        if (overallSuccess) {
            console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
            console.log('✅ The Swiss Rent vs Buy Calculator is fully validated');
            console.log('✅ All automatic parameter calculations work correctly');
            console.log('✅ Frontend and backend calculations are consistent');
            console.log('✅ Parameter sweeps and max-bid calculations are reliable');
        } else if (criticalSuccess) {
            console.log('⚠️  SOME NON-CRITICAL TESTS FAILED');
            console.log('✅ All critical functionality is working correctly');
            console.log('✅ Core calculations and auto-parameters are validated');
            console.log('⚠️  Some advanced features may have minor issues');
        } else {
            console.log('🚨 CRITICAL TEST FAILURES DETECTED');
            console.log('❌ Core functionality issues found');
            console.log('❌ Calculator reliability may be compromised');
            console.log('🔧 Immediate investigation and fixes required');
        }

        return {
            overallSuccess,
            criticalSuccess,
            results: results
        };
    }

    /**
     * Save test results to file
     */
    saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `test-results-${timestamp}.json`;
        const filePath = path.join(__dirname, fileName);
        
        try {
            fs.writeFileSync(filePath, JSON.stringify(this.results, null, 2));
            console.log(`💾 Test results saved to: ${fileName}`);
        } catch (error) {
            console.log(`❌ Failed to save test results: ${error.message}`);
        }
    }

    /**
     * Run all tests in sequence
     */
    async runAllTests() {
        console.log('🚀 SWISS RENT VS BUY CALCULATOR - COMPREHENSIVE TEST SUITE');
        console.log('='.repeat(80));
        console.log(`📅 Test Execution Started: ${this.results.summary.startTime.toLocaleString()}`);
        console.log(`🧪 Total Tests to Execute: ${this.testSuite.length}`);
        console.log(`⏱️  Estimated Duration: ${(this.testSuite.reduce((sum, t) => sum + t.timeout, 0)/60000).toFixed(1)} minutes (max)`);
        console.log('');

        // Execute each test
        for (let i = 0; i < this.testSuite.length; i++) {
            const test = this.testSuite[i];
            
            console.log(`\n[${i + 1}/${this.testSuite.length}] ` + '='.repeat(60));
            
            const result = await this.runSingleTest(test);
            this.results.tests.push(result);
            
            // Update summary
            this.results.summary.total++;
            if (result.status === 'PASSED') {
                this.results.summary.passed++;
            } else if (result.status === 'FAILED' || result.status === 'TIMEOUT') {
                this.results.summary.failed++;
            } else {
                this.results.summary.errors++;
            }
        }

        // Finalize summary
        this.results.summary.endTime = new Date();
        this.results.summary.duration = this.results.summary.endTime.getTime() - this.results.summary.startTime.getTime();

        // Generate and display report
        const report = this.generateReport();
        
        // Save results
        this.saveResults();

        // Return exit code based on critical test results
        return report.criticalSuccess ? 0 : 1;
    }
}

// CLI usage
if (require.main === module) {
    const runner = new TestRunner();
    
    runner.runAllTests().then(exitCode => {
        console.log(`\n🏁 Test execution completed with exit code: ${exitCode}`);
        process.exit(exitCode);
    }).catch(error => {
        console.error('💥 Test runner crashed:', error);
        process.exit(1);
    });
}

// Export for programmatic usage
module.exports = { TestRunner };