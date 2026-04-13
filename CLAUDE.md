# CLAUDE.md — mnm-3e-expanded

This is a Foundry VTT **compendium module** (`mnm-3e-expanded`) for the **Mutants & Masterminds 3rd Edition** system. It provides library packs of Powers, Advantages, Extras, Flaws, Equipment, Vehicles, and Headquarters that players can drag onto their characters.

The module **requires** the `mutants-and-masterminds-3e` system by Zakarik: https://github.com/Zakarik/foundry-mm3

---

## Project Layout

```
mnm-3e-expanded/          ← Foundry module (deployed to Foundry)
  module.json             ← Manifest: version, packs list, system dependency
  mnm-3e-expanded.js      ← Module entry point (minimal)
  packs/                  ← Output .db files (LDJSON, one JSON object per line)
    powers.db
    advantages.db
    extras.db
    flaws.db
    equipment.db
    vehicles.db
    headquarters.db

scripts/                  ← Build pipeline
  build.js                ← Master builder: reads compendium.json → writes all .db files
  extras.json             ← Source data for extras (modificateur items, type:"extra")
  flaws.json              ← Source data for flaws (modificateur items, type:"defaut")
  advantages.json         ← Source data for advantages (talent items)
  equipment/              ← Equipment source data
  vehicles/               ← Vehicle source data
  headquarters/           ← Headquarters source data

compendium.json           ← Master data file combining all source data
editor/                   ← Local Express editor (port 3001) for extras/flaws
src/                      ← Additional source data/tooling
```

**Key rule:** The `.db` files are the build output — never edit them directly. The sources are `compendium.json` / the JSON files under `scripts/`.

---

## foundry-mm3 System Reference

This section documents the data models of the `mutants-and-masterminds-3e` system so we can produce compendium items that are fully compatible.

### Actor Types
| System Key   | English Name     |
|--------------|------------------|
| `personnage` | Character/Hero   |
| `vehicule`   | Vehicle          |
| `qg`         | Headquarters/NPC |

### Item Types
| System Key    | English Name | Used In Packs          |
|---------------|--------------|------------------------|
| `pouvoir`     | Power        | `powers.db`            |
| `modificateur`| Extra/Flaw   | `extras.db`, `flaws.db`|
| `talent`      | Advantage    | `advantages.db`        |
| `equipement`  | Equipment    | `equipment.db`         |

Vehicles and Headquarters are **Actor** documents, not Items.

---

## Item Data Schemas

### Power (`pouvoir`) — Most Complex

```json
{
  "_id": "<nedb-id>",
  "name": "Power Name",
  "type": "pouvoir",
  "img": "systems/mutants-and-masterminds-3e/assets/icons/pouvoir.svg",
  "system": {
    "type": "",
    "activate": true,
    "special": "standard",
    "action": "simple",
    "portee": "personal",
    "duree": "instantane",
    "notes": "<p>HTML description shown on sheet</p>",
    "description": "<p>Same or longer HTML description</p>",
    "effets": "<p>HTML effects detail</p>",
    "effetsprincipaux": "<p>Short summary of main effects</p>",
    "link": "",
    "descripteurs": {},
    "extras": {},
    "defauts": {},
    "effectsVarianteSelected": "",
    "listEffectsVariantes": {},
    "edit": false,
    "carac": 0,
    "check": "",
    "cout": {
      "rang": 1,
      "parrang": 1,
      "total": 1,
      "totalTheorique": 1,
      "modrang": 0,
      "modfixe": 0,
      "parrangtotal": "1"
    }
  },
  "effects": [],
  "folder": null,
  "sort": 0,
  "flags": {},
  "_stats": {
    "systemId": "mutants-and-masterminds-3e",
    "systemVersion": "1.39.13",
    "coreVersion": "12"
  }
}
```

**Power field reference:**

| Field | Values | Notes |
|-------|--------|-------|
| `special` | `"standard"`, `"alternative"`, `"dynamique"` | Power type |
| `action` | `"aucune"`, `"libre"`, `"simple"`, `"complet"` | Action cost (NOT "standard"/"free" — must use French keys) |
| `portee` | `"personal"`, `"contact"`, `"distance"`, `"perception"`, `"zone"` | Range |
| `duree` | `"instantane"`, `"concentration"`, `"soutenu"`, `"permanent"`, `"continu"` | Duration |
| `cout.rang` | integer | Rank of the power |
| `cout.parrang` | integer | Base cost per rank |
| `cout.modrang` | integer | Modifier to cost per rank from extras/flaws |
| `cout.modfixe` | integer | Flat cost modifier from extras/flaws |
| `cout.total` | integer | Final point cost (min 1) |
| `cout.parrangtotal` | string | Display string e.g. `"2"` or `"1/2"` |
| `extras` | `{}` | Cleared at build time (extras stored in extras.db separately) |
| `defauts` | `{}` | Cleared at build time (flaws stored in flaws.db separately) |

