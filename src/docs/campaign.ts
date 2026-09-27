/** The campaign. The game reads encounter and ability names from here; the Design page renders all of it. */

export type AbilityKind = 'passive' | 'active' | 'lantern';

export interface AbilityDesign {
  id: string;
  name: string;
  kind: AbilityKind;
  control: string;
  rule: string;
}

export interface EncounterDesign {
  id: string;
  role: 'mini' | 'boss';
  name: string;
  art: string;
  artState: 'reuse' | 'new';
  behavior: string;
  /** Ability id unlocked when this encounter is released. Bosses unlock nothing. */
  unlocks?: string;
}

export interface LevelDesign {
  id: string;
  index: number;
  place: string;
  feeling: string;
  cast: string;
  skill: string;
  chapters: string;
  encounters: EncounterDesign[];
  abilities: AbilityDesign[];
}

export interface CampaignDesign {
  /** A finished run does not return to level 1. */
  loops: false;
  levels: LevelDesign[];
}

const poolLight: AbilityDesign = {
  id: 'pool-light',
  name: 'Pool Light',
  kind: 'passive',
  control: 'No new key. Rides the Wand.',
  rule: 'Every third Wand volley also fires one Lamp bolt. Lamp pickups still fill the Lamp bar and fire it continuously while the bar lasts. The every-third-volley stays for the rest of the run even when the bar is empty.',
};

const stillWater: AbilityDesign = {
  id: 'still-water',
  name: 'Still Water',
  kind: 'active',
  control: 'Shift',
  rule: 'Max sinks for 1 second. Sorrow shots miss. Shades do not collide with her, and a shade passing through her does not cost a life. She cannot fire. Cooldown is 8 seconds from when she surfaces. Unavailable while the lantern dome is out.',
};

const unravel: AbilityDesign = {
  id: 'unravel',
  name: 'Unravel',
  kind: 'active',
  control: 'Q',
  rule: 'For 2 seconds, gnats stop homing and fly straight down. Aimed enemy shots lose their aim and fly straight down. Cooldown is 10 seconds.',
};

const silkSnare: AbilityDesign = {
  id: 'silk-snare',
  name: 'Silk Snare',
  kind: 'passive',
  control: 'No new key. Rides the Wand.',
  rule: 'A gnat that touches a Wand stream is released at once. Other shades still take normal Wand damage.',
};

const petalReturn: AbilityDesign = {
  id: 'petal-return',
  name: 'Petal Return',
  kind: 'passive',
  control: 'No new key.',
  rule: 'Releasing a shade other than a gnat leaves a gold petal. The petal drifts toward Max for 3 seconds. If it reaches her, HOPE restores by 25. A missed petal fades. Gnats leave nothing, so a swarm cannot refill HOPE.',
};

const openLantern: AbilityDesign = {
  id: 'open-lantern',
  name: 'Open Lantern',
  kind: 'lantern',
  control: 'Enter once, or one right-click',
  rule: 'The arming press is gone. One press dumps the lantern. After the dome ends, it cannot be dumped again for 20 seconds. The burst on death, when a life remains, is unchanged and does not start that cooldown.',
};

