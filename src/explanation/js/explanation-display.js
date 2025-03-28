/**
 * Explanation Display Module
 * Handles the display and updating of explanation content
 */

class ExplanationDisplay {
    constructor() {
        this.currentExplanation = null;
        this.isStreaming = false;
        this.streamingBuffer = '';
    }
    
    /**
     * Display complete explanation
     */
    async displayExplanation(contextData, explanation) {
        console.log('📝 Displaying explanation:', {
            hasExplanation: !!explanation.explanation,
            explanationLength: explanation.explanation ? explanation.explanation.length : 0,
            wordCount: explanation.wordCount,
            isPartial: explanation.isPartial
        });
        
        try {
            // Store current explanation data
            this.currentExplanation = { contextData, explanation };
            
            // Hide loading states
            if (window.UIComponents) {
                window.UIComponents.hideLoading();
                window.UIComponents.removeStreamingIndicator();
            }
            
            // Process and display the explanation content
            await this.processAndDisplayContent(explanation);
            
            // Add final touches if this is the complete explanation
            if (!explanation.isPartial) {
                this.finalizeDisplay(explanation);
            }
            
        } catch (error) {
            console.error('❌ Error displaying explanation:', error);
            if (window.UIComponents) {
                window.UIComponents.showError('Failed to display explanation: ' + error.message);
            }
        }
    }
    
    /**
     * Process and display content
     */
    async processAndDisplayContent(explanation) {
        if (!explanation.explanation) {
            console.error('❌ No explanation content to display');
            if (window.UIComponents) {
                window.UIComponents.showError('No explanation content was received');
            }
            return;
        }
        
        // Format the content
        let formattedContent = explanation.explanation;
        
        if (window.TextFormatter) {
            // Reset counters for new content
            window.TextFormatter.resetCounters();
            formattedContent = window.TextFormatter.formatExplanationContent(explanation.explanation);
        }
        
        // Display the content
        if (window.UIComponents) {
            window.UIComponents.showExplanation(formattedContent);
        }
        
        // Process code blocks after content is in DOM
        await this.processCodeBlocks();
        
        // Render math equations if present
        await this.renderMathContent();
    }
    
    /**
     * Update progress during streaming
     */
    async updateProgress(progressData, contextData) {
        console.log('📊 Updating explanation progress:', progressData);
        
        try {
            this.isStreaming = true;
            
            // Hide loading screen on first chunk if still visible
            if (window.UIComponents) {
                window.UIComponents.hideLoading();
            }
            
            // Update selected text visibility if needed
            if (contextData && window.UIComponents) {
                window.UIComponents.updateSelectedTextVisibility(contextData);
            }
            
            // Update the explanation content
            if (progressData.explanation) {
                await this.updateStreamingContent(progressData);
            }
            
            // Update streaming indicator
            if (window.UIComponents) {
                window.UIComponents.addStreamingIndicator(progressData.wordCount || 0);
            }
            
            // Update status to show progress
            if (window.UIComponents) {
                const status = progressData.isPartial ? 
                    `Streaming... (${progressData.wordCount || 0} words)` : 
                    `Complete (${progressData.wordCount || 0} words)`;
                window.UIComponents.updateStatus(status, progressData.isPartial ? '#ffa726' : '#4caf50');
            }
            
        } catch (error) {
            console.error('❌ Error updating progress:', error);
        }
    }
    
    /**
     * Update streaming content
     */
    async updateStreamingContent(progressData) {
        const startTime = Date.now();
        
        // Record performance if monitor is available
        if (window.PerformanceMonitor) {
            window.PerformanceMonitor.recordStreamingUpdate();
        }
        
        let content = progressData.explanation;
        
        // Format the streaming content (but don't add streaming indicators in formatter)
        if (window.TextFormatter) {
            content = window.TextFormatter.formatExplanationContent(content);
        }
        
        // Update the display directly without going through UIComponents.showExplanation
        // which would hide loading and change status
        if (window.UIComponents) {
            const explanationContent = window.UIComponents.getElement('explanationContent');
            if (explanationContent) {
                explanationContent.innerHTML = content;
                
                // Add visual streaming indicator to the content
                if (progressData.isPartial) {
                    const streamingDot = document.createElement('span');
                    streamingDot.className = 'streaming-dot';
                    streamingDot.innerHTML = ' <span style="color: #667eea; font-weight: bold;">●</span>';
                    streamingDot.style.animation = 'pulse 1.5s infinite';
                    explanationContent.appendChild(streamingDot);
                }
            }
        }
        
        // Record content update time
        if (window.PerformanceMonitor) {
            window.PerformanceMonitor.recordContentUpdate(startTime);
        }
        
        // Process code blocks after content is in DOM
        await this.processCodeBlocks();
        
        // Render math for the updated content
        await this.renderMathContent();
        
        // Scroll to show new content - DISABLED
        // if (window.UIComponents) {
        //     window.UIComponents.scrollToBottom();
        // }
    }
    
