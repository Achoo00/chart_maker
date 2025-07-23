-----

# AI\_MEMORY.md

This document serves as a persistent knowledge base for the FlowGenius project. It captures summaries of completed work, key design decisions, rationales, and important learnings.

-----

## 1\. Summaries of Completed Tasks

### Project Initialization and PRD Development

  * **Initial PRD Draft:** Created the foundational Product Requirements Document for FlowGenius, outlining the core vision, goals, and high-level requirements.
  * **Detailed PRD Refinement:** Through iterative Q\&A, the PRD was significantly expanded and clarified, incorporating granular details on input template, parsing logic, UI/UX, error handling, technical implementation, and future scope. Key areas like ID uniqueness, shape/type values, link definition rules, and error panel behavior were precisely defined.
  * **Task and Subtask Breakdown:** The comprehensive PRD was successfully broken down into a structured `TASKS.md` and `SUBTASKS.md` file, providing an actionable roadmap for development with IDs, titles, scores, dependencies, and statuses.

-----

## 2\. Key Design Decisions and Rationale

### 2.1. Input Template & Validation (T002, T004)

  * **Decision:** Implement a **strict, predefined text input template** (`FLOWCHART_NAME`, `ORIENTATION`, `STEP`, `LINK` sections).
      * **Rationale:** To ensure unambiguous input, reduce parsing complexity, and provide a standardized method for defining processes. This directly addresses the goal of "Clarity" (Objective 2).
  * **Decision:** All `STEP` fields (`ID`, `NAME`, `TYPE`, `SHAPE`, `DESCRIPTION`) are **mandatory**. `FLOWCHART_NAME` and `ORIENTATION` are also **mandatory**.
      * **Rationale:** To prevent incomplete node definitions and ensure the core flowchart structure is always present, leading to predictable rendering.
  * **Decision:** `IDs`, `TYPE` values, and `SHAPE` values are **not case-sensitive**.
      * **Rationale:** To improve user convenience and reduce common input errors without sacrificing strictness in value content.
  * **Decision:** **Strict syntax validation** with **granular, line-specific error messages** in a dedicated panel.
      * **Rationale:** To guide users effectively in correcting their input, aligning with "Accuracy" (Objective 5). Providing exact line numbers minimizes debugging time for users.
  * **Decision:** `DESCRIPTION` field directly maps to node content and will influence box size. **Users are responsible for manually escaping special characters** (e.g., backticks, double quotes) within `DESCRIPTION` that Mermaid.js might misinterpret.
      * **Rationale:** Offloading complex character escaping to the user simplifies the initial parsing logic and keeps the client-side app lighter for V1.0. This is a known constraint the user needs to be aware of.

### 2.2. Link Definition Logic (T002, T004)

  * **Decision:** **Partial `LINK` definitions** (only `FROM` or only `TO`) are acceptable and will **not throw an error**.
      * **Rationale:** This allows for clear starting and ending points of a process sequence where a node might only lead out of or into a flow without a corresponding preceding/succeeding node within the defined links, providing flexibility for representing process boundaries.
  * **Decision:** **Completely isolated `STEP` definitions** (not linked `FROM` or `TO` anything) **will throw an error**.
      * **Rationale:** An isolated node likely indicates an incomplete or erroneous process definition. While an "orphan node" due to an undefined `TO` is acceptable (Mermaid handles it), a fully defined but unlinked node indicates a user intent for it to be part of the flow that hasn't been realized via links. This helps maintain logical consistency in the diagram.

### 2.3. User Interface (UI) & User Experience (UX) (T001, T003, T005)

  * **Decision:** **"Generate" button trigger** for flowchart rendering, no real-time updates.
      * **Rationale:** Simplifies development for V1.0, reduces immediate performance demands, and allows for full validation *before* attempting a render.
  * **Decision:** **Application layout** with input top, flowchart bottom, and error panel right.
      * **Rationale:** Provides a clear, intuitive flow for user interaction: input, visualize, debug.
  * **Decision:** **Error panel is open by default, fixed width, closable via tab, and auto-opens on new errors.**
      * **Rationale:** Ensures errors are immediately visible to guide the user, while still allowing them to manage screen real estate.
  * **Decision:** Clicking a node on the flowchart **highlights its `STEP` definition in the text input based on `ID`**.
      * **Rationale:** Directly links visual elements to their textual source, greatly enhancing editing and iteration efficiency ("As a Process Owner... click on a node... find and edit it").

