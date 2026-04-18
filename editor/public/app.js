const API = '/api';

const state = {
  pack: null,
  entries: [],
  selected: null,
  allExtras: [],
  allFlaws: [],
};

// DOM refs
const packList = document.getElementById('pack-list');
const searchInput = document.getElementById('search');
const btnNew = document.getElementById('btn-new');
const entryList = document.getElementById('entry-list');
const listEmpty = document.getElementById('list-empty');
const editPlaceholder = document.getElementById('edit-placeholder');
const editForm = document.getElementById('edit-form');
const editTitle = document.getElementById('edit-title');

// Metadata
const fName = document.getElementById('f-name');
const fPType = document.getElementById('f-p-type');

// Power Specifics
const fPRank = document.getElementById('f-p-rank');
const fPCost = document.getElementById('f-p-cost');
const fPSpecial = document.getElementById('f-p-special');
const fPAction = document.getElementById('f-p-action');
const fPRange = document.getElementById('f-p-range');
const fPDuration = document.getElementById('f-p-duration');
const fPActivate = document.getElementById('f-p-activate');
const fPMechanics = document.getElementById('f-p-mechanics');
const fPEffetsPrincipaux = document.getElementById('f-p-effets-principaux');

// Modifiers UI
const extrasList = document.getElementById('extras-list');
const flawsList = document.getElementById('flaws-list');
const addExtraSelect = document.getElementById('add-extra-select');
const addFlawSelect = document.getElementById('add-flaw-select');

// Equipment Specifics
const fECost = document.getElementById('f-e-cost');
const fEProtection = document.getElementById('f-e-protection');
const fEGroup = document.getElementById('f-e-group');

// Modifier Specifics
const fCoutFixe = document.getElementById('f-cout-fixe');
const fCoutRang = document.getElementById('f-cout-rang');
const fCoutValue = document.getElementById('f-cout-value');

const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');
const saveStatus = document.getElementById('save-status');

// Quill WYSIWYG
const quill = new Quill('#f-description', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  },
});

const quillCommon = new Quill('#f-description-common', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  },
});

const quillNotes = new Quill('#f-p-notes', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  },
});

const quillMechanics = new Quill('#f-p-mechanics', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  },
});

async function loadPacks() {
  try {
    const res = await fetch(`${API}/packs`);
    const { packs } = await res.json();
    packList.innerHTML = '';
    for (const pack of packs) {
      const btn = document.createElement('button');
      btn.className = 'pack-btn';
      btn.textContent = pack.charAt(0).toUpperCase() + pack.slice(1);
      btn.dataset.pack = pack;
      btn.addEventListener('click', () => selectPack(pack));
      packList.appendChild(btn);
    }

    // Pre-load all extras and flaws for the dropdowns
    const extrasRes = await fetch(`${API}/packs/extras`);
    state.allExtras = await extrasRes.json();
    const flawsRes = await fetch(`${API}/packs/flaws`);
    state.allFlaws = await flawsRes.json();

    populateModifierSelects();
  } catch (e) {
    console.error('Connection failed');
  }
}

function populateModifierSelects() {
  addExtraSelect.innerHTML = '<option value="">+ Add Extra...</option>';
  state.allExtras.sort((a, b) => a.name.localeCompare(b.name)).forEach(ex => {
    const opt = document.createElement('option');
    opt.value = ex._id;
    opt.textContent = ex.name;
    addExtraSelect.appendChild(opt);
  });

  addFlawSelect.innerHTML = '<option value="">+ Add Flaw...</option>';
  state.allFlaws.sort((a, b) => a.name.localeCompare(b.name)).forEach(fl => {
    const opt = document.createElement('option');
    opt.value = fl._id;
    opt.textContent = fl.name;
    addFlawSelect.appendChild(opt);
  });
}

function renderModifiers() {
  if (!state.selected || state.pack !== 'powers') return;
  const sys = state.selected.system || {};
  const extras = sys.extras || {};
  const flaws = sys.defauts || {};

  extrasList.innerHTML = '';
  Object.entries(extras).forEach(([id, data]) => {
    const li = document.createElement('li');
    li.className = 'item-tag';
    li.innerHTML = `<span>${data.name || id}</span><span class="remove-btn" data-id="${id}" data-type="extra">&times;</span>`;
    extrasList.appendChild(li);
  });

  flawsList.innerHTML = '';
  Object.entries(flaws).forEach(([id, data]) => {
    const li = document.createElement('li');
    li.className = 'item-tag';
    li.innerHTML = `<span>${data.name || id}</span><span class="remove-btn" data-id="${id}" data-type="flaw">&times;</span>`;
    flawsList.appendChild(li);
  });

  // Add event listeners for remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.target.dataset.id;
      const type = e.target.dataset.type;
      removeModifier(type, id);
    };
  });
}

