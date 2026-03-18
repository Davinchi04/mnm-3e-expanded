const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const pdfPath = path.join(__dirname, '../MnM_Powers_Only.pdf');
const csvPath = path.join(__dirname, '../1st Powers Input.csv');

async function extract() {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  // Scan the entire book for powers
  const text = data.text;

  const powersList = [
    'CREATE', 'DAMAGE', 'DAZZLE', 'DEFLECT', 'DEVICE', 
    'DIMENSION TRAVEL', 'DUPLICATION', 'ELONGATION', 'ENHANCED TRAIT', 'ENVIRONMENT',
    'EXTRA LIMBS', 'FEATURE', 'FLIGHT', 'GROWTH', 'HEALING', 
    'ILLUSION', 'IMMUNITY', 'INSUBSTANTIAL', 'INVISIBILITY', 'LEAPING'
  ];

  const extractedPowers = [];

  for (const powerName of powersList) {
    let startIndex = text.indexOf(powerName);
    
    // If not found in ALL CAPS, try title case
    if (startIndex === -1) {
        const titleCase = powerName.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        startIndex = text.indexOf(titleCase);
    }

    if (startIndex !== -1) {
      // Find the "End" by looking for the next power or a reasonable limit
      let powerText = text.substring(startIndex, startIndex + 5000).trim();
      
      // Split the text into main description, Extras, and Flaws
      const extrasSplit = powerText.split(/\bEXTRAS\b/i);
      let mainText = extrasSplit[0];
      let extrasBlock = extrasSplit[1] || '';
      
      const flawsSplit = extrasBlock.split(/\bFLAWS\b/i);
      extrasBlock = flawsSplit[0];
      let flawsBlock = flawsSplit[1] || '';

      // Clean text
      mainText = mainText.replace(/\s+/g, ' ').trim();
      
      // Extract Stats from the mainText only
      let action = 'Standard';
      let range = 'Personal';
      let duration = 'Instant';
      let cost = 1;

      const lowerText = mainText.toLowerCase();
      if (lowerText.includes('action: standard')) action = 'Standard';
      else if (lowerText.includes('action: move')) action = 'Move';
      else if (lowerText.includes('action: free')) action = 'Free';
      else if (lowerText.includes('action: reaction')) action = 'Reaction';

      if (lowerText.includes('range: close') || lowerText.includes('range: contact')) range = 'Close';
      else if (lowerText.includes('range: ranged')) range = 'Ranged';
      else if (lowerText.includes('range: perception')) range = 'Perception';

      if (lowerText.includes('duration: instant')) duration = 'Instant';
      else if (lowerText.includes('duration: sustained')) duration = 'Sustained';
      else if (lowerText.includes('duration: continuous')) duration = 'Continuous';

      const costMatch = mainText.match(/Cost: (\d+) point/i);
      if (costMatch) cost = parseInt(costMatch[1]);

      // Identify modifier names (best effort - usually capitalized words followed by a colon)
      const extractModifierNames = (block) => {
        const names = [];
        const regex = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*):/g;
        let match;
        while ((match = regex.exec(block)) !== null) {
          names.push(match[1]);
        }
        return names.join(', ');
      };

      const extrasNames = extractModifierNames(extrasBlock);
      const flawsNames = extractModifierNames(flawsBlock);

      extractedPowers.push({
        Name: powerName.charAt(0) + powerName.slice(1).toLowerCase(),
        Power: 'Power',
        Rank: 1,
        Cost: cost,
        Action: action,
        Range: range,
        Duration: duration,
        Description: mainText.substring(0, 500),
        Mechanics: mainText.substring(500),
        Extras: extrasNames,
        Flaws: flawsNames
      });
    }
  }

  // Update CSV
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  let records = parse(fileContent, { columns: true });
  
  const namesToExtract = extractedPowers.map(p => p.Name);
  records = records.filter(r => !namesToExtract.includes(r.Name));

  const updatedRecords = [...records, ...extractedPowers];
  const output = stringify(updatedRecords, { header: true });
  fs.writeFileSync(csvPath, output);
  
  console.log(`Successfully extracted ${extractedPowers.length} powers and updated CSV.`);
}

extract().catch(err => console.error(err));
