/**
 * CODE FORMATTER MODULE
 * Intelligent code formatting and wrapping for LLM responses
 * Handles proper line breaks and indentation for better readability
 */

class CodeFormatter {
    constructor() {
        this.maxLineLength = 80; // Standard line length for terminal display
        this.indentSize = 2;
        this.forceBreakLength = 100; // Hard limit - break anywhere after this
    }

    /**
     * Format code block content for better wrapping
     * @param {string} code - Raw code string from LLM
     * @param {string} language - Programming language (cpp, js, python, etc.)
     * @returns {string} - Formatted code with proper line breaks
     */
    formatCode(code, language = 'cpp') {
        if (!code || typeof code !== 'string') {
            return code;
        }

        // Remove excessive whitespace but preserve intentional formatting
        let formatted = code.trim();

        // FIRST: Force break any extremely long lines
        formatted = this.forceBreakLongLines(formatted);

        // THEN: Apply language-specific formatting
        switch (language.toLowerCase()) {
            case 'cpp':
            case 'c++':
            case 'c':
                formatted = this.formatCppCode(formatted);
                break;
            case 'javascript':
            case 'js':
                formatted = this.formatJavaScriptCode(formatted);
                break;
            case 'python':
                formatted = this.formatPythonCode(formatted);
                break;
            default:
                formatted = this.formatGenericCode(formatted);
        }

        return formatted;
    }

    /**
     * Force break extremely long lines first
     * @param {string} code - Input code
     * @returns {string} - Code with long lines broken
     */
    forceBreakLongLines(code) {
        const lines = code.split('\n');
        const result = [];
        
        for (let line of lines) {
            if (line.length <= this.forceBreakLength) {
                result.push(line);
                continue;
            }
            
            // Break extremely long lines at any reasonable point
            const broken = this.hardBreakLine(line);
            result.push(...broken);
        }
        
        return result.join('\n');
    }

    /**
     * Hard break a line at character boundaries
     * @param {string} line - Long line to break
     * @returns {string[]} - Array of broken lines
     */
    hardBreakLine(line) {
        const result = [];
        const maxLength = this.forceBreakLength;
        
        while (line.length > maxLength) {
            let breakPoint = maxLength;
            
            // Try to find a good break point (space, punctuation, etc.)
            for (let i = maxLength; i > maxLength - 15 && i >= 0; i--) {
                if (/[\s\(\)\[\]\{\},;\.=\+\-\*\/]/.test(line[i])) {
                    breakPoint = i + 1;
                    break;
                }
            }
            
            result.push(line.substring(0, breakPoint));
            line = '  ' + line.substring(breakPoint).trim(); // Add continuation indent
        }
        
        if (line.trim().length > 0) {
            result.push(line);
        }
        
        return result;
    }

