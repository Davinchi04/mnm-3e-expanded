const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');

const app = express();
app.use(cors());
app.use(express.json());

const ROOT_DIR = path.join(__dirname, '../..');

// Helper function to read and parse NeDB-like JSON files
const readDbFile = async (fileName) => {
  const filePath = path.join(ROOT_DIR, 'mnm-3e-expanded/packs', fileName);
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    // NeDB files are typically arrays of JSON objects.
    // If the file is large, it might be line-delimited JSON, but for these sizes,
    // assuming a single JSON array is reasonable.
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading or parsing ${fileName}:`, error);
    throw error; // Re-throw to be caught by route handler
  }
};

// Existing CSV routes
const getCsvPath = (type) => {
  if (type === 'powers') return path.join(ROOT_DIR, '1st Powers Input.csv');
  if (type === 'advantages') return path.join(ROOT_DIR, 'Advantages.csv');
  return '';
};

app.get('/api/items/:type', async (req, res) => {
  const { type } = req.params;
  const filePath = getCsvPath(type);
  if (!filePath) return res.status(404).json({ error: 'Compendium not found' });

  const results = [];
  fs.createReadStream(filePath)
    .pipe(parse({
      columns: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_empty_lines: true
    }))
    .on('data', (data) => results.push(data))
    .on('end', () => res.json(results))
    .on('error', (err) => res.status(500).json({ error: err.message }));
});

app.put('/api/:type/:name', async (req, res) => {
  const { type, name } = req.params;
  const updatedItem = req.body;
  const isDbBacked = ['powers', 'advantages', 'flaws', 'extras'].includes(type);

  if (isDbBacked) {
    const filePath = path.join(ROOT_DIR, 'mnm-3e-expanded/packs', `${type}.db`);
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const items = JSON.parse(fileContent);
      const index = items.findIndex(i => (i.name || i.Name || i.NAME) === name);
      if (index === -1) return res.status(404).json({ error: 'Item not found' });

      // Update item
      items[index].system = { ...items[index].system, ...updatedItem };

      await fs.writeFile(filePath, JSON.stringify(items, null, 2));
      res.json({ success: true, item: items[index] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    // CSV logic
    const filePath = getCsvPath(type);
    const items = [];
    fs.createReadStream(filePath)
      .pipe(parse({ 
        columns: true, 
        trim: true, 
        relax_quotes: true, 
        relax_column_count: true,
        skip_empty_lines: true
      }))
      .on('data', (data) => items.push(data))
      .on('end', async () => {
        const index = items.findIndex(i => (i.Name || i.name || i.NAME) === name);
        if (index === -1) return res.status(404).json({ error: 'Item not found' });

        items[index] = { ...items[index], ...updatedItem };

        const csvString = stringify(items, { header: true });
        await fs.writeFile(filePath, csvString);
        res.json({ success: true, item: items[index] });
      })
      .on('error', (err) => res.status(500).json({ error: err.message }));
  }
});
// New API endpoints for .db files

app.get('/api/powers', async (req, res) => {
  try {
    const powers = await readDbFile('powers.db');
    res.json(powers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load powers data' });
  }
});

app.get('/api/advantages', async (req, res) => {
  try {
    const advantages = await readDbFile('advantages.db');
    res.json(advantages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load advantages data' });
  }
});

app.get('/api/flaws', async (req, res) => {
  try {
    const flaws = await readDbFile('flaws.db');
    res.json(flaws);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load flaws data' });
  }
});

app.get('/api/extras', async (req, res) => {
  try {
    const extras = await readDbFile('extras.db');
    res.json(extras);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load extras data' });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));
