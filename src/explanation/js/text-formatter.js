/**
 * Text Formatter Module
 * Handles text processing, formatting, and sanitization
 */

class TextFormatter {
    constructor() {
        this.maxLineLength = 120;
        this.codeBlockCounter = 0;
    }
    
    // ==================== CORE FORMATTING METHODS ====================
    
    /**
     * Reset counters for new content
     */
    resetCounters() {
        this.codeBlockCounter = 0;
    }
    
    /**
     * Format selected text for display
     */
    formatSelectedText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        // Basic HTML escaping for safety
        const escaped = this.escapeHtml(text);
        
        // Preserve line breaks and normalize whitespace
        return escaped
            .replace(/\n/g, '<br>')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    
    /**
     * Escape HTML characters to prevent XSS
     */
    escapeHtml(text) {
        // Node.js environment fallback
        if (typeof document === 'undefined') {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        
        // Browser environment
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Format explanation content - STREAMING-SAFE APPROACH
     * Handles incremental LLM content properly during streaming
     */
    formatExplanationContent(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }
        
        let formatted = content;
        
        // Check if content is already HTML (from AIService) or raw markdown
        if (this.isHtmlContent(formatted)) {
            formatted = this.sanitizeHtmlHeaders(formatted);
        } else {
            // Process markdown code blocks first
            formatted = this.processMarkdownCodeBlocks(formatted);
            
            // Process headers, then handle content between headers
            formatted = this.processHeaders(formatted);
            formatted = this.processStreamingContent(formatted);
        }
        
        // Enhance code blocks
        formatted = this.enhanceCodeBlocks(formatted);
        
        // Remove empty sections after all processing is complete
        formatted = this.removeEmptySections(formatted);
        
        return formatted;
    }
    
    // ==================== HEADER PROCESSING METHODS ====================
    
    /**
     * STREAMING-SAFE header processing - treats all headers uniformly
     * Uses single-line regex patterns that work with incremental LLM content
     * ⚠️ IMPORTANT: All patterns use [^\n\r]+ to avoid matching across lines
     * This ensures headers are processed correctly even when content arrives in chunks
     */
    processHeaders(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        // Process markdown headers (most specific patterns first)
        let processed = content;
        
        // STREAMING-SAFE: Use global search, not line-based regex
        // H6 first (most specific)
        processed = processed.replace(/######\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const cleanText = this.stripHtmlTags(headerText);
                const escapedText = this.escapeHtml(cleanText);
                const icon = this.getHeaderIcon(cleanText);
                return `<h6 class="explanation-header explanation-h6"><span class="header-icon">${icon}</span>${escapedText}</h6>`;
            });
        
        // H5
        processed = processed.replace(/#####\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const cleanText = this.stripHtmlTags(headerText);
                const escapedText = this.escapeHtml(cleanText);
                const icon = this.getHeaderIcon(cleanText);
                return `<h5 class="explanation-header explanation-h5"><span class="header-icon">${icon}</span>${escapedText}</h5>`;
            });
        
