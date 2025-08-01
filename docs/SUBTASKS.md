| ID | Title | Score | # of Dependencies | Status |
|---|---|---|---|---|
| **T001: Project Setup & Core Infrastructure** | | | | |
| S001.1 | Initialize React Project | 10 | 0 | Done |
| S001.2 | Integrate Mermaid.js via npm | 15 | 0 | Done |
| S001.3 | Design Basic Application Layout (Input, Flowchart, Error Panel placeholders) | 15 | 0 | Done |
| S001.4 | Set up CSS for basic styling | 5 | 0 | Done |
| S001.5 | Implement client-side only architecture | 5 | 0 | Done |
| **T002: Input Text Area & Template Enforcement** | | | | |
| S002.1 | Create multi-line text input component | 10 | 0 | Done |
| S002.2 | Implement parsing logic for `FLOWCHART_NAME` and `ORIENTATION` | 15 | 0 | In Progress |
| S002.3 | Implement parsing logic for `STEP` definitions (ID, NAME, TYPE, SHAPE, DESCRIPTION) | 20 | 0 | In Progress |
| S002.4 | Implement parsing logic for `LINK` definitions (FROM, TO, LABEL) | 20 | 0 | In Progress |
| S002.5 | Implement validation for mandatory `FLOWCHART_NAME` and `ORIENTATION` | 10 | 0 | In Progress |
| S002.6 | Implement validation for mandatory fields within `STEP` definitions | 15 | 0 | In Progress |
| S002.7 | Implement validation for unique, valid `ID` format (no spaces/special chars, not case-sensitive) | 10 | 0 | In Progress |
| **T003: Flowchart Generation & Display** | | | | |
| S003.1 | Create "Generate" button component | 5 | 0 | Done |
| S003.2 | Wire "Generate" button to trigger parsing and rendering | 10 | S002.1, S002.2, S002.3, S002.4 | In Progress |
| S003.3 | Implement Mermaid.js rendering with parsed input | 20 | S001.2, S002.2, S002.3, S002.4 | In Progress |
| S003.4 | Create flowchart preview area | 10 | S001.3 | Done |
| S003.5 | Ensure `DESCRIPTION` content affects node size | 15 | S002.3, S003.3 | Done |
| S003.6 | Implement basic Mermaid.js interactive viewer (zoom, pan) | 20 | S003.3 | In Progress |
| **T004: Error Handling & Feedback System** | | | | |
| S004.1 | Create dedicated error panel component | 10 | S001.3 | Done |
| S004.2 | Implement granular error message generation for all validation rules | 20 | S002.5, S002.6, S002.7, S004.5, S004.6, S004.7 | In Progress |
| S004.3 | Display errors in the error panel upon "Generate" click | 15 | S003.2, S004.1, S004.2 | In Progress |
| S004.4 | Implement error reporting with specific line numbers | 15 | S004.2 | In Progress |
| S004.5 | Implement validation for `TYPE` and `SHAPE` allowed values (not case-sensitive) | 10 | S002.3 | In Progress |
| S004.6 | Implement validation for "isolated step definitions" (not linked from or to) | 10 | S002.3, S002.4 | In Progress |
| S004.7 | Note/confirm manual escaping expectation for `DESCRIPTION` special characters | 0 | S002.3 | Done |
| **T005: Interactive UI Features** | | | | |
| S005.1 | Implement logic to highlight `STEP` definition in text area on node click (by ID) | 25 | S002.3, S003.3 | In Progress |
| S005.2 | Implement error panel visibility: open by default, close/reopen tab, auto-open on new errors | 25 | S004.1, S004.3 | In Progress |
| S005.3 | Ensure error panel is fixed width (< 1/3 screen) | 10 | S005.2 | In Progress |
| **T006: Export Functionality** | | | | |
| S006.1 | Implement "Download PNG" button | 15 | S003.3 | Done |
| S006.2 | Implement "Download SVG" button | 15 | S003.3 | Done |
| S006.3 | Implement option for transparent background on image export (default white) | 10 | S006.1, S006.2 | Done |
| S006.4 | Implement "Download Text" (.txt) button for input area content | 10 | S002.1 | Done |
| **T007: Documentation & Default State** | | | | |
| S007.1 | Create comprehensive example template string | 15 | 0 | Done |
| S007.2 | Load input text area with the default example template on app load | 15 | S002.1, S007.1 | Done |
| **T008: Cross-Browser Compatibility Testing** | | | | |
| S008.1 | Test full application functionality across Chrome, Firefox, Edge, Safari | 40 | All previous S-tasks | In Progress |
| **T009: Performance Optimization** | | | | |
| S009.1 | Profile and optimize parsing/rendering for typical workflow sizes (100 nodes/200 links) | 30 | S002.2, S002.3, S002.4, S003.3 | To Do |
