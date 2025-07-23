import React, { useEffect, useState, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { getTemplate } from './templates/exampleTemplate';
import { detectBrowser, isBrowserSupported, applyBrowserFixes } from './utils/browserUtils';
import { perfMonitor } from './utils/performanceUtils';
import './App.css'; // For basic layout styling

function App() {
  const [inputText, setInputText] = useState("");
  const [isExampleLoaded, setIsExampleLoaded] = useState(false);
  const [flowchartName, setFlowchartName] = useState("");
  const [orientation, setOrientation] = useState("");
  const [steps, setSteps] = useState([]);
  const [links, setLinks] = useState([]);
  const [errors, setErrors] = useState([]);
  const [mermaidError, setMermaidError] = useState("");
  const [mermaidDef, setMermaidDef] = useState("");
  const [errorPanelOpen, setErrorPanelOpen] = useState(true);
  const prevErrorsRef = useRef([]);
  const previewRef = useRef(null);
  const [highlightedStepId, setHighlightedStepId] = useState(null);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const textareaRef = useRef(null);
  const processingTimeout = useRef(null);
  const prevInputTextRef = useRef('');
  const [isProcessing, setIsProcessing] = useState(false);

  const parseFlowchartDefinition = useCallback((text) => {
    if (!text) {
      return { steps: [], links: [], errors: [], flowchartName: '' };
    }

    const lines = text.split(/\r?\n/);
    const steps = [];
    const links = [];
    const errors = [];
    let flowchartName = '';
    let tempOrientation = '';

    const stepIds = new Set();

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      line = line.trim();
      if (!line || line.startsWith('%%')) return;

      if (line.toUpperCase().startsWith('FLOWCHART_NAME:')) {
        flowchartName = line.substring('FLOWCHART_NAME:'.length).trim();
      } else if (line.toUpperCase().startsWith('ORIENTATION:')) {
        tempOrientation = line.substring('ORIENTATION:'.length).trim().toLowerCase();
        if (tempOrientation !== 'vertical' && tempOrientation !== 'horizontal') {
          errors.push(`Line ${lineNumber}: Invalid ORIENTATION. Must be 'vertical' or 'horizontal'.`);
        }
      } else if (line.toUpperCase().startsWith('STEP:')) {
        const parts = line.substring('STEP:'.length).split(',').map(p => p.trim());
        if (parts.length < 3) {
          errors.push(`Line ${lineNumber}: Invalid STEP definition. Expected format: STEP: id, type, name, [shape], [description]`);
          return;
        }
        const [id, type, name, shape = 'roundedrect', ...descriptionParts] = parts;
        const description = descriptionParts.join(',').trim();

        if (stepIds.has(id.toLowerCase())) {
          errors.push(`Line ${lineNumber}: Duplicate STEP ID '${id}'. IDs must be unique.`);
        } else {
          stepIds.add(id.toLowerCase());
          steps.push({ id, type, name, shape, description });
        }
      } else if (line.toUpperCase().startsWith('LINK:')) {
        const parts = line.substring('LINK:'.length).split(',').map(p => p.trim());
        if (parts.length < 2) {
          errors.push(`Line ${lineNumber}: Invalid LINK definition. Expected format: LINK: from, to, [label]`);
          return;
        }
        const [from, to, ...labelParts] = parts;
        const label = labelParts.join(',').trim();
        links.push({ from, to, label });
      }
    });

    links.forEach((link, index) => {
        if (!stepIds.has(link.from.toLowerCase())) {
            errors.push(`LINK ${index + 1}: 'from' step with ID '${link.from}' not found.`);
        }
        if (!stepIds.has(link.to.toLowerCase())) {
            errors.push(`LINK ${index + 1}: 'to' step with ID '${link.to}' not found.`);
        }
    });

    setOrientation(tempOrientation || 'vertical');

    return { steps, links, errors, flowchartName };
  }, []);

  const generateMermaidDefinition = useCallback((steps, links, name) => {
    if (!steps || steps.length === 0) return '';
    const direction = orientation === 'horizontal' ? 'LR' : 'TB';
    let mermaidCode = `flowchart ${direction}\n`;
    if (name) {
      mermaidCode += `    %% ${name}\n`;
    }
    steps.forEach(step => {
      const { id, shape, name, description } = step;
      let shapeSyntax = '';
      switch (shape.toLowerCase()) {
        case 'roundedrect': shapeSyntax = `[${name}${description ? `\\n${description}` : ''}]`; break;
        case 'diamond': shapeSyntax = `{${name}${description ? `\\n${description}` : ''}}`; break;
        case 'circle': shapeSyntax = `((${name}${description ? `\\n${description}` : ''}))`; break;
        case 'cylinder': shapeSyntax = `[(${name}${description ? `\\n${description}` : ''})]`; break;
        case 'trapezoid': shapeSyntax = `[/${name}${description ? `\\n${description}` : ''}/]`; break;
        default: shapeSyntax = `[${name}${description ? `\\n${description}` : ''}]`;
      }
      mermaidCode += `    ${id}${shapeSyntax}\n`;
    });
    links.forEach(link => {
      const { from, to, label } = link;
      if (from && to) {
        if (label) {
        mermaidCode += `    ${from} -->|${label}| ${to}\n`;
      } else {
        mermaidCode += `    ${from} --> ${to}\n`;
      }
      }
    });
    return mermaidCode;
  }, [orientation]);

  const forceProcessInputText = useCallback((text) => {
    setIsProcessing(true);
    try {
      const { steps, links, errors, flowchartName } = parseFlowchartDefinition(text);
      setSteps(steps);
      setLinks(links);
      setErrors(errors);
      setFlowchartName(flowchartName);
      if (steps.length > 0) {
        const def = generateMermaidDefinition(steps, links, flowchartName);
        setMermaidDef(def);
      } else {
        setMermaidDef('');
      }
    } catch (err) {
      console.error('Error processing input text:', err);
      setErrors(prev => [...prev, { message: `Error processing input: ${err.message}`, type: 'error' }]);
    } finally {
      setIsProcessing(false);
    }
  }, [parseFlowchartDefinition, generateMermaidDefinition]);

  const processInputText = useCallback((text) => {
    if (!text || text === prevInputTextRef.current) return;
    prevInputTextRef.current = text;
    if (processingTimeout.current) clearTimeout(processingTimeout.current);
    processingTimeout.current = setTimeout(() => {
      setIsProcessing(true);
      perfMonitor.start('parseInput');
      requestIdleCallback(() => {
        try {
          const { steps, links, errors, flowchartName } = parseFlowchartDefinition(text);
          setSteps(steps);
          setLinks(links);
          setErrors(errors);
          setFlowchartName(flowchartName);
          if (steps.length > 0) {
            const def = generateMermaidDefinition(steps, links, flowchartName);
            setMermaidDef(def);
          } else {
            setMermaidDef('');
          }
        } catch (err) {
          console.error('Error processing input text:', err);
          setErrors(prev => [...prev, { message: `Error processing input: ${err.message}`, type: 'error' }]);
        } finally {
          setIsProcessing(false);
          perfMonitor.end('parseInput');
          console.log('Performance metrics:', perfMonitor.getMetrics());
        }
      }, { timeout: 1000 });
    }, 300);
  }, [parseFlowchartDefinition, generateMermaidDefinition]);

  useEffect(() => {
    applyBrowserFixes();
    if (!isBrowserSupported()) {
      const { name, version } = detectBrowser();
      console.warn(`Browser ${name} ${version} may not be fully supported.`);
    }
    mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'loose', flowchart: { htmlLabels: true, useMaxWidth: false, curve: 'basis', nodeSpacing: 50, rankSpacing: 50 } });
    console.log(`Mermaid initialized in ${detectBrowser().name} ${detectBrowser().version}`);
    if (!isExampleLoaded) {
      const exampleTemplate = getTemplate('default');
      setInputText(exampleTemplate);
      processInputText(exampleTemplate);
      setIsExampleLoaded(true);
      console.log('Performance Info:', { hardwareConcurrency: navigator.hardwareConcurrency || 'unknown', deviceMemory: navigator.deviceMemory || 'unknown', connection: navigator.connection ? { effectiveType: navigator.connection.effectiveType, saveData: navigator.connection.saveData, downlink: navigator.connection.downlink } : 'unsupported' });
    }
    return () => { if (processingTimeout.current) clearTimeout(processingTimeout.current); };
  }, [isExampleLoaded, processInputText]);

  useEffect(() => {
    if (errors.length > 0 && errors.join('\n') !== prevErrorsRef.current.join('\n')) {
      setErrorPanelOpen(true);
    }
    prevErrorsRef.current = errors;
  }, [errors]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mermaidDef || errors.length > 0 || !previewRef.current) return;
    setMermaidError('');
    const renderId = 'mermaid-' + Date.now();
    mermaid.render(renderId, mermaidDef)
      .then(({ svg }) => {
        previewRef.current.innerHTML = svg;
        steps.forEach(step => {
          if (!step.id) return;
          const nodeList = previewRef.current.querySelectorAll(`[id^="flowchart-"][id*="-${step.id}-"]`);
          nodeList.forEach(node => {
            node.style.cursor = 'pointer';
            node.addEventListener('click', () => setHighlightedStepId(step.id));
          });
        });
      })
      .catch(err => setMermaidError('Mermaid rendering error: ' + err.message));
  }, [mermaidDef, errors, steps]);

  useEffect(() => {
    if (!highlightedStepId || !textareaRef.current) return;
    const lines = inputText.split(/\r?\n/);
    let startIdx = 0, endIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (new RegExp(`^\\s*STEP\\s*:\\s*${highlightedStepId}`, 'i').test(lines[i])) {
        startIdx = inputText.split(/\r?\n/).slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
        endIdx = startIdx + lines[i].length;
        break;
      }
    }
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(startIdx, endIdx);
  }, [highlightedStepId, inputText]);

  const handleDownloadPNG = useCallback(() => {
    try {
      const svgElement = previewRef.current.querySelector('svg');
      if (!svgElement) throw new Error('No flowchart to export');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const svgRect = svgElement.getBoundingClientRect();
      canvas.width = svgRect.width;
      canvas.height = svgRect.height;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        if (!transparentBackground) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${flowchartName || 'flowchart'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error('Error exporting as PNG:', err);
      setErrors(prev => [...prev, { message: `Failed to export as PNG: ${err.message}`, type: 'error' }]);
    }
  }, [flowchartName, transparentBackground]);

  const handleDownloadSVG = useCallback(() => {
    try {
      const svgElement = previewRef.current.querySelector('svg');
      if (!svgElement) throw new Error('No flowchart to export');
      const svgClone = svgElement.cloneNode(true);
      if (!transparentBackground) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'white');
        svgClone.insertBefore(rect, svgClone.firstChild);
      }
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${flowchartName ? flowchartName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'flowchart'}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting as SVG:', err);
      setErrors(prev => [...prev, { message: `Failed to export as SVG: ${err.message}`, type: 'error' }]);
    }
  }, [flowchartName, transparentBackground]);

  const handleDownloadText = useCallback(() => {
    try {
      if (!inputText) throw new Error('No text to download!');
      const blob = new Blob([inputText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${flowchartName || 'flowchart'}.txt`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error in handleDownloadText:', error);
      alert('Error: ' + (error.message || 'Failed to download text'));
    }
  }, [inputText, flowchartName]);

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputText(newValue);
    processInputText(newValue);
  }, [processInputText]);

  const handleGenerate = () => {
    forceProcessInputText(inputText);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Flowwwwwy</h1>
      </header>

      <main className="app-main-content">
        <div className="input-area">
          <h2>1. Input Your Flowchart Definition</h2>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              onClick={() => {
                setInputText(getTemplate('default'));
                setErrors([]);
                setMermaidError('');
              }}
              style={{ 
                padding: '5px 10px', 
                backgroundColor: '#f0f0f0', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Load Example
            </button>
            <span style={{ fontSize: '0.9em', color: '#666' }}>
              {isExampleLoaded ? 'Example loaded' : 'Loading example...'}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            placeholder="Paste your flowchart definition here..."
            rows="20"
            value={inputText}
            onChange={handleInputChange}
            style={{ width: '100%', fontFamily: 'monospace', ...(highlightedStepId ? { background: '#fffbe6' } : {}) }}
          ></textarea>
          <button onClick={handleGenerate} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Generate Flowchart'}
          </button>
          {/* Debug output for parsed values */}
          <div style={{marginTop: '1em', fontSize: '0.95em', color: '#333'}}>
            <div><strong>FLOWCHART_NAME:</strong> {flowchartName || <em>(not found)</em>}</div>
            <div><strong>ORIENTATION:</strong> {orientation || <em>(not found)</em>}</div>
            <div style={{marginTop: '1em'}}>
              <strong>Parsed STEPS:</strong>
              {steps.length === 0 ? (
                <div><em>(none found)</em></div>
              ) : (
                <ul>
                  {steps.map((step, idx) => (
                    <li key={idx}>
                      <code>{JSON.stringify(step)}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{marginTop: '1em'}}>
              <strong>Parsed LINKS:</strong>
              {links.length === 0 ? (
                <div><em>(none found)</em></div>
              ) : (
                <ul>
                  {links.map((link, idx) => (
                    <li key={idx}>
                      <code>{JSON.stringify(link)}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="flowchart-preview-area">
          <h2>2. Flowchart Preview</h2>
          <div id="flowchart-render-target">
            {mermaidError && <div style={{ color: 'red' }}>{mermaidError}</div>}
            <div className="mermaid" ref={previewRef} />
          </div>
          <div className="download-buttons" style={{ marginTop: '1em', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDownloadPNG} disabled={!mermaidDef || errors.length > 0}>Download PNG</button>
              <button onClick={handleDownloadSVG} disabled={!mermaidDef || errors.length > 0}>Download SVG</button>
              <button onClick={handleDownloadText} disabled={!inputText}>Download Text</button>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                checked={transparentBackground}
                onChange={(e) => setTransparentBackground(e.target.checked)}
              />
              Transparent Background (for PNG/SVG)
            </label>
          </div>
        </div>

        {errorPanelOpen ? (
          <div className="error-panel">
            <div style={{ position: 'absolute', top: 0, right: 0, cursor: 'pointer', background: '#ffebeb', border: 'none', borderRadius: '0 5px 0 0', padding: '2px 8px', zIndex: 2 }}
              onClick={() => setErrorPanelOpen(false)}
              title="Close error panel"
            >
              &gt;
            </div>
            <h2>Errors & Warnings</h2>
            <div className="error-list">
              {errors.length === 0 ? (
                <p>No errors yet. Happy flowcharting!</p>
              ) : (
                errors.map((err, idx) => (
                  <p key={idx}>{err.message || err}</p>
                ))
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              width: '20px',
              minWidth: '20px',
              height: '100%',
              background: '#ffebeb',
              border: '1px solid #ff0000',
              borderRadius: '5px 0 0 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2
            }}
            onClick={() => setErrorPanelOpen(true)}
            title="Open error panel"
          >
            <span style={{ color: '#ff0000', fontWeight: 'bold' }}>&lt;</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;