function addModifier(type, id) {
  if (!state.selected) return;
  const list = type === 'extra' ? state.allExtras : state.allFlaws;
  const mod = list.find(m => m._id === id);
  if (!mod) return;

  const sys = state.selected.system;
  const targetKey = type === 'extra' ? 'extras' : 'defauts';
  if (!sys[targetKey]) sys[targetKey] = {};
  
  // Clone the modifier's system data into the power
  sys[targetKey][id] = {
    name: mod.name,
    ...JSON.parse(JSON.stringify(mod.system))
  };

  renderModifiers();
}

function removeModifier(type, id) {
  if (!state.selected) return;
  const sys = state.selected.system;
  const targetKey = type === 'extra' ? 'extras' : 'defauts';
  if (sys[targetKey]) {
    delete sys[targetKey][id];
    renderModifiers();
  }
}

async function selectPack(pack) {
  state.pack = pack;
  state.selected = null;

  document.querySelectorAll('.pack-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.pack === pack);
  });

  editForm.style.display = 'none';
  editPlaceholder.style.display = '';

  const isPower = pack === 'powers';
  const isEq = ['equipment', 'vehicles', 'headquarters'].includes(pack);
  const isModifier = ['extras', 'flaws'].includes(pack);
  const isAdv = pack === 'advantages';

  // Visibility logic
  document.querySelectorAll('[class*="-only"]').forEach(el => {
    const classes = el.className.split(' ');
    let visible = false;
    let hasOnlyClass = false;

    if (classes.includes('power-only')) { hasOnlyClass = true; if (isPower) visible = true; }
    if (classes.includes('eq-only')) { hasOnlyClass = true; if (isEq) visible = true; }
    if (classes.includes('modifier-only')) { hasOnlyClass = true; if (isModifier) visible = true; }
    if (classes.includes('json-only')) { hasOnlyClass = true; if (isAdv || isModifier) visible = true; }

    if (hasOnlyClass) {
      el.style.display = visible ? '' : 'none';
    }
  });

  try {
    const res = await fetch(`${API}/packs/${pack}`);
    state.entries = await res.json();
  } catch (err) {
    state.entries = [];
  }

  searchInput.value = '';
  renderList();
}

function renderList() {
  const query = searchInput.value.toLowerCase();
  const filtered = state.entries.filter(e =>
    (e.name || '').toLowerCase().includes(query)
  );

  entryList.innerHTML = '';

  if (filtered.length === 0) {
    listEmpty.style.display = '';
    listEmpty.textContent = state.pack ? 'No entries found' : 'Select a pack';
    return;
  }

  listEmpty.style.display = 'none';

  for (const entry of filtered) {
    const li = document.createElement('li');
    li.textContent = entry.name;
    li.dataset.id = entry._id;
    if (state.selected && state.selected._id === entry._id) li.classList.add('selected');
    li.addEventListener('click', () => selectEntry(entry));
    entryList.appendChild(li);
  }
}

function selectEntry(entry) {
  state.selected = entry;
  document.querySelectorAll('#entry-list li').forEach(li => {
    li.classList.toggle('selected', li.dataset.id === entry._id);
  });

  const sys = entry.system || {};
  const cout = sys.cout || {};

  editTitle.textContent = entry.name;
  fName.value = entry.name || '';
  fPType.value = sys.type || '';

  // Power mapping
  fPRank.value = cout.rang || '';
  fPCost.value = cout.parrang || '';
  fPSpecial.value = sys.special || '';
  fPAction.value = sys.action || '';
  fPRange.value = sys.portee || '';
  fPDuration.value = sys.duree || '';
  fPActivate.checked = !!sys.activate;
  fPEffetsPrincipaux.value = sys.effetsprincipaux || '';
  
  // Equipment mapping
  fECost.value = typeof sys.cout === 'number' ? sys.cout : (cout.total || '');
  fEProtection.value = sys.protection || '';
  fEGroup.value = entry.flags?.['mnm-3e-expanded']?.link || '';

  // Modifier mapping
  fCoutFixe.checked = !!cout.fixe;
  fCoutRang.checked = !!cout.rang;
  fCoutValue.value = cout.value || 0;

  const content = (state.pack === 'advantages' ? sys.notes : sys.description) || '';
  if (state.pack === 'powers') {
    // RESTORE: f-description (Mechanics) maps to sys.description
    //          f-p-mechanics (Flavor) maps to sys.effets
    quill.clipboard.dangerouslyPasteHTML(sys.description || '');
    quillMechanics.clipboard.dangerouslyPasteHTML(sys.effets || '');
    renderModifiers();
  } else {
    quillCommon.clipboard.dangerouslyPasteHTML(content);
  }
  quillNotes.clipboard.dangerouslyPasteHTML(sys.notes || '');

  editForm.style.display = '';
  editPlaceholder.style.display = 'none';
}

