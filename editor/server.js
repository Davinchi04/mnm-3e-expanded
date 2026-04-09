const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(express.json({ limit: '100mb' }));

const ROOT_DIR = path.join(__dirname, '..');
const COMPENDIUM_PATH = path.join(ROOT_DIR, 'compendium.json');

// Helper to read the master JSON
async function readCompendium() {
  const content = await fs.readFile(COMPENDIUM_PATH, 'utf8');
  return JSON.parse(content);
}

// Helper to write the master JSON
async function writeCompendium(data) {
  await fs.writeFile(COMPENDIUM_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log('Compendium saved. Triggering build...');
  exec('npm run build', { cwd: ROOT_DIR }, (err, stdout, stderr) => {
    if (err) console.error('Build Error:', err);
    else console.log('Build Success');
  });
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/packs', async (req, res) => {
  try {
    const data = await readCompendium();
    res.json({ packs: Object.keys(data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/packs/:pack', async (req, res) => {
  const { pack } = req.params;
  try {
    const data = await readCompendium();
    if (!data[pack]) return res.status(404).json({ error: 'Pack not found' });
    const items = data[pack];
    items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/packs/:pack', async (req, res) => {
  const { pack } = req.params;
  try {
    const data = await readCompendium();
    if (!data[pack]) data[pack] = [];
    
    const entry = { _id: Math.random().toString(36).slice(2, 13), ...req.body };
    data[pack].push(entry);
    
    await writeCompendium(data);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/packs/:pack/:id', async (req, res) => {
  const { pack, id } = req.params;
  try {
    const data = await readCompendium();
    if (!data[pack]) return res.status(404).json({ error: 'Pack not found' });
    
    const idx = data[pack].findIndex(i => String(i._id) === String(id));
    if (idx !== -1) {
      data[pack][idx] = req.body;
      await writeCompendium(data);
      res.json(data[pack][idx]);
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/packs/:pack/:id', async (req, res) => {
  const { pack, id } = req.params;
  console.log(`DELETE | Request to remove ${id} from ${pack}`);
  try {
    const data = await readCompendium();
    if (!data[pack]) return res.status(404).json({ error: 'Pack not found' });
    
    const initialCount = data[pack].length;
    data[pack] = data[pack].filter(i => String(i._id) !== String(id));
    
    if (data[pack].length === initialCount) {
      console.warn(`DELETE | Item ${id} not found in ${pack}`);
      return res.status(404).json({ error: 'Item not found' });
    }

    await writeCompendium(data);
    console.log(`DELETE | Success. Removed ${id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(3001, () => console.log(`Editor running at http://localhost:3001`));