**CRITICAL: French key mapping for actions (wrong → right):**
- `"standard"` → `"simple"`
- `"free"` or `"free action"` → `"libre"`
- `"none"` → `"aucune"`
- `"full"` or `"full action"` → `"complet"`

**CRITICAL: French key mapping for range:**
- `"close"` → `"contact"`
- `"ranged"` → `"distance"`
- `"personal"` → `"personal"` (same)
- `"perception"` → `"perception"` (same)

### Modifier/Extra/Flaw (`modificateur`)

```json
{
  "_id": "<nedb-id>",
  "name": "Extra or Flaw Name",
  "type": "modificateur",
  "img": "systems/mutants-and-masterminds-3e/assets/icons/pouvoir.svg",
  "system": {
    "type": "extra",
    "description": "<p>HTML description</p>",
    "rang": 1,
    "edit": true,
    "cout": {
      "fixe": false,
      "rang": true,
      "value": 1
    }
  }
}
```

**Modifier cost fields:**

| Field | Type | Meaning |
|-------|------|---------|
| `cout.fixe` | boolean | `true` = flat cost, `false` = per-rank cost |
| `cout.rang` | boolean | `true` = scales with rank, `false` = fixed regardless of rank |
| `cout.value` | number | Positive for extras, negative for flaws |
| `system.type` | string | `"extra"` or `"defaut"` |

**Cost calculation rules (from the system source):**
- Per-rank extra: adds `value` to `modrang`
- Per-rank flaw: subtracts `value` from `modrang`
- Flat extra: adds `value` to `modfixe`
- Flat flaw: subtracts `value` from `modfixe` (except Removable/Easily Removable which use special logic)
- Net cost per rank < 0: treated as `1/(2 + abs(netCostPerRank))` ranks per point
- Net cost per rank = 0: treated as `1/2` ranks per point
- `Removable`: reduces final total by `floor(total/5) * 1`
- `Easily Removable`: reduces final total by `floor(total/5) * 2`
- Minimum final cost is always 1

### Advantage (`talent`)

```json
{
  "_id": "<nedb-id>",
  "name": "Advantage Name",
  "type": "talent",
  "img": "systems/mutants-and-masterminds-3e/assets/icons/talent.svg",
  "system": {
    "description": "<p>HTML description</p>",
    "equipement": false,
    "rang": 1,
    "edit": false,
    "listEffectsVariantes": {}
  }
}
```

### Equipment (`equipement`)

```json
{
  "_id": "<nedb-id>",
  "name": "Equipment Name",
  "type": "equipement",
  "img": "systems/mutants-and-masterminds-3e/assets/icons/equipement.svg",
  "system": {
    "description": "<p>HTML description</p>",
    "cout": 1
  }
}
```

---

## Power Cost Calculation (build.js implementation)

The `calculatePowerCost()` function in `scripts/build.js` mirrors the system's own cost logic:

```
netCostPerRank = parrang + sum(per-rank extras) - sum(per-rank flaws)

if netCostPerRank > 0:
  totalRankCost = netCostPerRank × rang
  parrangtotal  = netCostPerRank.toString()

else:
  ranksPerPoint = 2 - netCostPerRank   (e.g. net=-1 → 3 ranks/pt)
  totalRankCost = ceil(rang / ranksPerPoint)
  parrangtotal  = "1/{ranksPerPoint}"

Apply Removable / Easily Removable to totalRankCost
Add flat modifiers (modfixe)
Final total = max(1, result)
```

Note: `extras` and `defauts` are **cleared to `{}`** in the build output for powers — extras and flaws live in their own separate packs.

---

## Versioning

Every release requires a version bump in `mnm-3e-expanded/module.json` **before** pushing to GitHub. Foundry and The Forge detect updates by comparing versions.

- Patch (x.x.N): bug fixes / data corrections
- Minor (x.N.0): new features / new item types
- Major (N.0.0): breaking structural changes

Run `npm run bump-version` or manually edit `"version"` in `module.json`.

---

## Common Debugging Gotchas

1. **Wrong action key**: Using English `"standard"` instead of French `"simple"` means the system won't display the action cost correctly.
2. **Wrong range key**: `"close"` must be `"contact"`.
3. **Negative `cout.value` for flaws**: The system expects the magnitude as a positive number in `value`; the sign is implied by `type: "defaut"`. (Our build.js subtracts flaw values.)
4. **`_id` uniqueness**: Every item in a `.db` file must have a unique `_id`. Use short alphanumeric strings matching the NeDB format.
5. **`_stats` field**: Should match the actual system version installed. Currently `"systemVersion": "1.39.13"`, `"coreVersion": "12"`.
6. **Extras/Flaws embedded in powers**: The system supports embedding extras/flaws in the `extras`/`defauts` objects of a power, but we clear these in the build step because we maintain them as separate compendium items.
7. **Dynamic powers**: Require `cout.special = "dynamique"` and `link` field pointing to parent power `_id`.
