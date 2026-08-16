import { HI_SCORE_HIST } from '../constants';

export interface HiScoreEntry {
  score: number;
  name: string;
  date: number;
}

export const HI_SCORE_STORAGE_KEY = 'hope-invaders-hiscores';

export function sanitizePilotName(raw: string): string {
  const cleaned = raw.replace(/[^\w ?\-']/g, '').trim().slice(0, 12);
  return cleaned || 'Max';
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
        this.scores = JSON.parse(raw) as HiScoreEntry[];
        if (Array.isArray(this.scores) && this.scores.length) {
          this.scores = this.scores.slice(0, HI_SCORE_HIST);
          return;
        }
      }
    } catch {
      // fall through to defaults
    }
    this.scores = DEFAULT_SCORES.map((entry) => ({ ...entry }));
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
