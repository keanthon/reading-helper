/**
 * Explanation Controller Module
 * Main application controller that coordinates all modules
 */

class ExplanationController {
    constructor() {
        this.isInitialized = false;
        this.startTime = Date.now();
        this.modules = {};
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        console.log('🚀 Initializing Explanation Controller...');
        
        try {
            // Check if all required modules are available
            this.validateModules();
            
            // Initialize modules
            await this.initializeModules();
            
            // Set up application state
            this.setupInitialState();
            
            // Mark as initialized
            this.isInitialized = true;
            
            const initTime = Date.now() - this.startTime;
            console.log(`✅ Explanation Controller initialized in ${initTime}ms`);
            
            // Update status
            if (this.modules.uiComponents) {
                this.modules.uiComponents.updateStatus('Ready', '#4caf50');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize Explanation Controller:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Validate that all required modules are available
     */
    validateModules() {
        const requiredModules = {
            eventHandler: window.EventHandler,
            uiComponents: window.UIComponents,
            textFormatter: window.TextFormatter,
            mathJaxLoader: window.MathJaxLoader,
            explanationDisplay: window.ExplanationDisplay
        };
        
        const missingModules = [];
        
        for (const [name, module] of Object.entries(requiredModules)) {
            if (!module) {
                missingModules.push(name);
            } else {
                this.modules[name] = module;
            }
        }
        
        if (missingModules.length > 0) {
            throw new Error(`Missing required modules: ${missingModules.join(', ')}`);
        }
        
        console.log('✅ All required modules validated');
    }
    
    /**
     * Initialize all modules
     */
    async initializeModules() {
        console.log('🔧 Initializing modules...');
        
        // MathJax initialization is already handled in its constructor
        // Other modules are already initialized as global instances
        
        // Additional initialization if needed
        if (this.modules.mathJaxLoader && typeof this.modules.mathJaxLoader.initializeOnLoad === 'function') {
            // MathJax will load asynchronously
        }
        
        console.log('✅ Modules initialized');
    }
    
    /**
     * Set up initial application state
     */
    setupInitialState() {
        // Set initial status
        if (this.modules.uiComponents) {
            this.modules.uiComponents.updateStatus('🔄 Initializing...', '#667eea');
        }
        
        // Clear any existing content
        if (this.modules.explanationDisplay) {
            this.modules.explanationDisplay.clearExplanation();
        }
        
        console.log('✅ Initial state configured');
    }
    
    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('💥 Initialization error:', error);
        
        // Try to show error in UI if possible
        try {
            if (window.UIComponents) {
                window.UIComponents.showError('Failed to initialize application: ' + error.message);
            } else {
                // Fallback error display
                document.body.innerHTML = `
                    <div style="padding: 20px; color: red; font-family: monospace;">
                        <h2>Initialization Error</h2>
                        <p>${error.message}</p>
                        <p>Please check the console for more details.</p>
                    </div>
                `;
            }
        } catch (displayError) {
            console.error('❌ Could not display error:', displayError);
        }
    }
    
    /**
     * Get application status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            uptime: Date.now() - this.startTime,
            modules: Object.keys(this.modules),
            eventHandlerIPC: this.modules.eventHandler?.isIPCAvailable() || false,
            mathJaxReady: this.modules.mathJaxLoader?.isReady() || false,
            currentExplanation: !!this.modules.explanationDisplay?.getCurrentExplanation()
        };
    }
    
    /**
     * Get module reference
     */
    getModule(name) {
        return this.modules[name];
    }
    
    /**
     * Handle application errors
     */
    handleError(error, context = '') {
        console.error(`❌ Application error${context ? ' in ' + context : ''}:`, error);
        
        if (this.modules.uiComponents) {
            const message = context ? 
                `Error in ${context}: ${error.message}` : 
                error.message;
            this.modules.uiComponents.showError(message);
        }
    }
    
    /**
     * Restart application (development feature)
     */
    async restart() {
        console.log('🔄 Restarting application...');
        
        try {
            // Clear current state
            this.isInitialized = false;
            this.modules = {};
            
            // Clear displays
            if (window.ExplanationDisplay) {
                window.ExplanationDisplay.clearExplanation();
            }
            
            // Reinitialize
            await this.initialize();
            
            console.log('✅ Application restarted successfully');
            
        } catch (error) {
            console.error('❌ Failed to restart application:', error);
            this.handleError(error, 'restart');
        }
    }
    
    /**
     * Export application logs (development feature)
     */
    exportLogs() {
        const logs = {
            timestamp: new Date().toISOString(),
            status: this.getStatus(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            mathJaxStatus: this.modules.mathJaxLoader?.getStatus(),
            currentExplanation: this.modules.explanationDisplay?.getCurrentExplanation() ? {
                hasExplanation: true,
                isStreaming: this.modules.explanationDisplay.getIsStreaming()
            } : null
        };
        
        return JSON.stringify(logs, null, 2);
    }
    
    /**
     * Development mode helpers
     */
    dev = {
        /**
         * Force reload MathJax
         */
        reloadMathJax: async () => {
            if (this.modules.mathJaxLoader) {
                return this.modules.mathJaxLoader.reload();
            }
        },
        
        /**
         * Simulate explanation data for testing
         */
        simulateExplanation: (type = 'regular') => {
            const mockData = {
                regular: {
                    selectedText: 'This is a sample text for testing.',
                    explanation: '<p>This is a sample explanation with <strong>formatting</strong>.</p>',
                    wordCount: 42,
                    isPartial: false
                },
                thorough: {
                    selectedText: 'Complex document content',
                    explanation: '<h3>Comprehensive Analysis</h3><p>This is a thorough analysis with multiple sections and <em>detailed</em> explanations.</p>',
                    wordCount: 156,
                    isThorough: true,
                    isPartial: false
                },
                code: {
                    selectedText: 'function hello() { return "world"; }',
                    explanation: '<p>This function returns a greeting string.</p><pre><code>function hello() {\n  return "world";\n}</code></pre>',
                    wordCount: 28,
                    isCode: true,
                    isPartial: false
                },
                math: {
                    selectedText: 'Mathematical equation',
                    explanation: '<p>The quadratic formula is: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$</p>',
                    wordCount: 15,
                    isPartial: false
                }
            };
            
            const contextData = mockData[type] || mockData.regular;
            
            if (this.modules.explanationDisplay) {
                this.modules.explanationDisplay.displayExplanation(contextData, contextData);
            }
        },
        
        /**
         * Get performance metrics
         */
        getMetrics: () => {
            return {
                performance: performance.timing,
                memory: performance.memory,
                navigation: performance.navigation,
                status: this.getStatus()
            };
        }
    };
    
    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('🧹 Cleaning up resources...');
        
        // Clear any running processes
        if (this.modules.explanationDisplay) {
            this.modules.explanationDisplay.clearExplanation();
        }
        
        // Reset state
        this.isInitialized = false;
        this.modules = {};
        
        console.log('✅ Cleanup complete');
    }
}

// Create global instance
window.ExplanationController = new ExplanationController();

// Development helpers (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
    window.dev = window.ExplanationController.dev;
    console.log('🔧 Development helpers available via window.dev');
}
