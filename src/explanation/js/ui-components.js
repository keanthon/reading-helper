/**
 * UI Components Module
 * Manages all UI component state and interactions
 */

class UIComponents {
    constructor() {
        this.elements = {
            header: null,
            headerTitle: null,
            statusBar: null,
            statusText: null,
            selectedTextSection: null,
            selectedTextContent: null,
            explanationContent: null,
            loadingScreen: null,
            loadingTextLarge: null,
            loadingSubtext: null
        };
        
        this.initializeElements();
    }
    
    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements.header = document.querySelector('.header');
        this.elements.headerTitle = document.querySelector('.header-title');
        this.elements.statusBar = document.getElementById('status-bar');
        this.elements.statusText = document.getElementById('status-text');
        this.elements.selectedTextSection = document.getElementById('selected-text-section');
        this.elements.selectedTextContent = document.getElementById('selected-text-content');
        this.elements.explanationContent = document.getElementById('explanation-content');
        this.elements.loadingScreen = document.getElementById('loading-screen');
        this.elements.loadingTextLarge = document.getElementById('loading-text-large');
        this.elements.loadingSubtext = document.getElementById('loading-subtext');
        
        console.log('✅ UI components initialized');
    }
    
    /**
     * Update UI based on explanation type
     */
    updateForExplanationType(contextData) {
        this.updateHeaderForType(contextData);
        this.updateSelectedTextVisibility(contextData);
        this.updateStatus('Processing request...', '#667eea');
    }
    
    /**
     * Update header styling based on explanation type
     */
    updateHeaderForType(contextData) {
        if (!this.elements.header || !this.elements.headerTitle) return;
        
        // Reset classes
        this.elements.header.classList.remove('header-thorough', 'header-code');
        
        if (contextData.isThorough) {
            this.elements.headerTitle.textContent = 'Comprehensive Text Analysis';
            this.elements.header.classList.add('header-thorough');
        } else if (contextData.isCode) {
            this.elements.headerTitle.textContent = 'Code Analysis & Explanation';
            this.elements.header.classList.add('header-code');
        } else {
            this.elements.headerTitle.textContent = 'Text Explanation';
            // Reset to default styling
            this.elements.headerTitle.style.background = '';
            this.elements.headerTitle.style.webkitBackgroundClip = '';
            this.elements.headerTitle.style.webkitTextFillColor = '';
            this.elements.headerTitle.style.backgroundClip = '';
            this.elements.headerTitle.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
            this.elements.headerTitle.style.color = 'white';
        }
    }
    
    /**
     * Update selected text section visibility
     */
    updateSelectedTextVisibility(contextData) {
        if (!this.elements.selectedTextSection) return;
        
        if (contextData.isThorough) {
            // Hide selected text for thorough explanations
            this.elements.selectedTextSection.style.display = 'none';
        } else {
            // Show selected text for regular and code explanations
            this.elements.selectedTextSection.style.display = 'block';
            this.showSelectedText(contextData.selectedText);
        }
    }
    
    /**
     * Show selected text content
     */
    showSelectedText(text) {
        if (!this.elements.selectedTextContent || !text) return;
        
        // Format and display the selected text
        if (window.TextFormatter) {
            const formattedText = window.TextFormatter.formatSelectedText(text);
            this.elements.selectedTextContent.innerHTML = formattedText;
        } else {
            this.elements.selectedTextContent.textContent = text;
        }
    }
    
    /**
     * Update status bar
     */
    updateStatus(message, color = '#667eea') {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = message;
        }
        
        if (this.elements.statusBar) {
            this.elements.statusBar.style.borderLeftColor = color;
        }
    }
    
    /**
     * Show loading screen
     */
    showLoading(message = 'Processing your request...', subtext = 'This may take a few moments') {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.display = 'flex';
        }
        
        if (this.elements.loadingTextLarge) {
            this.elements.loadingTextLarge.textContent = message;
        }
        
        if (this.elements.loadingSubtext) {
            this.elements.loadingSubtext.textContent = subtext;
        }
        
        this.updateStatus('Loading...', '#ffa726');
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.display = 'none';
        }
        
        this.updateStatus('Ready', '#4caf50');
    }
    
    /**
     * Show explanation content
     */
    showExplanation(htmlContent) {
        if (!this.elements.explanationContent) return;
        
        this.hideLoading();
        this.elements.explanationContent.innerHTML = htmlContent;
        this.updateStatus('Explanation complete', '#4caf50');
    }
    
    /**
     * Show error message
     */
    showError(message) {
        if (!this.elements.explanationContent) return;
        
        this.hideLoading();
        
        const errorHtml = `
            <div class="error">
                <strong>Error</strong>
                ${message}
            </div>
        `;
        
        this.elements.explanationContent.innerHTML = errorHtml;
        this.updateStatus('Error occurred', '#e74c3c');
    }
    
    /**
     * Show loading placeholder in explanation area
     */
    showExplanationLoading(message = 'Waiting for explanation data...') {
        if (!this.elements.explanationContent) return;
        
        const loadingHtml = `
            <div class="loading-placeholder">
                <div class="loading-spinner"></div>
                <p class="loading-text">${message}</p>
            </div>
        `;
        
        this.elements.explanationContent.innerHTML = loadingHtml;
    }
    
    /**
     * Add streaming indicator
     */
    addStreamingIndicator(wordCount = 0) {
        // Remove existing indicator
        this.removeStreamingIndicator();
        
        const indicator = document.createElement('div');
        indicator.className = 'streaming-indicator';
        indicator.innerHTML = `Streaming... (${wordCount} words)`;
        document.body.appendChild(indicator);
    }
    
    /**
     * Remove streaming indicator
     */
    removeStreamingIndicator() {
        const existing = document.querySelector('.streaming-indicator');
        if (existing) {
            existing.remove();
        }
    }
    
    /**
     * Add word count info
     */
    addWordCountInfo(wordCount) {
        if (!this.elements.explanationContent || !wordCount) return;
        
        // Remove existing word count
        const existing = this.elements.explanationContent.querySelector('.word-count-info');
        if (existing) {
            existing.remove();
        }
        
        const wordCountDiv = document.createElement('div');
        wordCountDiv.className = 'word-count-info';
        wordCountDiv.innerHTML = `Analysis complete: ${wordCount} words`;
        this.elements.explanationContent.appendChild(wordCountDiv);
    }
    
    /**
     * Get element reference
     */
    getElement(name) {
        return this.elements[name];
    }
    
    /**
     * Scroll to bottom of content
     */
    scrollToBottom() {
        const content = document.querySelector('.content');
        if (content) {
            content.scrollTop = content.scrollHeight;
        }
    }
    
    /**
     * Scroll to top of content
     */
    scrollToTop() {
        const content = document.querySelector('.content');
        if (content) {
            content.scrollTop = 0;
        }
    }
    
    /**
     * Toggle element visibility
     */
    toggleVisibility(elementName, show) {
        const element = this.elements[elementName];
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }
    
    /**
     * Set element text content safely
     */
    setTextContent(elementName, text) {
        const element = this.elements[elementName];
        if (element) {
            element.textContent = text;
        }
    }
    
    /**
     * Set element HTML content safely
     */
    setHTMLContent(elementName, html) {
        const element = this.elements[elementName];
        if (element) {
            element.innerHTML = html;
        }
    }
}

// Create global instance
window.UIComponents = new UIComponents();