export const CAMPAIGN: CampaignDesign = {
  loops: false,
  levels: [
    {
      id: 'cenote',
      index: 1,
      place: 'Sinking Cenote',
      feeling: 'Hopelessness. The pool wants Max to stop moving.',
      cast: 'Straight (kelp shade) and Omni. RayGuns are not a wave enemy here; the sealed light shows up as the first mini-boss.',
      skill: '1.0',
      chapters: 'Opening waves, then each encounter pauses the waves until it is released. After the octopus, the Cenote shard is restored and Tangled Web begins.',
      encounters: [
        {
          id: 'sealed-sentinel',
          role: 'mini',
          name: 'Sealed Sentinel',
          art: 'enemy02, drawn larger',
          artState: 'reuse',
          behavior: 'One RayGun parked in the upper playfield. It sweeps sorrow darts and does not drift off the bottom. The fight ends only when it is released.',
          unlocks: 'pool-light',
        },
        {
          id: 'drowned-choir',
          role: 'mini',
          name: 'Drowned Choir',
          art: 'enemy00, three of them',
          artState: 'reuse',
          behavior: 'Three kelp shades that share one health pool. Damaging any of them damages the pool. Releasing the pool releases all three. If one reaches the bottom, the village loses a life and that shade is gone; the other two stay.',
          unlocks: 'still-water',
        },
        {
          id: 'grotto-octopus',
          role: 'boss',
          name: 'Grotto Octopus',
          art: 'enemy05',
          artState: 'reuse',
          behavior: 'The current Cenote boss. Same fight as the build: enters from above, hangs, and sprays. Releasing it restores the shard and starts Tangled Web. No new ability.',
        },
      ],
      abilities: [poolLight, stillWater],
    },
    {
      id: 'web',
      index: 2,
      place: 'Tangled Web',
      feeling: 'Worry. Things that follow Max, and threads that close in.',
      cast: 'Straight, Omni, and Gnat swarms, in three chapters around the encounters.',
      skill: '1.2',
      chapters: 'Same pause-for-the-fight rule. The tree-spirit does not appear here. Releasing the Weaver starts Hollow Garden.',
      encounters: [
        {
          id: 'ruminant',
          role: 'mini',
          name: 'The Ruminant',
          art: 'enemy01, drawn larger',
          artState: 'reuse',
          behavior: 'One web moth locked to Max’s horizontal position, firing the usual aimed bursts.',
          unlocks: 'unravel',
        },
        {
          id: 'mote-nest',
          role: 'mini',
          name: 'Mote Nest',
          art: 'New sprite. A hanging nest of silk and sorrow motes, facing down.',
          artState: 'new',
          behavior: 'Hangs and spits gnats. If the nest reaches the bottom it does not cost a life. Gnats it already spawned follow gnat rules.',
          unlocks: 'silk-snare',
        },
        {
          id: 'weaver',
          role: 'boss',
          name: 'The Weaver',
          art: 'New sprite. A web-thing, facing down. Not the garden tree.',
          artState: 'new',
          behavior: 'Hangs at the top. Two silk bands drift inward from the sides, then reset. Max loses HOPE while inside a band. When the Weaver is hit, it spits a short gnat burst. Health matches the other bosses (10000 × skill). Releasing it restores the Web shard and starts Hollow Garden.',
        },
      ],
      abilities: [unravel, silkSnare],
    },
    {
      id: 'garden',
      index: 3,
      place: 'Hollow Garden',
      feeling: 'Anhedonia. The festival that wilted, and the last light.',
      cast: 'Straight, Omni, Gnat, and Tank, in three chapters. The named Echo and the Procession are extra; they are not a replacement for wave Tanks.',
      skill: '1.4',
      chapters: 'Last place in the campaign. Releasing the Hollow Tree ends the run. The village keeps its light. There is no level 4 and no return to the Cenote.',
      encounters: [
        {
          id: 'hollow-echo',
          role: 'mini',
          name: 'Hollow Echo',
          art: 'enemy03 and enemy03-extra',
          artState: 'reuse',
          behavior: 'One Tank with the gold petal prefire, tougher than a wave Tank, alone in the playfield.',
          unlocks: 'petal-return',
        },
        {
          id: 'procession',
          role: 'mini',
          name: 'The Procession',
          art: 'enemy03, four of them',
          artState: 'reuse',
          behavior: 'Four Echoes in a slow row. Each has its own health. One that reaches the bottom costs a life, same as any Tank.',
          unlocks: 'open-lantern',
        },
        {
          id: 'hollow-tree',
          role: 'boss',
          name: 'The Hollow Tree',
          art: 'enemy06',
          artState: 'reuse',
          behavior: 'The current Garden boss. Same fight as the build. Releasing it ends the campaign.',
        },
      ],
      abilities: [petalReturn, openLantern],
    },
  ],
};

export function encounterById(id: string): EncounterDesign | undefined {
  for (const level of CAMPAIGN.levels) {
    const found = level.encounters.find((encounter) => encounter.id === id);
    if (found) return found;
  }
  return undefined;
}

export function abilityById(id: string): AbilityDesign | undefined {
  for (const level of CAMPAIGN.levels) {
    const found = level.abilities.find((ability) => ability.id === id);
    if (found) return found;
  }
  return undefined;
}
