/**
 * HYBRID THEME SYSTEM
 * Initializes with system theme but allows manual toggle override
 * Best of both worlds: automatic system detection + user control
 */

class ThemeToggle {
    constructor() {
        this.storageKey = 'reading-helper-theme';
        this.overrideKey = 'reading-helper-theme-override';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Check if user has manually overridden, otherwise use system
        this.isManualOverride = this.hasManualOverride();
        this.currentTheme = this.isManualOverride ? this.getStoredTheme() : this.getSystemTheme();
        
        this.initialize();
    }

    /**
     * Initialize the hybrid theme system
     */
    initialize() {
        this.createToggleButton();
        this.applyTheme(this.currentTheme);
        this.addEventListeners();
        
        console.log(`🎨 Theme initialized: ${this.currentTheme} (${this.isManualOverride ? 'manual override' : 'following system'})`);
    }

    /**
     * Check if user has manually overridden the system theme
     * @returns {boolean}
     */
    hasManualOverride() {
        try {
            return localStorage.getItem(this.overrideKey) === 'true';
        } catch (error) {
            console.warn('Unable to check manual override status:', error);
            return false;
        }
    }

    /**
     * Get stored manual theme preference
     * @returns {string|null}
     */
    getStoredTheme() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (error) {
            console.warn('Unable to access stored theme:', error);
            return null;
        }
    }

    /**
     * Get current system theme preference
     * @returns {string} - 'light' | 'dark'
     */
    getSystemTheme() {
        return this.mediaQuery.matches ? 'dark' : 'light';
    }

    /**
     * Store theme preference with override flag
     * @param {string} theme - 'light' | 'dark'
     * @param {boolean} isManualOverride - whether this is user-initiated
     */
    storeTheme(theme, isManualOverride = false) {
        try {
            localStorage.setItem(this.storageKey, theme);
            localStorage.setItem(this.overrideKey, isManualOverride.toString());
            this.isManualOverride = isManualOverride;
        } catch (error) {
            console.warn('Unable to store theme preference:', error);
        }
    }

    /**
     * Create the theme toggle button
     */
    createToggleButton() {
        // Remove existing button if it exists
        const existingButton = document.getElementById('theme-toggle');
        if (existingButton) {
            existingButton.remove();
        }

        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('title', 'Click to toggle theme, double-click to reset to system');
        
        // Force inline styles to ensure visibility
        button.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 999999 !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            border-radius: 50px !important;
            padding: 12px 20px !important;
            color: #ffffff !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            min-width: 120px !important;
            justify-content: center !important;
            font-family: system-ui, -apple-system, sans-serif !important;
        `;
        
        this.updateButtonContent(button);
        document.body.appendChild(button);
        
        console.log('🎛️ Theme toggle button created');
        return button;
    }

    /**
     * Update button content based on current theme and override status
     * @param {HTMLElement} button
     */
    updateButtonContent(button) {
        const icon = this.currentTheme === 'dark' ? '☀️' : '🌙';
        const text = this.isManualOverride ? 'Theme' : 'Auto';
        
        button.innerHTML = `
            <span style="font-size: 16px;">${icon}</span>
            <span>${text}</span>
        `;
    }

    /**
     * Apply theme to the application
     * @param {string} theme - 'light' | 'dark'
     */
    applyTheme(theme) {
        const body = document.body;
        const toggleButton = document.getElementById('theme-toggle');

        // Remove existing theme classes
        body.classList.remove('light-mode', 'dark-mode');
        
        // Add new theme class
        body.classList.add(`${theme}-mode`);
        
        // Update current theme
        this.currentTheme = theme;
        
        // Update button content
        if (toggleButton) {
            this.updateButtonContent(toggleButton);
        }
        
        // Dispatch custom event for other components
        this.dispatchThemeChangeEvent(theme);
        
        console.log(`🎨 Theme applied: ${theme} (${this.isManualOverride ? 'manual' : 'auto'})`);
    }

    /**
     * Toggle between light and dark themes (manual override)
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.storeTheme(newTheme, true); // Mark as manual override
        
        console.log(`🎛️ Manual theme toggle: ${newTheme}`);
    }

    /**
     * Reset to system theme (remove manual override)
     */
    resetToSystem() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.overrideKey);
        } catch (error) {
            console.warn('Unable to clear theme preferences:', error);
        }
        
        this.isManualOverride = false;
        const systemTheme = this.getSystemTheme();
        this.applyTheme(systemTheme);
        
        console.log(`🔄 Reset to system theme: ${systemTheme}`);
    }

    /**
     * Dispatch theme change event
     * @param {string} theme - 'light' | 'dark'
     */
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themeChanged', {
            detail: { 
                theme,
                isManualOverride: this.isManualOverride,
                isSystemTheme: !this.isManualOverride
            },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        // Manual toggle button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#theme-toggle')) {
                // Single click toggles theme
                if (!e.detail || e.detail === 1) {
                    this.toggleTheme();
                }
                // Double click resets to system
                else if (e.detail === 2) {
                    this.resetToSystem();
                }
            }
        });

        // Keyboard accessibility
        document.addEventListener('keydown', (e) => {
            if (e.target.closest('#theme-toggle') && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // Listen for system theme changes (only if not manually overridden)
        this.mediaQuery.addEventListener('change', (e) => {
            if (!this.isManualOverride) {
                const systemTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(systemTheme);
                console.log(`🔄 System theme changed: ${systemTheme}`);
            }
        });
    }

    /**
     * Get current theme
     * @returns {string} - 'light' | 'dark'
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if currently using manual override
     * @returns {boolean}
     */
    isUsingManualOverride() {
        return this.isManualOverride;
    }

    /**
     * Force set theme (for programmatic use)
     * @param {string} theme - 'light' | 'dark'
     */
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
            this.storeTheme(theme, true);
        } else {
            console.warn('Invalid theme provided. Use "light" or "dark".');
        }
    }
}

// Initialize theme system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeToggle = new ThemeToggle();
    });
} else {
    window.themeToggle = new ThemeToggle();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
}
