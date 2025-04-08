/**
 * STREAMING-AWARE TEXT FORMATTER MODULE
 * Handles text processing for streaming LLM content
 * Processes headers without relying on line boundaries
 */

class StreamingTextFormatter {
    constructor() {
        this.maxLineLength = 120;
        this.codeBlockCounter = 0;
        this.headerProcessingBuffer = '';
        this.processedHeaderIds = new Set();
    }
    
    /**
     * Reset all state for new content stream
     */
    resetCounters() {
        this.codeBlockCounter = 0;
        this.headerProcessingBuffer = '';
        this.processedHeaderIds.clear();
    }
    
    /**
     * Format streaming content update - handles partial content
     */
    formatStreamingContent(newContent, isPartial = true) {
        if (!newContent || typeof newContent !== 'string') {
            return '';
        }
        
        console.log('🔄 STREAMING CONTENT UPDATE:', {
            length: newContent.length,
            isPartial,
            preview: newContent.substring(0, 100)
        });
        
        let formatted = newContent;
        
        // Use streaming-safe header processing
        formatted = this.processHeadersStreaming(formatted, isPartial);
        
        // Process code blocks (safer for streaming)
        formatted = this.enhanceCodeBlocksStreaming(formatted);
        
        if (isPartial) {
            formatted += '<span class="streaming-indicator">...</span>';
        }
        
        return formatted;
    }
    
    /**
     * STREAMING-SAFE header processing
     * Uses global search instead of line-based regex
     */
    processHeadersStreaming(content, isPartial = false) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        console.log('🔍 STREAMING HEADER PROCESSING');
        
        let processed = content;
        
        // Process big section headers first (more specific)
        processed = this.processBigSectionHeadersStreaming(processed, isPartial);
        
        // Process markdown headers using GLOBAL search, not line-based
        // H6 first (most specific)
        processed = processed.replace(/######\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const escapedText = this.escapeHtml(headerText);
                return `<h6 class="explanation-header explanation-h6"><span class="header-icon">▫️</span>${escapedText}</h6>`;
            });
        
        // H5
        processed = processed.replace(/#####\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const escapedText = this.escapeHtml(headerText);
                return `<h5 class="explanation-header explanation-h5"><span class="header-icon">▪️</span>${escapedText}</h5>`;
            });
        
        // H4
        processed = processed.replace(/####\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const escapedText = this.escapeHtml(headerText);
                return `<h4 class="explanation-header explanation-h4"><span class="header-icon">🔹</span>${escapedText}</h4>`;
            });
        
        // H3 - most common
        processed = processed.replace(/###\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const escapedText = this.escapeHtml(headerText);
                return `<h3 class="explanation-header explanation-h3"><span class="header-icon">💡</span>${escapedText}</h3>`;
            });
        
        // H2
        processed = processed.replace(/##\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const escapedText = this.escapeHtml(headerText);
                return `<h2 class="explanation-header explanation-h2"><span class="header-icon">📖</span>${escapedText}</h2>`;
            });
        
        // H1 (least specific, do last)
        processed = processed.replace(/#\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const escapedText = this.escapeHtml(headerText);
                return `<h1 class="explanation-header explanation-h1"><span class="header-icon">📋</span>${escapedText}</h1>`;
            });
        
        console.log('✅ STREAMING HEADER PROCESSING COMPLETE');
        return processed;
    }
    
    /**
     * Process big section headers for streaming content
     */
    processBigSectionHeadersStreaming(content, isPartial = false) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        console.log('🎯 PROCESSING BIG SECTION HEADERS (STREAMING)');
        
        // Look for the pattern: ---\n### HEADER or ---\r\n### HEADER
        // Use a more flexible approach that doesn't rely on line boundaries
        let processed = content.replace(
            /---[\s\n\r]*###\s+([^\n\r]+)/g, 
            (match, headerText) => {
                console.log(`🔥 FOUND BIG SECTION: "${headerText}"`);
                
                // Determine icon based on content
                const icon = this.determineSectionIcon(headerText);
                const escapedText = this.escapeHtml(headerText);
                
                return `<div class="big-section-header"><span class="header-icon">${icon}</span>${escapedText}</div>`;
            }
        );
        
        return processed;
    }
    
    /**
     * Determine appropriate icon for section headers
     */
    determineSectionIcon(headerText) {
        const lower = headerText.toLowerCase();
        
        if (lower.includes('code') || lower.includes('example')) return '💻';
        if (lower.includes('math') || lower.includes('equation')) return '📐';
        if (lower.includes('key') || lower.includes('important') || lower.includes('term')) return '🔑';
        if (lower.includes('summary') || lower.includes('conclusion')) return '📋';
        if (lower.includes('concept') || lower.includes('theory')) return '🧠';
        if (lower.includes('practice') || lower.includes('exercise')) return '🎯';
        
        return '🔥'; // Default
    }
    
    /**
     * Enhance code blocks safely for streaming
     */
    enhanceCodeBlocksStreaming(content) {
        // Only process complete code blocks to avoid issues with partial content
        return content.replace(
            /```(\w+)?\n([\s\S]*?)\n```/g,
            (match, language, code) => {
                this.codeBlockCounter++;
                const codeId = `code-block-${this.codeBlockCounter}`;
                const lang = language || 'text';
                
                return `
                    <div class="code-block" data-language="${lang}">
                        <div class="code-header">
                            <span class="code-language">${lang}</span>
                            <button class="code-copy-btn" onclick="TextFormatter.copyCode('${codeId}')">
                                Copy
                            </button>
                        </div>
                        <pre><code id="${codeId}" class="language-${lang}">${this.escapeHtml(code)}</code></pre>
                    </div>
                `;
            }
        );
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Copy code to clipboard
     */
    static copyCode(codeId) {
        const element = document.getElementById(codeId);
        if (!element) return;
        
        const text = element.textContent;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('📋 Code copied to clipboard');
            }).catch(err => {
                console.error('❌ Failed to copy:', err);
            });
        }
    }
    
    /**
     * Finalize content when streaming is complete
     */
    finalizeStreamingContent(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }
        
        // Remove streaming indicators
        let finalized = content.replace(/<span class="streaming-indicator">.*?<\/span>/g, '');
        
        // Final cleanup and optimization
        finalized = this.cleanupFormatting(finalized);
        
        return finalized;
    }
    
    /**
     * Clean up formatting inconsistencies
     */
    cleanupFormatting(content) {
        return content
            // Remove excessive whitespace
            .replace(/\n{3,}/g, '\n\n')
            // Clean up spacing around headers
            .replace(/(<\/h[1-6]>)\n+/g, '$1\n\n')
            .replace(/\n+(<h[1-6])/g, '\n\n$1')
            // Trim
            .trim();
    }
    
    /**
     * Format word count display
     */
    formatWordCount(count) {
        if (typeof count !== 'number' || count < 0) return '0 words';
        if (count === 1) return '1 word';
        return count.toLocaleString() + ' words';
    }
    
    /**
     * Check if content contains mathematical notation
     */
    containsMath(content) {
        if (!content || typeof content !== 'string') return false;
        
        const mathPatterns = [
            /\$\$[\s\S]*?\$\$/,  // Display math
            /\$[^$\n]*\$/,       // Inline math  
            /\\\[[\s\S]*?\\\]/,  // Display brackets
            /\\\([\s\S]*?\\\)/   // Inline brackets
        ];
        
        return mathPatterns.some(pattern => pattern.test(content));
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamingTextFormatter;
} else if (typeof window !== 'undefined') {
    window.StreamingTextFormatter = StreamingTextFormatter;
}
