### Final Summarized Decisions for FlowGenius App:

**Section 1: Input Template & Parsing Logic**

* **Template Structure:**
    * All fields in `STEP` are required: `ID`, `NAME`, `TYPE`, `SHAPE`, `DESCRIPTION`.
    * `SHAPE` is explicitly defined and distinct from `TYPE`.
    * Allowed `TYPE` values: `START`, `END`, `PROCESS`, `DECISION`, `INPUT`, `OUTPUT`, `DATABASE`, `DOCUMENT`. These values are **not case-sensitive**.
    * Allowed `SHAPE` values: `Rectangle`, `RoundedRect`, `Diamond`, `Circle`, `Cylinder`, `Trapezoid`. These map directly to Mermaid shapes and are **not case-sensitive**.
    * `IDs`: Not case-sensitive. Must contain no spaces or special characters. Must be unique.
    * `Description`: Can contain special characters, line breaks, and commas. Will affect box size (this is naturally handled by Mermaid). **Users will be expected to manually escape any special characters that Mermaid.js might misinterpret as its own syntax (e.g., backticks, double quotes).**
    * `FLOWCHART_NAME` and `ORIENTATION` are **mandatory**. An error will be thrown if either is omitted.

* **Link Definition Logic:**
    * `FROM` and `TO` are NOT always mandatory.
    * A `LINK` can define a node with only a `FROM` (e.g., `LINK: FROM=NodeA, TO=`). This means `NodeA` is the last node in a sequence, with an arrow pointing out to nothing. This is acceptable.
    * A `LINK` can define a node with only a `TO` (e.g., `LINK: FROM=, TO=NodeB`). This means `NodeB` is the first node in a sequence, with an arrow pointing in from nothing. This is acceptable.
    * No label just means an unlabelled arrow.
    * Order does not matter for multiple links from one node.
    * A `STEP` definition that is present but not linked *from* or *to* any other nodes (i.e., a completely isolated `STEP` without any `LINK` references) will result in an **error**: "Node ID [NodeID] is defined but not linked to or from any other node."
    * A node linked to but not defined (e.g., `LINK: FROM=A, TO=UndefinedNode`) will result in an "orphan node" isolated in the diagram, which is acceptable (no error for this specific case).

* **Error Handling & User Feedback:**
    * Granular error messages as per the example.
    * Dedicated error panel on the right side of the screen. It will be **open by default** and **fixed width (less than a third of the screen)**. It can be closed and reopened via a **tab on the right side**, and will **automatically reopen** if new errors are detected after a "Generate" click.
    * Strict adherence to template rules; no forgiveness for syntax errors.
    * When reporting errors within a multi-line definition, the error message should specify the **exact line number where the error occurs**.

**Section 2: User Interface (UI) & User Experience (UX) Design Details**

* **Application Layout:**
    * Input text area on top.
    * Flowchart preview below.
    * Separate error panel on the right side.
* **Flowchart Generation Trigger:** User clicks a "Generate" button; no real-time rendering.
* **Editing & Iteration:**
    * All edits happen by modifying the text input.
    * Clicking a node on the flowchart will **highlight its corresponding `STEP` definition in the text input area based strictly on its `ID`**. If a multi-line `STEP` definition is highlighted, the entire multi-line definition will be highlighted.
* **Export Options:**
    * Download button for PNG/SVG.
    * Use default Mermaid.js options for now (no custom resolution/DPI controls initially), but include an option for **transparent backgrounds** (defaulting to white background).
* **Accessibility:** No specific accessibility requirements at this time.
* **Input Area Initial State:** The input area should contain a **comprehensive default example template** that demonstrates all `TYPE` and `SHAPE` options, and various `LINK` scenarios (including labels and partial links).

**Section 3: Technical Implementation Details**

* **Frontend Framework:** React.
* **Application Type:** Purely client-side for V1.0 (no backend).
* **Data Saving:** Users download their input as a .txt file for saving.
* **Mermaid.js Integration:** Via npm.

**Section 4: Future Enhancements / Scope Management**

* No specific future features prioritized at this time. Focus remains on V1.0.
* **Note for Future:** Keep a note to check Mermaid.js documentation regarding case sensitivity for `TYPE` and `SHAPE` values if issues arise.