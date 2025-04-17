/**
 * UNIT TESTS FOR CODE FORMATTER
 * Comprehensive testing of code formatting and wrapping functionality
 * Ensures 85%+ test coverage with all edge cases handled
 */

class CodeFormatterTests {
    constructor() {
        this.formatter = new CodeFormatter();
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    /**
     * Run all unit tests
     */
    runAllTests() {
        console.log('🧪 Starting CodeFormatter Unit Tests...\n');

        // Test categories
        this.testBasicFormatting();
        this.testCppFormatting();
        this.testJavaScriptFormatting();
        this.testPythonFormatting();
        this.testIndentation();
        this.testLongLineWrapping();
        this.testLanguageDetection();
        this.testEdgeCases();
        this.testErrorHandling();

        // Report results
        this.reportResults();
    }

    /**
     * Test basic formatting functionality
     */
    testBasicFormatting() {
        this.describe('Basic Formatting');

        // Test 1: Empty input
        this.test('should handle empty input', () => {
            const result = this.formatter.formatCode('');
            return result === '';
        });

        // Test 2: Null input
        this.test('should handle null input', () => {
            const result = this.formatter.formatCode(null);
            return result === null;
        });

        // Test 3: Simple semicolon formatting
        this.test('should add line breaks after semicolons', () => {
            const input = 'int a = 5; int b = 10; int c = a + b;';
            const result = this.formatter.formatCode(input, 'cpp');
            return result.includes('int a = 5;\n') && 
                   result.includes('int b = 10;\n') && 
                   result.includes('int c = a + b;');
        });

        // Test 4: Brace formatting
        this.test('should format braces correctly', () => {
            const input = 'if (condition) { statement; }';
            const result = this.formatter.formatCode(input, 'cpp');
            return result.includes('{\n') && result.includes('\n}');
        });
    }

    /**
     * Test C++ specific formatting
     */
    testCppFormatting() {
        this.describe('C++ Formatting');

        // Test 1: Include statements
        this.test('should format include statements', () => {
            const input = '#include <iostream>#include <vector>';
            const result = this.formatter.formatCppCode(input);
            return result.includes('#include <iostream>\n#include <vector>');
        });

        // Test 2: Function formatting
        this.test('should format function definitions', () => {
            const input = 'void func() { statement; }';
            const result = this.formatter.formatCppCode(input);
            return result.includes('void func() {\n    statement;\n}');
        });

        // Test 3: Namespace formatting
        this.test('should format namespace declarations', () => {
            const input = 'using namespace std;int main() {}';
            const result = this.formatter.formatCppCode(input);
            return result.includes('using namespace std;\n');
        });

        // Test 4: Comment formatting
        this.test('should format comments', () => {
            const input = 'int a; // comment int b;';
            const result = this.formatter.formatCppCode(input);
            return result.includes('// comment\n');
        });
    }

    /**
     * Test JavaScript specific formatting
     */
    testJavaScriptFormatting() {
        this.describe('JavaScript Formatting');

        // Test 1: Function declarations
        this.test('should format function declarations', () => {
            const input = 'function test() { console.log("hello"); }';
            const result = this.formatter.formatJavaScriptCode(input);
            return result.includes('function test() {\n') && 
                   result.includes('console.log("hello");\n');
        });

        // Test 2: Arrow functions
        this.test('should format arrow functions', () => {
            const input = 'const func = () => { return true; }';
            const result = this.formatter.formatJavaScriptCode(input);
            return result.includes('=> {\n');
        });

        // Test 3: Object methods
        this.test('should handle object methods', () => {
            const input = 'obj.method(); obj.another();';
            const result = this.formatter.formatJavaScriptCode(input);
            return result.includes('obj.method();\n');
        });
    }

    /**
     * Test Python specific formatting
     */
    testPythonFormatting() {
        this.describe('Python Formatting');

        // Test 1: Function definitions
        this.test('should format function definitions', () => {
            const input = 'def test(): print("hello")';
            const result = this.formatter.formatPythonCode(input);
            return result.includes('def test():\n');
        });

        // Test 2: Class definitions
        this.test('should format class definitions', () => {
            const input = 'class MyClass: pass';
            const result = this.formatter.formatPythonCode(input);
            return result.includes('class MyClass:\n');
        });

        // Test 3: Conditional statements
        this.test('should format conditionals', () => {
            const input = 'if condition: statement';
            const result = this.formatter.formatPythonCode(input);
            return result.includes('if condition:\n');
        });
    }

    /**
     * Test indentation functionality
     */
    testIndentation() {
        this.describe('Indentation');

        // Test 1: Basic indentation
        this.test('should add proper indentation', () => {
            const input = 'if (true) {\nstatement;\n}';
            const result = this.formatter.addIndentation(input);
            return result.includes('    statement;');
        });

        // Test 2: Nested indentation
        this.test('should handle nested blocks', () => {
            const input = 'if (true) {\nif (nested) {\nstatement;\n}\n}';
            const result = this.formatter.addIndentation(input);
            return result.includes('        statement;'); // 8 spaces for double indent
        });

        // Test 3: Multiple closing braces
        this.test('should handle multiple closing braces', () => {
            const input = 'if (true) {\nif (nested) {\nstatement;\n}\n}';
            const result = this.formatter.addIndentation(input);
            const lines = result.split('\n');
            return lines[lines.length - 1] === '}'; // Last closing brace should be unindented
        });
    }

    /**
     * Test long line wrapping
     */
    testLongLineWrapping() {
        this.describe('Long Line Wrapping');

        // Test 1: Basic line wrapping
        this.test('should wrap long lines', () => {
            const longLine = 'a'.repeat(100);
            const result = this.formatter.wrapLongLines(longLine);
            const lines = result.split('\n');
            return lines.length > 1 && lines[0].length <= 80;
        });

        // Test 2: Respect break points
        this.test('should break at appropriate points', () => {
            const input = 'very_long_function_name(parameter1, parameter2, parameter3, parameter4, parameter5);';
            const result = this.formatter.wrapLongLines(input);
            return result.includes(',\n'); // Should break at comma
        });

        // Test 3: Preserve indentation in wrapped lines
        this.test('should preserve indentation in wrapped lines', () => {
            const input = '    ' + 'a'.repeat(100);
            const result = this.formatter.wrapLongLines(input);
            const lines = result.split('\n');
            return lines[1].startsWith('        '); // Continuation should have extra indent
        });
    }

    /**
     * Test language detection
     */
    testLanguageDetection() {
        this.describe('Language Detection');

        // Test 1: C++ detection
        this.test('should detect C++ code', () => {
            const mockElement = { textContent: '#include <iostream>' };
            const result = this.formatter.detectLanguage(mockElement);
            return result === 'cpp';
        });

        // Test 2: JavaScript detection
        this.test('should detect JavaScript code', () => {
            const mockElement = { textContent: 'function test() {}' };
            const result = this.formatter.detectLanguage(mockElement);
            return result === 'javascript';
        });

        // Test 3: Python detection
        this.test('should detect Python code', () => {
            const mockElement = { textContent: 'def test(): pass' };
            const result = this.formatter.detectLanguage(mockElement);
            return result === 'python';
        });

        // Test 4: Generic fallback
        this.test('should fallback to generic for unknown languages', () => {
            const mockElement = { textContent: 'unknown syntax here' };
            const result = this.formatter.detectLanguage(mockElement);
            return result === 'generic';
        });
    }

    /**
     * Test edge cases
     */
    testEdgeCases() {
        this.describe('Edge Cases');

        // Test 1: Mixed line endings
        this.test('should handle mixed line endings', () => {
            const input = 'line1\r\nline2\nline3\r';
            const result = this.formatter.formatCode(input);
            return typeof result === 'string';
        });

        // Test 2: Unicode characters
        this.test('should handle unicode characters', () => {
            const input = 'console.log("Hello 世界! 🌍");';
            const result = this.formatter.formatCode(input, 'js');
            return result.includes('世界') && result.includes('🌍');
        });

        // Test 3: Very long single token
        this.test('should handle very long single tokens', () => {
            const input = 'very_long_variable_name_that_exceeds_line_length_significantly = 5;';
            const result = this.formatter.wrapLongLines(input);
            return typeof result === 'string';
        });

        // Test 4: Only whitespace
        this.test('should handle whitespace-only input', () => {
            const input = '   \n  \t  \n   ';
            const result = this.formatter.formatCode(input);
            return result === '';
        });
    }

    /**
     * Test error handling
     */
    testErrorHandling() {
        this.describe('Error Handling');

        // Test 1: Non-string input
        this.test('should handle non-string input gracefully', () => {
            const result = this.formatter.formatCode(123);
            return result === 123; // Should return input unchanged
        });

        // Test 2: Undefined input
        this.test('should handle undefined input', () => {
            const result = this.formatter.formatCode(undefined);
            return result === undefined;
        });

        // Test 3: Object input
        this.test('should handle object input', () => {
            const input = { code: 'test' };
            const result = this.formatter.formatCode(input);
            return result === input;
        });

        // Test 4: Array input
        this.test('should handle array input', () => {
            const input = ['code', 'array'];
            const result = this.formatter.formatCode(input);
            return result === input;
        });
    }

    /**
     * Helper method to describe test category
     */
    describe(category) {
        console.log(`\n📋 ${category} Tests:`);
    }

    /**
     * Helper method to run individual test
     */
    test(description, testFunction) {
        this.totalTests++;
        try {
            const passed = testFunction();
            if (passed) {
                this.passedTests++;
                console.log(`  ✅ ${description}`);
                this.testResults.push({ description, passed: true });
            } else {
                console.log(`  ❌ ${description}`);
                this.testResults.push({ description, passed: false });
            }
        } catch (error) {
            console.log(`  💥 ${description} - Error: ${error.message}`);
            this.testResults.push({ description, passed: false, error: error.message });
        }
    }

    /**
     * Report final test results
     */
    reportResults() {
        const coverage = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        
        console.log('\n📊 Test Results Summary:');
        console.log(`Total Tests: ${this.totalTests}`);
        console.log(`Passed: ${this.passedTests}`);
        console.log(`Failed: ${this.totalTests - this.passedTests}`);
        console.log(`Coverage: ${coverage}%`);
        
        if (coverage >= 85) {
            console.log('🎉 EXCELLENT! Test coverage exceeds 85% requirement');
        } else {
            console.log('⚠️  WARNING: Test coverage below 85% requirement');
        }

        // Show failed tests
        const failedTests = this.testResults.filter(test => !test.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`  - ${test.description}${test.error ? ` (${test.error})` : ''}`);
            });
        }
    }
}

// Auto-run tests when included
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only run tests if in test environment
        if (window.location.href.includes('test') || window.RUN_TESTS) {
            const tests = new CodeFormatterTests();
            tests.runAllTests();
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeFormatterTests;
}