async function saveEntry() {
  if (!state.selected || !state.pack) return;

  const updated = JSON.parse(JSON.stringify(state.selected));
  updated.name = fName.value.trim();

  if (!updated.system) updated.system = {};
  const sys = updated.system;

  if (state.pack === 'powers') {
    sys.type = fPType.value;
    if (!sys.cout) sys.cout = {};
    sys.special = fPSpecial.value.trim();
    sys.action = fPAction.value.trim();
    sys.portee = fPRange.value.trim();
    sys.duree = fPDuration.value.trim();
    sys.activate = fPActivate.checked;
    sys.effets = quillMechanics.root.innerHTML;
    sys.effetsprincipaux = fPEffetsPrincipaux.value.trim();
    sys.cout.rang = parseInt(fPRank.value) || 1;
    sys.cout.parrang = parseInt(fPCost.value) || 1;
    sys.description = quill.root.innerHTML;
    sys.notes = quillNotes.root.innerHTML;
  } else if (['extras', 'flaws'].includes(state.pack)) {
    sys.cout = {
      fixe: fCoutFixe.checked,
      rang: fCoutRang.checked,
      value: parseInt(fCoutValue.value) || 0
    };
    sys.description = quillCommon.root.innerHTML;
  } else if (state.pack === 'advantages') {
    sys.notes = quillCommon.root.innerHTML;
    sys.description = quillCommon.root.innerHTML;
  } else {
    // Equipment, Vehicles, Headquarters
    sys.cout = parseInt(fECost.value) || 0;
    sys.protection = parseInt(fEProtection.value) || 0;
    sys.description = quillCommon.root.innerHTML;
    if (!updated.flags) updated.flags = {};
    if (!updated.flags['mnm-3e-expanded']) updated.flags['mnm-3e-expanded'] = {};
    updated.flags['mnm-3e-expanded'].link = fEGroup.value.trim();
  }

  try {
    const res = await fetch(`${API}/packs/${state.pack}/${state.selected._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error(await res.text());
    
    const saved = await res.json();
    const idx = state.entries.findIndex(e => e._id === saved._id);
    if (idx !== -1) state.entries[idx] = saved;
    renderList();
    saveStatus.classList.add('visible');
    setTimeout(() => saveStatus.classList.remove('visible'), 2000);
  } catch (err) {
    alert('Save failed: ' + err.message);
  }
}

async function newEntry() {
  if (!state.pack) return;
  const payload = {
    name: 'New Entry',
    type: state.pack === 'powers' ? 'pouvoir' : (state.pack === 'advantages' ? 'talent' : 'equipement'),
    system: { 
      type: '',
      description: '', 
      cout: state.pack === 'powers' ? { rang: 1, parrang: 1 } : 1 
    },
    flags: {}
  };

  try {
    const res = await fetch(`${API}/packs/${state.pack}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const entry = await res.json();
    state.entries.push(entry);
    renderList();
    selectEntry(entry);
  } catch (err) {
    alert('Failed to create entry');
  }
}

async function deleteEntry() {
  if (!state.selected || !state.pack) return;
  if (!confirm(`Delete "${state.selected.name}"?`)) return;
  try {
    const res = await fetch(`${API}/packs/${state.pack}/${state.selected._id}`, { method: 'DELETE' });
    if (res.ok) {
      state.entries = state.entries.filter(e => e._id !== state.selected._id);
      state.selected = null;
      editForm.style.display = 'none';
      editPlaceholder.style.display = '';
      renderList();
    }
  } catch (err) {
    alert('Delete failed');
  }
}

addExtraSelect.addEventListener('change', (e) => {
  if (e.target.value) {
    addModifier('extra', e.target.value);
    e.target.value = '';
  }
});

addFlawSelect.addEventListener('change', (e) => {
  if (e.target.value) {
    addModifier('flaw', e.target.value);
    e.target.value = '';
  }
});

searchInput.addEventListener('input', renderList);
btnNew.addEventListener('click', newEntry);
btnSave.addEventListener('click', saveEntry);
btnDelete.addEventListener('click', deleteEntry);
loadPacks();
