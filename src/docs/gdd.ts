import './site.css';
import { CAMPAIGN, abilityById, type EncounterDesign, type LevelDesign } from './campaign';

const NOTES_KEY = 'hope-gdd-notes';

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

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function noteBox(id: string, placeholder: string): string {
  return `<textarea class="note" data-note="${esc(id)}" placeholder="${esc(placeholder)}">${esc(notes[id] ?? '')}</textarea>`;
}

function roleLabel(role: EncounterDesign['role']): string {
  return role === 'mini' ? 'Mini-boss' : 'Big boss';
}

function encounterCard(encounter: EncounterDesign): string {
  const ability = encounter.unlocks ? abilityById(encounter.unlocks) : undefined;
  const abilityBlock = ability
    ? `
      <div class="unlock">
        <p class="meta">Unlocks <strong>${esc(ability.name)}</strong> · ${esc(ability.kind)} · ${esc(ability.control)}</p>
        <p>${esc(ability.rule)}</p>
        ${noteBox(ability.id, `Change ${ability.name}?`)}
      </div>`
    : `<p class="meta">No ability. Clearing this fight is the gate.</p>`;

  return `
    <article class="card encounter" id="${esc(encounter.id)}">
      <div class="row">
        <span class="badge ${encounter.role}">${roleLabel(encounter.role)}</span>
        <span class="badge ${encounter.artState}">${encounter.artState === 'new' ? 'Needs art' : 'Reuse'}</span>
      </div>
      <h3>${esc(encounter.name)}</h3>
      <p class="meta">${esc(encounter.art)}</p>
      <p>${esc(encounter.behavior)}</p>
      ${noteBox(encounter.id, `Change ${encounter.name}?`)}
      ${abilityBlock}
    </article>
  `;
}

