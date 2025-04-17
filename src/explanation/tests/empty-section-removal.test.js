/**
 * Unit Tests for Empty Section Removal Feature
 * Tests the removeEmptySections functionality in TextFormatter
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;

const TextFormatter = require('../js/text-formatter.js');

// Simple test framework
const framework = {
    tests: [],
    passed: 0,
    failed: 0,
    
    test(name, testFn) {
        this.tests.push({ name, testFn });
    },
    
    async run() {
        console.log('🧪 Running Empty Section Removal Tests...\n');
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                console.log(`✅ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }
        
        const total = this.passed + this.failed;
        const successRate = Math.round((this.passed / total) * 100);
        
        console.log(`\n📊 Test Summary:`);
        console.log(`   Total: ${total}`);
        console.log(`   Passed: ${this.passed}`);
        console.log(`   Failed: ${this.failed}`);
        console.log(`   Success Rate: ${successRate}%`);
        
        if (this.failed > 0) {
            console.log('\n❌ Some tests failed!');
            process.exit(1);
        } else {
            console.log('\n🎉 All tests passed!');
        }
    }
};

// Helper functions
function assertContains(actual, expected, message = '') {
    if (!actual.includes(expected)) {
        throw new Error(`String does not contain: "${expected}". ${message}`);
    }
}

function assertNotContains(actual, notExpected, message = '') {
    if (actual.includes(notExpected)) {
        throw new Error(`String should not contain: "${notExpected}". ${message}`);
    }
}

function assertEquals(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`Expected: "${expected}", but got: "${actual}". ${message}`);
    }
}

// ==================== EMPTY SECTION REMOVAL TESTS ====================

framework.test('removeEmptySections should remove header with no content at end', () => {
    const formatter = new TextFormatter();
    const input = '### Good Header\nSome content\n\n### Empty Header\n\n';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Good Header');
    assertContains(result, 'Some content');
    assertNotContains(result, 'Empty Header');
});

framework.test('removeEmptySections should remove multiple empty headers', () => {
    const formatter = new TextFormatter();
    const input = '### Good Header\nContent\n\n### Empty 1\n\n### Empty 2\n\n### Another Good\nMore content';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Good Header');
    assertContains(result, 'Another Good');
    assertNotContains(result, 'Empty 1');
    assertNotContains(result, 'Empty 2');
});

framework.test('removeEmptySections should remove headers with only whitespace', () => {
    const formatter = new TextFormatter();
    const input = '### Header\nContent\n\n### Whitespace Only\n   \n\t\n\n### Another Header\nMore content';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Header');
    assertContains(result, 'Another Header');
    assertNotContains(result, 'Whitespace Only');
});

framework.test('removeEmptySections should preserve headers with actual content', () => {
    const formatter = new TextFormatter();
    const input = '### Header 1\nContent 1\n\n### Header 2\n• Bullet point\n\n### Header 3\n1. Numbered item';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Header 1');
    assertContains(result, 'Header 2');
    assertContains(result, 'Header 3');
    assertContains(result, 'Content 1');
    assertContains(result, 'Bullet point');
    assertContains(result, 'Numbered item');
});

framework.test('removeEmptySections should handle mixed header levels', () => {
    const formatter = new TextFormatter();
    const input = '# Main Title\nContent\n\n## Empty Section\n\n### Good Subsection\nSubcontent\n\n#### Empty Subsub\n\n';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Main Title');
    assertContains(result, 'Good Subsection');
    assertNotContains(result, 'Empty Section');
    assertNotContains(result, 'Empty Subsub');
});

framework.test('removeEmptySections should handle empty headers in middle of content', () => {
    const formatter = new TextFormatter();
    const input = '### Start\nContent\n\n### Empty Middle\n\n### End\nFinal content';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Start');
    assertContains(result, 'End');
    assertNotContains(result, 'Empty Middle');
    assertContains(result, 'Content');
    assertContains(result, 'Final content');
});

framework.test('removeEmptySections should handle code blocks correctly', () => {
    const formatter = new TextFormatter();
    const input = '### Code Example\n```javascript\nconsole.log("test");\n```\n\n### Empty After Code\n\n';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Code Example');
    assertContains(result, 'console.log');
    assertNotContains(result, 'Empty After Code');
});

framework.test('removeEmptySections should handle headers with special characters', () => {
    const formatter = new TextFormatter();
    const input = '### Header & Special\nContent\n\n### Empty & Special\n\n### Another (Good)\nMore content';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Header &amp; Special');
    assertContains(result, 'Another (Good)');
    assertNotContains(result, 'Empty &amp; Special');
});

framework.test('removeEmptySections should handle content with inline formatting', () => {
    const formatter = new TextFormatter();
    const input = '### Header\n**Bold** and *italic* text\n\n### Empty Header\n\n### Another\n`Code inline`';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, '<strong>Bold</strong>');
    assertContains(result, '<em>italic</em>');
    assertContains(result, '<code class="inline-code">Code inline</code>');
    assertNotContains(result, 'Empty Header');
});

framework.test('removeEmptySections should handle bullet points and numbered lists', () => {
    const formatter = new TextFormatter();
    const input = '### List Header\n• Item 1\n• Item 2\n\n### Empty List\n\n### Number Header\n1. First\n2. Second';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'List Header');
    assertContains(result, 'Number Header');
    assertNotContains(result, 'Empty List');
    assertContains(result, 'bullet-point');
    assertContains(result, 'numbered-item');
});

framework.test('removeEmptySections should handle edge case with only empty headers', () => {
    const formatter = new TextFormatter();
    const input = '### Empty 1\n\n### Empty 2\n\n### Empty 3\n\n';
    const result = formatter.formatExplanationContent(input);
    
    // Should result in minimal output with no headers
    assertNotContains(result, 'Empty 1');
    assertNotContains(result, 'Empty 2');
    assertNotContains(result, 'Empty 3');
    assertNotContains(result, 'explanation-header');
});

framework.test('removeEmptySections should handle single character content', () => {
    const formatter = new TextFormatter();
    const input = '### Header\na\n\n### Empty\n\n### Another\nb';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Header');
    assertContains(result, 'Another');
    assertNotContains(result, 'Empty');
});

framework.test('removeEmptySections should handle numeric content', () => {
    const formatter = new TextFormatter();
    const input = '### Numbers\n123\n\n### Empty\n\n### More Numbers\n456.789';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Numbers');
    assertContains(result, 'More Numbers');
    assertContains(result, '123');
    assertContains(result, '456.789');
    assertNotContains(result, 'Empty');
});

framework.test('removeEmptySections should preserve content with just newlines', () => {
    const formatter = new TextFormatter();
    const input = '### Header\nContent\n\n\nMore content\n\n### Empty\n\n';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, 'Header');
    assertContains(result, 'Content');
    assertContains(result, 'More content');
    assertNotContains(result, 'Empty');
});

framework.test('removeEmptySections should work with different header types', () => {
    const formatter = new TextFormatter();
    const input = '### CODE EXAMPLES\nsome code\n\n### EMPTY CODE\n\n### KEY TERMS\nterm definition';
    const result = formatter.formatExplanationContent(input);
    
    assertContains(result, '💻</span>CODE EXAMPLES');
    assertContains(result, '🔑</span>KEY TERMS');
    assertNotContains(result, 'EMPTY CODE');
});

// Run all tests
if (require.main === module) {
    framework.run().catch(console.error);
}

module.exports = framework;
