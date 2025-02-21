/**
 * AIService.js - Handles AI initialization and explanation generation
 */

class AIService {
  constructor() {
    this.genAI = null;
    this.initialize();
  }

  async initialize() {
    try {
      const { GoogleGenAI } = require('@google/genai');
      
      if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY not found in environment variables');
        return;
      }
      
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      console.log('Google GenAI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google GenAI:', error);
      this.genAI = null;
    }
  }

  isAvailable() {
    return this.genAI !== null;
  }

  async getExplanation(contextData) {
    const aiStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] AI explanation generation started`);
    
    const { selectedText, explanation } = contextData;
    
    // If we already have an explanation from the vision API, process and structure it
    if (explanation) {
      const aiDuration = Date.now() - aiStartTime;
      console.log(`[${new Date().toISOString()}] AI explanation completed using pre-generated explanation in ${aiDuration}ms`);
      
      return {
        explanation: this.formatExplanationForHTML(explanation),
        summary: `Contextual explanation for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
        wordCount: this.countWords(explanation)
      };
    }
    
    if (!this.isAvailable()) {
      return this.getFallbackExplanation(contextData);
    }

    try {
      // Point-form technical explanation with analogies
      const prompt = `TEXT TO EXPLAIN: "${selectedText}"

Provide a clear and thorough technical explanation:

Consider the following points:
**Definition**: What this term/concept means technically
**Function**: What it does or how it works
**Key details**: Important technical specifics
**Mathematical expressions**: Use LaTeX notation for any formulas (inline: $equation$, display: $$equation$$)
**Code Example if relevant**: C++ preferred
**Analogy**: A helpful real-world comparison

**CODE FORMATTING RULES** (if code examples are included):
• Keep all code lines under 80 characters maximum
• Break long lines at logical points (after operators, commas, etc.)
• Use proper indentation for continuation lines

Format each point as a section

Use bullet points for easy reading. Be technically accurate but accessible through analogies and mathematical notation when applicable.`;

      const result = await Promise.race([
        this.genAI.models.generateContent({
          model: "gemini-2.0-flash-lite",
          contents: prompt,
          config: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 2000
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Explanation timeout')), 10000) // 10 seconds timeout
        )
      ]);

      const aiResponse = result.text;
      
      const aiDuration = Date.now() - aiStartTime;
      console.log(`[${new Date().toISOString()}] AI explanation generation completed in ${aiDuration}ms`);
      
      return {
        explanation: this.formatExplanationForHTML(aiResponse),
        summary: `AI explanation for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
        wordCount: this.countWords(aiResponse)
      };

    } catch (error) {
      const aiDuration = Date.now() - aiStartTime;
      console.log(`[${new Date().toISOString()}] Google GenAI API error after ${aiDuration}ms:`, error);
      return this.getFallbackExplanation(contextData);
    }
  }

  getFallbackExplanation(contextData) {
    const { selectedText } = contextData;
    
    return {
      explanation: this.formatExplanationForHTML(`The selected text "${selectedText}" appears on the current page. 

**ANALYSIS**
• The text was selected from the current window
• To get AI-powered explanations with deeper analysis, please add your Google GenAI API key to the .env file

For better results, make sure the text you select is clearly visible in the captured window and that the Google API key is properly configured.`),
      summary: `Analysis of "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
      wordCount: this.countWords(selectedText)
    };
  }

  async getThoroughExplanation(selectedText, onProgress) {
    const thoroughStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Thorough AI explanation generation started`);
    
    if (!this.isAvailable()) {
      return this.getThoroughFallbackExplanation(selectedText);
    }

    try {
      const prompt = `Explain this text thoroughly: "${selectedText}"

**EXPLANATION**
• Provide a clear, detailed explanation of what this means
• Break down the concepts into understandable parts
• Use short bullet points for clarity

**REAL-WORLD ANALOGY**
• Use a compelling real-world analogy to make it intuitive

**MATHEMATICAL EQUATIONS**
• If the text contains mathematical concepts, express them using LaTeX notation:
  - For inline math: $equation$
  - For display math: $$equation$$
  - Example: $E = mc^2$ or $$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
• If the text does not involve math, SKIP this section and DON'T EVEN GENERATE THE HEADING

**CODE EXAMPLES**
• If the text involves programming concepts, provide C++ code examples to illustrate
• Use proper code blocks with syntax highlighting
• Show practical implementations where relevant

**CODE FORMATTING RULES** (if code examples are included):
• Keep all code lines under 80 characters maximum
• Break long lines at logical points (after operators, commas, etc.)
• Use proper indentation for continuation lines

**KEY TERMS**
• Define any important technical terms mentioned at the end

Keep it focused and insightful. Make complex ideas accessible through great analogies, mathematical notation, and concrete code examples when applicable.`;

      // Initialize result variables
      let fullResponse = "";
      
      console.log('Starting streaming thorough explanation generation...');
      
      // Use streaming with free tier compatible model
      const response = await this.genAI.models.generateContentStream({
        model: "gemini-2.5-flash-preview-05-20", // Free tier compatible model with thinking capabilities
        contents: prompt,
        config: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 16000,
          thinkingConfig: {
            thinkingBudget: 2000,
          }
        }
      });
      
      // Process the stream - the response itself is the async iterator
      for await (const chunk of response) {
        const chunkText = chunk.text || '';
        if (chunkText) {
          fullResponse += chunkText;
          
          // Call progress callback if provided for real-time updates
          if (typeof onProgress === 'function') {
            const formattedChunk = this.formatExplanationForHTML(fullResponse);
            onProgress({
              explanation: formattedChunk,
              summary: `Generating comprehensive analysis... (${this.countWords(fullResponse)} words)`,
              wordCount: this.countWords(fullResponse),
              isThorough: true,
              isPartial: true
            });
          }
        }
      }
      
      // Call progress callback with final result
      if (typeof onProgress === 'function') {
        const formattedResult = this.formatExplanationForHTML(fullResponse);
        onProgress({
          explanation: formattedResult,
          summary: `Comprehensive analysis complete (${this.countWords(fullResponse)} words)`,
          wordCount: this.countWords(fullResponse),
          isThorough: true,
          isPartial: false
        });
      }
      
      console.log('Thorough explanation response length:', fullResponse.length);
      console.log('First 200 chars:', fullResponse.substring(0, 200));
      console.log('Last 200 chars:', fullResponse.substring(Math.max(0, fullResponse.length - 200)));
      
      const thoroughDuration = Date.now() - thoroughStartTime;
      console.log(`[${new Date().toISOString()}] Thorough AI explanation generation completed in ${thoroughDuration}ms`);
      
      return {
        explanation: this.formatExplanationForHTML(fullResponse),
        summary: `Comprehensive analysis: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
        wordCount: this.countWords(fullResponse),
        isThorough: true,
        isPartial: false
      };

    } catch (error) {
      const thoroughDuration = Date.now() - thoroughStartTime;
      console.error(`[${new Date().toISOString()}] Google GenAI Pro API error after ${thoroughDuration}ms:`, error);
      return this.getThoroughFallbackExplanation(selectedText);
    }
  }

  getThoroughFallbackExplanation(selectedText) {
    return {
      explanation: `<strong>COMPREHENSIVE ANALYSIS REQUEST</strong>

<p>Selected text: "${selectedText}"</p>

<p><strong>Analysis Status:</strong> AI service unavailable</p>

<p><strong>To enable thorough explanations:</strong></p>
<ul>
<li>Add your Google GenAI API key to the .env file</li>
<li>Ensure internet connectivity</li>
<li>Restart the application</li>
</ul>

<p><strong>About Thorough Explanations:</strong></p>
<ul>
<li>Uses advanced Gemini 2.0 Flash model with thinking capabilities</li>
<li>Provides comprehensive breakdowns with analogies</li>
<li>Includes context, applications, and insights</li>
<li>Designed for complex technical concepts</li>
<li>Streams results in real-time for better user experience</li>
</ul>

<p>Once configured, this feature will provide detailed, structured explanations with technical breakdowns, real-world analogies, and deeper insights.</p>`,
      summary: `Thorough analysis request: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
      wordCount: this.countWords(selectedText),
      isThorough: true
    };
  }

  async getCodeExplanation(contextData, onProgress = null) {
    const codeStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] Code explanation generation started`);
    
    const { selectedText, explanation } = contextData;
    
    // If we already have an explanation from the vision API, process and structure it
    if (explanation) {
      const codeDuration = Date.now() - codeStartTime;
      console.log(`[${new Date().toISOString()}] Code explanation completed using pre-generated explanation in ${codeDuration}ms`);
      
      return {
        explanation: this.formatExplanationForHTML(explanation),
        summary: `Code explanation for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
        wordCount: this.countWords(explanation),
        isCode: true
      };
    }
    
    if (!this.isAvailable()) {
      return this.getCodeFallbackExplanation(contextData);
    }

    try {
      // Smart code explanation prompt focused on meaningful code elements
      const prompt = `ANALYZE THIS CODE: "${selectedText}"

Please provide a focused explanation of this code, concentrating on the meaningful elements:

**WHAT IT DOES**
• Overview of the code's purpose and main functionality

**LINE BY LINE CODE ELEMENTS EXPLAINED**
• Focus on the substantive parts of the code that contain logic, algorithms, or important operations
• SKIP trivial syntax elements like:
  - Standalone closing braces (\`}\`, \`};\`)
  - Standalone opening braces (\`{\`)
  - Empty lines or whitespace-only lines
  - Simple variable declarations without logic
  - Basic import/include statements (unless they're unusual)
• EXPLAIN the important parts like:
  - Function definitions and their parameters
  - Complex expressions and calculations
  - Control flow (if/else, loops, switch statements)
  - Data structures and their operations
  - Algorithm implementations
  - Business logic and conditional statements
  - Error handling and edge cases
• Group related lines together when explaining connected operations
• Include relevant code snippets in blocks using:
\`\`\`language
code here
\`\`\`

**IMPORTANT CODE FORMATTING RULES**
• Keep all code lines under 80 characters maximum
• Break long lines at logical points (after operators, commas, etc.)
• Use proper indentation for continuation lines
• Example of good formatting:
\`\`\`cpp
std::cout << "Short line" << std::endl;
// Long line broken properly:
result = calculate_value(param1, param2, 
                        param3, param4);
\`\`\`

Focus on the "meat" of the code - the logic, algorithms, and operations that actually do something meaningful. Skip the obvious syntax scaffolding.`;

      // Initialize result variables
      let fullResponse = "";
      
      console.log('Starting streaming code explanation generation...');
      
      // Use streaming for real-time updates
      const response = await this.genAI.models.generateContentStream({
        model: "gemini-2.0-flash-lite",
        contents: prompt,
        config: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 3000
        }
      });
      
      // Process the stream - the response itself is the async iterator
      for await (const chunk of response) {
        const chunkText = chunk.text || '';
        if (chunkText) {
          fullResponse += chunkText;
          
          // Call progress callback if provided for real-time updates
          if (typeof onProgress === 'function') {
            const formattedChunk = this.formatExplanationForHTML(fullResponse);
            onProgress({
              explanation: formattedChunk,
              summary: `Analyzing code... (${this.countWords(fullResponse)} words)`,
              wordCount: this.countWords(fullResponse),
              isCode: true,
              isPartial: true
            });
          }
        }
      }
      
      // Call progress callback with final result
      if (typeof onProgress === 'function') {
        const formattedResult = this.formatExplanationForHTML(fullResponse);
        onProgress({
          explanation: formattedResult,
          summary: `Code analysis complete (${this.countWords(fullResponse)} words)`,
          wordCount: this.countWords(fullResponse),
          isCode: true,
          isPartial: false
        });
      }
      
      console.log('Code explanation response length:', fullResponse.length);
      console.log('First 200 chars:', fullResponse.substring(0, 200));
      console.log('Last 200 chars:', fullResponse.substring(Math.max(0, fullResponse.length - 200)));
      
      const codeDuration = Date.now() - codeStartTime;
      console.log(`[${new Date().toISOString()}] Code explanation generation completed in ${codeDuration}ms`);
      
      return {
        explanation: this.formatExplanationForHTML(fullResponse),
        summary: `Code analysis for: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
        wordCount: this.countWords(fullResponse),
        isCode: true,
        isPartial: false
      };

    } catch (error) {
      const codeDuration = Date.now() - codeStartTime;
      console.log(`[${new Date().toISOString()}] Google GenAI API error after ${codeDuration}ms:`, error);
      return this.getCodeFallbackExplanation(contextData);
    }
  }

  getCodeFallbackExplanation(contextData) {
    const { selectedText } = contextData;
    
    return {
      explanation: this.formatExplanationForHTML(`**CODE ANALYSIS REQUEST**

Selected code: "${selectedText}"

**STATUS:** AI service unavailable

**TO ENABLE CODE EXPLANATIONS:**
• Add your Google GenAI API key to the .env file
• Ensure internet connectivity
• Restart the application

**ABOUT CODE EXPLANATIONS:**
• Specialized for analyzing programming code
• Provides line-by-line breakdowns
• Explains programming concepts and patterns
• Identifies potential issues and improvements
• Suggests best practices and alternatives

This feature uses advanced AI analysis specifically tuned for code understanding and explanation.`),
      summary: `Code analysis request: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`,
      wordCount: this.countWords(selectedText),
      isCode: true
    };
  }

  formatExplanationForHTML(text) {
    // Normalize line breaks and clean up text
    let formatted = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    // Split into lines for processing
    const lines = formatted.split('\n');
    let result = '';
    let inList = false;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeLanguage = '';
    let lastWasEmpty = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Check for code block start/end
      if (line.match(/^```(\w+)?/)) {
        if (!inCodeBlock) {
          // Starting a code block
          inCodeBlock = true;
          codeLanguage = line.replace(/^```/, '') || 'cpp'; // Default to C++
          codeBlockContent = '';
          
          // Close any open list
          if (inList) {
            result += '</ul>\n';
            inList = false;
          }
          continue;
        } else {
          // Ending a code block
          inCodeBlock = false;
          result += this.formatCodeBlock(codeBlockContent, codeLanguage);
          codeBlockContent = '';
          codeLanguage = '';
          continue;
        }
      }
      
      // If we're in a code block, collect the content
      if (inCodeBlock) {
        codeBlockContent += (codeBlockContent ? '\n' : '') + lines[i]; // Use original line with spacing
        continue;
      }
      
      // Handle empty lines
      if (!line) {
        // Close list if we're in one and hit an empty line
        if (inList) {
          result += '</ul>\n';
          inList = false;
        }
        // Add breathing room between sections
        if (!lastWasEmpty && result) {
          result += '<div style="margin: 15px 0;"></div>\n';
        }
        lastWasEmpty = true;
        continue;
      }
      
      lastWasEmpty = false;
      
      // Check for section headers (bold text on its own line)
      if (line.match(/^\*\*(.*?)\*\*\s*$/)) {
        // Close any open list
        if (inList) {
          result += '</ul>\n';
          inList = false;
        }
        
        const headerText = line.replace(/^\*\*(.*?)\*\*\s*$/, '$1');
        result += `<div class="section-header">
          <h3 style="color: #2c5aa0; margin: 25px 0 15px 0; font-size: 17px; font-weight: 700; 
                     text-transform: uppercase; letter-spacing: 0.5px; 
                     border-bottom: 2px solid #e3f2fd; padding-bottom: 8px;
                     display: flex; align-items: center;">
            <span style="width: 4px; height: 20px; background: linear-gradient(135deg, #2c5aa0, #1976d2); 
                         border-radius: 2px; margin-right: 12px;"></span>
            ${headerText}
          </h3>
        </div>\n`;
        continue;
      }
      
      // Check for bullet points
      if (line.match(/^[•\-\*]\s+/)) {
        // Start list if not already in one
        if (!inList) {
          result += `<ul style="margin: 15px 0 20px 0; padding-left: 0; list-style: none;">`;
          inList = true;
        }
        
        // Extract bullet content and format
        const content = line.replace(/^[•\-\*]\s+/, '');
        const formattedContent = content
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1976d2; font-weight: 600;">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em style="color: #37474f; font-style: italic;">$1</em>');
        
        result += `<li style="margin: 12px 0; line-height: 1.7; position: relative; padding-left: 25px; color: #424242;">
          <span style="position: absolute; left: 0; top: 8px; width: 8px; height: 8px; 
                       background: linear-gradient(135deg, #2196f3, #1976d2); 
                       border-radius: 50%; box-shadow: 0 1px 3px rgba(25, 118, 210, 0.3);"></span>
          ${formattedContent}
        </li>\n`;
        continue;
      }
      
      // Regular text line
      if (inList) {
        result += '</ul>\n';
        inList = false;
      }
      
      // Format regular paragraphs
      if (line) {
        const formattedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1976d2; font-weight: 600;">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em style="color: #37474f; font-style: italic;">$1</em>');
        
        result += `<p style="margin: 15px 0; line-height: 1.8; color: #424242; 
                          font-size: 15px; text-align: justify;">${formattedLine}</p>\n`;
      }
    }
    
    // Close any remaining open list
    if (inList) {
      result += '</ul>\n';
    }
    
    // Handle unclosed code block
    if (inCodeBlock && codeBlockContent) {
      result += this.formatCodeBlock(codeBlockContent, codeLanguage);
    }
    
    return result;
  }

  formatCodeBlock(code, language = 'cpp') {
    const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
    const escapedCode = this.escapeHtml(code);
    
    return `
      <div style="margin: 20px 0; border-radius: 12px; overflow: hidden; 
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
                  border: 1px solid #e1e8ed;">
        <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); 
                    padding: 12px 16px; border-bottom: 1px solid #dee2e6; 
                    display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center;">
            <span style="width: 12px; height: 12px; background: #ff5f57; border-radius: 50%; margin-right: 6px;"></span>
            <span style="width: 12px; height: 12px; background: #ffbd2e; border-radius: 50%; margin-right: 6px;"></span>
            <span style="width: 12px; height: 12px; background: #28ca42; border-radius: 50%; margin-right: 12px;"></span>
            <span style="font-size: 13px; font-weight: 600; color: #495057; 
                         font-family: 'SF Mono', Monaco, 'Inconsolata', monospace;">
              ${language.toUpperCase()}
            </span>
          </div>
          <button onclick="copyCodeToClipboard('${codeId}')" 
                  style="background: linear-gradient(135deg, #007ACC, #0066CC); 
                         border: none; border-radius: 6px; padding: 6px 12px; 
                         font-size: 12px; font-weight: 600; cursor: pointer; 
                         color: white; transition: all 0.2s ease;
                         box-shadow: 0 2px 4px rgba(0, 122, 204, 0.2);"
                  onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0, 122, 204, 0.3)';"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0, 122, 204, 0.2)';">
            📋 Copy
          </button>
        </div>
        <div style="background: #fafbfc; padding: 20px; overflow-x: auto; 
                    border-top: 1px solid rgba(0, 122, 204, 0.1);">
          <pre id="${codeId}" style="margin: 0; 
                                     font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace; 
                                     font-size: 14px; line-height: 1.6; color: #24292f; 
                                     white-space: pre; overflow: visible; 
                                     background: none; border: none;">${escapedCode}</pre>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
}

module.exports = AIService;
