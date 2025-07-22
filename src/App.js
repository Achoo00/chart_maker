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
  const previewRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });
    console.log("Mermaid initialized!");
  }, []);

  const handleGenerate = () => {
    const newErrors = [];
    // Simple regex to extract FLOWCHART_NAME and ORIENTATION
    const nameMatch = inputText.match(/^\s*FLOWCHART_NAME\s*:\s*(.+)$/im);
    const orientationMatch = inputText.match(/^\s*ORIENTATION\s*:\s*(.+)$/im);
    setFlowchartName(nameMatch ? nameMatch[1].trim() : "");
    setOrientation(orientationMatch ? orientationMatch[1].trim() : "");

    if (!nameMatch) newErrors.push("FLOWCHART_NAME is required.");
    if (!orientationMatch) newErrors.push("ORIENTATION is required.");

    // Parse STEP definitions
    const stepLines = inputText.split(/\r?\n/).filter(line => /^\s*STEP\s*:/i.test(line));
    const parsedSteps = stepLines.map(line => {
      // Remove 'STEP:' and split by comma
      const parts = line.replace(/^\s*STEP\s*:/i, '').split(',').map(s => s.trim());
      return {
        id: parts[0] || '',
        name: parts[1] || '',
        type: parts[2] || '',
        shape: parts[3] || '',
        description: parts.slice(4).join(', ') || '' // In case description contains commas
      };
    });
    setSteps(parsedSteps);

    // Validate mandatory fields in STEP definitions
    parsedSteps.forEach((step, idx) => {
      if (!step.id || !step.name || !step.type || !step.shape) {
        newErrors.push(
          `STEP ${step.id ? `ID '${step.id}'` : `#${idx+1}`}: Missing mandatory field(s): ` +
          [!step.id ? 'ID' : null, !step.name ? 'NAME' : null, !step.type ? 'TYPE' : null, !step.shape ? 'SHAPE' : null]
            .filter(Boolean).join(', ')
        );
      }
    });

    // Parse LINK definitions
    const linkLines = inputText.split(/\r?\n/).filter(line => /^\s*LINK\s*:/i.test(line));
    const parsedLinks = linkLines.map(line => {
      const parts = line.replace(/^\s*LINK\s*:/i, '').split(',').map(s => s.trim());
      return {
        from: parts[0] || '',
        to: parts[1] || '',
        label: parts[2] || ''
      };
    });
    setLinks(parsedLinks);

    // S002.4: Validate mandatory fields in LINK definitions
    parsedLinks.forEach((link, idx) => {
      if (!link.from || !link.to) {
        newErrors.push(
          `LINK #${idx+1}: Missing mandatory field(s): ` +
          [!link.from ? 'FROM' : null, !link.to ? 'TO' : null]
            .filter(Boolean).join(', ')
        );
      }
    });

    // S002.7: Validate STEP IDs for uniqueness and allowed format
    const idFormat = /^[a-zA-Z0-9_\-]+$/; // No spaces/special chars, allow letters, numbers, _ and -
    const seenIds = new Set();
    parsedSteps.forEach((step, idx) => {
      if (step.id) {
        const idLower = step.id.toLowerCase();
        if (seenIds.has(idLower)) {
          newErrors.push(`STEP ID '${step.id}' is not unique (case-insensitive).`);
        } else {
          seenIds.add(idLower);
        }
        if (!idFormat.test(step.id)) {
          newErrors.push(`STEP ID '${step.id}' contains invalid characters (no spaces or special chars).`);
        }
      }
    });

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

        <div className="error-panel">
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
      </main>
    </div>
  );
}

export default App;