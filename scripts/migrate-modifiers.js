const fs = require('fs-extra');
const path = require('path');

const compendiumPath = path.join(__dirname, '../compendium.json');

async function migrateModifiers() {
  try {
    const data = await fs.readJson(compendiumPath);
    let migratedCount = 0;

    if (data.powers) {
      data.powers.forEach(power => {
        ['extras', 'defauts'].forEach(key => {
          if (power.system && power.system[key]) {
            const mods = power.system[key];
            Object.keys(mods).forEach(modId => {
              const mod = mods[modId];
              // If it doesn't have .data but has fields like .type or .description at the root
              if (!mod.data && (mod.type || mod.description || mod.cout)) {
                console.log(`Migrating mod "${mod.name}" in power "${power.name}"`);
                
                // Create the new structure
                const newMod = {
                  name: mod.name,
                  details: true,
                  data: { ...mod }
                };
                
                // Clean up root level data fields if they exist to avoid confusion
                delete newMod.data.name;
                delete newMod.data.details;
                
                mods[modId] = newMod;
                migratedCount++;
              }
            });
          }
        });
      });
    }

    if (migratedCount > 0) {
      await fs.writeJson(compendiumPath, data, { spaces: 2 });
      console.log(`Successfully migrated ${migratedCount} modifiers to the 'data' wrapper structure.`);
    } else {
      console.log('No flat modifiers found to migrate.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrateModifiers();
