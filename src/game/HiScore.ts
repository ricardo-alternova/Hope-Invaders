import { HI_SCORE_HIST } from '../constants';

export interface HiScoreEntry {
  score: number;
  name: string;
  date: number;
}

const STORAGE_KEY = 'chromium-bsu-hiscores';
const DEFAULT_SCORES = [250000, 200000, 150000, 100000, 50000];

export class HiScore {
  private scores: HiScoreEntry[] = [];

  constructor() {
    this.load();
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.scores = JSON.parse(raw) as HiScoreEntry[];
        return;
      }
    } catch {
      // fall through to defaults
    }
    this.scores = DEFAULT_SCORES.map((score, i) => ({
      score,
      name: i < 5 ? 'nobody' : '---',
      date: Date.UTC(2000, 0, 1),
    }));
    while (this.scores.length < HI_SCORE_HIST) {
      this.scores.push({ score: 99, name: 'nobody', date: Date.UTC(2000, 0, 1) });
    }
  }

  save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
  }

  getScores(): readonly HiScoreEntry[] {
    return this.scores;
  }

  getTopScore(): number {
    return this.scores[0]?.score ?? 0;
  }

  /** Returns rank (1-based) if it's a hi-score, else 0. */
  submit(score: number, name = 'pilot'): number {
    const entry: HiScoreEntry = { score, name, date: Date.now() };
    this.scores.push(entry);
    this.scores.sort((a, b) => b.score - a.score);
    const rank = this.scores.findIndex((s) => s === entry) + 1;
    this.scores = this.scores.slice(0, HI_SCORE_HIST);
    this.save();
    return rank <= HI_SCORE_HIST ? rank : 0;
  }

  isHiScore(score: number): boolean {
    const lowest = this.scores[HI_SCORE_HIST - 1]?.score ?? 0;
    return score > lowest;
  }
}

export const hiScore = new HiScore();