### 2.4. Export & Data Saving (T006)

  * **Decision:** Export to **PNG/SVG** with an option for **transparent background (defaulting to white)**.
      * **Rationale:** Standard image formats for sharing, transparent background offers greater flexibility for embedding diagrams.
  * **Decision:** Users save input as a **`.txt` file**. Purely client-side, **no backend saving**.
      * **Rationale:** Prioritizes simplicity and rapid deployment for V1.0, aligning with "Client-Side Only" NFR.

### 2.5. Technical Implementation (T001, T008, T009)

  * **Decision:** **React frontend, purely client-side**, Mermaid.js via npm.
      * **Rationale:** Leveraging a popular framework for efficient UI development and focusing on a single-page application model for V1.0 simplicity.

-----

## 3\. Pointers to Relevant Code Sections or External Documentation (Placeholder)

  * `src/components/InputArea.js`: (Will contain the text input component and initial parsing trigger.)
  * `src/utils/parser.js`: (Will house the core logic for parsing the structured input and generating Mermaid syntax.)
  * `src/utils/validator.js`: (Will contain all validation rules and error message generation.)
  * `src/components/FlowchartDisplay.js`: (Will integrate Mermaid.js for rendering and handle node click events.)
  * `src/components/ErrorPanel.js`: (Will manage error display and panel visibility.)
  * [Mermaid.js Documentation](https://www.google.com/search?q=https://mermaid.js.org/docs/): Primary external reference for syntax, rendering options, and export functionalities.

-----

## 4\. Learnings from Previous Debugging Sessions or Failed Attempts (Placeholder)

  * **Initial thought:** Real-time rendering might be cool. **Learning:** Decided against it for V1.0 due to complexity of immediate validation feedback and potential performance issues with large diagrams. "Generate" button simplifies error handling flow.
  * **Initial thought:** Overly complex character escaping. **Learning:** Decided to rely on user manual escaping for special characters within `DESCRIPTION` for V1.0 to keep initial parsing simpler. This may be revisited in future versions.
  * **Initial thought:** What happens if a node isn't connected? **Learning:** Distinguished between "orphan nodes" due to *undefined* references (acceptable, Mermaid handles) vs. "isolated `STEP` definitions" (error, indicates user logic flaw). This distinction is critical for clear error reporting.

-----

## 5. Debugging Logs

### 5.1 React + Mermaid Rendering Issue (2025-07-21)

#### Problem Statement
- **Error:** Flowchart preview area did not render the diagram
- **Context:** React application with Mermaid v10+
- **Symptoms:**
  - No visible errors in console
  - `.mermaid` element present but SVG content empty (`<g></g>`)

#### Investigation
1. **Initial Verification**
   - Confirmed Mermaid initialization
   - Validated Mermaid definition syntax
   - Verified no console errors

2. **DOM Analysis**
   - Inspected `.mermaid` element post-render
   - Found empty SVG structure
   - Determined Mermaid attempted but failed to render

3. **Root Cause**
   - Using `mermaid.init` with React's dynamic rendering
   - Timing issues between React's virtual DOM and Mermaid's initialization

#### Solution
```javascript
// Updated rendering approach
useEffect(() => {
  if (typeof window === 'undefined' || !mermaidDef || errors.length > 0) return;
  
  const renderId = 'mermaid-' + Date.now();
  mermaid.render(renderId, mermaidDef)
    .then(({ svg }) => {
      if (previewRef.current) {
        previewRef.current.innerHTML = svg;
      }
    })
    .catch(err => {
      setMermaidError('Rendering error: ' + err.message);
    });
}, [mermaidDef, errors]);
```

#### Key Learnings
1. Use `mermaid.render()` instead of `mermaid.init` in React
2. Handle async rendering with Promises
3. Include proper cleanup and error handling

---

### 5.3 Mermaid Link Parsing Error (2025-07-22)

#### Problem Statement
- **Error:** `Parse error on line 12: ...ted)) start -->|| input_creds in ----------------------^ Expecting 'TAGEND', 'STR', 'MD_STR', 'UNICODE_TEXT', 'TEXT', 'TAGSTART', got 'PIPE'`
- **Context:** Mermaid flowchart generation with empty link labels
- **Impact:** Flowchart failed to render with empty link labels

#### Solution
```javascript
// Before (problematic)
`${from} -->|${label || ''}| ${to}`

// After (fixed)
if (label) {
  mermaidCode += `    ${from} -->|${label}| ${to}\n`;
} else {
  mermaidCode += `    ${from} --> ${to}\n`;
}
```

#### Key Learnings
1. Mermaid is sensitive to empty link labels in certain versions
2. Use conditional rendering for link syntax based on label presence
3. The `-->` syntax is preferred for unlabeled links over `-->||`

---

### 5.2 Mermaid.js SSR Compatibility (2025-07-22)

#### Problem Statement
- **Error:** `can't access property "createElementNS", document is undefined`
- **Context:** Server-side rendering (SSR) and test environments
- **Impact:** Failed rendering in Next.js, Jest tests

#### Solution
```jsx
// Component
function Flowchart({ definition }) {
  return <div className="mermaid">{definition}</div>;
}

// Effect hook
useEffect(() => {
  if (typeof window === 'undefined' || !mermaidDef) return;
  
  try {
    mermaid.init(undefined, '.mermaid');
  } catch (err) {
    console.error('Mermaid init failed:', err);
  }
}, [mermaidDef]);
```

#### Key Learnings
1. Mermaid requires browser environment
2. Use `mermaid.init` with class selector pattern
3. Always wrap in environment checks for SSR

---

### 5.3 Node Click Highlighting (S005.1, 2025-07-22)

#### Problem Statement
- **Issue:** Node clicks not highlighting corresponding text
- **Error:** `No SVG node found for step S1`
- **Environment:** Mermaid v11+

#### Investigation
- **Findings:**
  - Mermaid v11+ uses complex node ID patterns
  - Previous selector `[id$='-S1']` too simplistic
  - Actual ID format: `flowchart-<stepId>-<index>`

#### Solution
```javascript
// Updated selector pattern
const selector = `[id^="flowchart-"][id*="-${stepId}-"]`;
document.querySelectorAll(selector).forEach(node => {
  node.addEventListener('click', handleNodeClick);
});
```

#### Key Learnings
1. Mermaid v11+ node ID format: `flowchart-<stepId>-<index>`
2. Use combined attribute selectors for reliable matching
3. Handle multiple matching elements

---

### 5.4 PNG Export Functionality (2025-07-22)

#### Problem Statement
- **Error:** `URL.createObjectURL: Argument 1 could not be converted to any of: Blob, MediaSource`
- **Context:** PNG export functionality
- **Impact:** Failed to generate downloadable PNG

#### Technical Analysis
- **Root Cause:**
  - Missing SVG dimensions and viewBox
  - Improper Blob creation
  - Resource cleanup issues

#### Solution
```javascript
// 1. Prepare SVG
const svgClone = svgElem.cloneNode(true);
const bbox = svgElem.getBBox();
svgClone.setAttribute('width', bbox.width);
svgClone.setAttribute('height', bbox.height);
svgClone.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);

// 2. Convert to PNG
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = bbox.width;
canvas.height = bbox.height;

// 3. Cleanup
const cleanup = () => {
  URL.revokeObjectURL(url);
  document.body.removeChild(link);
};
```

#### Key Learnings
1. Always set explicit SVG dimensions
2. Properly manage browser resources
3. Implement comprehensive error handling
4. Clean up object URLs to prevent memory leaks

---

## 6. General Debugging Guidelines

### Common Patterns
1. **For Mermaid in React:**
   - Use class-based selectors with `mermaid.init`
   - Handle SSR with environment checks
   - Prefer functional components with hooks

2. **For SVG Manipulation:**
   - Always check for valid dimensions
   - Use `getBBox()` for accurate measurements
   - Clone nodes before modification

3. **For File Operations:**
   - Implement proper error boundaries
   - Clean up resources (URLs, event listeners)
   - Provide user feedback for all states

### Best Practices
1. **Error Handling**
   - Catch and log all async operations
   - Provide user-friendly error messages
   - Implement fallback behaviors

2. **Performance**
   - Debounce rapid state updates
   - Use refs for DOM operations
   - Clean up effects and subscriptions

3. **Testing**
   - Mock browser APIs in tests
   - Test edge cases (empty states, errors)
   - Verify accessibility