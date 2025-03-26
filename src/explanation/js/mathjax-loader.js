/**
 * MathJax Loader Module
 * Handles asynchronous loading and configuration of MathJax for mathematical equation rendering
 */

class MathJaxLoader {
    constructor() {
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
        this.renderQueue = [];
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.configureMathJax();
    }
    
    /**
     * Configure MathJax settings
     */
    configureMathJax() {
        // Configure MathJax before loading
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true,
                processEnvironments: true,
                packages: {'[+]': ['ams', 'color', 'cancel', 'bbox']},
                tags: 'ams'
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                ignoreHtmlClass: 'no-mathjax',
                processHtmlClass: 'tex2jax_process'
            },
            startup: {
                pageReady: () => {
                    console.log('✅ MathJax page ready');
                    return Promise.resolve();
                },
                ready: () => {
                    console.log('✅ MathJax startup complete');
                    window.MathJax.startup.defaultReady();
                }
            },
            chtml: {
                scale: 1,
                minScale: 0.5,
                matchFontHeight: false,
                displayAlign: 'center',
                displayIndent: '0'
            }
        };
        
        console.log('✅ MathJax configured with enhanced settings');
    }
    
    /**
     * Load MathJax asynchronously
     */
    async loadMathJax() {
        if (this.isLoaded) {
            return Promise.resolve();
        }
        
        if (this.isLoading) {
            return this.loadPromise;
        }
        
        this.isLoading = true;
        console.log('🔄 Loading MathJax asynchronously...');
        
        this.loadPromise = new Promise((resolve, reject) => {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                try {
                    // Check if MathJax is already loaded by another source
                    if (window.MathJax && window.MathJax.typesetPromise) {
                        console.log('✅ MathJax already loaded externally');
                        this.isLoaded = true;
                        this.isLoading = false;
                        this.processRenderQueue();
                        resolve();
                        return;
                    }
                    
                    // Load MathJax directly (skip polyfill for modern browsers)
                    const mathjaxScript = document.createElement('script');
                    mathjaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
                    mathjaxScript.async = true;
                    mathjaxScript.type = 'text/javascript';
                    
                    mathjaxScript.onload = () => {
                        console.log('✅ MathJax script loaded');
                        
                        // Wait for MathJax to be fully ready
                        const checkReady = () => {
                            if (window.MathJax && window.MathJax.typesetPromise && window.MathJax.startup) {
                                console.log('✅ MathJax fully ready');
                                this.isLoaded = true;
                                this.isLoading = false;
                                this.processRenderQueue();
                                resolve();
                            } else {
                                setTimeout(checkReady, 100);
                            }
                        };
                        
                        checkReady();
                    };
                    
                    mathjaxScript.onerror = (error) => {
                        console.warn('⚠️ MathJax failed to load:', error);
                        this.isLoading = false;
                        
                        if (this.retryCount < this.maxRetries) {
                            this.retryCount++;
                            console.log(`🔄 Retrying MathJax load (${this.retryCount}/${this.maxRetries})`);
                            setTimeout(() => {
                                this.isLoading = false;
                                this.loadMathJax().then(resolve).catch(resolve);
                            }, 1000 * this.retryCount);
                        } else {
                            console.warn('❌ MathJax load failed after retries');
                            resolve(); // Don't reject, continue without MathJax
                        }
                    };
                    
                    document.head.appendChild(mathjaxScript);
                    
                } catch (error) {
                    console.error('❌ Error loading MathJax:', error);
                    this.isLoading = false;
                    resolve(); // Don't reject, continue without MathJax
                }
            }, 100);
        });
        
        return this.loadPromise;
    }
    
    /**
     * Render math in a specific element
     */
    async renderMathInElement(element) {
        if (!element) {
            console.warn('⚠️ No element provided for math rendering');
            return;
        }
        
        console.log('🔢 Attempting to render math in element:', element);
        
        // Check if the content contains math
        const hasMatch = window.TextFormatter && window.TextFormatter.containsMath(element.innerHTML);
        console.log('🔍 Content contains math:', hasMatch);
        console.log('📝 Element content preview:', element.innerHTML.substring(0, 200) + '...');
        
        if (!hasMatch) {
            console.log('⏭️ No math content detected, skipping render');
            return;
        }
        
        if (!this.isLoaded) {
            console.log('⏳ MathJax not loaded yet, queuing element for later');
            // Add to queue if MathJax not loaded yet
            this.renderQueue.push(element);
            
            // Start loading if not already loading
            if (!this.isLoading) {
                console.log('🚀 Starting MathJax load...');
                await this.loadMathJax();
            }
            return;
        }
        
        try {
            if (window.MathJax && window.MathJax.typesetPromise) {
                console.log('🔢 Rendering math in element with MathJax...');
                await window.MathJax.typesetPromise([element]);
                console.log('✅ Math rendering complete for element');
            } else {
                console.warn('⚠️ MathJax.typesetPromise not available');
                // Fallback rendering
                element.innerHTML = this.fallbackMathRender(element.innerHTML);
                console.log('🔄 Applied fallback math rendering');
            }
        } catch (error) {
            console.warn('⚠️ MathJax rendering error:', error);
            // Try fallback rendering
            element.innerHTML = this.fallbackMathRender(element.innerHTML);
            console.log('🔄 Applied fallback math rendering due to error');
        }
    }
    
    /**
     * Process queued render requests
     */
    async processRenderQueue() {
        if (this.renderQueue.length === 0) return;
        
        console.log(`🔢 Processing ${this.renderQueue.length} queued math render requests`);
        
        for (const element of this.renderQueue) {
            try {
                await this.renderMathInElement(element);
            } catch (error) {
                console.warn('⚠️ Error processing queued math render:', error);
            }
        }
        
        this.renderQueue = [];
    }
    
    /**
     * Render math in document
     */
    async renderMathInDocument() {
        if (!this.isLoaded) {
            await this.loadMathJax();
        }
        
        try {
            if (window.MathJax && window.MathJax.typesetPromise) {
                console.log('🔢 Rendering math in entire document...');
                await window.MathJax.typesetPromise();
                console.log('✅ Document math rendering complete');
            }
        } catch (error) {
            console.warn('⚠️ Document math rendering error:', error);
        }
    }
    
    /**
     * Check if MathJax is ready
     */
    isReady() {
        return this.isLoaded && window.MathJax && window.MathJax.typesetPromise;
    }
    
    /**
     * Get MathJax status
     */
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            queueLength: this.renderQueue.length,
            hasWindow: !!window.MathJax
        };
    }
    
    /**
     * Force reload MathJax (for development)
     */
    async reload() {
        console.log('🔄 Reloading MathJax...');
        
        // Remove existing scripts
        const existingScripts = document.querySelectorAll('script[src*="mathjax"], script[src*="polyfill"]');
        existingScripts.forEach(script => script.remove());
        
        // Reset state
        this.isLoaded = false;
        this.isLoading = false;
        this.loadPromise = null;
        
        // Reconfigure and reload
        this.configureMathJax();
        return this.loadMathJax();
    }
    
    /**
     * Convert LaTeX to HTML (fallback when MathJax unavailable)
     */
    fallbackMathRender(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        // Simple fallback: wrap math in styled spans
        return content
            .replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-fallback display-math">$1</div>')
            .replace(/\$([^$\n]*?)\$/g, '<span class="math-fallback inline-math">$1</span>')
            .replace(/\\\[([\s\S]*?)\\\]/g, '<div class="math-fallback display-math">$1</div>')
            .replace(/\\\(([\s\S]*?)\\\)/g, '<span class="math-fallback inline-math">$1</span>');
    }
    
    /**
     * Initialize MathJax loading on page load
     */
    initializeOnLoad() {
        // Start loading MathJax after a short delay to not block the main UI
        setTimeout(() => {
            this.loadMathJax().catch(error => {
                console.warn('⚠️ MathJax initialization failed:', error);
            });
        }, 500);
    }
}

// Create global instance
window.MathJaxLoader = new MathJaxLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MathJaxLoader.initializeOnLoad();
    });
} else {
    window.MathJaxLoader.initializeOnLoad();
}
