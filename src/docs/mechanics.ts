import './site.css';
import { ART_ITEMS, artSrc } from './catalog';

function sprite(key: string): string {
  const item = ART_ITEMS.find((i) => i.key === key);
  const src = `${import.meta.env.BASE_URL}${artSrc(key)}`;
  return `<img class="tiny" src="${src}" alt="${key}" title="${item?.title ?? key}" />`;
}

document.querySelector('#app')!.innerHTML = `
  <div class="wrap">
    <header class="top">
      <div class="brand">Hope Invaders</div>
      <nav>
        <a href="./">Play</a>
        <a href="./art">Art</a>
        <a href="./mechanics" aria-current="page">Mechanics</a>
      </nav>
    </header>
    <p class="lede">
      Arcade Chromium B.S.U. loop, rethemed as Max in the dungeons.
      Combat is not killing — shades are released. If a shade (not a gnat) reaches the bottom, the village darkens by one life.
    </p>

    <section class="section">
      <h2>How a run goes</h2>
      <div class="flow">
        <div class="step"><strong>Menu</strong><span>Village square. Enter / click starts dungeon 1.</span></div>
        <div class="step"><strong>Dungeon</strong><span>Level N maps to Cenote → Web → Garden, then repeats. Skill creeps up 0.05 per level, cap 1.9.</span></div>
        <div class="step"><strong>Waves</strong><span>Scheduled at boot of the level. Density scales with skill.</span></div>
        <div class="step"><strong>Boss</strong><span>Last spawn. Releasing it restores the shard (~9s of “Shard restored”).</span></div>
        <div class="step"><strong>Next dungeon</strong><span>Level++, Max resets HOPE/RSV and guns empty except infinite Wand.</span></div>
        <div class="step"><strong>Village goes dark</strong><span>Lives &lt; 0. Enter a name, record Hope restored, then the village square shows the board.</span></div>
      </div>
    </section>

    <section class="section">
      <h2>Max</h2>
      <table>
        <thead><tr><th></th><th>Thing</th><th>How it works</th></tr></thead>
        <tbody>
          <tr><td>${sprite('hero')}</td><td>Move</td><td>WASD / arrows hold-to-move. Mouse also steers. Sides of the screen stay open; the top 25% is blocked.</td></tr>
          <tr><td>${sprite('heroAmmo00')}</td><td>Wand</td><td>Click / Space. Always on: two gold streams. A short burst releases an early kelp shade. Pickup adds two extra streams.</td></tr>
          <tr><td>${sprite('heroAmmo01')}</td><td>Lamp</td><td>Pickup only. Slower cyan bolt, damage 8, uses the Lamp bar.</td></tr>
          <tr><td>${sprite('heroAmmo02')}</td><td>Amu</td><td>Pickup only. Heavy plum-gold pulse, damage 40, uses the Amu bar.</td></tr>
          <tr><td>${sprite('heroShields')}</td><td>HOPE</td><td>Starts at 500. Hits drain HOPE first, then RSV. Pickup “Hope-drop” refills to 500.</td></tr>
          <tr><td>${sprite('hero')}</td><td>Overcharge</td><td>SuperShields pickup sets HOPE to 1000 and repairs RSV. Drain is slower. A red halo sits behind the same craft.</td></tr>
          <tr><td></td><td>RSV</td><td>Resolve / hull. Starts at −500 (full). Hits after HOPE is gone push this toward 0. Repair pickup resets it. At 0 you lose a life.</td></tr>
          <tr><td>${sprite('life')}</td><td>Lives</td><td>Start with 4 extra (5 icons). +1 life every 50,000 Hope restored. Cap 9; overflow dumps the lantern.</td></tr>
          <tr><td>${sprite('useItem00')}</td><td>Lantern flash</td><td>Enter twice (or double right-click). First press arms rings; second dumps a gold dome that releases nearby shades. Also fires on death if lives remain (i-frames while hidden).</td></tr>
          <tr><td></td><td>I-frames</td><td>12 frames after a hit so overlapping shades do not melt HOPE in one frame.</td></tr>
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Shades</h2>
      <p class="lede">Arcade type index is the filename: enemy00 = Straight. Faces down. Score is Hope restored on release.</p>
      <table>
        <thead><tr><th></th><th>Type</th><th>HP-ish</th><th>Score</th><th>Behavior</th><th>Where</th></tr></thead>
        <tbody>
          <tr>
            <td>${sprite('enemy00')}</td>
            <td>0 Straight<br /><span class="key">enemy00</span></td>
            <td>110 × skill</td>
            <td>75</td>
            <td>Drifts down, shoots sorrow darts straight down. Reaching y &lt; −14 costs a life.</td>
            <td>All dungeons, opening waves</td>
          </tr>
          <tr>
            <td>${sprite('enemy01')}</td>
            <td>1 Omni<br /><span class="key">enemy01</span></td>
            <td>45</td>
            <td>25</td>
            <td>Drifts toward Max’s X, bursts type-1 shots at her.</td>
            <td>All dungeons, mixed waves</td>
          </tr>
          <tr>
            <td>${sprite('enemy02')}</td>
            <td>2 RayGun<br /><span class="key">enemy02</span></td>
            <td>1000 × skill</td>
            <td>1000</td>
            <td>Slow descent, aimed heavy fire.</td>
            <td>Cenote, second half</td>
          </tr>
          <tr>
            <td>${sprite('enemy03')}</td>
            <td>3 Tank / Echo<br /><span class="key">enemy03</span></td>
            <td>2000 × skill</td>
            <td>1500</td>
            <td>Fat shade, gold petal prefire. Garden only in the current schedule.</td>
            <td>Hollow Garden (level 3, 6, …)</td>
          </tr>
          <tr>
            <td>${sprite('enemy04')}</td>
            <td>4 Gnat<br /><span class="key">enemy04</span></td>
            <td>10</td>
            <td>10</td>
            <td>Homes on Max. Reaching the bottom does <em>not</em> cost a life.</td>
            <td>Web + Garden swarms</td>
          </tr>
          <tr>
            <td>${sprite('enemy05')}</td>
            <td>5 Boss00<br /><span class="key">enemy05</span></td>
            <td>10000 × skill</td>
            <td>5000</td>
            <td>Enters from above, hangs and sprays. Release → shard restored.</td>
            <td>Sinking Cenote</td>
          </tr>
          <tr>
            <td>${sprite('enemy06')}</td>
            <td>6 Boss01<br /><span class="key">enemy06</span></td>
            <td>10000 × skill</td>
            <td>5000</td>
            <td>Same win condition. Used for Web and Garden.</td>
            <td>Tangled Web, Hollow Garden</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Pickups</h2>
      <p class="lede">Each boon is one tinted Lumen crystal. They fall straight down. Catch it to take the boon. If it falls off the bottom you still get Hope restored (and overcharge grants a life).</p>
      <table>
        <thead><tr><th>Color</th><th>Type</th><th>Catch</th><th>Let fall</th></tr></thead>
        <tbody>
          <tr><td>Cyan</td><td>Hope-drop</td><td>HOPE = 500</td><td>+10,000</td></tr>
          <tr><td>Red</td><td>Overcharge</td><td>HOPE = 1000, RSV repaired</td><td>+2,500 and +1 life</td></tr>
          <tr><td>Cream</td><td>Repair</td><td>RSV full</td><td>+10,000</td></tr>
          <tr><td>Gold</td><td>Wand</td><td>Fill Wand bar, +100</td><td>+2,500</td></tr>
          <tr><td>Green</td><td>Lamp</td><td>Fill Lamp bar, +100</td><td>+2,500</td></tr>
          <tr><td>Plum</td><td>Amu</td><td>Fill Amu bar, +100</td><td>+2,500</td></tr>
        </tbody>
      </table>
      <p class="hint">Scheduled throughout each dungeon. Ammo types 0/1/2 drop on different clocks; Amu is rarest. Death ejects leftover ammo as pickups.</p>
    </section>

    <section class="section">
      <h2>Dungeon schedule</h2>
      <table>
        <thead><tr><th>Level mod 3</th><th>Place</th><th>Cast</th><th>Boss</th></tr></thead>
        <tbody>
          <tr><td>1, 4, 7…</td><td>Sinking Cenote</td><td>Straight, Omni, RayGun</td><td>${sprite('enemy05')} Boss00</td></tr>
          <tr><td>2, 5, 8…</td><td>Tangled Web</td><td>Straight, Omni, Gnat swarms</td><td>${sprite('enemy06')} Boss01</td></tr>
          <tr><td>3, 6, 9…</td><td>Hollow Garden</td><td>Straight, Omni, Gnat, Tank/Echo</td><td>${sprite('enemy06')} Boss01</td></tr>
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Sorrow shots</h2>
      <p class="lede">Five enemy ammo types. Damage to Max: 75, 6, 100, 20, 8.5. Drawn with enemyAmmo00–04.</p>
      <div class="toolbar">
        ${['enemyAmmo00', 'enemyAmmo01', 'enemyAmmo02', 'enemyAmmo03', 'enemyAmmo04'].map(sprite).join('')}
      </div>
    </section>
  </div>
`;
