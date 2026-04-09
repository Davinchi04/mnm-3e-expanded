const API = '/api';

const state = {
  pack: null,
  entries: [],
  selected: null,
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

// Form Fields
const fName = document.getElementById('f-name');
const fType = document.getElementById('f-type');
const fImg = document.getElementById('f-img');

// System Logic (Flexible based on content)
const fSysType = document.getElementById('f-sys-type');
const fPRank = document.getElementById('f-p-rank');
const fPCost = document.getElementById('f-p-cost');
const fPAction = document.getElementById('f-p-action');
const fPRange = document.getElementById('f-p-range');
const fPDuration = document.getElementById('f-p-duration');
const fPMechanics = document.getElementById('f-p-mechanics');
const fPExtras = document.getElementById('f-p-extras');
const fPFlaws = document.getElementById('f-p-flaws');
const fEGroup = document.getElementById('f-e-group');

const fRang = document.getElementById('f-rang');
const fEditCheck = document.getElementById('f-edit');
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
  } catch (e) {
    console.error('Connection failed');
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

  // Determine view mode
  const isPower = pack === 'powers';
  const isEq = ['equipment', 'vehicles', 'headquarters'].includes(pack);
  const isModifier = ['extras', 'flaws'].includes(pack);
  const isAdv = pack === 'advantages';

  document.querySelectorAll('.json-only').forEach(el => el.style.display = (isModifier || isAdv) ? '' : 'none');
  document.querySelectorAll('.power-only').forEach(el => el.style.display = isPower ? '' : 'none');
  document.querySelectorAll('.eq-only').forEach(el => el.style.display = isEq ? '' : 'none');
  document.querySelectorAll('.modifier-only').forEach(el => el.style.display = isModifier ? '' : 'none');

  document.getElementById('desc-label').textContent = isAdv ? 'Notes' : 'Description';

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
  fType.value = entry.type || '';
  fImg.value = entry.img || '';

  // Map fields based on structure
  fSysType.value = sys.type || '';
  
  // Power mapping (from JSON structure)
  fPRank.value = cout.rang || '';
  fPCost.value = cout.parrang || '';
  fPAction.value = sys.action || '';
  fPRange.value = sys.portee || '';
  fPDuration.value = sys.duree || '';
  fPMechanics.value = sys.effets || '';
  
  // Equipment mapping
  fEGroup.value = entry.flags?.['mnm-3e-expanded']?.link || '';

  // Modifier mapping
  fRang.value = sys.rang || 1;
  fEditCheck.checked = !!sys.edit;
  fCoutFixe.checked = !!cout.fixe;
  fCoutRang.checked = !!cout.rang;
  fCoutValue.value = cout.value || 0;

  quill.clipboard.dangerouslyPasteHTML((state.pack === 'advantages' ? sys.notes : sys.description) || '');

  editForm.style.display = '';
  editPlaceholder.style.display = 'none';
}

async function saveEntry() {
  if (!state.selected || !state.pack) return;

  const updated = JSON.parse(JSON.stringify(state.selected));
  updated.name = fName.value.trim();
  updated.type = fType.value.trim();
  updated.img = fImg.value.trim();

  // Update System
  if (['powers'].includes(state.pack)) {
    updated.system.action = fPAction.value.trim();
    updated.system.portee = fPRange.value.trim();
    updated.system.duree = fPDuration.value.trim();
    updated.system.effets = fPMechanics.value.trim();
    updated.system.cout.rang = parseInt(fPRank.value) || 1;
    updated.system.cout.parrang = parseInt(fPCost.value) || 1;
    updated.system.description = quill.root.innerHTML;
  } else if (['extras', 'flaws'].includes(state.pack)) {
    updated.system.type = fSysType.value.trim();
    updated.system.description = quill.root.innerHTML;
    updated.system.rang = parseInt(fRang.value) || 1;
    updated.system.edit = fEditCheck.checked;
    updated.system.cout = {
      fixe: fCoutFixe.checked,
      rang: fCoutRang.checked,
      value: parseInt(fCoutValue.value) || 0
    };
  } else if (['advantages'].includes(state.pack)) {
    updated.system.notes = quill.root.innerHTML;
    updated.system.rang = parseInt(fRang.value) || 1;
  } else {
    // Equipment
    updated.system.description = quill.root.innerHTML;
    updated.system.cout = parseInt(fPCost.value) || 1;
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
    system: { description: '', cout: {} },
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

searchInput.addEventListener('input', renderList);
btnNew.addEventListener('click', newEntry);
btnSave.addEventListener('click', saveEntry);
btnDelete.addEventListener('click', deleteEntry);
loadPacks();
