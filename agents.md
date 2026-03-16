# Project Agents & Automation

This document outlines the automated "agents" and scripts that manage this project's data pipeline.

---

## 1. The Build Agent (`scripts/build.js`)

This is the core agent responsible for compiling the raw data from the spreadsheet into a Foundry VTT-compatible compendium.

-   **Source:** Reads from `1st Powers Input.csv`.
-   **Output:** Generates the `packs/powers.db` database file.
-   **Function:**
    -   Translates English terms (e.g., "standard," "close") into the French system-required keys (e.g., "simple," "contact").
    -   Constructs the full HTML description for each item.
    -   Calculates the final point cost.

### How to Use:

To run the build agent, execute the following command in your terminal:

```bash
npm run build
```

---

## 2. The Extraction Agent (`scripts/extract.js`)

This agent is a specialized tool for pulling raw text data directly from the M&M 3e PDF source. Its purpose is to perform the initial "heavy-lifting" of data entry.

-   **Source:** Reads from `MnM_Powers_Only.pdf`.
-   **Output:** Appends new rows to the `1st Powers Input.csv` spreadsheet.
-   **Function:**
    -   Parses the PDF to extract a readable text layer.
    -   Identifies specific powers by name.
    -   Performs a "best-effort" extraction of the power's description, cost, and stats.

### How to Use:

To run the extraction agent, execute the following command:

```bash
node scripts/extract.js
```

**Note:** This agent is designed to be run by the project architect (Gemini). The output often requires manual cleanup and verification in the CSV file before running the final build.

---
