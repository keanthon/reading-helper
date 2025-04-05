/**
 * Dynamic Header Processor
 * Ensures consistent header theming regardless of LLM output variation
 * 
 * This module automatically detects and applies appropriate CSS classes
 * to headers based on their content, ensuring themed headers work
 * consistently across all text selections.
 */

class DynamicHeaderProcessor {
    constructor() {
        this.headerMappings = {
            'mathematical': ['math', 'equation', 'formula', 'calculation'],
            'code': ['code', 'example', 'programming', 'function', 'syntax'],
            'key': ['key', 'term', 'definition', 'vocabulary', 'glossary'],
            'analysis': ['analysis', 'summary', 'overview', 'conclusion', 'detailed']
        };
        
        this.themeClasses = {
            'mathematical': 'explanation-h-math',
            'code': 'explanation-h-code', 
            'key': 'explanation-h-key',
            'analysis': 'explanation-h-analysis'
        };
        
        this.processed = new Set();
        this.observer = null;
        
        this.init();
    }

    /**
     * Initialize the processor with error handling
     */
    init() {
        try {
            this.processExistingHeaders();
            this.setupMutationObserver();
            console.log('✅ DynamicHeaderProcessor initialized successfully');
        } catch (error) {
            console.error('❌ DynamicHeaderProcessor initialization failed:', error);
            this.handleError(error);
        }
    }

    /**
     * Process all existing headers in the document
     */
    processExistingHeaders() {
        const selectors = [
            'h1, h2, h3, h4, h5, h6',
            '[class*="explanation-h"]',
            '[class*="header"]',
            '.explanation-title',
            '.explanation-content h1, .explanation-content h2, .explanation-content h3'
        ];

        selectors.forEach(selector => {
            try {
                const headers = document.querySelectorAll(selector);
                headers.forEach(header => this.processHeader(header));
            } catch (error) {
                console.warn(`Warning: Could not process selector "${selector}":`, error);
            }
        });
    }

    /**
     * Process a single header element
     * @param {HTMLElement} header - The header element to process
     */
    processHeader(header) {
        if (!header || this.processed.has(header)) {
            console.log('🔍 SKIPPING HEADER (already processed or null):', {
                hasHeader: !!header,
                alreadyProcessed: this.processed.has(header),
                headerText: header ? header.textContent?.substring(0, 50) : 'null'
            });
            return;
        }

        try {
            const text = this.getHeaderText(header).toLowerCase();
            const theme = this.detectTheme(text);
            
            // Log header processing details
            console.log('🔍 PROCESSING HEADER:', {
                text: text.substring(0, 50),
                theme: theme,
                tagName: header.tagName,
                className: header.className,
                hasDataProcessed: header.getAttribute('data-processed'),
                isAlreadyProcessed: this.processed.has(header)
            });
            
            if (theme) {
                this.applyTheme(header, theme);
                this.processed.add(header);
                console.log(`🎨 Applied ${theme} theme to header: "${text.substring(0, 50)}..."`);
            }
        } catch (error) {
            console.warn('Warning: Could not process header:', error);
        }
    }

    /**
     * Extract text content from header element safely
     * @param {HTMLElement} header - The header element
     * @returns {string} - The text content
     */
    getHeaderText(header) {
        try {
            return header.textContent || header.innerText || header.getAttribute('title') || '';
        } catch (error) {
            console.warn('Warning: Could not extract header text:', error);
            return '';
        }
    }

    /**
     * Detect theme based on header text content
     * @param {string} text - The header text to analyze
     * @returns {string|null} - The detected theme or null
     */
    detectTheme(text) {
        try {
            for (const [theme, keywords] of Object.entries(this.headerMappings)) {
                if (keywords.some(keyword => text.includes(keyword))) {
                    return theme;
                }
            }
            return null;
        } catch (error) {
            console.warn('Warning: Theme detection failed:', error);
            return null;
        }
    }

