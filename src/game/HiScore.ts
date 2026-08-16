import { HI_SCORE_HIST } from '../constants';

export interface HiScoreEntry {
  score: number;
  name: string;
  date: number;
}

export const HI_SCORE_STORAGE_KEY = 'hope-invaders-hiscores';
export const PILOT_NAME_MAX = 12;
const PILOT_NAME_CHAR = /[\w ?\-']/;

export function sanitizePilotName(raw: string): string {
  const cleaned = raw.replace(/[^\w ?\-']/g, '').trim().slice(0, PILOT_NAME_MAX);
  return cleaned || 'Max';
}

/** Keyboard handling for the game-over name field (Enter submits only once a name is typed). */
export function applyNameEntryKey(name: string, key: string): { name: string; submit: boolean } {
  if (key === 'Enter') return { name, submit: name.trim().length > 0 };
  if (key === 'Escape') return { name, submit: true };
  if (key === 'Backspace') return { name: name.slice(0, -1), submit: false };
  if (key.length === 1 && name.length < PILOT_NAME_MAX && PILOT_NAME_CHAR.test(key)) {
    return { name: name + key, submit: false };
  }
  return { name, submit: false };
}

const DEFAULT_SCORES: HiScoreEntry[] = Array.from({ length: HI_SCORE_HIST }, () => ({
  score: 0,
  name: '---',
  date: Date.UTC(2000, 0, 1),
}));

export class HiScore {
  private scores: HiScoreEntry[] = [];

  constructor() {
    this.load();
  }

  load(): void {
    try {
      const raw = localStorage.getItem(HI_SCORE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HiScoreEntry[];
        if (Array.isArray(parsed) && parsed.length) {
          this.scores = parsed.slice(0, HI_SCORE_HIST);
          this.padBoard();
          return;
        }
      }
    } catch {
      // fall through to defaults
    }
    this.scores = DEFAULT_SCORES.map((entry) => ({ ...entry }));
  }

  private padBoard(): void {
    while (this.scores.length < HI_SCORE_HIST) {
      this.scores.push({
        score: 0,
        name: '---',
        date: Date.UTC(2000, 0, 1),
      });
    }
  }

  save(): void {
    localStorage.setItem(HI_SCORE_STORAGE_KEY, JSON.stringify(this.scores));
  }

  getScores(): readonly HiScoreEntry[] {
    return this.scores;
  }

  getTopScore(): number {
    return this.scores[0]?.score ?? 0;
  }

  /** Returns rank (1-based) if the run stays on the board, else 0. */
  submit(score: number, name = 'Max'): number {
    const entry: HiScoreEntry = {
      score,
      name: sanitizePilotName(name),
      date: Date.now(),
    };
    this.scores.push(entry);
    this.scores.sort((a, b) => b.score - a.score);
    const rank = this.scores.findIndex((s) => s === entry) + 1;
    this.scores = this.scores.slice(0, HI_SCORE_HIST);
    this.save();
    return rank <= HI_SCORE_HIST ? rank : 0;
  }

  isHiScore(score: number): boolean {
    if (this.scores.length < HI_SCORE_HIST) return true;
    const lowest = this.scores[HI_SCORE_HIST - 1]?.score ?? 0;
    return score >= lowest;
  }
}

export const hiScore = new HiScore();