function levelSection(level: LevelDesign): string {
  return `
    <section class="section" id="${esc(level.id)}">
      <h2>${level.index} · ${esc(level.place)}</h2>
      <p class="lede">${esc(level.feeling)}</p>
      <p><strong>Cast.</strong> ${esc(level.cast)}</p>
      <p class="meta">Skill for this level: ${esc(level.skill)}. ${esc(level.chapters)}</p>
      ${noteBox(level.id, `Change ${level.place}?`)}
      <div class="stack">
        ${level.encounters.map(encounterCard).join('')}
      </div>
    </section>
  `;
}

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="wrap">
    <header class="top">
      <div class="brand">Hope Invaders</div>
      <nav>
        <a href="./">Play</a>
        <a href="./gdd" aria-current="page">Design</a>
        <a href="./art">Art</a>
        <a href="./mechanics">Mechanics</a>
      </nav>
    </header>
    <p class="lede">
      This is the campaign we are agreeing on.
      Notes stay in this browser. Write under a section, then copy them into chat.
    </p>
    <p class="callout">
      The Sinking Cenote is playable as written here: three chapters, both mini-bosses, the octopus, Pool Light, and Still Water.
      Tangled Web and Hollow Garden are still the old build, with one boss each and no unlocks, and the game still repeats after the Garden.
    </p>
    <div class="actions">
      <button class="btn" id="copy-notes">Copy notes for chat</button>
    </div>
    <div class="toc">
      <a href="#campaign">Campaign</a>
      <a href="#carry">What carries</a>
      <a href="#cenote">Cenote</a>
      <a href="#web">Web</a>
      <a href="#garden">Garden</a>
      <a href="#ending">Ending</a>
      <a href="#art-gaps">Art still needed</a>
      <a href="#done">Ready when</a>
    </div>

    <section class="section" id="campaign">
      <h2>Campaign</h2>
      <p>
        Three places, played once, in this order: Sinking Cenote, Tangled Web, Hollow Garden.
        Each place has two mini-bosses and one big boss. Each mini-boss unlocks an ability that stays until the run ends.
        Releasing the Hollow Tree lights the village. That is the win. There is no fourth level and no loop back to the Cenote.
      </p>
      <p class="meta">
        Wand, Lamp, Amu, HOPE, RSV, lives, pickups, pause, and the village-darkens rule stay as they are on
        <a href="./mechanics">Mechanics</a>. This page only changes the shape of a run and what Max learns.
      </p>
      ${noteBox('campaign', 'Change the shape of the campaign?')}
    </section>

    <section class="section" id="carry">
      <h2>What carries</h2>
      <ul class="plain">
        <li>A new run starts at Cenote with no abilities, score 0, and 4 extra lives, same as today.</li>
        <li>Score, lives, and abilities already unlocked carry into the next place. HOPE and RSV reset. Lamp and Amu bars empty. The Wand stays.</li>
        <li>Pool Light keeps firing a Lamp bolt every third Wand volley even with an empty Lamp bar.</li>
        <li>Dying with a life left continues the same place. Abilities already unlocked stay. The level does not restart.</li>
        <li>Skill is fixed by the place: Cenote 1.0, Web 1.2, Garden 1.4. It does not climb after that.</li>
      </ul>
      ${noteBox('carry', 'Change what carries between places?')}
    </section>

    ${CAMPAIGN.levels.map(levelSection).join('')}

    <section class="section" id="ending">
      <h2>Ending</h2>
      <p>
        <strong>Win.</strong> Releasing the Hollow Tree shows “The lanterns are lit”, then the same name entry as a loss
        (“Who kept the lantern?”). The score joins the local top 20 with the tag <em>lit</em>.
      </p>
      <p>
        <strong>Loss.</strong> Lives below 0 still shows “The village goes dark” and records the score with the tag <em>dark</em>.
        The menu list is still the top 20 in this browser.
      </p>
      <p class="meta">The win screen reuses the night village painting. No new backdrop unless we decide we want the lanterns actually lit.</p>
      ${noteBox('ending', 'Change the win or the score tags?')}
    </section>

    <section class="section" id="art-gaps">
      <h2>Art still needed</h2>
      <p class="lede">Everything else in the encounters reuses a sprite the game already loads. These two do not exist.</p>
      <table>
        <thead><tr><th>Fight</th><th>Need</th></tr></thead>
        <tbody>
          <tr><td>Mote Nest</td><td>Isolated sprite, facing down. Hanging nest of silk and sorrow motes. Not a gnat scaled up.</td></tr>
          <tr><td>The Weaver</td><td>Isolated sprite, facing down. A web-thing. Not the garden tree-spirit (<code class="key">enemy06</code>).</td></tr>
        </tbody>
      </table>
      <p class="meta">Still Water and Unravel are code effects, not new files. Unlocked abilities can be named in the HUD as text until we want icons.</p>
      ${noteBox('art-gaps', 'Wrong art, or something else missing?')}
    </section>

    <section class="section" id="done">
      <h2>Ready when</h2>
      <ol class="plain">
        <li>A run plays Cenote, then Web, then Garden, and stops. It does not load a fourth place or return to Cenote.</li>
        <li>Each place contains the two mini-bosses and the one big boss on this page, in that order, with waves between them.</li>
        <li>Releasing a mini-boss turns on the ability named under it, and that ability still works in later places.</li>
        <li>Releasing the Hollow Tree ends the run as a win and records a <em>lit</em> score. Lives below 0 still records a <em>dark</em> score.</li>
        <li>The Weaver and the Mote Nest use their own art. The octopus stays the Cenote boss. The tree-spirit stays the Garden boss and does not appear in the Web.</li>
        <li><code class="key">npm test</code> passes and <code class="key">npm run build</code> succeeds.</li>
      </ol>
      <p class="meta">A new place, a new ability, or a loop is a change to this page, not unfinished work.</p>
      ${noteBox('done', 'Change the bar for done?')}
    </section>
  </div>
`;

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

app.querySelector('#copy-notes')?.addEventListener('click', async () => {
  const lines = Object.entries(notes)
    .filter(([, text]) => text.trim())
    .map(([key, text]) => `- \`${key}\`: ${text.trim()}`);
  const body = lines.length
    ? `Design notes for Hope Invaders:\n${lines.join('\n')}`
    : 'No design notes yet. Type under a section first.';
  const button = app.querySelector('#copy-notes');
  const previous = button?.textContent ?? 'Copy notes for chat';
  try {
    await navigator.clipboard.writeText(body);
    if (button) button.textContent = lines.length ? 'Copied' : 'Nothing to copy';
  } catch {
    if (button) button.textContent = 'Copy blocked';
  }
  window.setTimeout(() => {
    if (button) button.textContent = previous;
  }, 1200);
});

bindNotes(app);
