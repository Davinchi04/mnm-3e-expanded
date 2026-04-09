const fs = require('fs-extra');
const path = require('path');

const packsDir = path.join(__dirname, '../mnm-3e-expanded/packs');
const files = ['powers.db', 'advantages.db', 'flaws.db', 'extras.db', 'equipment.db', 'vehicles.db', 'headquarters.db'];

async function exportData() {
  const allData = {};
  for (const file of files) {
    const filePath = path.join(packsDir, file);
    if (await fs.pathExists(filePath)) {
      console.log(`Processing ${file}...`);
      const content = await fs.readFile(filePath, 'utf8');
      if (!content.trim()) {
        allData[file.replace('.db', '')] = [];
        continue;
      }
      
      if (content.trim().startsWith('[')) {
        allData[file.replace('.db', '')] = JSON.parse(content);
      } else {
        const lines = content.trim().split(/\r?\n/).filter(Boolean);
        allData[file.replace('.db', '')] = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            console.error(`Failed to parse line in ${file}:`, line.substring(0, 50));
            return null;
          }
        }).filter(Boolean);
      }
    } else {
      console.warn(`File not found: ${filePath}`);
    }
  }
  await fs.writeJson(path.join(__dirname, '../compendium.json'), allData, { spaces: 2 });
  console.log('Exported all data to compendium.json');
}

exportData();