    /**
     * Finalize display for complete explanations
     */
    finalizeDisplay(explanation) {
        // Remove streaming indicators
        if (window.UIComponents) {
            window.UIComponents.removeStreamingIndicator();
        }
        
        // Remove streaming dots from content
        const streamingDots = document.querySelectorAll('.streaming-dot');
        streamingDots.forEach(dot => dot.remove());
        
        // Add word count info
        if (explanation.wordCount && window.UIComponents) {
            window.UIComponents.addWordCountInfo(explanation.wordCount);
        }
        
        // Clean up content
        if (window.TextFormatter) {
            const explanationContent = window.UIComponents?.getElement('explanationContent');
            if (explanationContent) {
                const cleanedContent = window.TextFormatter.finalizeContent(explanationContent.innerHTML);
                explanationContent.innerHTML = cleanedContent;
            }
        }
        
        // Update final status
        if (window.UIComponents) {
            window.UIComponents.updateStatus('Explanation complete', '#4caf50');
        }
        
        this.isStreaming = false;
        console.log('✅ Explanation display finalized');
    }
    
    /**
     * Render mathematical content
     */
    async renderMathContent() {
        if (!window.MathJaxLoader) return;
        
        const startTime = Date.now();
        
        try {
            const explanationContent = window.UIComponents?.getElement('explanationContent');
            if (explanationContent) {
                await window.MathJaxLoader.renderMathInElement(explanationContent);
            }
            
            // Record math render time
            if (window.PerformanceMonitor) {
                window.PerformanceMonitor.recordMathRender(startTime);
            }
        } catch (error) {
            console.warn('⚠️ Math rendering failed:', error);
        }
    }

    /**
     * Process code blocks with formatting only
     */
    async processCodeBlocks() {
        try {
            const explanationContent = window.UIComponents?.getElement('explanationContent');
            if (!explanationContent) {
                console.warn('⚠️ No explanation content element found for code processing');
                return;
            }
            
            console.log('🔧 Processing code blocks...');
            
            // Check if there are any code blocks to process
            const codeBlocks = explanationContent.querySelectorAll('.code-block code, pre code');
            console.log(`📝 Found ${codeBlocks.length} code blocks to process`);
            
            if (codeBlocks.length === 0) {
                console.log('ℹ️ No code blocks found to process');
                return;
            }
            
            // Format code blocks if CodeFormatter is available
            if (window.CodeFormatter) {
                console.log('🔧 Running CodeFormatter...');
                await window.CodeFormatter.formatAllCodeBlocks(explanationContent);
                console.log('✅ Code formatting completed');
            } else {
                console.warn('⚠️ CodeFormatter not available');
            }
            
        } catch (error) {
            console.error('❌ Code processing failed:', error);
        }
    }
    
    /**
     * Clear current explanation
     */
    clearExplanation() {
        this.currentExplanation = null;
        this.isStreaming = false;
        this.streamingBuffer = '';
        
        if (window.UIComponents) {
            window.UIComponents.showExplanationLoading();
            window.UIComponents.removeStreamingIndicator();
        }
    }
    
    /**
     * Get current explanation data
     */
    getCurrentExplanation() {
        return this.currentExplanation;
    }
    
    /**
     * Check if currently streaming
     */
    getIsStreaming() {
        return this.isStreaming;
    }
    
    /**
     * Handle explanation error
     */
    handleError(error, contextData = null) {
        console.error('❌ Explanation display error:', error);
        
        this.isStreaming = false;
        
        let errorMessage = 'An error occurred while displaying the explanation.';
        
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        if (window.UIComponents) {
            window.UIComponents.showError(errorMessage);
        }
    }
    
    /**
     * Refresh current explanation (development feature)
     */
    async refreshExplanation() {
        if (!this.currentExplanation) {
            console.warn('⚠️ No current explanation to refresh');
            return;
        }
        
        console.log('🔄 Refreshing explanation...');
        
        try {
            const { contextData, explanation } = this.currentExplanation;
            await this.displayExplanation(contextData, explanation);
        } catch (error) {
            console.error('❌ Error refreshing explanation:', error);
            this.handleError(error);
        }
    }
    
    /**
     * Export explanation as text
     */
    exportAsText() {
        if (!this.currentExplanation) {
            return '';
        }
        
        const { contextData, explanation } = this.currentExplanation;
        
        let text = 'EXPLANATION EXPORT\n';
        text += '==================\n\n';
        
        if (contextData.selectedText && !contextData.isThorough) {
            text += 'SELECTED TEXT:\n';
            text += contextData.selectedText + '\n\n';
        }
        
        text += 'EXPLANATION:\n';
        
        // Strip HTML tags for plain text export
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = explanation.explanation;
        text += tempDiv.textContent || tempDiv.innerText || '';
        
        if (explanation.wordCount) {
            text += `\n\nWord Count: ${explanation.wordCount}`;
        }
        
        return text;
    }
    
    /**
     * Copy explanation to clipboard
     */
    async copyToClipboard() {
        const text = this.exportAsText();
        
        if (!text) {
            console.warn('⚠️ No explanation to copy');
            return false;
        }
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                console.log('✅ Explanation copied to clipboard');
                return true;
            } else {
                // Fallback method
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                
                document.body.appendChild(textArea);
                textArea.select();
                
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (success) {
                    console.log('✅ Explanation copied to clipboard (fallback)');
                }
                
                return success;
            }
        } catch (error) {
            console.error('❌ Failed to copy explanation:', error);
            return false;
        }
    }
}

// Create global instance
window.ExplanationDisplay = new ExplanationDisplay();
