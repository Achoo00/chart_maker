import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import './App.css'; // For basic layout styling

function App() {
  const [inputText, setInputText] = useState("");
  const [flowchartName, setFlowchartName] = useState("");
  const [orientation, setOrientation] = useState("");
  const [steps, setSteps] = useState([]);
  const [links, setLinks] = useState([]);
  const [errors, setErrors] = useState([]);
  const [mermaidError, setMermaidError] = useState("");
  const [mermaidDef, setMermaidDef] = useState("");
  const [errorPanelOpen, setErrorPanelOpen] = useState(true); // UI state for error panel
  const prevErrorsRef = useRef([]);
  const previewRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });
    console.log("Mermaid initialized!");
  }, []);

  // Auto-open error panel if new errors are detected after Generate
  useEffect(() => {
    if (errors.length > 0 && errors.join('\n') !== prevErrorsRef.current.join('\n')) {
      setErrorPanelOpen(true);
    }
    prevErrorsRef.current = errors;
  }, [errors]);

  const handleGenerate = () => {
    const newErrors = [];
    const lines = inputText.split(/\r?\n/);
    // Track line numbers for each section
    let flowchartNameLine = -1;
    let orientationLine = -1;
    const stepLineNumbers = [];
    const linkLineNumbers = [];

    // Find FLOWCHART_NAME and ORIENTATION lines
    lines.forEach((line, idx) => {
      if (/^\s*FLOWCHART_NAME\s*:/i.test(line) && flowchartNameLine === -1) flowchartNameLine = idx + 1;
      if (/^\s*ORIENTATION\s*:/i.test(line) && orientationLine === -1) orientationLine = idx + 1;
    });
    const nameMatch = inputText.match(/^\s*FLOWCHART_NAME\s*:\s*(.+)$/im);
    const orientationMatch = inputText.match(/^\s*ORIENTATION\s*:\s*(.+)$/im);
    setFlowchartName(nameMatch ? nameMatch[1].trim() : "");
    setOrientation(orientationMatch ? orientationMatch[1].trim() : "");

    if (!nameMatch) newErrors.push(`Line ${flowchartNameLine > 0 ? flowchartNameLine : 1}: FLOWCHART_NAME is required.`);
    if (!orientationMatch) newErrors.push(`Line ${orientationLine > 0 ? orientationLine : 1}: ORIENTATION is required.`);

    // Parse STEP definitions and track line numbers
    const stepLines = lines
      .map((line, idx) => ({ line, idx }))
      .filter(obj => /^\s*STEP\s*:/i.test(obj.line));
    const parsedSteps = stepLines.map(obj => {
      stepLineNumbers.push(obj.idx + 1);
      const parts = obj.line.replace(/^\s*STEP\s*:/i, '').split(',').map(s => s.trim());
      return {
        id: parts[0] || '',
        name: parts[1] || '',
        type: parts[2] || '',
        shape: parts[3] || '',
        description: parts.slice(4).join(', ') || '',
        line: obj.idx + 1
      };
    });
    setSteps(parsedSteps);

    // Allowed TYPE and SHAPE values
    const allowedTypes = [
      'start', 'end', 'process', 'decision', 'input', 'output', 'database', 'document'
    ];
    const allowedShapes = [
      'rectangle', 'roundedrect', 'diamond', 'circle', 'cylinder', 'trapezoid'
    ];

    // Validate mandatory fields and TYPE/SHAPE in STEP definitions
    parsedSteps.forEach((step, idx) => {
      const missing = [];
      if (!step.id) missing.push('ID');
      if (!step.name) missing.push('NAME');
      if (!step.type) missing.push('TYPE');
      if (!step.shape) missing.push('SHAPE');
      if (missing.length > 0) {
        newErrors.push(`Line ${step.line}: STEP ${step.id ? `ID '${step.id}'` : `#${idx+1}`}: Missing mandatory field(s): ${missing.join(', ')}`);
      }
      if (step.type && !allowedTypes.includes(step.type.toLowerCase())) {
        newErrors.push(`Line ${step.line}: STEP ID '${step.id}': Invalid TYPE '${step.type}'. Allowed: ${allowedTypes.join(', ').toUpperCase()}`);
      }
      if (step.shape && !allowedShapes.includes(step.shape.toLowerCase())) {
        newErrors.push(`Line ${step.line}: STEP ID '${step.id}': Invalid SHAPE '${step.shape}'. Allowed: ${allowedShapes.join(', ')}`);
      }
    });

    // Parse LINK definitions and track line numbers
    const linkLines = lines
      .map((line, idx) => ({ line, idx }))
      .filter(obj => /^\s*LINK\s*:/i.test(obj.line));
    const parsedLinks = linkLines.map(obj => {
      linkLineNumbers.push(obj.idx + 1);
      const parts = obj.line.replace(/^\s*LINK\s*:/i, '').split(',').map(s => s.trim());
      return {
        from: parts[0] || '',
        to: parts[1] || '',
        label: parts[2] || '',
        line: obj.idx + 1
      };
    });
    setLinks(parsedLinks);

    // S002.4: Validate mandatory fields in LINK definitions (but partial links are allowed, so skip this check)
    // S002.7: Validate STEP IDs for uniqueness and allowed format
    const idFormat = /^[a-zA-Z0-9_\-]+$/; // No spaces/special chars, allow letters, numbers, _ and -
    const seenIds = new Set();
    parsedSteps.forEach((step, idx) => {
      if (step.id) {
        const idLower = step.id.toLowerCase();
        if (seenIds.has(idLower)) {
          newErrors.push(`Line ${step.line}: STEP ID '${step.id}' is not unique (case-insensitive).`);
        } else {
          seenIds.add(idLower);
        }
        if (!idFormat.test(step.id)) {
          newErrors.push(`Line ${step.line}: STEP ID '${step.id}' contains invalid characters (no spaces or special chars).`);
        }
      }
    });

    // S004.6: Detect isolated steps (not linked from or to any other node)
    if (parsedSteps.length > 0 && parsedLinks.length > 0) {
      const allStepIds = parsedSteps.map(s => s.id.toLowerCase());
      const linkedFrom = new Set(parsedLinks.map(l => l.from.toLowerCase()).filter(Boolean));
      const linkedTo = new Set(parsedLinks.map(l => l.to.toLowerCase()).filter(Boolean));
      parsedSteps.forEach(step => {
        const id = step.id.toLowerCase();
        if (!linkedFrom.has(id) && !linkedTo.has(id)) {
          newErrors.push(`Line ${step.line}: Node ID '${step.id}' is defined but not linked to or from any other node.`);
        }
      });
    }

    setErrors(newErrors);

    // S003.3: Generate Mermaid definition and store in state
    let def = '';
    if (newErrors.length === 0) {
      const orient = orientation || 'LR';
      def = `flowchart ${orient}\n`;
      steps.forEach(step => {
        if (step.id && step.name) {
          let label = step.name;
          if (step.description) {
            label += `\\n${step.description}`;
          }
          let nodeSyntax = '';
          switch (step.shape.toLowerCase()) {
            case 'circle': nodeSyntax = `(${label})`; break;
            case 'rect': nodeSyntax = `[${label}]`; break;
            case 'stadium': nodeSyntax = `([${label}])`; break;
            case 'subroutine': nodeSyntax = `[[${label}]]`; break;
            case 'round': nodeSyntax = `(${label})`; break;
            case 'hexagon': nodeSyntax = `{{${label}}}`; break;
            case 'parallelogram': nodeSyntax = `[/ ${label} /]`; break;
            case 'rhombus': nodeSyntax = `{${label}}`; break;
            default: nodeSyntax = `[${label}]`;
          }
          def += `  ${step.id}${nodeSyntax}\n`;
        }
      });
      links.forEach(link => {
        if (link.from && link.to) {
          const lbl = link.label ? `|${link.label}|` : '';
          def += `  ${link.from} -->${lbl} ${link.to}\n`;
        }
      });
    }
    console.log('Generated Mermaid Definition:', def);
    setMermaidDef(def);
    setMermaidError("");
  };

  // Render Mermaid diagram when mermaidDef changes
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined' ||
      !mermaidDef ||
      errors.length > 0 ||
      !previewRef.current
    ) {
      return;
    }
    setMermaidError('');
    // Generate a unique id for each render
    const renderId = 'mermaid-' + Date.now();
    mermaid.render(renderId, mermaidDef)
      .then(({ svg }) => {
        previewRef.current.innerHTML = svg;
        console.log('Mermaid SVG rendered:', svg);
      })
      .catch(err => {
        setMermaidError('Mermaid rendering error: ' + err.message);
      });
    // eslint-disable-next-line
  }, [mermaidDef, errors]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>FlowGenius</h1>
      </header>

      <main className="app-main-content">
        <div className="input-area">
          <h2>1. Input Your Flowchart Definition</h2>
          <textarea
            placeholder="Paste your FlowGenius definition here..."
            rows="20"
            cols="80"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          ></textarea>
          <button onClick={handleGenerate}>Generate Flowchart</button>
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
            {mermaidError && (
              <div style={{ color: 'red' }}>{mermaidError}</div>
            )}
            {!mermaidError && mermaidDef && errors.length === 0 && (
              <div className="mermaid" ref={previewRef}></div>
            )}
          </div>
        </div>

        {/* Error Panel with open/close tab */}
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
                  <p key={idx}>{err}</p>
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