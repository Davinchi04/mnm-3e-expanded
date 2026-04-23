const fs = require('fs-extra');
const path = require('path');
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');

const ROOT_DIR = path.join(__dirname, '..');
const COMPENDIUM_PATH = path.join(ROOT_DIR, 'compendium.json');

function generateId(name, pack) {
  return crypto.createHash('md5').update(`${pack}-${name.toLowerCase()}`).digest('hex').slice(0, 11);
}

const CSV_CONFIG = [
  { 
    file: 'Advantages.csv', 
    pack: 'advantages',
    mapping: (row) => ({
      name: row.Name,
      type: 'talent',
      system: {
        type: row.Type,
        rang: parseInt(row.Ranks) || 1,
        notes: `<p>${row.Description}</p>`,
        description: `<p>${row.Description}</p>`
      },
      mods: row.ModKey ? [{ key: row.ModKey, value: parseInt(row.ModValue) }] : []
    })
  },
  {
    file: '1st Powers Input.csv',
    pack: 'powers',
    mapping: (row) => ({
      name: row.Name,
      type: 'pouvoir',
      system: {
        type: (row.Type || '').toLowerCase(),
        action: (row.Action || '').toLowerCase() === 'standard' ? 'simple' : (row.Action || '').toLowerCase(),
        portee: (row.Range || '').toLowerCase() === 'ranged' ? 'distance' : (row.Range || '').toLowerCase(),
        duree: (row.Duration || '').toLowerCase() === 'instant' ? 'instantane' : (row.Duration || '').toLowerCase(),
        effets: `<p>${row.Mechanics || ''}</p>`,
        effetsprincipaux: `<p>${row.Mechanics || ''}</p>`,
        description: `<p>${row.Description || ''}</p>`,
        notes: `<p>${row.Description || ''}</p>`,
        cout: {
          rang: parseInt(row.Rank) || 1,
          parrang: parseInt(row.Cost) || 1
        }
      }
    })
  },
  {
    file: 'src/equipment/armor/armor.csv',
    pack: 'equipment',
    mapping: (row) => ({
      name: row.Name,
      type: 'equipement',
      system: {
        cout: parseInt(row.Cost) || 1,
        protection: parseInt(row.Protection) || 0,
        description: `<p>${row.Notes}</p>`
      }
    })
  },
  {
    file: 'src/equipment/melee/melee.csv',
    pack: 'equipment',
    mapping: (row) => ({
      name: row.Name,
      type: 'equipement',
      system: {
        cout: parseInt(row.Cost) || 1,
        description: `<p>${row.Notes}</p>`
      },
      mods: row.ModKey ? [{ key: row.ModKey, value: parseInt(row.ModValue) }] : []
    })
  },
  {
    file: 'src/equipment/ranged/ranged.csv',
    pack: 'equipment',
    mapping: (row) => ({
      name: row.Name,
      type: 'equipement',
      system: {
        cout: parseInt(row.Cost) || 1,
        description: `<p>${row.Notes}</p>`
      }
    })
  },
  {
    file: 'src/equipment/utility/utility.csv',
    pack: 'equipment',
    mapping: (row) => ({
      name: row.Name,
      type: 'equipement',
      system: {
        cout: parseInt(row.Cost) || 1,
        description: `<p>${row.Notes}</p>`
      }
    })
  },
  {
    file: 'src/vehicles/vehicles.csv',
    pack: 'vehicles',
    mapping: (row) => ({
      name: row.Name,
      type: 'equipement',
      system: {
        cout: parseInt(row.Cost) || 1,
        description: `<p>${row.Notes}</p><div class="mnm-stat-block" style="margin-top: 5px; padding: 5px; border-top: 1px solid #ccc; font-size: 0.9em;"><strong>Str:</strong> ${row.Strength || 0} | <strong>Spd:</strong> ${row.Speed || 0} | <strong>Def:</strong> ${row.Defense || 0} | <strong>Tou:</strong> ${row.Toughness || 0}</div>`,
        isVehicle: true,
        typeVehicule: (row.Category || '').toLowerCase() === 'land' ? 'ground' : (row.Category || '').toLowerCase(),
        size: row.Size || 'Medium',
        strength: parseInt(row.Strength) || 0,
        speed: parseInt(row.Speed) || 0,
        defense: parseInt(row.Defense) || 0,
        toughness: parseInt(row.Toughness) || 0
      }
    })
  },
  {
    file: 'src/headquarters/headquarters.csv',
    pack: 'headquarters',
    mapping: (row) => ({
      name: row.Name,
      type: 'equipement',
      system: {
        cout: parseInt(row.Cost) || 1,
        description: `<p>${row.Notes}</p><div class="mnm-stat-block" style="margin-top: 5px; padding: 5px; border-top: 1px solid #ccc; font-size: 0.9em;"><strong>Size:</strong> ${row.Size || 'Medium'} | <strong>Tou:</strong> ${row.Toughness || 0}<br><strong>Features:</strong> ${row.Features || 'None'}</div>`,
        isHeadquarters: true,
        size: row.Size || 'Medium',
        toughness: parseInt(row.Toughness) || 0,
        features: row.Features || ''
      }
    })
  }
];

function setNestedProperty(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

async function reconcile() {
  const data = await fs.readJson(COMPENDIUM_PATH);
  
  for (const config of CSV_CONFIG) {
    const filePath = path.join(ROOT_DIR, config.file);
    if (!await fs.pathExists(filePath)) {
      console.warn(`Skipping ${config.file}: Not found`);
      continue;
    }

    const content = await fs.readFile(filePath, 'utf8');
    const rows = parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
    
    if (!data[config.pack]) data[config.pack] = [];
    const pack = data[config.pack];

    for (const row of rows) {
      const mapped = config.mapping(row);
      let existing = pack.find(i => i.name.toLowerCase() === mapped.name.toLowerCase());
      
      if (existing) {
        // Merge system data
        existing.system = { ...existing.system, ...mapped.system };
        // Apply mods if any
        if (mapped.mods) {
          mapped.mods.forEach(mod => {
            setNestedProperty(existing, mod.key, mod.value);
          });
        }
      } else {
        const defaultImg = config.pack === 'powers' ? 'systems/mutants-and-masterminds-3e/assets/icons/pouvoir.svg' : 'systems/mutants-and-masterminds-3e/assets/icons/equipement.svg';
        const newItem = {
          _id: generateId(mapped.name, config.pack),
          img: defaultImg,
          ...mapped
        };
        if (mapped.mods) {
          mapped.mods.forEach(mod => {
            setNestedProperty(newItem, mod.key, mod.value);
          });
          delete newItem.mods;
        }
        pack.push(newItem);
      }
    }
    console.log(`Reconciled ${config.file} -> ${config.pack} (${rows.length} items)`);
  }

  await fs.writeJson(COMPENDIUM_PATH, data, { spaces: 2 });
  console.log('Successfully updated compendium.json with CSV data.');
}

reconcile().catch(console.error);
