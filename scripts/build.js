const fs = require('fs-extra');
const path = require('path');

const distDir = path.join(__dirname, '../mnm-3e-expanded/packs');
const compendiumPath = path.join(__dirname, '../compendium.json');

// Corrected Cost Calculation Logic (Standard M&M 3e)
function calculatePowerCost(power) {
  if (!power.system) return power;

  // Handle Talents (Advantages) - Default to 1 per rank if cout is missing
  if (power.type === 'talent') {
    if (!power.system.cout) {
      power.system.cout = {
        rang: power.system.rang || 1,
        parrang: 1,
        total: power.system.rang || 1
      };
    }
    return power;
  }

  if (!power.system.cout) return power;

  let baseRank = power.system.cout.rang || 1;
  let baseCostPerRank = power.system.cout.parrang || 1;
  let modCostPerRank = 0;
  let flatModTotal = 0;
  
  // 1. Calculate per-rank modifiers from Extras
  if (power.system.extras) {
    for (let extra of Object.values(power.system.extras)) {
      // Modifiers in powers might have their data nested in 'system' or 'data' or flat at the root
      const extraData = extra.data || (extra.cout ? extra : (extra.system?.cout ? extra.system : extra));
      if (extraData.cout) {
        if (extraData.cout.rang && !extraData.cout.fixe) {
          modCostPerRank += extraData.cout.value || 0;
        } else if (extraData.cout.fixe) {
          if (extraData.cout.rang) {
            flatModTotal += (extra.rang || 1) * (extraData.cout.value || 0);
          } else {
            flatModTotal += (extraData.cout.value || 0);
          }
        }
      }
    }
  }

  // 2. Calculate per-rank modifiers from Flaws
  if (power.system.defauts) {
    for (let flaw of Object.values(power.system.defauts)) {
      const flawData = flaw.data || (flaw.cout ? flaw : (flaw.system?.cout ? flaw.system : flaw));
      if (flawData.cout) {
        if (flawData.cout.rang && !flawData.cout.fixe) {
          modCostPerRank -= (flawData.cout.value || 0);
        } else if (flawData.cout.fixe) {
          if (flaw.name !== 'Removable' && flaw.name !== 'Easily Removable') {
             if (flawData.cout.rang) {
               flatModTotal -= (flaw.rang || 1) * (flawData.cout.value || 0);
             } else {
               flatModTotal -= (flawData.cout.value || 0);
             }
          }
        }
      }
    }
  }

  // 3. Determine Cost Per Rank (Fractional Logic)
  let netCostPerRank = baseCostPerRank + modCostPerRank;
  let totalRankCost = 0;
  let displayCostPerRank = "";

  if (netCostPerRank > 0) {
    totalRankCost = netCostPerRank * baseRank;
    displayCostPerRank = netCostPerRank.toString();
  } else {
    // Fractional cost logic: 0 -> 1/2, -1 -> 1/3, -2 -> 1/4, etc.
    let ranksPerPoint = 2 - netCostPerRank;
    totalRankCost = Math.ceil(baseRank / ranksPerPoint);
    displayCostPerRank = `1/${ranksPerPoint}`;
  }

  // 4. Apply Flat Modifiers (like Removable)
  let finalTotal = totalRankCost;
  
  if (power.system.defauts) {
    for (let flaw of Object.values(power.system.defauts)) {
      if (flaw.name === 'Removable') {
        finalTotal -= Math.floor(finalTotal / 5) * 1;
      } else if (flaw.name === 'Easily Removable') {
        finalTotal -= Math.floor(finalTotal / 5) * 2;
      }
    }
  }
  
  finalTotal += flatModTotal;

  power.system.cout.total = Math.max(1, finalTotal);
  power.system.cout.totalTheorique = Math.max(1, finalTotal);
  power.system.cout.modrang = modCostPerRank;
  power.system.cout.modfixe = flatModTotal;
  power.system.cout.parrangtotal = displayCostPerRank;
  
  return power;
}

async function build() {
  if (!await fs.pathExists(compendiumPath)) {
    console.error('compendium.json not found!');
    return;
  }

  const data = await fs.readJson(compendiumPath);
  await fs.ensureDir(distDir);

  for (const [key, items] of Object.entries(data)) {
    const processedItems = items.map(item => {
      if (key === 'powers') {
        const processedItem = { ...item };
        // Synchronize Mechanics fields: Ensure description and notes match
        if (processedItem.system) {
          const mech = processedItem.system.description || processedItem.system.notes || '';
          processedItem.system.description = mech;
          processedItem.system.notes = mech;
        }
        return calculatePowerCost(processedItem);
      }
      return item;
    });

    const ldj = processedItems.map(item => JSON.stringify(item)).join('\n');
    await fs.writeFile(path.join(distDir, `${key}.db`), ldj);
    console.log(`Pack built: ${key} (${items.length} items)`);
  }
  console.log('Build Complete: All compendiums synchronized from compendium.json.');
}

build().catch(err => console.error(err));
