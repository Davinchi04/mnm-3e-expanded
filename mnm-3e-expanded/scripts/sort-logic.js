Hooks.on('renderActorSheet', (app, html, data) => {
  // Only target the M&M 3e system sheets
  if (app.actor.type !== 'personnage') return;

  const powerList = html.find('.pouvoir-list, .item-list');
  const powers = powerList.find('.item.pouvoir, .pouvoir-item');

  // Make powers draggable for sorting
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
    const data = JSON.parse(ev.originalEvent.dataTransfer.getData('text/plain'));
    if (data.type !== 'Item') return;

    const targetLi = $(ev.target).closest('.item');
    if (!targetLi.length) return;

    const targetId = targetLi.data('itemId');
    const sourceId = data.uuid.split('.').pop();
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

  // Add drag-and-drop handles for Extras and Flaws
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

    const oldIndex = dragData.index;
    const newIndex = targetLi.data('index');
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
