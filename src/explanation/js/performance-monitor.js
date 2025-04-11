/**
 * Performance Monitor Module
 * Tracks performance metrics and provides optimization insights
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            streamingUpdates: 0,
            mathRenderTime: 0,
            contentUpdateTime: 0,
            memoryUsage: [],
            startTime: Date.now()
        };
        
        this.isEnabled = process.env.NODE_ENV === 'development' || localStorage.getItem('perfMonitor') === 'true';
        
        if (this.isEnabled) {
            this.startMonitoring();
        }
    }
    
    /**
     * Start performance monitoring
     */
    startMonitoring() {
        // Monitor memory usage every 5 seconds
        this.memoryInterval = setInterval(() => {
            if (performance.memory) {
                this.metrics.memoryUsage.push({
                    timestamp: Date.now(),
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                });
                
                // Keep only last 20 measurements
                if (this.metrics.memoryUsage.length > 20) {
                    this.metrics.memoryUsage.shift();
                }
            }
        }, 5000);
        
        console.log('📊 Performance monitoring enabled');
    }
    
    /**
     * Record streaming update
     */
    recordStreamingUpdate() {
        if (!this.isEnabled) return;
        this.metrics.streamingUpdates++;
    }
    
    /**
     * Record math render time
     */
    recordMathRender(startTime) {
        if (!this.isEnabled) return;
        const duration = Date.now() - startTime;
        this.metrics.mathRenderTime += duration;
    }
    
    /**
     * Record content update time
     */
    recordContentUpdate(startTime) {
        if (!this.isEnabled) return;
        const duration = Date.now() - startTime;
        this.metrics.contentUpdateTime += duration;
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        const uptime = Date.now() - this.metrics.startTime;
        
        return {
            uptime,
            streamingUpdates: this.metrics.streamingUpdates,
            avgMathRenderTime: this.metrics.streamingUpdates > 0 ? 
                this.metrics.mathRenderTime / this.metrics.streamingUpdates : 0,
            avgContentUpdateTime: this.metrics.streamingUpdates > 0 ? 
                this.metrics.contentUpdateTime / this.metrics.streamingUpdates : 0,
            memoryTrend: this.getMemoryTrend(),
            performance: this.getPerformanceMetrics()
        };
    }
    
    /**
     * Get memory usage trend
     */
    getMemoryTrend() {
        if (this.metrics.memoryUsage.length < 2) return 'stable';
        
        const recent = this.metrics.memoryUsage.slice(-5);
        const trend = recent[recent.length - 1].used - recent[0].used;
        
        if (trend > 1024 * 1024) return 'increasing'; // 1MB increase
        if (trend < -1024 * 1024) return 'decreasing';
        return 'stable';
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        if (!performance.timing) return null;
        
        const timing = performance.timing;
        return {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            pageLoad: timing.loadEventEnd - timing.navigationStart,
            domReady: timing.domComplete - timing.navigationStart
        };
    }
    
    /**
     * Check for performance issues
     */
    checkPerformanceIssues() {
        const metrics = this.getMetrics();
        const issues = [];
        
        if (metrics.avgContentUpdateTime > 100) {
            issues.push('Content updates are slow (>100ms average)');
        }
        
        if (metrics.avgMathRenderTime > 500) {
            issues.push('Math rendering is slow (>500ms average)');
        }
        
        if (metrics.memoryTrend === 'increasing') {
            issues.push('Memory usage is increasing');
        }
        
        return issues;
    }
    
    /**
     * Export metrics for analysis
     */
    exportMetrics() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.getMetrics(),
            issues: this.checkPerformanceIssues(),
            userAgent: navigator.userAgent
        };
    }
    
    /**
     * Cleanup monitoring
     */
    cleanup() {
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
        }
    }
}

// Create global instance if monitoring is enabled
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = new PerformanceMonitor();
}
