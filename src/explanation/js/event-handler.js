/**
 * Event Handler Module
 * Manages all event handling including IPC communication, keyboard shortcuts, and UI events
 */

class EventHandler {
    constructor() {
        this.ipcRenderer = null;
        this.currentContextData = null;
        this.isInitialized = false;
        
        this.initializeIPC();
        this.setupEventListeners();
    }
    
    /**
     * Initialize IPC renderer if available
     */
    initializeIPC() {
        try {
            if (typeof require === 'function') {
                const { ipcRenderer } = require('electron');
                this.ipcRenderer = ipcRenderer;
                console.log('✅ IPC renderer initialized');
                this.setupIPCListeners();
            } else {
                console.warn('⚠️ IPC renderer not available (not in Electron context)');
            }
        } catch (error) {
            console.error('❌ Failed to initialize IPC:', error);
        }
    }
    
    /**
     * Set up IPC event listeners
     */
    setupIPCListeners() {
        if (!this.ipcRenderer) return;
        
        // Listen for explanation data
        this.ipcRenderer.on('show-explanation', this.handleShowExplanation.bind(this));
        
        // Listen for streaming progress updates
        this.ipcRenderer.on('explanation-progress', this.handleExplanationProgress.bind(this));
        
        console.log('✅ IPC listeners registered');
    }
    
    /**
     * Set up general event listeners
     */
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Close button
        const closeBtn = document.getElementById('close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.handleCloseWindow.bind(this));
        }
        
        // Prevent default behavior for certain keys
        document.addEventListener('keydown', (e) => {
            // Prevent F5 refresh in Electron
            if (e.key === 'F5') {
                e.preventDefault();
            }
        });
        
        console.log('✅ Event listeners set up');
    }
    
    /**
     * Handle show-explanation IPC event
     */
    async handleShowExplanation(event, contextData) {
        console.log('📩 Received show-explanation event:', contextData);
        
        try {
            // Store context data for reference
            this.currentContextData = contextData;
            
            // Update UI components
            if (window.UIComponents) {
                window.UIComponents.updateForExplanationType(contextData);
            }
            
            // Handle different explanation scenarios
            if (contextData.source === 'pending') {
                console.log('📥 Processing pending data - showing loading');
                this.showLoadingState(contextData.isThorough);
                return;
            }
            
            // Process real explanation data
            if (contextData.explanation) {
                console.log('📝 Pre-computed explanation found');
                this.displayExplanation(contextData);
            } else {
                console.log('🚀 Starting streaming explanation');
                this.startStreamingExplanation(contextData);
            }
            
        } catch (error) {
            console.error('❌ Error handling show-explanation:', error);
            this.showError('Failed to process explanation request: ' + error.message);
        }
    }
    
    /**
     * Handle explanation-progress IPC event
     */
    handleExplanationProgress(event, progressData) {
        console.log('📊 Received explanation progress:', progressData);
        
        try {
            // First progress update should initialize streaming display
            if (window.ExplanationDisplay) {
                window.ExplanationDisplay.updateProgress(progressData, this.currentContextData);
            }
            
            // If this is the final chunk, handle completion
            if (!progressData.isPartial) {
                console.log('✅ Streaming complete, finalizing display');
                setTimeout(() => {
                    if (window.ExplanationDisplay) {
                        const explanation = {
                            explanation: progressData.explanation,
                            summary: progressData.summary,
                            wordCount: progressData.wordCount,
                            isPartial: false
                        };
                        window.ExplanationDisplay.displayExplanation(this.currentContextData, explanation);
                    }
                }, 100); // Small delay to ensure last update is processed
            }
        } catch (error) {
            console.error('❌ Error handling explanation progress:', error);
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(event) {
        switch (event.key) {
            case 'Escape':
                this.handleCloseWindow();
                break;
            case 'r':
            case 'R':
                if (event.metaKey || event.ctrlKey) {
                    event.preventDefault();
                    this.handleRefresh();
                }
                break;
        }
    }
    
    /**
     * Handle window close request
     */
    handleCloseWindow() {
        console.log('🚪 Closing window...');
        
        if (this.ipcRenderer) {
            this.ipcRenderer.send('close-explanation');
        } else {
            // Fallback for non-Electron environments
            if (window.close) {
                window.close();
            }
        }
    }
    
    /**
     * Handle refresh request (development feature)
     */
    handleRefresh() {
        if (this.currentContextData) {
            console.log('🔄 Refreshing explanation...');
            this.handleShowExplanation(null, this.currentContextData);
        }
    }
    
    /**
     * Show loading state
     */
    showLoadingState(isThorough = false) {
        if (window.UIComponents) {
            const message = isThorough ? 
                'Analyzing comprehensive content...' : 
                'Processing your request...';
            window.UIComponents.showLoading(message);
        }
    }
    
    /**
     * Display explanation content
     */
    displayExplanation(contextData) {
        if (window.ExplanationDisplay) {
            const explanation = {
                explanation: contextData.explanation,
                summary: contextData.summary,
                wordCount: contextData.wordCount,
                isPartial: false
            };
            window.ExplanationDisplay.displayExplanation(contextData, explanation);
        }
    }
    
    /**
     * Start streaming explanation process
     */
    async startStreamingExplanation(contextData) {
        try {
            this.showLoadingState(contextData.isThorough);
            
            if (this.ipcRenderer) {
                const finalExplanation = await this.ipcRenderer.invoke('get-explanation', contextData);
                
                if (!finalExplanation.isPartial && window.ExplanationDisplay) {
                    window.ExplanationDisplay.displayExplanation(contextData, finalExplanation);
                }
            }
        } catch (error) {
            console.error('❌ Error in streaming explanation:', error);
            this.showError('Failed to get explanation: ' + error.message);
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        if (window.UIComponents) {
            window.UIComponents.showError(message);
        }
    }
    
    /**
     * Get current context data
     */
    getCurrentContextData() {
        return this.currentContextData;
    }
    
    /**
     * Check if IPC is available
     */
    isIPCAvailable() {
        return !!this.ipcRenderer;
    }
}

// Create global instance
window.EventHandler = new EventHandler();
