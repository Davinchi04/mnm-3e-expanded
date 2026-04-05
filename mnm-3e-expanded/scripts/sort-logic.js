// Self-Healing Logic: Fixes legacy data structures on the fly
async function healActorData(actor) {
  if (!actor.isOwner) return;

  const updates = [];
  const powers = actor.items.filter(i => i.type === 'pouvoir');
  
  // Group powers by array
  const arrays = {};
  powers.forEach(p => {
    const link = p.system.link;
    if (link) {
      if (!arrays[link]) arrays[link] = [link]; // Parent ID is the key, and first member
      arrays[link].push(p._id);
    }
  });

  // Calculate costs for arrays
  const arrayCosts = {};
  for (const parentId in arrays) {
    const members = arrays[parentId];
    let maxCost = 0;
    
    members.forEach(id => {
      const p = actor.items.get(id);
      if (!p) return;
      
      const c = p.system.cout;
      const baseRank = c.rang || 0;
      const baseCostPerRank = c.parrang || 0;
      const modCostPerRank = c.modrang || 0;
      const flatCost = c.modfixe || 0;
      const divers = c.divers || 0;

      let netCostPerRank = baseCostPerRank + modCostPerRank;
      let totalRankCost = 0;

      if (netCostPerRank > 0) {
        totalRankCost = netCostPerRank * baseRank;
      } else {
        let ranksPerPoint = 2 - netCostPerRank;
        totalRankCost = Math.ceil(baseRank / ranksPerPoint);
      }
      
      const fullCost = Math.max(1, totalRankCost + flatCost + divers);
      if (fullCost > maxCost) maxCost = fullCost;
    });
    arrayCosts[parentId] = maxCost;
  }

  for (let item of actor.items) {
    const update = { _id: item._id };
    let needsUpdate = false;

    // Fix Powers (pouvoir)
    if (item.type === 'pouvoir') {
      // 1. Fix arrays to objects
      if (Array.isArray(item.system.extras)) {
        const obj = {};
        item.system.extras.forEach((e, i) => { if (e) obj[i + 1] = e; });
        update['system.extras'] = obj;
        needsUpdate = true;
      }
      if (Array.isArray(item.system.defauts)) {
        const obj = {};
        item.system.defauts.forEach((f, i) => { if (f) obj[i + 1] = f; });
        update['system.defauts'] = obj;
        needsUpdate = true;
      }

      // 2. Fix "simple" to "standard"
      if (item.system.special === 'simple') {
        update['system.special'] = 'standard';
        needsUpdate = true;
      }

      // 3. Array Cost Logic
      const link = item.system.link;
      const isParent = arrays[item._id];
      const isChild = !!link;

      if (isParent || isChild) {
        const parentId = isParent ? item._id : link;
        const maxCost = arrayCosts[parentId];
        
        // If it's the parent, it gets the max cost. 
        // (Wait, in standard M&M any power could be the primary, but we'll assign to parent for simplicity or if it is the max)
        // The user said "The Array costs only the most expensive power... The remaining powers do not cost anything"
        
        let targetCost = 0;
        // We need to decide which one gets the max cost. Let's pick the one that IS the max cost.
        // If multiple have the same max cost, the parent or the first one found gets it.
        
        const members = arrays[parentId];
        // Find which member should bear the cost
        let costBearerId = parentId;
        let highestFound = -1;
        members.forEach(id => {
          const p = actor.items.get(id);
          if (!p) return;
          const c = p.system.cout;
          const bc = c.parrang || 0;
          const mr = c.modrang || 0;
          const r = c.rang || 0;
          const fc = c.modfixe || 0;
          const d = c.divers || 0;
          const net = bc + mr;
          const full = net > 0 ? (net * r + fc + d) : (Math.ceil(r / (2 - net)) + fc + d);
          if (full > highestFound) {
            highestFound = full;
            costBearerId = id;
          }
        });

        targetCost = (item._id === costBearerId) ? maxCost : 0;

        if (item.system.cout.total !== targetCost) {
          update['system.cout.total'] = targetCost;
          needsUpdate = true;
        }
      }
    }

    // Fix Talents (advantages) missing cost data
    if (item.type === 'talent' && !item.system.cout) {
      update['system.cout'] = {
        rang: item.system.rang || 1,
        parrang: 1,
        total: item.system.rang || 1
      };
      needsUpdate = true;
    }

    if (needsUpdate) updates.push(update);
  }

  if (updates.length > 0) {
    console.log(`M&M 3e Expanded | Self-Healing: Fixing ${updates.length} items on ${actor.name}`);
    await actor.updateEmbeddedDocuments('Item', updates);
  }
}

Hooks.on('renderActorSheet', (app, html, data) => {
  if (app.actor.type !== 'personnage') return;

  // Run self-healing
  healActorData(app.actor);

  // --- Drag and Drop Sorting for Powers ---
  const powerList = html.find('.pouvoir-list, .item-list');
  const powers = powerList.find('.item.pouvoir, .pouvoir-item');

  powers.attr('draggable', true);

  powers.on('dragstart', (ev) => {
    const li = ev.currentTarget;
    ev.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'Item',
      uuid: app.actor.items.get(li.dataset.itemId).uuid,
      sort: parseInt(li.dataset.sort || 0)
    }));
  });

  powerList.on('drop', async (ev) => {
    const dragData = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));
    if (dragData.type !== 'Item') return;

    const targetLi = $(ev.target).closest('.item');
    if (!targetLi.length) return;

    const targetId = targetLi.data('itemId');
    const sourceId = dragData.uuid.split('.').pop();
    if (targetId === sourceId) return;

    const siblings = app.actor.items.filter(i => i.type === 'pouvoir');
    const sourceItem = app.actor.items.get(sourceId);
    const targetItem = app.actor.items.get(targetId);

    if (!sourceItem || !targetItem) return;

    const updates = SortingHelpers.performIntegerSort(sourceItem, {
      target: targetItem,
      siblings: siblings,
      sortKey: 'sort'
    });

    const updateData = updates.map(u => ({
      _id: u.target._id,
      sort: u.update.sort
    }));

    await app.actor.updateEmbeddedDocuments('Item', updateData);
  });
});

Hooks.on('renderItemSheet', (app, html, data) => {
  if (app.item.type !== 'pouvoir') return;

  // --- Drag and Drop Sorting for Modifiers ---
  const modifiers = html.find('.extras-list .item, .flaws-list .item, .modifier-item');
  modifiers.attr('draggable', true);

  modifiers.on('dragstart', (ev) => {
    const li = ev.currentTarget;
    ev.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
      index: li.dataset.index,
      type: li.closest('.extras-list').length ? 'extras' : 'defauts'
    }));
  });

  html.find('.extras-list, .flaws-list').on('drop', async (ev) => {
    const dragData = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));
    const dropType = ev.currentTarget.classList.contains('extras-list') ? 'extras' : 'defauts';
    
    if (dragData.type !== dropType) return;

    const targetLi = $(ev.target).closest('.item, .modifier-item');
    if (!targetLi.length) return;

    const oldIndex = parseInt(dragData.index);
    const newIndex = parseInt(targetLi.data('index'));
    if (oldIndex === newIndex) return;

    const list = duplicate(app.item.system[dropType]);
    const entries = Object.entries(list).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    
    const [moved] = entries.splice(oldIndex - 1, 1);
    entries.splice(newIndex - 1, 0, moved);

    const newList = {};
    entries.forEach((entry, i) => {
      newList[i + 1] = entry[1];
    });

    await app.item.update({ [`system.${dropType}`]: newList });
  });
});
