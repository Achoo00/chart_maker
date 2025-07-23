/**
 * Browser detection and compatibility utilities
 * Helps handle browser-specific quirks and features
 */

export const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let version = '';

  // Detect Chrome
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '';
  } 
  // Detect Edge
  else if (userAgent.indexOf('Edg') > -1) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    version = match ? match[1] : '';
  }
  // Detect Firefox
  else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : '';
  }
  // Detect Safari
  else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : '';
  }

  return { name: browserName, version };
};

export const isBrowserSupported = () => {
  const { name, version } = detectBrowser();
  const versionNum = parseInt(version, 10);
  
  // Minimum supported versions
  const minVersions = {
    'Chrome': 50,
    'Firefox': 50,
    'Edge': 80,
    'Safari': 13
  };

  if (minVersions[name] && versionNum >= minVersions[name]) {
    return true;
  }
  
  // For browsers not in our list, be permissive but log a warning
  if (name !== 'Unknown') {
    console.warn(`Browser ${name} ${version} is not officially supported.`);
    return true;
  }
  
  return false;
};

// Apply browser-specific fixes
export const applyBrowserFixes = () => {
  const { name } = detectBrowser();
  
  // Firefox specific fixes
  if (name === 'Firefox') {
    // Ensure SVG foreignObject is properly supported
    if (!document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')) {
      console.warn('SVG foreignObject not supported, some features may be limited');
    }
  }
  
  // Safari specific fixes
  if (name === 'Safari') {
    // Add any Safari-specific fixes here
  }
};

// Polyfill for requestIdleCallback
window.requestIdleCallback = window.requestIdleCallback || 
  function(cb) {
    const start = Date.now();
    return setTimeout(function() {
      cb({ 
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  };

// Polyfill for cancelIdleCallback
window.cancelIdleCallback = window.cancelIdleCallback || 
  function(id) {
    clearTimeout(id);
  };
