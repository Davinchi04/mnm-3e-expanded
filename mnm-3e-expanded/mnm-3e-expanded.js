console.log('%c M&M 3E EXPANDED | SYSTEM HIJACK ACTIVE (V3.3.65) ', 'background: #800080; color: #fff; font-weight: bold;');

/**
 * Calculates the theoretical full cost of a power based on M&M 3e rules.
 */
function calculatePowerCost(item) {
  const c = item.system?.cout || {};
  const r = c.rang || 0;
  const pr = c.parrang || 0;
  const mr = c.modrang || 0;
  const fc = c.modfixe || 0;
  const d = c.divers || 0;
  const net = pr + mr;
  
  if (net > 0) return Math.max(1, (net * r) + fc + d);
  const ranksPerPoint = 2 - net;
  return Math.max(1, Math.ceil(r / ranksPerPoint) + fc + d);
}

/**
 * The core logic to override Power and Equipment PP/EP totals.
 */
function applyExpandedLogic(actor) {
  if (actor.type !== 'personnage') return;

  const powers = actor.items.filter(i => i.type === 'pouvoir');
  const equipment = actor.items.filter(i => i.type === 'equipement');

  // --- 1. POWER ARRAY LOGIC ---
  const pArrays = {};
  powers.forEach(p => {
    const link = p.system.link;
    if (link) {
      const parent = actor.items.get(link) || powers.find(i => i.name === link);
      if (parent) {
        const pId = parent._id;
        if (!pArrays[pId]) pArrays[pId] = [pId];
        if (!pArrays[pId].includes(p._id)) pArrays[pId].push(p._id);
      }
    }
  });

  const pArrayMetadata = {};
  for (const pId in pArrays) {
    let maxCost = 0;
    let bearerId = pId;
    pArrays[pId].forEach(id => {
      const item = actor.items.get(id);
      if (!item) return;
      const full = calculatePowerCost(item);
      if (full > maxCost) { maxCost = full; bearerId = id; }
    });
    pArrayMetadata[pId] = { max: maxCost, bearer: bearerId };
  }

  let totalPowerPP = 0;
  let totalEquipmentEP = 0;

  // Process Equipment first to establish base EP
  equipment.forEach(e => {
    totalEquipmentEP += (parseInt(e.system.cout) || 0);
  });

  powers.forEach(item => {
    const flags = item.flags['mnm-3e-expanded'] || {};
    const full = calculatePowerCost(item);
    let target = full;

    // Check if it's an EP Power (on equipment)
    if (flags.costAsEP && flags.parentEquipmentId) {
      // This power contributes to EP, not PP
      totalEquipmentEP += full;
      target = 0; // Does not cost PP
    } else {
      // Standard Power Array Logic
      const link = item.system.link;
      const parent = link ? (actor.items.get(link) || powers.find(i => i.name === link)) : null;
      const parentId = pArrays[item._id] ? item._id : (parent ? parent._id : null);

      if (parentId && pArrayMetadata[parentId]) {
        const meta = pArrayMetadata[parentId];
        target = (item._id === meta.bearer) ? meta.max : 0;
      }
      totalPowerPP += target;
    }

    // Override the value in the actor's current data structure
    item.system.cout.total = target;
    item.system.cout.totalTheorique = target;
    if (target === 0) item.system.cout.parrangtotal = "0";
  });

  // --- 2. EQUIPMENT ARRAY LOGIC (Utility Belts etc) ---
  const eArrays = {};
  equipment.forEach(e => {
    const link = e.flags['mnm-3e-expanded']?.link;
    if (link) {
      const parent = actor.items.get(link) || equipment.find(i => i.name === link);
      if (parent) {
        const pId = parent._id;
        if (!eArrays[pId]) eArrays[pId] = [pId];
        if (!eArrays[pId].includes(e._id)) eArrays[pId].push(e._id);
      }
    }
  });

  const eArrayMetadata = {};
  for (const pId in eArrays) {
    let maxCost = 0;
    let bearerId = pId;
    eArrays[pId].forEach(id => {
      const item = actor.items.get(id);
      if (!item) return;
      const cost = parseInt(item.system.cout) || 0;
      if (cost > maxCost) { maxCost = cost; bearerId = id; }
    });
    eArrayMetadata[pId] = { max: maxCost, bearer: bearerId };
  }

  // Recalculate totalEquipmentEP with array discounts
  totalEquipmentEP = 0;
  equipment.forEach(item => {
    const baseCost = parseInt(item.system.cout) || 0;
    let target = baseCost;
    const link = item.flags['mnm-3e-expanded']?.link;
    const parent = link ? (actor.items.get(link) || equipment.find(i => i.name === link)) : null;
    const parentId = eArrays[item._id] ? item._id : (parent ? parent._id : null);

    if (parentId && eArrayMetadata[parentId]) {
      const meta = eArrayMetadata[parentId];
      target = (item._id === meta.bearer) ? meta.max : 1;
    }
    item.system.derivedCout = target;
    totalEquipmentEP += target;
  });

  // Add the costs of powers marked as EP
  powers.forEach(p => {
    const flags = p.flags['mnm-3e-expanded'] || {};
    if (flags.costAsEP && flags.parentEquipmentId) {
      totalEquipmentEP += calculatePowerCost(p);
    }
  });

  // 4. Update top-level pools
  if (actor.system?.pp) {
    actor.system.pp.pouvoirs = totalPowerPP;
    const pp = actor.system.pp;
    const newUsed = (pp.caracteristiques || 0) + totalPowerPP + (pp.talents || 0) + (pp.competences || 0) + (pp.defenses || 0) + (pp.divers || 0);
    actor.system.pp.used = newUsed;
  }
  if (actor.system?.ptsEquipements) {
    actor.system.ptsEquipements.use = totalEquipmentEP;
  }
}

