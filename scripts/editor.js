const fs = require('fs-extra');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const readline = require('readline');

const ROOT_DIR = path.join(__dirname, '..');
const COMPENDIUMS = {
  powers: path.join(ROOT_DIR, '1st Powers Input.csv'),
  advantages: path.join(ROOT_DIR, 'Advantages.csv')
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function loadCsv(type) {
  const content = await fs.readFile(COMPENDIUMS[type], 'utf-8');
  return parse(content, { 
    columns: true, 
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
  });
}

async function saveCsv(type, data) {
  const output = stringify(data, { header: true });
  await fs.writeFile(COMPENDIUMS[type], output);
}

async function main() {
  console.log('--- M&M Data Editor ---');
  console.log('1. Powers');
  console.log('2. Advantages');
  
  rl.question('Select a compendium (1-2): ', async (choice) => {
    const type = choice === '1' ? 'powers' : 'advantages';
    const data = await loadCsv(type);
    
    console.log(`Loaded ${data.length} items.`);
    rl.question('Search for an item: ', (query) => {
      const filtered = data.filter(i => (i.Name || i.name || i.NAME).toLowerCase().includes(query.toLowerCase()));
      
      if (filtered.length === 0) {
        console.log('No items found.');
        process.exit();
      }

      console.table(filtered.map((i, idx) => ({ id: idx, name: i.Name || i.name || i.NAME })));
      
      rl.question('Select ID to edit: ', async (id) => {
        const item = filtered[id];
        console.log(`Editing: ${item.Name || item.name || item.NAME}`);
        console.log('Current Description:', item.Description || item.description || '');
        
        rl.question('New Description (Press Enter to skip): ', (newDesc) => {
          rl.question('New Details/Mechanics (Press Enter to skip): ', async (newMech) => {
            // Update the item
            const dataIdx = data.findIndex(i => (i.Name || i.name || i.NAME) === (item.Name || item.name || item.NAME));
            
            if (newDesc.trim()) {
              if (data[dataIdx].Description !== undefined) data[dataIdx].Description = newDesc;
              else data[dataIdx].description = newDesc;
            }
            if (newMech.trim()) {
              if (data[dataIdx].Mechanics !== undefined) data[dataIdx].Mechanics = newMech;
              else data[dataIdx].mechanics = newMech;
            }
            
            await saveCsv(type, data);
            console.log('Saved successfully!');
            process.exit();
          });
        });
      });
    });
  });
}

main();
