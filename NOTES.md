# Work Dashboard — Project Notes for Claude

## Overview
A self-contained interactive work dashboard for Chris (TMI dept, Butte College).
Built as three files hosted on GitHub Pages. The Save button commits changes
directly to the repo via the GitHub API — no manual file management needed.

**Owner:** Chris  
**Live URL:** https://bodie8.github.io/work-dashboard/  
**Repo:** https://github.com/bodie8/work-dashboard  
**Branch:** main  

---

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | All HTML structure and content |
| `dashboard.css` | All styles |
| `dashboard.js` | All JavaScript — interactivity, save logic, Sortable init |
| `NOTES.md` | This file |

External dependency: SortableJS 1.15.2 via cdnjs CDN (loaded in index.html head).

---

## Key Features

### Status Board (Project Status Overview)
- 4 columns: Front Burner, In Progress, On the Radar, Waiting on Others
- Column IDs: `board-frontburner`, `board-inprogress`, `board-radar`, `board-waiting`
- Items are draggable between columns via SortableJS (handle: `.drag-grip`)
- Linked items use `<a class="board-link" href="#card-id">` — not contenteditable
- Plain note items use `<span contenteditable="true">` — editable in place
- Sub-text uses `<div class="sub" contenteditable="true">`
- Delete: hover-reveal `×` span (`.board-item-delete`), absolutely positioned

### Project Cards (Active Project Detail)
- 2-column grid (`#cards-container`)
- Each card: `<div class="card card-{status}" id="card-{name}">`
- Card drag handle: `.drag-grip` on card-top (not the title)
- Badge click opens badge picker modal to change status
- Changing badge also moves the linked board item to the correct column
- Remove card: hover-reveal `×` span (`.card-controls`), absolutely positioned top-right
- Title edits sync in real time to matching `board-link` anchors via `syncBoardLink()`

### Steps
- Each step is a `<li class="step">` inside `<ul class="steps" id="steps-{cardname}">`
- Step number bubble (`.step-num`) is clickable to toggle `.done` state (strikethrough + light red)
- Drag handle: `.drag-grip` before `.step-num`
- Delete: hover-reveal `×` (`.step-controls`), uses `visibility:hidden/visible` not display:none to avoid layout shift
- `renumberSteps()` re-wires onclick on `.step-num` after every reorder/delete
- `addStep(stepsId)` creates new steps dynamically and calls `initStepsSortable()`

### Backlog
- 3 groups: Guides & Documentation, Canvas/LMS Content, WP/ORT/Other
- Group container IDs: `backlog-guides`, `backlog-canvas`, `backlog-other`
- Items draggable between groups (handle: `.backlog-grip`)
- Delete: hover-reveal `×` span (`.backlog-item-controls`), absolutely positioned

### Save to GitHub
- `saveDashboard()` in dashboard.js commits index.html directly via GitHub API
- Token stored in `localStorage` as `gh_dashboard_token`
- "Reset Token" button clears stored token and prompts again on next save
- Config at top of dashboard.js: `GITHUB_USER`, `GITHUB_REPO`, `GITHUB_FILE`, `GITHUB_BRANCH`
- Done state (`.done` class on steps) is explicitly copied to clone before save

---

## CSS Conventions

### Status / Badge Colors
| Status | Badge class | Card border class | Color |
|--------|-------------|-------------------|-------|
| Due/Deadline | `badge-deadline` | `card-deadline` | `#e74c3c` (red) |
| Do Soon | `badge-soon` | `card-soon` | `#e67e22` (orange) |
| In Progress | `badge-progress` | `card-progress` | `#27ae60` (green) |
| On the Radar | `badge-radar` | `card-radar` | `#8e44ad` (purple) |
| Waiting | `badge-waiting` | `card-waiting` | `#bdc3c7` (grey) |

### Board Column Header Colors
| Column | Class | Color |
|--------|-------|-------|
| Front Burner | `col-frontburner` | `#e67e22` (orange) |
| In Progress | `col-inprogress` | `#27ae60` (green) |
| On the Radar | `col-radar` | `#8e44ad` (purple) |
| Waiting on Others | `col-waiting` | `#7f8c8d` (grey) |

### Other Key Colors
- Page background: `#f0f2f5`
- Card/panel background: `white`
- Primary dark (headings, save button): `#1a1a2e`
- Board links: `#2980b9`
- Drag grip: `#ccc` / `#aaa` on hover
- Step done state: `#fde8e8` bg, `#e74c3c` text (light red)
- Contenteditable focus: `#f0f7ff` bg, `#3498db44` box-shadow

### Layout
- Max page width: `1180px`, centered
- Status board: 4-column CSS grid
- Project cards: 2-column CSS grid
- Backlog: 3-column CSS grid
- Responsive breakpoint at `800px`: all grids collapse to 1-2 columns

---

## JavaScript Patterns

### Card Counter
`cardCounter` is initialized by scanning existing `card-new-N` IDs on page load
to avoid ID collisions after save/reload cycles:
```js
let cardCounter = 100;
document.querySelectorAll('[id^="card-new-"]').forEach(el => {
  const n = parseInt(el.id.replace('card-new-', ''), 10);
  if (n > cardCounter) cardCounter = n;
});
```

### Adding Cards from Board
`confirmAddCard()` creates both a project card AND a linked board item.
`colBadgeMap` maps board column IDs to default badge/card classes.

### Badge Picker
`openBadgePicker(el)` sets `activeBadgeEl`, opens modal.
`setBadge(type, label)` updates badge class, card border class, and moves
the linked board item to the correct column.

### Title Sync
All existing cards get an `input` listener on page load via:
```js
document.querySelectorAll('.card[id]').forEach(card => { ... })
```
New cards get the listener wired in `confirmAddCard()`.

### Sortable Initialization
- Board columns: initialized in forEach loop, handle `.drag-grip`
- Cards container: single Sortable on `#cards-container`, handle `.drag-grip`
- Steps: `initStepsSortable(listId)` called per card, handle `.drag-grip`
- Backlog: initialized in forEach loop, handle `.backlog-grip`

---

## Known Quirks / History

- `badge-waiting` and `card-waiting` were renamed from `badge-blocked`/`card-blocked`
  — make sure any new code uses the `waiting` naming, not `blocked`
- SortableJS bakes `draggable="false"` and `contenteditable="false"` attributes
  into saved HTML — regex operations on board items must match regardless of
  extra attributes (use `[^>]*class="board-link"` not `class="board-link"`)
- `renumberSteps()` must re-attach onclick to `.step-num` after reordering —
  setting `textContent` alone is not sufficient
- Step delete uses `visibility:hidden` not `display:none` to reserve space
  and prevent layout shift on hover
- The `.step-hint` sub-step feature was removed — do not re-add it
- `+ Add Card` toolbar button was removed — use `+ Add item` in board columns instead
- GitHub raw file URLs (raw.githubusercontent.com) cannot be fetched by Claude
  in Chat — files must be uploaded or index.html fetched from the Pages URL

---

## Session Startup (Claude Code)
At the start of each session, run:
```bash
cd ~/path/to/work-dashboard
git pull origin main
```
Then read this file and the three project files before making any changes.
After changes:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```
GitHub Pages rebuilds in ~60 seconds.
