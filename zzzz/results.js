(async function(){
  const res = await fetch('data.json');
  const data = await res.json();
  const resultsList = document.getElementById('resultsList');
  if (!resultsList) return;

  // Utility per colore rhombus in base a prio
  function getRhombusColor(priority, status) {
    if (status === 'done') return '#bdbdbd';
    if (priority === 'high') return '#e53935';
    if (priority === 'medium') return '#ff9800';
    if (priority === 'low') return '#fff';
    return '#bdbdbd';
  }

  // Render ricorsivo solo di section e task
  function renderNode(node, indent = 0) {
    if (node.type === 'section') {
      const li = document.createElement('li');
      li.className = 'tree-section';
      li.textContent = node.text || node.title || 'Sezione';
      li.style.marginLeft = (indent * 18) + 'px';
      resultsList.appendChild(li);
      if (node.children && node.children.length) {
        node.children.forEach(child => renderNode(child, indent + 1));
      }
    } else if (node.type === 'task') {
      const li = document.createElement('li');
      li.className = 'tree-task';
      li.style.marginLeft = (indent * 18) + 'px';
      const row = document.createElement('span');
      row.className = 'tree-task-row';
      // Rhombus SVG pixel-perfect
      const rhombus = document.createElement('span');
      rhombus.className = 'tree-rhombus';
      rhombus.innerHTML = `<svg width="6" height="6" viewBox="0 0 6 6" style="display:block;"><rect x="0" y="0" width="6" height="6" fill="currentColor" transform="rotate(45 2 2)"/></svg>`;
      rhombus.style.color = getRhombusColor(node.priority, node.status);
      row.appendChild(rhombus);
      // Note icon (matita)
      const hasNotes = (node.notes && node.notes.length) || (node.children && node.children.some(c => c.type === 'note'));
      if (hasNotes) {
        const noteIcon = document.createElement('span');
        noteIcon.className = 'tree-note-icon';
        noteIcon.textContent = '✏️';
        row.appendChild(noteIcon);
      }
      // Meta icon
      const hasMeta = node.meta && Object.keys(node.meta).length > 0;
      if (hasMeta) {
        const metaIcon = document.createElement('span');
        metaIcon.className = 'tree-meta-icon';
        metaIcon.textContent = '@';
        row.appendChild(metaIcon);
      }
      // Testo task
      const text = document.createElement('span');
      text.className = 'tree-task-text';
      text.textContent = node.text;
      row.appendChild(text);
      // Tooltip solo se ci sono meta o note
      if (hasMeta || hasNotes) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tree-tooltip';
        if (hasMeta) {
          const metaLine = Object.entries(node.meta)
            .map(([k, v]) => v ? `@${k}:${v}` : `@${k}`)
            .join(', ');
          const metaDiv = document.createElement('div');
          metaDiv.className = 'tree-tooltip-meta';
          metaDiv.textContent = metaLine;
          tooltip.appendChild(metaDiv);
        }
        if (hasMeta && hasNotes) {
          tooltip.appendChild(document.createElement('br'));
        }
        if (hasNotes) {
          const notes = [
            ...(node.notes ? node.notes.map(n => n.text) : []),
            ...(node.children ? node.children.filter(c => c.type === 'note').map(n => n.text) : [])
          ];
          const notesDiv = document.createElement('div');
          notesDiv.className = 'tree-tooltip-notes';
          notesDiv.textContent = notes.join('\n');
          tooltip.appendChild(notesDiv);
        }
        row.appendChild(tooltip);
        let tooltipHover = false, rowHover = false, hideTimeout;
        const show = () => {
          clearTimeout(hideTimeout);
          tooltip.classList.add('show');
        };
        const hide = () => {
          hideTimeout = setTimeout(() => {
            if (!tooltipHover && !rowHover) tooltip.classList.remove('show');
          }, 80);
        };
        row.addEventListener('mouseenter', () => { rowHover = true; show(); });
        row.addEventListener('mouseleave', () => { rowHover = false; hide(); });
        tooltip.addEventListener('mouseenter', () => { tooltipHover = true; show(); });
        tooltip.addEventListener('mouseleave', () => { tooltipHover = false; hide(); });
      }
      if (node.status === 'done') li.classList.add('tree-task-done');
      li.appendChild(row);
      resultsList.appendChild(li);
    }
    // Ricorsione su tutti i children
    if (node.children && node.children.length) {
      node.children.forEach(child => renderNode(child, indent + 1));
    }
  }

  resultsList.innerHTML = '';
  if (data && data.children) {
    data.children.forEach(child => renderNode(child, 0));
  }
})();