    /**
     * Apply theme styling to header element
     * @param {HTMLElement} header - The header element
     * @param {string} theme - The theme to apply
     */
    applyTheme(header, theme) {
        try {
            // Prevent double processing by checking if already processed
            if (header.getAttribute('data-processed') === 'true') {
                console.log('🔍 HEADER ALREADY PROCESSED, SKIPPING:', {
                    text: header.textContent?.substring(0, 50),
                    theme: header.getAttribute('data-theme'),
                    alreadyHasTheme: !!header.getAttribute('data-theme')
                });
                return;
            }

            // Also check if it already has our explanation-header class
            if (header.classList.contains('explanation-header')) {
                console.log('🔍 HEADER ALREADY HAS EXPLANATION CLASS, MARKING AS PROCESSED:', {
                    text: header.textContent?.substring(0, 50),
                    className: header.className
                });
                header.setAttribute('data-processed', 'true');
                this.processed.add(header);
                return;
            }

            const isSubheader = this.isSubheader(header);
            const themeClass = isSubheader ? 
                `${this.themeClasses[theme]}-sub` : 
                this.themeClasses[theme];
            
            if (themeClass) {
                header.classList.add(themeClass);
                header.setAttribute('data-theme', theme);
                header.setAttribute('data-processed', 'true');
                header.setAttribute('data-header-type', isSubheader ? 'subheader' : 'header');
                
                // Ensure base explanation header class is present
                if (!header.classList.contains('explanation-header')) {
                    header.classList.add('explanation-header');
                }

                console.log(`🎨 Applied ${isSubheader ? 'subheader' : 'header'} ${theme} theme to: "${this.getHeaderText(header).substring(0, 30)}..."`);
            }
        } catch (error) {
            console.warn('Warning: Could not apply theme:', error);
        }
    }

    /**
     * Check if a header is a subheader (H4-H6)
     * @param {HTMLElement} header - The header element
     * @returns {boolean} - True if the header is a subheader
     */
    isSubheader(header) {
        try {
            const tagName = header.tagName ? header.tagName.toLowerCase() : '';
            return /^h[4-6]$/.test(tagName);
        } catch (error) {
            return false;
        }
    }

    /**
     * Setup mutation observer to handle dynamically added content
     */
    setupMutationObserver() {
        try {
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    console.log('🔍 MUTATION OBSERVED:', {
                        type: mutation.type,
                        addedNodes: mutation.addedNodes.length,
                        removedNodes: mutation.removedNodes.length,
                        target: mutation.target.tagName || 'unknown'
                    });
                    
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            console.log('🔍 PROCESSING NEW NODE:', {
                                tagName: node.tagName,
                                className: node.className,
                                isHeader: this.isHeader(node),
                                textContent: node.textContent?.substring(0, 100)
                            });
                            this.processNewNode(node);
                        }
                    });
                });
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (error) {
            console.warn('Warning: Could not setup mutation observer:', error);
        }
    }

    /**
     * Process newly added DOM nodes
     * @param {HTMLElement} node - The newly added node
     */
    processNewNode(node) {
        try {
            // Check if the node itself is a header
            if (this.isHeader(node)) {
                console.log('🔍 NODE IS HEADER:', {
                    tagName: node.tagName,
                    className: node.className,
                    textContent: node.textContent?.substring(0, 50)
                });
                this.processHeader(node);
            }
            
            // Check for headers within the node
            const headers = node.querySelectorAll ? node.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="explanation-h"], [class*="header"]') : [];
            console.log('🔍 HEADERS FOUND IN NODE:', {
                count: headers.length,
                headers: Array.from(headers).map(h => ({
                    tagName: h.tagName,
                    className: h.className,
                    textContent: h.textContent?.substring(0, 50)
                }))
            });
            
            headers.forEach(header => this.processHeader(header));
        } catch (error) {
            console.warn('Warning: Could not process new node:', error);
        }
    }

    /**
     * Check if an element is a header
     * @param {HTMLElement} element - The element to check
     * @returns {boolean} - True if the element is a header
     */
    isHeader(element) {
        try {
            const tagName = element.tagName ? element.tagName.toLowerCase() : '';
            const className = element.className || '';
            
            return /^h[1-6]$/.test(tagName) || 
                   className.includes('explanation-h') || 
                   className.includes('header') ||
                   className.includes('explanation-title');
        } catch (error) {
            return false;
        }
    }

    /**
     * Reprocess all headers (useful for content updates)
     */
    reprocess() {
        try {
            this.processed.clear();
            this.processExistingHeaders();
            console.log('🔄 Headers reprocessed successfully');
        } catch (error) {
            console.error('❌ Header reprocessing failed:', error);
            this.handleError(error);
        }
    }

    /**
     * Handle errors gracefully
     * @param {Error} error - The error to handle
     */
    handleError(error) {
        console.error('DynamicHeaderProcessor Error:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Attempt recovery
        setTimeout(() => {
            try {
                this.reprocess();
            } catch (recoveryError) {
                console.error('❌ Recovery attempt failed:', recoveryError);
            }
        }, 1000);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        try {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            this.processed.clear();
            console.log('🧹 DynamicHeaderProcessor cleaned up');
        } catch (error) {
            console.warn('Warning: Cleanup failed:', error);
        }
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.dynamicHeaderProcessor = new DynamicHeaderProcessor();
        } catch (error) {
            console.error('❌ Failed to initialize DynamicHeaderProcessor:', error);
        }
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicHeaderProcessor;
}
