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

## 5. Debugging Log: React + Mermaid Rendering Issue (2024-06)

### Problem
- Flowchart preview area did not render the diagram, even though the Mermaid definition was correct and no errors appeared in the console.
- The `.mermaid` element was present, but the SVG was empty or missing.

### Step-by-Step Debugging Process

1. **Initial Checks**
   - Verified that Mermaid was initialized and the correct definition was being generated (multi-line, valid syntax).
   - Confirmed no errors in the browser console.

2. **DOM Inspection**
   - Inspected the `.mermaid` element after clicking "Generate Flowchart".
   - Found that the SVG was present but empty (`<g></g>`), indicating Mermaid attempted to render but failed.

3. **Console Logging**
   - Added `console.log` after `mermaid.init` to inspect the innerHTML of the preview div.
   - Confirmed that after `mermaid.init`, the SVG was still empty.

4. **Hypothesis**
   - Suspected a timing or API issue, especially with Mermaid v10+ and React's dynamic rendering.
   - Noted that `mermaid.init` is not recommended for dynamic rendering in React with newer Mermaid versions.

5. **Solution: Switch to `mermaid.render`**
   - Updated the rendering logic to use `mermaid.render(id, definition)`, which returns a Promise with the SVG string.
   - Injected the SVG string directly into the preview div's `innerHTML`.
   - Example:
     ```js
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
       const renderId = 'mermaid-' + Date.now();
       mermaid.render(renderId, mermaidDef)
         .then(({ svg }) => {
           previewRef.current.innerHTML = svg;
           console.log('Mermaid SVG rendered:', svg);
         })
         .catch(err => {
           setMermaidError('Mermaid rendering error: ' + err.message);
         });
     }, [mermaidDef, errors]);
     ```

6. **Result**
   - The flowchart rendered correctly in the preview area.
   - This approach is robust for React + Mermaid v10+ integration.

### Key Takeaway
- For React apps using Mermaid v10+, always use `mermaid.render` for dynamic diagram rendering. Avoid `mermaid.init` for dynamic or programmatic rendering in React.

-----

## Robust Mermaid.js Rendering in React: Solution Log

### Problem Encountered
- **Error:** `can't access property "createElementNS", document is undefined` (from d3-selection, used by Mermaid)
- **Context:** Occurred when trying to render Mermaid diagrams in a React app, especially during hot reload, tests, or in non-browser contexts.
- **Symptoms:** The error appeared in the browser console and prevented flowchart rendering.

### Debugging Steps & Failed Approaches
1. **Direct use of `mermaid.render` in event handler or useEffect:**
   - Attempted to call `mermaid.render` and inject SVG into a target div.
   - Added defensive checks for `window`, `document`, and ref presence.
   - **Result:** Error persisted, especially during React hot reload or test runs.
2. **Tried to use a ref and direct DOM manipulation:**
   - Still encountered timing/context issues with the DOM.

### Final Working Solution (Best Practice)
- **Render a `<div className="mermaid">{mermaidDef}</div>` in the React component.**
- **After each update, call `mermaid.init(undefined, '.mermaid')` in a `useEffect`.**
- **Do not use `mermaid.render` or direct DOM manipulation.**
- This approach lets Mermaid upgrade the div into a diagram, is robust to React's lifecycle, and avoids SSR/test/HMR issues.

#### Example Implementation
```jsx
// In the render/return:
<div className="mermaid">{mermaidDef}</div>

// In useEffect:
useEffect(() => {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !mermaidDef ||
    errors.length > 0
  ) {
    return;
  }
  setMermaidError('');
  try {
    mermaid.init(undefined, '.mermaid');
  } catch (err) {
    setMermaidError('Mermaid rendering error: ' + err.message);
  }
}, [mermaidDef, errors]);
```

### Why This Works
- Mermaid's `.init()` is designed to scan and upgrade `.mermaid` divs after the DOM is ready.
- This avoids all direct DOM manipulation and is compatible with React's rendering lifecycle.
- It is robust to hot reload, SSR, and test environments.

### Additional Notes
- For Jest tests, mock the `mermaid` module in `setupTests.js` to avoid ESM import errors.
- This pattern is recommended for any React + Mermaid integration.

---

## Analysis

- **No errors in the console** (other than a minor eslint warning, which is unrelated to rendering).
- **Mermaid is initialized** (so the library is loaded).
- **The “Flowchart Preview” area shows the raw Mermaid definition as text, not a rendered diagram.**
- The Mermaid definition you posted is:
  ```
  flowchart LR S1(Start\nBegin the process) S2[Do Task\nPerform the main task] S3{Decision\nIs it complete?} S4(End\nFinish) S1 -->|Next| S2 S2 -->|Check| S3 S3 -->|No| S2 S3 -->|Yes| S4 
  ```
  This is a single line, not the usual multi-line Mermaid format.

---

## Hypothesis

**Mermaid expects each node and edge to be on its own line.**  
If you pass the entire definition as a single line, Mermaid may not parse it correctly, resulting in no diagram being rendered.

---

## Debugging Step

### 1. **Check the Mermaid Definition Formatting**

Let’s log the actual `mermaidDef` string to the console before rendering, to see if it’s formatted as expected.

**Add this line before `setMermaidDef(def);` in your `handleGenerate` function:**
```js
console.log('Generated Mermaid Definition:', def);
```

Then:
- Enter your flowchart definition and click “Generate Flowchart.”
- Check the console for the output.  
- Is the Mermaid definition multi-line, with each node/edge on its own line?

---

### 2. **Expected Format Example**

A correct Mermaid definition should look like:
```
flowchart LR
  S1(Start\nBegin the process)
  S2[Do Task\nPerform the main task]
  S3{Decision\nIs it complete?}
  S4(End\nFinish)
  S1 -->|Next| S2
  S2 -->|Check| S3
  S3 -->|No| S2
  S3 -->|Yes| S4
```

---

## Next Steps

1. **Add the console.log as above.**
2. **Paste the output here** (or confirm if it matches the expected format).
3. If it’s a single line, I’ll help you fix the code to generate a multi-line Mermaid definition.

Let me know what you find!