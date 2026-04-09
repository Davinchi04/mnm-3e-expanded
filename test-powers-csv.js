const fs = require('fs-extra');
const path = require('path');
const { parse } = require('csv-parse/sync');

const filePath = path.join(__dirname, '1st Powers Input.csv');

try {
  console.log('Checking file:', filePath);
  if (!fs.existsSync(filePath)) {
    console.error('File does NOT exist!');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log('File size:', content.length, 'bytes');
  console.log('First 100 chars:', JSON.stringify(content.substring(0, 100)));

  const records = parse(content, { 
    columns: true, 
    skip_empty_lines: true,
    bom: true,
    trim: true
  });

  console.log('Found records:', records.length);
  if (records.length > 0) {
    console.log('First record sample:', records[0]);
    console.log('Record Name check:', records[0].Name || records[0].name);
  }

} catch (err) {
  console.error('Error during test:', err);
}
