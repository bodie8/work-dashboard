    const GITHUB_USER = 'bodie8';
    const GITHUB_REPO = 'work-dashboard';
    const GITHUB_FILE = 'prebuilt.html';
    const GITHUB_BRANCH = 'main';

    // ── Step management ──────────────────────────────────────────────

    function initStepsSortable(listId) {
      const el = document.getElementById(listId);
      if (!el || !window.Sortable) return;
      Sortable.create(el, {
        handle: '.drag-grip',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: () => renumberSteps(listId)
      });
    }

    function renumberSteps(listId) {
      const list = document.getElementById(listId);
      if (!list) return;
      list.querySelectorAll('.step-num').forEach((num, i) => {
        num.textContent = i + 1;
        num.onclick = function() { this.closest('.step').classList.toggle('done'); };
      });
    }

    function addStep(listId) {
      const list = document.getElementById(listId);
      const count = list.querySelectorAll('.step').length + 1;
      const li = document.createElement('li');
      li.className = 'step';
      li.innerHTML = `
        <span class="drag-grip" title="Drag to reorder">⠿</span>
        <div class="step-num" onclick="this.closest('.step').classList.toggle('done')" title="Mark complete">${count}</div>
        <div class="step-body">
          <div class="step-text" contenteditable="true">New step</div>
        </div>
        <div class="step-time" contenteditable="true">TBD</div>
        <div class="step-controls">
          <span class="step-delete" onclick="deleteStep(this)" title="Remove step">&times;</span>
        </div>
      `;
      list.appendChild(li);
      li.querySelector('[contenteditable]').focus();
    }

    function deleteStep(btn) {
      const step = btn.closest('.step');
      const list = step.closest('.steps');
      step.style.visibility = 'hidden';
      setTimeout(() => {
        step.remove();
        renumberSteps(list.id);
      }, 150);
    }

    // ── Save to GitHub ───────────────────────────────────────────────

    let cachedSha = null;
    let isSaving = false;

    function getToken() {
      let token = localStorage.getItem('gh_prebuilt_token');
      if (!token) {
        token = prompt('Enter your GitHub personal access token:');
        if (token) localStorage.setItem('gh_prebuilt_token', token.trim());
      }
      return token;
    }

    function resetToken() {
      localStorage.removeItem('gh_prebuilt_token');
      alert('Token cleared. You will be prompted for a new token on next save.');
    }

    function buildHTML() {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

      // Sync .done class on steps by index within the card
      const liveSteps = document.querySelectorAll('.step');
      const cloneSteps = clone.querySelectorAll('.step');
      liveSteps.forEach((liveStep, i) => {
        if (!cloneSteps[i]) return;
        if (liveStep.classList.contains('done')) {
          cloneSteps[i].classList.add('done');
        } else {
          cloneSteps[i].classList.remove('done');
        }
      });

      // Clean up SortableJS artifacts
      clone.querySelectorAll('[draggable="false"]').forEach(el => el.removeAttribute('draggable'));
      clone.querySelectorAll('[style=""]').forEach(el => el.removeAttribute('style'));
      clone.querySelectorAll('.sortable-ghost').forEach(el => el.classList.remove('sortable-ghost'));
      clone.querySelectorAll('.edit-hint').forEach(el => el.remove());

      return '<!DOCTYPE html>\n' + clone.outerHTML;
    }

    async function savePage() {
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
            message: `PreBuilt Courses update ${new Date().toLocaleString()}`,
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

    // ── Init ─────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', () => {
      initStepsSortable('steps-prebuilt');
    });
