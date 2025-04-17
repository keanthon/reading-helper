/**
 * Unit Tests for Big Section Header Processing
 * Tests the processBigSectionHeaders functionality in TextFormatter
 */

// Simple test using Node.js require (bypassing DOM complexities)
const TextFormatter = require('../js/text-formatter.js');

// Test framework (simple implementation)
class TestFramework {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }
    
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    async run() {
        console.log('🧪 Running Big Section Headers Tests...\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                await testFn();
                console.log(`✅ ${name}`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
                this.results.failed++;
            }
            this.results.total++;
        }
        
        this.printSummary();
    }
    
    printSummary() {
        console.log('\n📊 Test Summary:');
        console.log(`   Total: ${this.results.total}`);
        console.log(`   Passed: ${this.results.passed}`);
        console.log(`   Failed: ${this.results.failed}`);
        console.log(`   Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
            process.exit(0);
        } else {
            console.log('\n❌ Some tests failed!');
            process.exit(1);
        }
    }
}

// Helper functions
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertContains(text, substring, message) {
    if (!text.includes(substring)) {
        throw new Error(`${message || 'String does not contain'}: "${substring}"`);
    }
}

function assertNotContains(text, substring, message) {
    if (text.includes(substring)) {
        throw new Error(`${message || 'String should not contain'}: "${substring}"`);
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Values not equal'}. Expected: ${expected}, Actual: ${actual}`);
    }
}

// Initialize test framework
const framework = new TestFramework();

// Tests
framework.test('should process basic big section pattern', () => {
    const formatter = new TextFormatter();
    const input = `Regular content

---
### CODE EXAMPLES
Content after big section`;

    const result = formatter.processBigSectionHeaders(input);
    
    assertContains(result, '<div class="big-section-header">');
    assertContains(result, '<span class="header-icon">💻</span>CODE EXAMPLES</div>');
    assertNotContains(result, '---');
    assertNotContains(result, '### CODE EXAMPLES');
});

framework.test('should detect different section types with appropriate icons', () => {
    const formatter = new TextFormatter();
    const testCases = [
        { input: '---\n### CODE EXAMPLES', expectedIcon: '💻' },
        { input: '---\n### MATHEMATICAL EQUATIONS', expectedIcon: '📐' },
        { input: '---\n### KEY CONCEPTS', expectedIcon: '🔑' },
        { input: '---\n### SUMMARY', expectedIcon: '📋' },
        { input: '---\n### PRACTICE EXERCISES', expectedIcon: '🎯' },
        { input: '---\n### THEORY CONCEPTS', expectedIcon: '🧠' },
        { input: '---\n### GENERAL SECTION', expectedIcon: '🔥' }
    ];

    testCases.forEach(({ input, expectedIcon }) => {
        const result = formatter.processBigSectionHeaders(input);
        assertContains(result, `<span class="header-icon">${expectedIcon}</span>`);
    });
});

framework.test('should handle multiple big sections in same content', () => {
    const formatter = new TextFormatter();
    const input = `Content

---
### CODE EXAMPLES
Code content

More content

---
### MATHEMATICAL EQUATIONS
Math content`;

    const result = formatter.processBigSectionHeaders(input);
    
    const bigSectionCount = (result.match(/big-section-header/g) || []).length;
    assertEquals(bigSectionCount, 2, 'Should have exactly 2 big sections');
    assertContains(result, '💻</span>CODE EXAMPLES</div>');
    assertContains(result, '📐</span>MATHEMATICAL EQUATIONS</div>');
});

framework.test('should not process regular headers without --- prefix', () => {
    const formatter = new TextFormatter();
    const input = `Regular content

### Regular Header
More content`;

    const result = formatter.processBigSectionHeaders(input);
    
    assertNotContains(result, 'big-section-header');
    assertEquals(result, input, 'Should remain unchanged');
});

framework.test('should handle empty or invalid input', () => {
    const formatter = new TextFormatter();
    assertEquals(formatter.processBigSectionHeaders(''), '');
    assertEquals(formatter.processBigSectionHeaders(null), null);
    assertEquals(formatter.processBigSectionHeaders(undefined), undefined);
});

framework.test('should process big sections without creating double headers in full formatting', () => {
    const formatter = new TextFormatter();
    const input = `Regular content

### Regular Header
Regular content

---
### CODE EXAMPLES
Big section content

### Another Regular Header
More regular content`;

    const result = formatter.formatExplanationContent(input);
    
    // Should have 2 regular H3 elements and 1 big section
    const regularH3Count = (result.match(/<h3 class="explanation-header/g) || []).length;
    const bigSectionCount = (result.match(/big-section-header/g) || []).length;
    
    assertEquals(regularH3Count, 2, 'Should have exactly 2 regular H3 headers');
    assertEquals(bigSectionCount, 1, 'Should have exactly 1 big section header');
    assertNotContains(result, '### CODE EXAMPLES', 'Original markdown should be gone');
});

framework.test('should maintain correct processing order', () => {
    const formatter = new TextFormatter();
    const input = `---
### MATHEMATICAL EQUATIONS
Math content

### Regular Header
Regular content`;

    const result = formatter.formatExplanationContent(input);
    
    // Big section should be processed first, regular header should remain as H3
    assertContains(result, 'big-section-header');
    assertContains(result, '<h3 class="explanation-header explanation-h3">');
    assertContains(result, '📐</span>MATHEMATICAL EQUATIONS</div>');
    assertContains(result, '💡</span>Regular Header</h3>');
});

framework.test('should handle consecutive big sections', () => {
    const formatter = new TextFormatter();
    const input = `---
### FIRST SECTION
---
### SECOND SECTION`;

    const result = formatter.formatExplanationContent(input);
    
    const bigSectionCount = (result.match(/big-section-header/g) || []).length;
    assertEquals(bigSectionCount, 2, 'Should handle consecutive big sections');
});

framework.test('should handle big section at start of content', () => {
    const formatter = new TextFormatter();
    const input = `---
### CODE EXAMPLES
Content`;

    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'big-section-header');
    assertContains(result, '💻</span>CODE EXAMPLES</div>');
});

// Run the tests
if (require.main === module) {
    framework.run().catch(console.error);
}
