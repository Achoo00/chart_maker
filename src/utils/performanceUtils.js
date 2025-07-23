/**
 * Performance measurement and optimization utilities
 * Helps identify and address performance bottlenecks
 */

/**
 * Measures the execution time of a function
 * @param {Function} fn - The function to measure
 * @param {string} name - Name for the measurement
 * @param {number} iterations - Number of iterations to run (default: 1)
 * @returns {Object} - Performance measurement results
 */
export const measureExecution = (fn, name = 'Function', iterations = 1) => {
  const start = performance.now();
  let result;
  
  for (let i = 0; i < iterations; i++) {
    result = fn();
  }
  
  const end = performance.now();
  const duration = end - start;
  
  console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms` + 
    (iterations > 1 ? ` (${(duration/iterations).toFixed(2)}ms avg over ${iterations} runs)` : ''));
  
  return {
    name,
    duration,
    averageDuration: duration / iterations,
    iterations,
    result
  };
};

/**
 * Creates a performance monitor for tracking multiple measurements
 */
export class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
  }
  
  /**
   * Start a new measurement
   * @param {string} name - Name of the measurement
   */
  start(name) {
    if (this.measurements.has(name)) {
      console.warn(`[Performance] Measurement '${name}' already exists, overwriting`);
    }
    this.measurements.set(name, {
      start: performance.now(),
      end: null,
      duration: null
    });
  }
  
  /**
   * End an existing measurement
   * @param {string} name - Name of the measurement to end
   * @returns {Object} - Measurement result
   */
  end(name) {
    if (!this.measurements.has(name)) {
      console.warn(`[Performance] No measurement found with name '${name}'`);
      return null;
    }
    
    const measurement = this.measurements.get(name);
    measurement.end = performance.now();
    measurement.duration = measurement.end - measurement.start;
    
    console.log(`[Performance] ${name} took ${measurement.duration.toFixed(2)}ms`);
    return measurement;
  }
  
  /**
   * Get all measurements
   * @returns {Array} - Array of measurement results
   */
  getMeasurements() {
    return Array.from(this.measurements.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }
  
  /**
   * Clear all measurements
   */
  clear() {
    this.measurements.clear();
  }
}

/**
 * Generates a large test workflow for performance testing
 * @param {number} nodeCount - Number of nodes to generate
 * @param {number} linkDensity - Link density (0-1)
 * @returns {string} - Generated workflow definition
 */
export const generateTestWorkflow = (nodeCount = 100, linkDensity = 0.3) => {
  const steps = [];
  const links = [];
  
  // Generate steps
  for (let i = 1; i <= nodeCount; i++) {
    const stepType = i === 1 ? 'START' : 
                   i === nodeCount ? 'END' : 'PROCESS';
    steps.push(`STEP: ${i}, ${stepType}, RECTANGLE, Step ${i} description`);
    
    // Create links based on density
    if (i < nodeCount) {
      // Always link to next node
      links.push(`LINK: ${i} -> ${i + 1}`);
      
      // Add some random links for density
      const possibleLinks = Math.floor((nodeCount - i - 1) * linkDensity);
      for (let j = 0; j < possibleLinks; j++) {
        const target = i + 2 + Math.floor(Math.random() * (nodeCount - i - 1));
        if (target <= nodeCount) {
          links.push(`LINK: ${i} -> ${target}`);
        }
      }
    }
  }
  
  return `${steps.join('\n')}\n\n${links.join('\n')}`;
};

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// Export for debugging in browser console
if (typeof window !== 'undefined') {
  window.perfMonitor = perfMonitor;
}