        // H4
        processed = processed.replace(/####\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const cleanText = this.stripHtmlTags(headerText);
                const escapedText = this.escapeHtml(cleanText);
                const icon = this.getHeaderIcon(cleanText);
                return `<h4 class="explanation-header explanation-h4"><span class="header-icon">${icon}</span>${escapedText}</h4>`;
            });
        
        // H3 - most common (KEY TERMS will be processed here)
        processed = processed.replace(/###\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const cleanText = this.stripHtmlTags(headerText);
                const escapedText = this.escapeHtml(cleanText);
                const icon = this.getHeaderIcon(cleanText);
                return `<h3 class="explanation-header explanation-h3"><span class="header-icon">${icon}</span>${escapedText}</h3>`;
            });
        
        // H2
        processed = processed.replace(/##\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const cleanText = this.stripHtmlTags(headerText);
                const escapedText = this.escapeHtml(cleanText);
                const icon = this.getHeaderIcon(cleanText);
                return `<h2 class="explanation-header explanation-h2"><span class="header-icon">${icon}</span>${escapedText}</h2>`;
            });
        
        // H1 (least specific, do last)
        processed = processed.replace(/#\s+([^\n\r]+)/g, 
            (match, headerText) => {
                const cleanText = this.stripHtmlTags(headerText);
                const escapedText = this.escapeHtml(cleanText);
                const icon = this.getHeaderIcon(cleanText);
                return `<h1 class="explanation-header explanation-h1"><span class="header-icon">${icon}</span>${escapedText}</h1>`;
            });
        
        // Enhance any existing HTML headers that don't have our styling
        processed = this.enhanceExistingHtmlHeaders(processed);
        
        return processed;
    }
    
    /**
     * Enhance existing HTML headers without our styling
     */
    enhanceExistingHtmlHeaders(content) {
        let enhanced = content;
        
        // Only enhance headers that don't already have our classes
        enhanced = enhanced.replace(/<h1(?![^>]*class="explanation-header")([^>]*)>([^<]+)<\/h1>/g, 
            '<h1 class="explanation-header explanation-h1"$1><span class="header-icon">📋</span>$2</h1>');
        enhanced = enhanced.replace(/<h2(?![^>]*class="explanation-header")([^>]*)>([^<]+)<\/h2>/g, 
            '<h2 class="explanation-header explanation-h2"$1><span class="header-icon">📖</span>$2</h2>');
        enhanced = enhanced.replace(/<h3(?![^>]*class="explanation-header")([^>]*)>([^<]+)<\/h3>/g, 
            '<h3 class="explanation-header explanation-h3"$1><span class="header-icon">💡</span>$2</h3>');
        enhanced = enhanced.replace(/<h4(?![^>]*class="explanation-header")([^>]*)>([^<]+)<\/h4>/g, 
            '<h4 class="explanation-header explanation-h4"$1><span class="header-icon">🔹</span>$2</h4>');
        enhanced = enhanced.replace(/<h5(?![^>]*class="explanation-header")([^>]*)>([^<]+)<\/h5>/g, 
            '<h5 class="explanation-header explanation-h5"$1><span class="header-icon">▪️</span>$2</h5>');
        enhanced = enhanced.replace(/<h6(?![^>]*class="explanation-header")([^>]*)>([^<]+)<\/h6>/g, 
            '<h6 class="explanation-header explanation-h6"$1><span class="header-icon">▫️</span>$2</h6>');
        
        return enhanced;
    }
    
    // ==================== HTML PROCESSING METHODS ====================
    
    /**
     * Detect if content is already HTML (from AIService) vs raw markdown
     */
    isHtmlContent(content) {
        // Check for common HTML patterns that indicate pre-formatted content
        const htmlPatterns = [
            /<div[^>]*class="section-header"[^>]*>/,
            /<h[1-6][^>]*style="[^"]*"[^>]*>/,
            /<span[^>]*style="[^"]*"[^>]*>/,
            /<[^>]+style="[^"]*"[^>]*>/
        ];
        
        return htmlPatterns.some(pattern => pattern.test(content));
    }
    
    /**
     * Sanitize HTML headers to remove inline styles and apply consistent CSS classes
     */
    sanitizeHtmlHeaders(content) {
        let sanitized = content;
        
        // STREAMING-SAFE: Remove section-header divs and extract the header content
        // Only match within single lines to work with streaming content
        sanitized = sanitized.replace(
            /<div[^>]*class="section-header"[^>]*>([^<]*<h([1-6])[^>]*>[^<]*<span[^>]*>[^<]*<\/span>[^<]*([^<]+)[^<]*<\/h[1-6]>[^<]*)<\/div>/g,
            (match, fullMatch, level, headerText) => {
                const cleanText = this.stripHtmlTags(headerText.trim());
                const escapedText = this.escapeHtml(cleanText);
                const icon = this.getHeaderIcon(cleanText);
                return `<h${level} class="explanation-header explanation-h${level}"><span class="header-icon">${icon}</span>${escapedText}</h${level}>`;
            }
        );
        
        // STREAMING-SAFE: Clean up any remaining headers with inline styles
        // Only match content within the same line
        sanitized = sanitized.replace(
            /<h([1-6])[^>]*style="[^"]*"[^>]*>([^<]*)<\/h[1-6]>/g,
            (match, level, content) => {
                const cleanText = this.stripHtmlTags(content.trim());
                const escapedText = this.escapeHtml(cleanText);
                const icon = this.getHeaderIcon(cleanText);
                return `<h${level} class="explanation-header explanation-h${level}"><span class="header-icon">${icon}</span>${escapedText}</h${level}>`;
            }
        );
        
        // Process any remaining markdown headers in the sanitized content
        sanitized = this.processHeaders(sanitized);
        
        return sanitized;
    }
    
    /**
     * Strip HTML tags from text to get clean content
     */
    stripHtmlTags(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        // Remove HTML tags using comprehensive regex patterns
        let cleaned = text
            .replace(/<[^>]*>/g, '')
            .replace(/&[a-zA-Z0-9#]+;/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        return cleaned;
    }
    
    /**
     * Sanitize HTML content
     */
    sanitizeHtml(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }
        
        // Node.js environment fallback - basic sanitization
        if (typeof document === 'undefined') {
            // Remove script, object, embed, iframe tags
            return html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
                .replace(/<embed\b[^>]*>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
                .replace(/\son\w+\s*=\s*[^"'\s>]+/gi, '');
        }
        
        // Browser environment - full DOM-based sanitization
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remove potentially dangerous elements and attributes
        const dangerousElements = temp.querySelectorAll('script, object, embed, iframe');
        dangerousElements.forEach(el => el.remove());
        
        // Remove dangerous attributes
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(el => {
            // Remove event handlers
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.toLowerCase().startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });
        
        return temp.innerHTML;
    }
    
    // ==================== CODE BLOCK ENHANCEMENT ====================
    
    /**
     * Enhance code blocks with copy functionality - STREAMING-SAFE
     */
    enhanceCodeBlocks(content) {
        // STREAMING-SAFE: Only enhance complete code blocks that are fully closed
        // This pattern ensures we only match complete <pre><code>...</code></pre> blocks
        return content.replace(
            /<pre><code([^>]*)>((?:(?!<\/code>)[\s\S])*)<\/code><\/pre>/g,
            (match, attributes, code) => {
                this.codeBlockCounter++;
                const codeId = `code-block-${this.codeBlockCounter}`;
                
                return `
                    <div class="code-block">
                        <button class="code-copy-btn" onclick="if(window.TextFormatter) window.TextFormatter.copyCodeToClipboard('${codeId}')">
                            Copy
                        </button>
                        <pre><code${attributes} id="${codeId}">${code}</code></pre>
                    </div>
                `;
            }
        );
    }
    
    /**
     * Process markdown code blocks (```) into HTML format
     * STREAMING-SAFE: Only processes complete code blocks
     */
    processMarkdownCodeBlocks(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        // STREAMING-SAFE: Only process complete code blocks with opening and closing ```
        // Use non-greedy matching to handle multiple code blocks correctly
        return content.replace(
            /```(\w+)?\n([\s\S]*?)\n```/g,
            (match, language, code) => {
                // Clean up the code content
                const cleanCode = code.trim();
                const escapedCode = this.escapeHtml(cleanCode);
                const langClass = language ? ` class="language-${language}"` : '';
                
                return `<pre><code${langClass}>${escapedCode}</code></pre>`;
            }
        );
    }
    
    // ==================== CLIPBOARD OPERATIONS ====================
    
    /**
     * Copy code to clipboard
     */
    copyCodeToClipboard(codeId) {
        const codeElement = document.getElementById(codeId);
        if (!codeElement) return;
        
        const codeText = codeElement.textContent;
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(codeText).then(() => {
                this.showCopyFeedback(codeId);
            }).catch(() => {
                this.fallbackCopyText(codeText, codeId);
            });
        } else {
            this.fallbackCopyText(codeText, codeId);
        }
    }
    
    /**
     * Fallback copy method for older browsers
     */
    fallbackCopyText(text, codeId) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopyFeedback(codeId);
        } catch (err) {
            console.warn('Could not copy text:', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    /**
     * Show copy feedback
     */
    showCopyFeedback(codeId) {
        const button = document.querySelector(`button[onclick*="${codeId}"]`);
        if (button) {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = '#4caf50';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        }
    }
    
    // ==================== STREAMING CONTENT METHODS ====================
    
    /**
     * Clean up content for final display
     */
    finalizeContent(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }
        
        // Remove any streaming indicators
        return content.replace(/<div class="streaming-indicator-inline">.*?<\/div>/g, '');
    }
    
    /**
     * STREAMING-SAFE content processing for content between headers
     * Handles incremental content arrival without losing partial content
     */
    processStreamingContent(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        // Split content into lines but preserve incomplete lines during streaming
        let lines = content.split('\n');
        let processedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let trimmedLine = line.trim();
            
            // Skip if line is already processed (headers, HTML elements)
            if (this.isAlreadyProcessed(line)) {
                processedLines.push(line);
                continue;
            }
            
            // Skip empty lines (preserve spacing)
            if (!trimmedLine) {
                processedLines.push(line);
                continue;
            }
            
            // STREAMING-SAFE: Only process complete lines that don't look incomplete
            if (this.looksIncomplete(line, i, lines)) {
                // Keep incomplete line as-is for now, will be processed when complete
                processedLines.push(line);
                continue;
            }
            
            // Process different content types
            const processedLine = this.processContentLine(line);
            processedLines.push(processedLine);
        }
        
        return processedLines.join('\n');
    }
    
    /**
     * Check if line is already processed (header, HTML, etc.)
     */
    isAlreadyProcessed(line) {
        return (
            line.includes('<h1') || line.includes('<h2') || line.includes('<h3') ||
            line.includes('<h4') || line.includes('<h5') || line.includes('<h6') ||
            line.includes('explanation-header') ||
            line.includes('<pre><code>') || line.includes('</code></pre>') ||
            line.includes('<div class="code-block">') ||
            line.includes('<p class="') || line.includes('<div class="bullet-point"')
        );
    }
    
    /**
     * Check if line looks incomplete during streaming
     * This prevents processing partial content that might be completed later
     */
    looksIncomplete(line, index, allLines) {
        const trimmed = line.trim();
        
        // Don't process lines that might be incomplete bullet points
        if (trimmed.match(/^\s*[\*\-\+]\s*$/) && !trimmed.match(/^\s*[\*\-\+]\s+.+/)) {
            return true;
        }
        
        // Don't process lines that end with incomplete patterns
        if (trimmed.endsWith(':') && trimmed.length < 5) {
            return true;
        }
        
        // If this is the last line and it's very short, it might be incomplete
        if (index === allLines.length - 1 && trimmed.length < 3) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Process individual content lines based on their type
     */
    processContentLine(line) {
        const trimmed = line.trim();
        
        // Process bullet points (• * - +)
        if (trimmed.match(/^[•\*\-\+]\s+(.+)$/)) {
            const content = trimmed.replace(/^[•\*\-\+]\s+/, '').trim();
            const escapedContent = this.escapeHtml(content);
            return `<div class="bullet-point">• ${escapedContent}</div>`;
        }
        
        // Process numbered lists
        if (trimmed.match(/^\d+\.\s+(.+)$/)) {
            const match = trimmed.match(/^(\d+)\.\s+(.+)$/);
            if (match) {
                const number = match[1];
                const content = match[2].trim();
                const escapedContent = this.escapeHtml(content);
                return `<div class="numbered-item">${number}. ${escapedContent}</div>`;
            }
        }
        
        // Process code inline (backticks)
        let processed = trimmed;
        processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Process bold text
        processed = processed.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        
        // Process italic text
        processed = processed.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
        processed = processed.replace(/_([^_]+)_/g, '<em>$1</em>');
        
        // Escape remaining HTML and wrap in paragraph
        if (processed !== trimmed) {
            // Already processed some markdown, don't double-escape
            return `<p class="content-paragraph">${processed}</p>`;
        } else {
            // Escape and wrap
            const escapedContent = this.escapeHtml(processed);
            return `<p class="content-paragraph">${escapedContent}</p>`;
        }
    }
    
    /**
     * Remove empty sections/headers that have no meaningful content after them
     * This is called after all streaming processing is complete
     */
    removeEmptySections(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        // Split content into blocks for analysis
        const lines = content.split('\n');
        const filteredLines = [];
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i].trim();
            
            // Check if this line is a header
            if (this.isHeaderLine(line)) {
                // Look ahead to see if there's meaningful content after this header
                const nextContentIndex = this.findNextMeaningfulContent(lines, i + 1);
                const nextHeaderIndex = this.findNextHeader(lines, i + 1);
                
                // If there's no meaningful content before the next header (or end of content),
                // this is an empty section
                if (nextContentIndex === -1 || 
                    (nextHeaderIndex !== -1 && nextHeaderIndex <= nextContentIndex)) {
                    // Skip this empty header and any empty lines after it
                    i = this.skipEmptyLinesAfter(lines, i);
                    continue;
                } else {
                    // Header has content, keep it
                    filteredLines.push(lines[i]);
                }
            } else {
                // Not a header, keep the line
                filteredLines.push(lines[i]);
            }
            
            i++;
        }
        
        return filteredLines.join('\n');
    }
    
    /**
     * Check if a line contains a header (HTML or markdown)
     */
    isHeaderLine(line) {
        if (!line) return false;
        
        // Check for HTML headers
        if (line.match(/<h[1-6][^>]*>/)) return true;
        
        // Check for markdown headers
        if (line.match(/^#+\s+/)) return true;
        
        return false;
    }
    
    /**
     * Find the next line with meaningful content (not empty, not just whitespace/formatting)
     */
    findNextMeaningfulContent(lines, startIndex) {
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Skip lines that are just HTML structure without content
            if (line.match(/^<\/?div[^>]*>$/)) continue;
            if (line.match(/^<\/?section[^>]*>$/)) continue;
            
            // Skip headers (they don't count as content for the previous header)
            if (this.isHeaderLine(line)) continue;
            
            // Found meaningful content
            return i;
        }
        
        return -1; // No meaningful content found
    }
    
    /**
     * Find the next header line
     */
    findNextHeader(lines, startIndex) {
        for (let i = startIndex; i < lines.length; i++) {
            if (this.isHeaderLine(lines[i].trim())) {
                return i;
            }
        }
        return -1; // No header found
    }
    
    /**
     * Skip empty lines after a given index
     */
    skipEmptyLinesAfter(lines, startIndex) {
        let index = startIndex + 1;
        while (index < lines.length && !lines[index].trim()) {
            index++;
        }
        return index - 1; // Return the last empty line index
    }
    
    // ==================== UTILITY FORMATTING METHODS ====================
    
    /**
     * Format word count display
     */
    formatWordCount(count) {
        if (typeof count !== 'number' || count < 0) {
            return '0 words';
        }
        
        if (count === 1) {
            return '1 word';
        }
        
        // Add comma separators for large numbers
        return count.toLocaleString() + ' words';
    }
    
    /**
     * Truncate text to specified length
     */
    truncateText(text, maxLength = 200) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength - 3) + '...';
    }
    
    /**
     * Format file size in human readable format
     */
    formatFileSize(bytes) {
        if (typeof bytes !== 'number' || bytes < 0) {
            return '0 B';
        }
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 10) / 10 + ' ' + sizes[i];
    }
    
    /**
     * Format duration in human readable format
     */
    formatDuration(milliseconds) {
        if (typeof milliseconds !== 'number' || milliseconds < 0) {
            return '0ms';
        }
        
        if (milliseconds < 1000) {
            return Math.round(milliseconds) + 'ms';
        }
        
        const seconds = milliseconds / 1000;
        if (seconds < 60) {
            return seconds.toFixed(1) + 's';
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    /**
     * Check if content contains mathematical equations
     */
    containsMath(content) {
        if (!content || typeof content !== 'string') {
            return false;
        }
        
        // Check for LaTeX math delimiters
        const mathPatterns = [
            /\$\$[\s\S]*?\$\$/,  // Display math
            /\$[^$\n]*\$/,       // Inline math
            /\\\[[\s\S]*?\\\]/,  // Display math brackets
            /\\\([\s\S]*?\\\)/   // Inline math brackets
        ];
        
        return mathPatterns.some(pattern => pattern.test(content));
    }
    
    // ==================== ICON DETERMINATION METHODS ====================
    
    /**
     * Get appropriate icon for regular headers based on content
     */
    getHeaderIcon(headerText) {
        const lower = headerText.toLowerCase();
        
        // Content-based icon selection for regular headers
        if (lower.includes('code') || lower.includes('example') || lower.includes('syntax')) return '💻';
        if (lower.includes('math') || lower.includes('equation') || lower.includes('formula')) return '🧮';
        if (lower.includes('key') || lower.includes('important') || lower.includes('term') || lower.includes('definition')) return '🔑';
        if (lower.includes('summary') || lower.includes('conclusion') || lower.includes('recap')) return '📝';
        if (lower.includes('concept') || lower.includes('theory') || lower.includes('principle')) return '🧠';
        if (lower.includes('practice') || lower.includes('exercise') || lower.includes('apply')) return '🏃';
        if (lower.includes('note') || lower.includes('warning') || lower.includes('caution')) return '⚠️';
        if (lower.includes('tip') || lower.includes('hint') || lower.includes('advice')) return '💡';
        if (lower.includes('step') || lower.includes('process') || lower.includes('procedure')) return '🔢';
        if (lower.includes('result') || lower.includes('output') || lower.includes('outcome')) return '📊';
        
        // Default icon for regular headers
        return '📌';
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.TextFormatter = new TextFormatter();
            console.log('✅ TextFormatter initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize TextFormatter:', error);
        }
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextFormatter;
}
