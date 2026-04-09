document.addEventListener('DOMContentLoaded', () => {
  // Global Tool Switching Logic
  const sidebarItems = document.querySelectorAll('.sidebar-item[data-tool]');
  const toolSections = document.querySelectorAll('.tool-section');

  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const toolId = item.dataset.tool;
      if (!toolId) return;

      // Update Sidebar UI
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update Content UI
      toolSections.forEach(section => {
        section.style.display = section.id === `tool-${toolId}` ? 'flex' : 'none';
      });
    });
  });

  // --- JSON Parser Logic ---
  const jsonInput = document.getElementById('json-input');
  const interactiveViewer = document.getElementById('interactive-viewer');
  const errorOverlay = document.getElementById('error-overlay');
  const copyFormattedBtn = document.getElementById('copy-formatted-btn');
  const copyMinifiedBtn = document.getElementById('copy-minified-btn');

  let parsedJson = null;

  const initialJson = {
    "project": "Web Toolkit",
    "features": ["JSON Parser", "Text Diff"],
    "status": "active"
  };
  jsonInput.value = JSON.stringify(initialJson, null, 2);

  function updateJsonViewer() {
    const val = jsonInput.value.trim();
    if (!val) { clearJson(); return; }
    try {
      parsedJson = JSON.parse(val);
      errorOverlay.classList.remove('visible');
      renderJson();
    } catch (e) {
      errorOverlay.textContent = `Invalid JSON: ${e.message}`;
      errorOverlay.classList.add('visible');
    }
  }

  function renderJson() {
    interactiveViewer.innerHTML = '';
    interactiveViewer.appendChild(createTree(parsedJson, 'root', true));
  }

  function clearJson() {
    interactiveViewer.innerHTML = '';
    errorOverlay.classList.remove('visible');
    parsedJson = null;
  }

  function provideCopyFeedback(btn, originalText) {
    btn.textContent = 'Copied!';
    btn.classList.add('active');
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove('active');
    }, 2000);
  }

  copyFormattedBtn.addEventListener('click', () => {
    if (parsedJson) {
      navigator.clipboard.writeText(JSON.stringify(parsedJson, null, 2));
      provideCopyFeedback(copyFormattedBtn, 'Copy Formatted');
    }
  });

  copyMinifiedBtn.addEventListener('click', () => {
    if (parsedJson) {
      navigator.clipboard.writeText(JSON.stringify(parsedJson));
      provideCopyFeedback(copyMinifiedBtn, 'Copy Minified');
    }
  });

  jsonInput.addEventListener('input', updateJsonViewer);

  // --- Base64 Logic ---
  const b64TextInput = document.getElementById('base64-text-input');
  const b64Output = document.getElementById('base64-output');
  const b64Error = document.getElementById('base64-error');
  const copyTextBtn = document.getElementById('copy-text-btn');
  const copyB64Btn = document.getElementById('copy-base64-btn');

  function updateB64FromText() {
    try {
      const val = b64TextInput.value;
      b64Output.value = btoa(unescape(encodeURIComponent(val))); // Handle Unicode
      b64Error.classList.remove('visible');
    } catch (e) {
      b64Error.textContent = `Error: ${e.message}`;
      b64Error.classList.add('visible');
    }
  }

  function updateTextFromB64() {
    try {
      const val = b64Output.value.trim();
      if (!val) { b64TextInput.value = ''; b64Error.classList.remove('visible'); return; }
      b64TextInput.value = decodeURIComponent(escape(atob(val))); // Handle Unicode
      b64Error.classList.remove('visible');
    } catch (e) {
      b64Error.textContent = `Invalid Base64: ${e.message}`;
      b64Error.classList.add('visible');
    }
  }

  b64TextInput.addEventListener('input', updateB64FromText);
  b64Output.addEventListener('input', updateTextFromB64);

  copyTextBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(b64TextInput.value);
    provideCopyFeedback(copyTextBtn, 'Copy');
  });

  copyB64Btn.addEventListener('click', () => {
    navigator.clipboard.writeText(b64Output.value);
    provideCopyFeedback(copyB64Btn, 'Copy');
  });

  // (createTree function remains the same as before, moved here for scope)
  function createTree(value, key = '', isRoot = false) {
    const node = document.createElement('div');
    node.className = 'tree-node';
    const header = document.createElement('div');
    header.className = 'tree-node-header';
    const type = typeof value;
    const isObject = value !== null && type === 'object';
    
    let toggle = null;
    if (isObject) {
      toggle = document.createElement('span');
      toggle.className = 'tree-toggle';
      toggle.textContent = '−'; // Minus sign
      header.appendChild(toggle);
    }
    
    if (key && !isRoot) {
      const keySpan = document.createElement('span');
      keySpan.className = 'tree-key';
      keySpan.textContent = `"${key}": `;
      header.appendChild(keySpan);
    }
    
    const content = document.createElement('div');
    content.className = 'tree-node-content';
    
    if (isObject) {
      const isArray = Array.isArray(value);
      const meta = document.createElement('span');
      meta.className = 'tree-meta';
      meta.textContent = `${isArray ? '[' : '{'}${isArray ? value.length : Object.keys(value).length} items${isArray ? ']' : '}'}`;
      header.appendChild(meta);
      
      Object.entries(value).forEach(([k, v]) => content.appendChild(createTree(v, k)));
      
      header.addEventListener('click', () => {
        node.classList.toggle('collapsed');
        if (toggle) {
          toggle.textContent = node.classList.contains('collapsed') ? '+' : '−';
        }
      });
    } else {
      const vSpan = document.createElement('span');
      if (value === null) vSpan.className = 'tree-null', vSpan.textContent = 'null';
      else if (type === 'string') vSpan.className = 'tree-string', vSpan.textContent = `"${value}"`;
      else if (type === 'number') vSpan.className = 'tree-number', vSpan.textContent = value;
      else if (type === 'boolean') vSpan.className = 'tree-boolean', vSpan.textContent = value;
      header.appendChild(vSpan);
    }
    
    node.appendChild(header);
    if (isObject) node.appendChild(content);
    return node;
  }

  // --- Text Diff Logic ---
  const diffInput1 = document.getElementById('diff-input-1');
  const diffInput2 = document.getElementById('diff-input-2');
  const diffViewer = document.getElementById('diff-viewer');
  const diffModeButtons = document.querySelectorAll('#tool-text-diff .mode-btn');

  let diffMode = 'line'; // 'line' or 'word'

  const initialText1 = "The quick brown fox jumps over the lazy dog.\nThis is a line that will stay.\nThis line will be removed.";
  const initialText2 = "The quick brown fox leaps over the lazy dog.\nThis is a line that will stay.\nThis line was added!";
  diffInput1.value = initialText1;
  diffInput2.value = initialText2;

  function updateDiff() {
    const text1 = diffInput1.value;
    const text2 = diffInput2.value;
    
    let diff;
    if (diffMode === 'line') {
      diff = Diff.diffLines(text1, text2);
    } else {
      diff = Diff.diffWords(text1, text2);
    }

    diffViewer.innerHTML = '';
    
    diff.forEach(part => {
      const span = document.createElement('span');
      span.className = 'diff-line';
      
      if (part.added) {
        span.classList.add('diff-added');
        if (diffMode === 'word') {
          span.classList.remove('diff-line');
          span.classList.add('diff-word-added');
        } else {
          span.textContent = `+ ${part.value}`;
        }
      } else if (part.removed) {
        span.classList.add('diff-removed');
        if (diffMode === 'word') {
          span.classList.remove('diff-line');
          span.classList.add('diff-word-removed');
        } else {
          span.textContent = `- ${part.value}`;
        }
      } else {
        span.classList.add('diff-unchanged');
        if (diffMode === 'line') {
          span.textContent = `  ${part.value}`;
        }
      }

      if (diffMode === 'word') {
        span.textContent = part.value;
        diffViewer.appendChild(span);
      } else {
        diffViewer.appendChild(span);
      }
    });
  }

  [diffInput1, diffInput2].forEach(el => el.addEventListener('input', updateDiff));
  
  diffModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      diffModeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      diffMode = btn.dataset.diffMode;
      updateDiff();
    });
  });

  // Initial render
  updateJsonViewer();
  updateDiff();
});