    /**
     * Format C++ code with proper line breaks
     * @param {string} code - Raw C++ code
     * @returns {string} - Formatted C++ code
     */
    formatCppCode(code) {
        let formatted = code
            // Add line breaks after semicolons (but not in for loops)
            .replace(/;(?!\s*[)}]|\s*$|\s*\/\/)/g, ';\n')
            // Add line breaks after opening braces
            .replace(/\{\s*(?!$)/g, '{\n')
            // Add line breaks before closing braces
            .replace(/\s*\}/g, '\n}')
            // Add line breaks after preprocessor directives
            .replace(/(#include\s+[<"][^>"]+[>"])/g, '$1\n')
            // Add line breaks after namespace declarations
            .replace(/(using\s+namespace\s+\w+;)/g, '$1\n')
            // Add line breaks before function definitions
            .replace(/(\w+\s+\w+\s*\([^)]*\)\s*\{)/g, '\n$1')
            // Add line breaks after comments
            .replace(/(\/\/[^\n]*)/g, '$1\n')
            // Clean up excessive line breaks
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\n+/, '')
            .trim();

        return this.addIndentation(formatted);
    }

    /**
     * Format JavaScript code with proper line breaks
     * @param {string} code - Raw JavaScript code
     * @returns {string} - Formatted JavaScript code
     */
    formatJavaScriptCode(code) {
        let formatted = code
            // Add line breaks after semicolons
            .replace(/;(?!\s*[)}]|\s*$)/g, ';\n')
            // Add line breaks after opening braces
            .replace(/\{\s*(?!$)/g, '{\n')
            // Add line breaks before closing braces
            .replace(/\s*\}/g, '\n}')
            // Add line breaks after function declarations
            .replace(/(function\s+\w*\s*\([^)]*\)\s*\{)/g, '\n$1')
            // Add line breaks after arrow functions
            .replace(/=>\s*\{/g, '=> {\n')
            // Clean up excessive line breaks
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\n+/, '')
            .trim();

        return this.addIndentation(formatted);
    }

    /**
     * Format Python code with proper line breaks
     * @param {string} code - Raw Python code
     * @returns {string} - Formatted Python code
     */
    formatPythonCode(code) {
        let formatted = code
            // Add line breaks after colons (for def, if, etc.)
            .replace(/:\s*(?!\s*$)/g, ':\n')
            // Add line breaks after function/class definitions
            .replace(/(def\s+\w+\([^)]*\):)/g, '$1\n')
            .replace(/(class\s+\w+[^:]*:)/g, '$1\n')
            // Clean up excessive line breaks
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\n+/, '')
            .trim();

        return this.addIndentation(formatted);
    }

    /**
     * Format generic code with basic line breaks
     * @param {string} code - Raw code
     * @returns {string} - Formatted code
     */
    formatGenericCode(code) {
        return code
            .replace(/;(?!\s*[)}]|\s*$)/g, ';\n')
            .replace(/\{\s*(?!$)/g, '{\n')
            .replace(/\s*\}/g, '\n}')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^\n+/, '')
            .trim();
    }

    /**
     * Add proper indentation to formatted code
     * @param {string} code - Code with line breaks
     * @returns {string} - Code with proper indentation
     */
    addIndentation(code) {
        const lines = code.split('\n');
        let indentLevel = 0;
        const indentedLines = [];

        for (let line of lines) {
            const trimmedLine = line.trim();
            
            // Decrease indent for closing braces
            if (trimmedLine.startsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            // Add indentation
            const spaces = ' '.repeat(indentLevel * this.indentSize);
            indentedLines.push(spaces + trimmedLine);

            // Increase indent for opening braces
            if (trimmedLine.endsWith('{')) {
                indentLevel++;
            }
        }

        return indentedLines.join('\n');
    }

    /**
     * Wrap long lines at appropriate points
     * @param {string} code - Formatted code
     * @returns {string} - Code with wrapped long lines
     */
    wrapLongLines(code) {
        const lines = code.split('\n');
        const wrappedLines = [];

        for (let line of lines) {
            // Force break extremely long lines first
            if (line.length > this.forceBreakLength) {
                const forceBroken = this.forceBreakLine(line);
                for (let brokenLine of forceBroken) {
                    if (brokenLine.length <= this.maxLineLength) {
                        wrappedLines.push(brokenLine);
                    } else {
                        const wrapped = this.breakLongLine(brokenLine);
                        wrappedLines.push(...wrapped);
                    }
                }
            } else if (line.length <= this.maxLineLength) {
                wrappedLines.push(line);
            } else {
                // Find good break points for long lines
                const wrapped = this.breakLongLine(line);
                wrappedLines.push(...wrapped);
            }
        }

        return wrappedLines.join('\n');
    }

    /**
     * Force break extremely long lines at any whitespace
     * @param {string} line - Extremely long line
     * @returns {string[]} - Array of broken lines
     */
    forceBreakLine(line) {
        const result = [];
        const maxChunk = this.forceBreakLength;
        
        while (line.length > maxChunk) {
            let breakPoint = maxChunk;
            
            // Try to find whitespace near the break point
            for (let i = maxChunk; i > maxChunk - 20 && i >= 0; i--) {
                if (/\s/.test(line[i])) {
                    breakPoint = i;
                    break;
                }
            }
            
            result.push(line.substring(0, breakPoint));
            line = line.substring(breakPoint).trim();
        }
        
        if (line.length > 0) {
            result.push(line);
        }
        
        return result;
    }

    /**
     * Break a long line at appropriate points
     * @param {string} line - Long line to break
     * @returns {string[]} - Array of broken lines
     */
    breakLongLine(line) {
        const breakPoints = [
            // Primary break points (best for readability)
            ', ', ' && ', ' || ', ' + ', ' - ', ' * ', ' / ', ' = ', ' == ', ' != ',
            // Secondary break points
            '.', '->', '::', '(', ')', '[', ']', '{', '}', ';',
            // Fallback break points
            ' '
        ];
        
        const indentMatch = line.match(/^(\s*)/);
        const baseIndent = indentMatch ? indentMatch[1] : '';
        const continuationIndent = baseIndent + ' '.repeat(this.indentSize);

        let remaining = line.trim();
        const result = [];
        let currentLine = baseIndent;

        while (remaining.length > 0) {
            let availableSpace = this.maxLineLength - currentLine.length;
            
            if (availableSpace >= remaining.length) {
                result.push(currentLine + remaining);
                break;
            }

            // Find the best break point within available space
            let bestBreak = -1;
            let bestBreakType = -1;
            
            for (let typeIndex = 0; typeIndex < breakPoints.length; typeIndex++) {
                const point = breakPoints[typeIndex];
                let searchStart = Math.max(0, availableSpace - 20);
                let index = remaining.lastIndexOf(point, availableSpace);
                
                if (index > searchStart && index !== -1) {
                    bestBreak = index + point.length;
                    bestBreakType = typeIndex;
                    break;
                }
            }

            // If no good break point found, force break at available space
            if (bestBreak === -1) {
                bestBreak = Math.max(1, availableSpace - 1);
            }

            result.push(currentLine + remaining.substring(0, bestBreak));
            remaining = remaining.substring(bestBreak).trim();
            currentLine = continuationIndent;
        }

        return result;
    }

    /**
     * Auto-format all code blocks in a container
     * @param {HTMLElement} container - Container with code blocks
     */
    async formatAllCodeBlocks(container = document) {
        const codeBlocks = container.querySelectorAll('.code-block code, pre code');
        
        for (const codeElement of codeBlocks) {
            // Skip if already processed (marked with data attribute)
            if (codeElement.hasAttribute('data-formatted')) {
                console.log('🔧 Skipping already formatted code block');
                continue;
            }
            
            const code = codeElement.textContent;
            console.log('Original code length:', code.length);
            console.log('Sample:', code.substring(0, 100) + '...');
            
            // Apply AGGRESSIVE line breaking
            const wrappedCode = this.aggressiveLineWrap(code);
            console.log('After wrapping - lines:', wrappedCode.split('\n').length);
            
            // Replace the content with wrapped version
            codeElement.textContent = wrappedCode;
            
            // Force aggressive text wrapping with multiple CSS properties
            codeElement.style.whiteSpace = 'pre-wrap';
            codeElement.style.wordWrap = 'break-word';
            codeElement.style.overflowWrap = 'anywhere';
            codeElement.style.wordBreak = 'break-all';
            codeElement.style.maxWidth = '100%';
            codeElement.style.width = '100%';
            codeElement.style.overflowX = 'hidden';
            codeElement.style.boxSizing = 'border-box';
            
            // Mark as processed to prevent re-formatting
            codeElement.setAttribute('data-formatted', 'true');
            
            console.log(`✅ Aggressively wrapped code block`);
        }
    }

    /**
     * Aggressively wrap text at character boundaries
     * @param {string} text - Input text
     * @returns {string} - Text with forced line breaks
     */
    aggressiveLineWrap(text) {
        const lines = text.split('\n');
        const wrappedLines = [];
        const maxWidth = 50; // Very aggressive wrapping
        
        for (let line of lines) {
            if (line.length <= maxWidth) {
                wrappedLines.push(line);
                continue;
            }
            
            // Split long lines aggressively
            while (line.length > maxWidth) {
                let breakPoint = maxWidth;
                
                // Look for a good break point (space or punctuation)
                for (let i = maxWidth; i > maxWidth - 10 && i > 0; i--) {
                    if (/[\s\(\)\[\]\{\},;\.=\+\-\*\/\\]/.test(line[i])) {
                        breakPoint = i + 1;
                        break;
                    }
                }
                
                // If no good break point, just break at maxWidth
                if (breakPoint === maxWidth && line[maxWidth] && !/\s/.test(line[maxWidth])) {
                    // Find any character that's not alphanumeric to break on
                    for (let i = maxWidth; i > maxWidth - 5 && i > 0; i--) {
                        if (!/[a-zA-Z0-9_]/.test(line[i])) {
                            breakPoint = i + 1;
                            break;
                        }
                    }
                }
                
                wrappedLines.push(line.substring(0, breakPoint));
                line = line.substring(breakPoint);
                
                // Add slight indentation for continuation lines if they don't start with whitespace
                if (line.length > 0 && !/^\s/.test(line)) {
                    line = '  ' + line;
                }
            }
            
            if (line.length > 0) {
                wrappedLines.push(line);
            }
        }
        
        return wrappedLines.join('\n');
    }

    /**
     * Detect programming language from code element
     * @param {HTMLElement} codeElement - Code element
     * @returns {string} - Detected language
     */
    detectLanguage(codeElement) {
        // Check for language class
        const classList = codeElement.classList || codeElement.parentElement?.classList;
        if (classList) {
            for (let className of classList) {
                if (className.includes('cpp') || className.includes('c++')) return 'cpp';
                if (className.includes('javascript') || className.includes('js')) return 'javascript';
                if (className.includes('python') || className.includes('py')) return 'python';
            }
        }

        // Simple content-based detection
        const content = codeElement.textContent;
        if (content.includes('#include') || content.includes('std::')) return 'cpp';
        if (content.includes('function') || content.includes('=>')) return 'javascript';
        if (content.includes('def ') || content.includes('import ')) return 'python';

        return 'generic';
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeFormatter;
}

// Make CodeFormatter available globally
if (typeof document !== 'undefined') {
    window.CodeFormatter = new CodeFormatter();
    console.log('🔧 CodeFormatter initialized and available globally');
}
