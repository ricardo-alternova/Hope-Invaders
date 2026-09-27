import './site.css';
import {
  ART_GROUPS,
  ART_ITEMS,
  PROCEDURAL_BG,
  WAV_ITEMS,
  artPack,
  artSrc,
  type ArtGroup,
} from './catalog';

const NOTES_KEY = 'hope-art-notes';

function loadNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, string>): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

const notes = loadNotes();
let group: ArtGroup | 'all' = 'all';
let query = '';

const app = document.querySelector<HTMLDivElement>('#app')!;

function imgFor(key: string, scene: boolean): string {
  const src = `${import.meta.env.BASE_URL}${artSrc(key)}`;
  const cls = scene ? 'preview scene' : 'preview';
  return `<div class="${cls}"><img src="${src}" alt="${key}" /></div>`;
}

function cardHtml(item: (typeof ART_ITEMS)[number]): string {
  const pack = artPack(item.key);
  const scene = item.key === 'menu_back';
  return `
    <article class="card" data-key="${item.key}" data-group="${item.group}">
      ${imgFor(item.key, scene)}
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center;justify-content:space-between;">
        <code class="key">${item.key}</code>
        <span class="pack ${pack}">${pack}</span>
      </div>
      <h3>${item.title}</h3>
      <p class="meta">${item.used}</p>
      <p class="lore">${item.lore}</p>
      <textarea class="note" data-note="${item.key}" placeholder="What should we do with this?">${notes[item.key] ?? ''}</textarea>
    </article>
  `;
}

function visibleItems() {
  const q = query.trim().toLowerCase();
  return ART_ITEMS.filter((item) => {
    if (group !== 'all' && item.group !== group) return false;
    if (!q) return true;
    return `${item.key} ${item.title} ${item.used} ${item.lore}`.toLowerCase().includes(q);
  });
}

function bindNotes(root: ParentNode): void {
  root.querySelectorAll<HTMLTextAreaElement>('textarea[data-note]').forEach((el) => {
    el.addEventListener('input', () => {
      const key = el.dataset.note!;
      notes[key] = el.value;
      if (!el.value) delete notes[key];
      saveNotes(notes);
    });
  });
}

function paintGrid(): void {
  const items = visibleItems();
  const grid = app.querySelector('#inventory-grid')!;
  grid.innerHTML = items.map(cardHtml).join('');
  bindNotes(grid);
  app.querySelectorAll('.chip[data-group]').forEach((btn) => {
    btn.classList.toggle('on', btn.getAttribute('data-group') === group);
  });
}

app.innerHTML = `
  <div class="wrap">
    <header class="top">
      <div class="brand">Hope Invaders</div>
      <nav>
        <a href="./">Play</a>
        <a href="./gdd">Design</a>
        <a href="./art" aria-current="page">Art</a>
        <a href="./mechanics">Mechanics</a>
      </nav>
    </header>
    <p class="lede">
      Every texture the game loads, with the file that is on disk now.
      Write what you want under a sprite, then copy the notes into chat.
      Checkerboard means the PNG should be transparent.
    </p>

    <div class="toolbar">
      <button class="chip on" data-group="all">All</button>
      ${ART_GROUPS.map((g) => `<button class="chip" data-group="${g.id}">${g.label}</button>`).join('')}
      <input class="search" type="search" placeholder="Filter by key or lore" />
    </div>
    <div class="actions">
      <button class="btn" id="copy-notes">Copy notes for chat</button>
      <button class="btn" id="copy-keys">Copy visible keys</button>
    </div>
    <div class="grid" id="inventory-grid"></div>

    <section class="section">
      <h2>Playfield (code, not files)</h2>
      <p class="lede">These are generated at boot. Do not paint hopeCenote / hopeWeb / hopeGarden strips.</p>
      <div class="grid">
        ${PROCEDURAL_BG.map((d) => `
          <article class="card">
            <span class="pack procedural">procedural</span>
            <h3>${d.title}</h3>
            <p class="meta">${d.used}</p>
            <p class="lore">${d.lore}</p>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="section">
      <h2>Audio</h2>
      <div class="audio-row">
        ${WAV_ITEMS.map((w) => `
          <label>${w.key}<br /><audio controls src="${import.meta.env.BASE_URL}${w.src}"></audio></label>
        `).join('')}
      </div>
    </section>
  </div>
`;

app.querySelectorAll<HTMLButtonElement>('.chip[data-group]').forEach((btn) => {
  btn.addEventListener('click', () => {
    group = btn.dataset.group as ArtGroup | 'all';
    paintGrid();
  });
});

app.querySelector<HTMLInputElement>('.search')!.addEventListener('input', (event) => {
  query = (event.target as HTMLInputElement).value;
  paintGrid();
});

app.querySelector('#copy-notes')?.addEventListener('click', async () => {
  const lines = Object.entries(notes)
    .filter(([, text]) => text.trim())
    .map(([key, text]) => `- \`${key}\`: ${text.trim()}`);
  const body = lines.length
    ? `Art notes for Hope Invaders:\n${lines.join('\n')}`
    : 'No art notes yet. Type under a sprite first.';
  await navigator.clipboard.writeText(body);
});

app.querySelector('#copy-keys')?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(visibleItems().map((i) => i.key).join('\n'));
});

bindNotes(app);
paintGrid();
