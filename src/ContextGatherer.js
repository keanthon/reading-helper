/**
 * ContextGatherer.js - Handles context gathering from various sources
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class ContextGatherer {
  constructor(windowCapture, aiService) {
    this.windowCapture = windowCapture;
    this.aiService = aiService;
  }

  async gatherContextForSelectedText(selectedText, windowInfo, preCapture = null) {
    console.log('Starting context gathering for selected text...');
    
    try {
      // Single strategy: Use AI vision to explain text in context of the captured page
      console.log('Using AI vision to explain text in context...');
      const contextData = await this.explainTextWithVision(selectedText, windowInfo, preCapture);
      
      // Ensure we always have valid context data
      if (!contextData) {
        const fallbackText = 'Unable to analyze the context. The selected text appears to be: ' + selectedText;
        return {
          selectedText,
          explanation: this.aiService.formatExplanationForHTML(fallbackText),
          summary: `Fallback analysis for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
          wordCount: this.aiService.countWords(fallbackText),
          windowInfo,
          source: 'fallback'
        };
      }
      
      console.log('Context gathering completed:', {
        selectedLength: selectedText.length,
        hasExplanation: !!contextData.explanation,
        source: contextData.source || 'fallback'
      });
      
      return contextData;
      
    } catch (error) {
      console.error('Error gathering context:', error);
      
      // Return minimal context on error
      const errorText = 'Error analyzing context. The selected text is: ' + selectedText;
      return {
        selectedText,
        explanation: this.aiService.formatExplanationForHTML(errorText),
        summary: `Error analysis for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
        wordCount: this.aiService.countWords(errorText),
        windowInfo,
        source: 'error-fallback'
      };
    }
  }

  async explainTextWithVision(selectedText, windowInfo, preCapture = null) {
    try {
      // Check if AI service is available
      if (!this.aiService.isAvailable()) {
        console.log('AI service not available');
        return null;
      }

      let windowCapture;

      // Use pre-captured image if available, otherwise capture now
      if (preCapture && preCapture.success) {
        console.log('Using pre-captured screenshot for vision analysis...');
        windowCapture = preCapture;
      } else {
        console.log('Pre-capture not available, capturing frontmost window after brief delay...');
        
        const windowInfo = await this.windowCapture.getActiveWindowInfo();
        windowCapture = await this.windowCapture.captureActiveWindow(windowInfo);
        
        if (!windowCapture.success) {
          console.log('Window capture failed:', windowCapture.error);
          return null;
        }
      }

      console.log('Using screenshot for vision API call...');

      // Concise prompt for definition, purpose, and analogy
      const prompt = `Briefly explain "${selectedText}" in the context of this screenshot. Provide: definition, purpose, analogy (10-25 words each)`;

      // Prepare the image data
      const imageParts = [
        {
          inlineData: {
            data: windowCapture.image.split(',')[1], // Remove data:image/jpg;base64, prefix
            mimeType: "image/jpeg"
          }
        }
      ];

      // Make API call to vision model using new @google/genai API
      console.log('Making vision API call...');
      const result = await Promise.race([
        this.aiService.genAI.models.generateContent({
          model: "gemini-1.5-flash-8b",
          contents: [prompt, ...imageParts],
          config: {
            temperature: 0.0,          // Deterministic for consistent processing
            topP: 0.1,                 // Focused responses
            maxOutputTokens: 200,      // Reasonable limit for detailed explanations
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Vision API timeout after 10 seconds')), 10000)
        )
      ]);

      const explanation = result.text;

      console.log('Vision API call successful');

      const formattedExplanation = this.aiService.formatExplanationForHTML(explanation.trim());
      
      return {
        selectedText,
        explanation: formattedExplanation,
        summary: `Context explanation for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
        wordCount: this.aiService.countWords(explanation.trim()),
        windowInfo,
        source: 'vision-api'
      };

    } catch (error) {
      console.error('Vision analysis failed:', error);
      return null;
    }
  }
}

module.exports = ContextGatherer;
