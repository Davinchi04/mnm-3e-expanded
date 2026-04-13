# Project Agents & Automation

This document describes the scripts, agents, and data pipeline for the `mnm-3e-expanded` Foundry VTT module.

For the full system data-model reference (field names, French keys, cost formulas), see [`CLAUDE.md`](../CLAUDE.md) in the project root.

---

## Data Flow Overview

```
Source JSON files (scripts/*.json, scripts/equipment/, etc.)
         ↓
   compendium.json   ←  master combined source
         ↓
   scripts/build.js  ←  cost calculation + key translation
         ↓
  mnm-3e-expanded/packs/*.db   ←  Foundry compendium output (LDJSON)
```

Never edit `.db` files directly. Always work from the source JSON files and rebuild.

---

## 1. Build Agent (`scripts/build.js`)

The core agent that compiles all source data into Foundry-ready compendium packs.

**Input:** `compendium.json`  
**Output:** `mnm-3e-expanded/packs/*.db` (one `.db` per compendium pack)

**What it does:**
- Reads the master `compendium.json` which contains arrays keyed by pack name (`powers`, `advantages`, `extras`, `flaws`, `equipment`, etc.)
- For powers: clears `extras`/`defauts` to `{}` (those live in separate packs), then runs `calculatePowerCost()` to recompute all cost fields
- Writes each pack as LDJSON (one JSON object per line) into the `packs/` directory

**Cost calculation (`calculatePowerCost`):**
- Sums per-rank and flat modifiers from embedded extras/flaws (before clearing them)
- Applies Removable / Easily Removable flaw special-case math
- Enforces minimum total cost of 1
- Sets `cout.parrangtotal` as display string (e.g. `"2"` or `"1/3"`)

**To run:**
```bash
npm run build
```

---

## 2. Extraction Agent (`scripts/extract_pdf.js`)

Pulls raw power text from the M&M 3e PDF to bootstrap data entry.

**Input:** `MnM_Powers_Only.pdf`  
**Output:** Appends rows to `1st Powers Input.csv`

**What it does:**
- Parses the PDF text layer
- Best-effort extraction of power name, description, cost, and stats
- Output requires manual cleanup before incorporating into `compendium.json`

**To run:**
```bash
node scripts/extract_pdf.js
```

This agent is primarily for initial data entry. Output quality varies — always review before adding to the compendium.

---

## 3. Append Powers Agent (`scripts/append_powers.js`)

Merges new power entries from a staging CSV into `compendium.json`.

**To run:**
```bash
node scripts/append_powers.js
```

---

## 4. Reconcile Agent (`scripts/reconcile-csv.js`)

Validates consistency between CSV source data and `compendium.json`.

---

## 5. Version Bump Agent (`scripts/bump-version.js`)

Increments the version in `mnm-3e-expanded/module.json`.

**To run:**
```bash
npm run bump-version
```

**Release versioning rules (CRITICAL — must run before every push):**
- **Patch** (x.x.N): Minor data corrections or bug fixes
- **Minor** (x.N.0): New features or new item types added
- **Major** (N.0.0): Breaking structural changes

Foundry VTT and The Forge detect module updates by comparing the `version` field. If the version is not bumped, users will not receive the update.

---

## 6. Web Editor (`editor/` + `scripts/editor.js`)

A local Express server for editing extras and flaws through a browser UI.

**To start:**
```bash
npm run dev
```

Runs on **port 3001**. Reads from and writes to `scripts/extras.json` and `scripts/flaws.json`. Designed to be extended to other pack types.

---

## 7. Export / Import Agents (`scripts/export-data.js`, `scripts/import-data.js`)

Utilities for round-tripping data between `compendium.json` and other formats.

---

## Compendium Pack Reference

| Pack File          | Foundry Label           | Item Type     | Source                         |
|--------------------|-------------------------|---------------|--------------------------------|
| `powers.db`        | Powers - M&M 3e Exp     | `pouvoir`     | `compendium.json` → powers     |
| `advantages.db`    | Advantages - M&M 3e Exp | `talent`      | `scripts/advantages.json`      |
| `extras.db`        | Extras - M&M 3e Exp     | `modificateur`| `scripts/extras.json`          |
| `flaws.db`         | Flaws - M&M 3e Exp      | `modificateur`| `scripts/flaws.json`           |
| `equipment.db`     | Equipment - M&M 3e Exp  | `equipement`  | `scripts/equipment/`           |
| `vehicles.db`      | Vehicles - M&M 3e Exp   | Actor: `vehicule` | `scripts/vehicles/`        |
| `headquarters.db`  | Headquarters - M&M 3e Exp | Actor: `qg` | `scripts/headquarters/`       |

---

## Key Field Mappings (English → System French Keys)

These translations are applied in `build.js` and must be used in source JSON:

| Concept     | English Term   | System Key (`foundry-mm3`) |
|-------------|----------------|-----------------------------|
| Action cost | Standard       | `simple`                    |
| Action cost | Free           | `libre`                     |
| Action cost | None           | `aucune`                    |
| Action cost | Full           | `complet`                   |
| Range       | Close          | `contact`                   |
| Range       | Ranged         | `distance`                  |
| Range       | Personal       | `personal`                  |
| Range       | Perception     | `perception`                |
| Duration    | Instant        | `instantane`                |
| Duration    | Concentration  | `concentration`             |
| Duration    | Sustained      | `soutenu`                   |
| Duration    | Continuous     | `continu`                   |
| Duration    | Permanent      | `permanent`                 |
| Power type  | Standard       | `standard`                  |
| Power type  | Alternate      | `alternative`               |
| Power type  | Dynamic        | `dynamique`                 |

---

## Design Decisions & Known Constraints

- **Extras/Flaws are separate packs**: The system supports embedding extras/flaws directly inside a power's `extras`/`defauts` fields. We clear those at build time and maintain them as independent `modificateur` items in their own packs. Users apply them to powers manually.
- **Cost calculation is done at build time**: `build.js` runs the same algorithm the system uses at runtime, so powers in the compendium already show the correct cost for their base configuration.
- **`_id` values are NeDB-style short strings**: They must be unique within a `.db` file. Do not reuse IDs across packs.
- **`_stats` pinned to system version**: Currently `systemVersion: "1.39.13"`, `coreVersion: "12"`. These may need updating if the upstream system makes breaking schema changes.
- **All text fields expect HTML**: `description`, `notes`, `effets`, `effetsprincipaux` are HTML strings. Wrap plain text in `<p>` tags.