// HIJACK: Inject our logic into the Actor's calculation process
Hooks.once('init', () => {
  const originalPrepareDerivedData = CONFIG.Actor.documentClass.prototype.prepareDerivedData;
  CONFIG.Actor.documentClass.prototype.prepareDerivedData = function() {
    originalPrepareDerivedData.call(this);
    applyExpandedLogic(this);
  };
});

// UI Injection for Equipment Cards
Hooks.on('renderItemSheet', (app, html, data) => {
  const item = app.item;
  if (item.type !== 'equipement') return;

  const actor = item.actor;
  if (!actor) return;

  const linkedPowers = actor.items.filter(i => 
    i.type === 'pouvoir' && i.flags['mnm-3e-expanded']?.parentEquipmentId === item._id
  );

  let powersHtml = `
    <div class="mnm-expanded-powers-section" style="margin-top: 10px; border-top: 1px solid #7a7971; padding-top: 10px;">
      <h3 style="border: none;">Powers on Equipment</h3>
      <div class="power-drop-zone" style="border: 2px dashed #7a7971; border-radius: 5px; padding: 15px; margin-bottom: 10px; text-align: center; background: rgba(0,0,0,0.05);">
        <i class="fas fa-plus"></i> Drop Powers Here
      </div>
      <ul class="linked-powers-list" style="list-style: none; padding: 0; margin: 0;">
        ${linkedPowers.map(p => `
          <li style="display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; border: 1px solid #ccc; border-radius: 3px; margin-bottom: 5px; background: #eee;">
            <span style="font-weight: bold;">${p.name} <span style="font-weight: normal; font-style: italic;">(${calculatePowerCost(p)} EP)</span></span>
            <a class="remove-power" title="Unlink Power" data-power-id="${p._id}" style="color: #800;"><i class="fas fa-trash"></i></a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  // Try to find a good injection point, fallback to end of sheet-body
  const injectionPoint = html.find('.sheet-body');
  if (injectionPoint.length) {
    injectionPoint.append(powersHtml);
  } else {
    html.append(powersHtml);
  }

  // --- ENABLE DROP ---
  const dropZone = html.find('.power-drop-zone');
  
  // Necessary for drop to fire
  dropZone.on('dragover', (ev) => {
    ev.preventDefault();
    dropZone.css('background', 'rgba(0,0,0,0.15)');
  });

  dropZone.on('dragleave', (ev) => {
    ev.preventDefault();
    dropZone.css('background', 'rgba(0,0,0,0.05)');
  });

  dropZone.on('drop', async (ev) => {
    ev.preventDefault();
    dropZone.css('background', 'rgba(0,0,0,0.05)');
    
    try {
      const dragData = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));
      if (dragData.type !== 'Item') return;
      
      const powerId = dragData.uuid.split('.').pop();
      const power = actor.items.get(powerId);
      
      if (!power || power.type !== 'pouvoir') {
        ui.notifications.warn("Only Powers can be added to Equipment.");
        return;
      }

      await power.update({
        'flags.mnm-3e-expanded.costAsEP': true,
        'flags.mnm-3e-expanded.parentEquipmentId': item._id
      });
      
      ui.notifications.info(`Added ${power.name} to ${item.name}`);
    } catch (err) {
      console.error(err);
    }
  });

  // Handle Removal
  html.find('.remove-power').on('click', async (ev) => {
    const pId = ev.currentTarget.dataset.powerId;
    const power = actor.items.get(pId);
    if (power) {
      await power.update({
        'flags.mnm-3e-expanded.costAsEP': false,
        'flags.mnm-3e-expanded.parentEquipmentId': null
      });
      ui.notifications.info(`Unlinked ${power.name} from equipment.`);
    }
  });
});

// Actor Sheet Dragstart Logic
Hooks.on('renderActorSheet', (app, html, data) => {
  const actor = data.actor || app.actor;
  if (!actor || actor.type !== 'personnage') return;

  const powerItems = html.find('.item.pouvoir, .pouvoir-item');
  powerItems.each((i, li) => {
    li.setAttribute('draggable', true);
    li.addEventListener('dragstart', (ev) => {
      const item = actor.items.get(li.dataset.itemId);
      ev.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'Item',
        uuid: item.uuid
      }));
    });
  });
});
