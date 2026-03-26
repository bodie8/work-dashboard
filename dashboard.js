function resizeWindow() {
      window.resizeTo(1260, 860);
    }

    // Auto-resize window to target dimensions on load
    (function() {
      const W = 1260, H = 860;
      if (!window.opener && (window.outerWidth < W - 20 || window.outerHeight < H - 20)) {
        window.open(location.href, '_blank', `width=${W},height=${H}`);
        location.replace('about:blank');
      } else {
        window.resizeTo(W, H);
      }
    })();

    // Sortable: status board columns (drag between columns)
    ['board-inprogress','board-frontburner','board-waiting','board-radar'].forEach(id => {
      Sortable.create(document.getElementById(id), {
        group: 'board',
        handle: '.drag-grip',
        animation: 150,
        ghostClass: 'sortable-ghost'
      });
    });

    // Sortable: project cards grid
    Sortable.create(document.getElementById('cards-container'), {
      animation: 150,
      ghostClass: 'sortable-ghost',
      handle: '.drag-grip'
    });

    // Sortable: steps within each card
    function initStepsSortable(listId) {
      const el = document.getElementById(listId);
      if (!el) return;
      Sortable.create(el, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        handle: '.drag-grip',
        onEnd: renumberSteps
      });
    }
    document.querySelectorAll('.steps[id]').forEach(el => initStepsSortable(el.id));

    // Sortable: backlog lists (drag between groups)
    ['backlog-guides','backlog-canvas','backlog-other'].forEach(id => {
      Sortable.create(document.getElementById(id), {
        group: 'backlog',
        handle: '.backlog-grip',
        animation: 150,
        ghostClass: 'sortable-ghost'
      });
    });

    // Renumber step bubbles after reorder
    function renumberSteps() {
      document.querySelectorAll('.steps').forEach(list => {
        list.querySelectorAll('.step').forEach((step, i) => {
          const num = step.querySelector('.step-num');
          if (num) {
            num.textContent = i + 1;
            num.onclick = function() { this.closest('.step').classList.toggle('done'); };
            num.title = 'Mark complete';
          }
        });
      });
    }

    // Add a step to a card
    function addStep(stepsId) {
      const list = document.getElementById(stepsId);
      const count = list.querySelectorAll('.step').length + 1;
      const li = document.createElement('li');
      li.className = 'step';
      li.innerHTML = `
        <span class="drag-grip" style="margin-top:5px;" title="Drag to reorder">⠿</span>
          <div class="step-num" onclick="this.closest('.step').classList.toggle('done')" title="Mark complete">${count}</div>
        <div class="step-body">
          <div class="step-text" contenteditable="true">New step</div>
        </div>
        <div class="step-time" contenteditable="true">TBD</div>
        <div class="step-controls"><span class="step-delete" onclick="if(confirm('Remove this step?')) { this.closest('.step').remove(); renumberSteps(); }" title="Remove step">&times;</span></div>
      `;
      list.appendChild(li);
      li.querySelector('[contenteditable]').focus();
    }



    // Column-to-badge mapping
    const colBadgeMap = {
      'board-inprogress':  { badgeClass: 'badge-progress', badgeLabel: 'In Progress', cardClass: 'card-progress' },
      'board-frontburner': { badgeClass: 'badge-soon',     badgeLabel: 'Do Soon',     cardClass: 'card-soon'     },
      'board-waiting':     { badgeClass: 'badge-waiting',  badgeLabel: 'Waiting',     cardClass: 'card-waiting'  },
      'board-radar':       { badgeClass: 'badge-radar',    badgeLabel: 'On the Radar', cardClass: 'card-radar'   }
    };

    // Add a board item — prompts Note vs Card
    function addBoardItem(listId) {
      document.getElementById('add-type-modal').classList.add('open');
      document.getElementById('add-type-modal').dataset.listId = listId;
    }

    function confirmAddNote() {
      const listId = document.getElementById('add-type-modal').dataset.listId;
      document.getElementById('add-type-modal').classList.remove('open');
      const list = document.getElementById(listId);
      const div = document.createElement('div');
      div.className = 'board-item';
      div.innerHTML = `
        <span class="drag-grip" title="Drag to reorder">⠿</span>
        <div class="board-item-content">
          <span contenteditable="true">New item</span>
          <div class="sub" contenteditable="true">Details</div>
        </div>
        <span class="board-item-delete" onclick="if(confirm('Remove this item?')) this.closest('.board-item').remove()" title="Remove">&times;</span>
      `;
      list.appendChild(div);
      div.querySelector('[contenteditable]').focus();
    }

    function confirmAddCard() {
      const listId = document.getElementById('add-type-modal').dataset.listId;
      document.getElementById('add-type-modal').classList.remove('open');
      const mapping = colBadgeMap[listId] || { badgeClass: 'badge-soon', badgeLabel: 'Do Soon', cardClass: 'card-soon' };

      // Create the card
      cardCounter++;
      const cardId = 'card-new-' + cardCounter;
      const stepsId = 'steps-new-' + cardCounter;
      const container = document.getElementById('cards-container');
      const div = document.createElement('div');
      div.className = `card ${mapping.cardClass}`;
      div.id = cardId;
      div.innerHTML = `
        <div class="card-top">
          <span class="drag-grip" style="font-size:0.9rem;align-self:flex-start;margin-top:4px;" title="Drag to reorder">⠿</span>
        <div class="card-title" contenteditable="true">New Project</div>
          <div class="badge ${mapping.badgeClass}" onclick="openBadgePicker(this)">${mapping.badgeLabel}</div>
          <span class="card-controls" onclick="removeCard(this)" title="Remove card">&times;</span>
        </div>
        <div class="card-meta" contenteditable="true">Est. total: TBD</div>
        <ul class="steps" id="${stepsId}">
          <li class="step">
            <span class="drag-grip" style="margin-top:5px;" title="Drag to reorder">⠿</span>
          <div class="step-num" onclick="this.closest('.step').classList.toggle('done')" title="Mark complete">1</div>
            <div class="step-body">
              <div class="step-text" contenteditable="true">First step</div>
            </div>
            <div class="step-time" contenteditable="true">TBD</div>
            <div class="step-controls"><span class="step-delete" onclick="if(confirm('Remove this step?')) { this.closest('.step').remove(); renumberSteps(); }" title="Remove step">&times;</span></div>
          </li>
        </ul>
        <div class="add-step" onclick="addStep('${stepsId}')">+ Add step</div>
      `;
      container.appendChild(div);
      initStepsSortable(stepsId);

      // Also add a linked board entry
      const list = document.getElementById(listId);
      const boardDiv = document.createElement('div');
      boardDiv.className = 'board-item';
      boardDiv.innerHTML = `
        <span class="drag-grip" title="Drag to reorder">⠿</span>
        <div class="board-item-content">
          <a href="#${cardId}" class="board-link" contenteditable="false">New Project</a>
          <div class="sub" contenteditable="true">New card — see details below</div>
        </div>
        <span class="board-item-delete" onclick="if(confirm('Remove this item?')) this.closest('.board-item').remove()" title="Remove">&times;</span>
      `;
      list.appendChild(boardDiv);

      // Scroll to and focus the new card title, wire up sync
      div.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const titleEl = div.querySelector('.card-title');
        titleEl.focus();
        titleEl.addEventListener('input', () => syncBoardLink(cardId, titleEl.textContent.trim()));
      }, 400);
    }

    // Add a backlog item
    function addBacklogItem(listId) {
      const list = document.getElementById(listId);
      const div = document.createElement('div');
      div.className = 'backlog-item';
      div.innerHTML = `
        <span contenteditable="true">New item</span>
        <span class="backlog-item-controls" onclick="if(confirm('Remove this item?')) this.closest('.backlog-item').remove()" title="Remove">&times;</span>
      `;
      list.appendChild(div);
      div.querySelector('[contenteditable]').focus();
    }

    // Add a new project card (from toolbar button)
    // Initialize counter above any card-new-N IDs already in the DOM
    let cardCounter = 100;
    document.querySelectorAll('[id^="card-new-"]').forEach(el => {
      const n = parseInt(el.id.replace('card-new-', ''), 10);
      if (n > cardCounter) cardCounter = n;
    });
    function addCard() {
      cardCounter++;
      const stepsId = 'steps-new-' + cardCounter;
      const container = document.getElementById('cards-container');
      const div = document.createElement('div');
      div.className = 'card card-soon';
      div.innerHTML = `
        <div class="card-top">
          <span class="drag-grip" style="font-size:0.9rem;align-self:flex-start;margin-top:4px;" title="Drag to reorder">⠿</span>
        <div class="card-title" contenteditable="true">New Project</div>
          <div class="badge badge-soon" onclick="openBadgePicker(this)">Do Soon</div>
          <span class="card-controls" onclick="removeCard(this)" title="Remove card">&times;</span>
        </div>
        <div class="card-meta" contenteditable="true">Est. total: TBD</div>
        <ul class="steps" id="${stepsId}">
          <li class="step">
            <span class="drag-grip" style="margin-top:5px;" title="Drag to reorder">⠿</span>
          <div class="step-num" onclick="this.closest('.step').classList.toggle('done')" title="Mark complete">1</div>
            <div class="step-body">
              <div class="step-text" contenteditable="true">First step</div>
            </div>
            <div class="step-time" contenteditable="true">TBD</div>
            <div class="step-controls"><span class="step-delete" onclick="if(confirm('Remove this step?')) { this.closest('.step').remove(); renumberSteps(); }" title="Remove step">&times;</span></div>
          </li>
        </ul>
        <div class="add-step" onclick="addStep('${stepsId}')">+ Add step</div>
      `;
      container.appendChild(div);
      initStepsSortable(stepsId);
      div.querySelector('.card-title').focus();
    }

    function removeCard(btn) {
      if (confirm('Remove this card?')) btn.closest('.card').remove();
    }

    // Badge picker
    let activeBadgeEl = null;
    function openBadgePicker(el) {
      activeBadgeEl = el;
      document.getElementById('badge-modal').classList.add('open');
    }
    function closeBadgePicker(e) {
      if (e.target === document.getElementById('badge-modal')) {
        document.getElementById('badge-modal').classList.remove('open');
      }
    }
    function setBadge(type, label) {
      if (!activeBadgeEl) return;
      const card = activeBadgeEl.closest('.card');
      activeBadgeEl.className = `badge badge-${type}`;
      activeBadgeEl.textContent = label;
      card.className = card.className.replace(/\bcard-(soon|waiting|progress|deadline|radar)\b/g, '').trim();
      card.classList.add({ soon:'card-soon', waiting:'card-waiting', progress:'card-progress', deadline:'card-deadline', radar:'card-radar' }[type]);
      document.getElementById('badge-modal').classList.remove('open');

      // Sync the board column — move the linked board item to the matching column
      const colMap = {
        deadline: 'board-frontburner',
        soon:     'board-frontburner',
        progress: 'board-inprogress',
        radar:    'board-radar',
        waiting:  'board-waiting'
      };
      const cardId = card.id;
      if (cardId) {
        const boardLink = document.querySelector(`a.board-link[href="#${cardId}"]`);
        if (boardLink) {
          const boardItem = boardLink.closest('.board-item');
          const targetListId = colMap[type];
          const targetList = document.getElementById(targetListId);
          if (boardItem && targetList && !targetList.contains(boardItem)) {
            targetList.appendChild(boardItem);
          }
        }
      }
    }

    // Sort cards by status priority, then by overview board order within each status
    function sortCards() {
      const container = document.getElementById('cards-container');
      const cards = Array.from(container.querySelectorAll('.card'));

      // Determine badge status priority
      const getType = el => {
        if (!el) return 99;
        const cls = el.className;
        if (cls.includes('badge-deadline')) return 0;
        if (cls.includes('badge-soon'))     return 1;
        if (cls.includes('badge-progress')) return 2;
        if (cls.includes('badge-radar'))    return 3;
        if (cls.includes('badge-waiting'))  return 4;
        return 5;
      };

      // Build an order map from the overview board — card ID -> position
      // Board links appear in column order (top to bottom, left to right)
      // reflecting the user's manual priority within each status group
      const boardOrder = {};
      document.querySelectorAll('.board-link[href^="#"]').forEach((link, i) => {
        const cardId = link.getAttribute('href').replace('#', '');
        if (!(cardId in boardOrder)) boardOrder[cardId] = i;
      });

      cards.sort((a, b) => {
        const badgeA = a.querySelector('.card-top .badge');
        const badgeB = b.querySelector('.card-top .badge');
        const typeA = getType(badgeA);
        const typeB = getType(badgeB);

        if (typeA !== typeB) return typeA - typeB;

        // Same status — use board order, fall back to current DOM order for unlinked cards
        const orderA = (a.id in boardOrder) ? boardOrder[a.id] : 9999;
        const orderB = (b.id in boardOrder) ? boardOrder[b.id] : 9999;
        return orderA - orderB;
      });

      // Re-append in sorted order
      cards.forEach(card => container.appendChild(card));
    }

    // GitHub config — update these two values to match your repo
    const GITHUB_USER = 'bodie8';
    const GITHUB_REPO = 'work-dashboard';
    const GITHUB_FILE = 'index.html';
    const GITHUB_BRANCH = 'main';

    // Get or prompt for token, stored in localStorage
    function getToken() {
      let token = localStorage.getItem('gh_dashboard_token');
      if (!token) {
        token = prompt('Enter your GitHub Personal Access Token:\n(It will be saved in your browser — never shared)');
        if (token) localStorage.setItem('gh_dashboard_token', token.trim());
      }
      return token ? token.trim() : null;
    }

    function clearToken() {
      localStorage.removeItem('gh_dashboard_token');
      alert('Token cleared. You will be prompted again on next save.');
    }

    // Cached SHA and save guard
    let cachedSha = null;
    let isSaving = false;

    // Build the HTML to save
    function buildHTML() {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
      const stamp = `Last updated: ${dateStr} &nbsp;·&nbsp; Managed with Claude`;
      document.getElementById('footer').innerHTML = stamp;
      document.getElementById('subtitle').innerHTML = stamp;

      const clone = document.documentElement.cloneNode(true);

      // Sync all contenteditable innerHTML from live DOM into clone
      const liveEditables = document.querySelectorAll('[contenteditable]');
      const cloneEditables = clone.querySelectorAll('[contenteditable]');
      liveEditables.forEach((el, i) => {
        if (cloneEditables[i]) cloneEditables[i].innerHTML = el.innerHTML;
      });

      // Sync .done class on steps by card ID + index
      document.querySelectorAll('.card').forEach(liveCard => {
        const cardId = liveCard.id;
        if (!cardId) return;
        const cloneCard = clone.querySelector('#' + cardId);
        if (!cloneCard) return;
        const liveSteps = liveCard.querySelectorAll('.step');
        const cloneSteps = cloneCard.querySelectorAll('.step');
        liveSteps.forEach((liveStep, i) => {
          if (!cloneSteps[i]) return;
          if (liveStep.classList.contains('done')) {
            cloneSteps[i].classList.add('done');
          } else {
            cloneSteps[i].classList.remove('done');
          }
        });
      });

      // Clean up SortableJS artifacts
      clone.querySelectorAll('[draggable="false"]').forEach(el => el.removeAttribute('draggable'));
      clone.querySelectorAll('[contenteditable="false"]').forEach(el => {
        if (!el.classList.contains('board-link')) el.removeAttribute('contenteditable');
      });
      clone.querySelectorAll('.sortable-ghost').forEach(el => el.classList.remove('sortable-ghost'));
      clone.querySelectorAll('[style=""]').forEach(el => el.removeAttribute('style'));
      clone.querySelectorAll('.edit-hint').forEach(el => el.remove());

      // Strip browser extension injections
      clone.querySelectorAll('[id^="give-freely"], [class^="give-freely"], #ctre_styles, #ctre_wnd, #claude-agent-animation-styles, [id^="claude-agent"]').forEach(el => el.remove());

      // Always save the button in its resting state
      const cloneSaveBtn = clone.querySelector('.btn-save');
      if (cloneSaveBtn) {
        cloneSaveBtn.textContent = 'Save';
        cloneSaveBtn.disabled = false;
      }

      return '<!DOCTYPE html>\n' + clone.outerHTML;
    }

    // Save to GitHub via API
    async function saveDashboard() {
      if (isSaving) return;
      const token = getToken();
      if (!token) return;

      isSaving = true;
      const saveBtn = document.querySelector('.btn-save');
      saveBtn.textContent = 'Saving…';
      saveBtn.disabled = true;

      try {
        const apiBase = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
        const headers = {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json'
        };

        let sha = cachedSha;
        if (!sha) {
          const getRes = await fetch(`${apiBase}?ref=${GITHUB_BRANCH}`, { headers });
          if (!getRes.ok) throw new Error(`Could not fetch file: ${getRes.status} ${getRes.statusText}`);
          const fileData = await getRes.json();
          sha = fileData.sha;
        }

        const html = buildHTML();
        const encoded = btoa(unescape(encodeURIComponent(html)));

        const putRes = await fetch(apiBase, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `Dashboard update ${new Date().toLocaleString()}`,
            content: encoded,
            sha,
            branch: GITHUB_BRANCH
          })
        });

        if (!putRes.ok) {
          const errData = await putRes.json();
          if (putRes.status === 409) {
            cachedSha = null;
            throw new Error('SHA conflict — please try saving again.');
          }
          throw new Error(errData.message || putRes.statusText);
        }

        const putData = await putRes.json();
        cachedSha = putData.content?.sha || null;

        saveBtn.textContent = 'Saved ✓';
        setTimeout(() => {
          saveBtn.textContent = 'Save';
          saveBtn.disabled = false;
        }, 2500);

      } catch (err) {
        console.error('Save error:', err);
        alert(`Save failed: ${err.message}\n\nIf your token has expired, use "Reset Token" to re-enter it.`);
        saveBtn.textContent = 'Error — try again';
        setTimeout(() => {
          saveBtn.textContent = 'Save';
          saveBtn.disabled = false;
        }, 3000);
      } finally {
        isSaving = false;
      }
    }

    // Title sync — keep board link text in sync with card title when typed
    function syncBoardLink(cardId, newTitle) {
      document.querySelectorAll(`a.board-link[href="#${cardId}"]`).forEach(link => {
        link.textContent = newTitle || 'Untitled';
      });
    }

    // Wire up title sync for all existing cards on page load
    document.querySelectorAll('.card[id]').forEach(card => {
      const cardId = card.id;
      const titleEl = card.querySelector('.card-title');
      if (titleEl) {
        titleEl.addEventListener('input', () => syncBoardLink(cardId, titleEl.textContent.trim()));
      }
    });
