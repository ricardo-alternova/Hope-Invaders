class Rng {
  private index = 0;
  readonly randS: number[];
  readonly randF: number[];

  constructor(seed = 12345) {
    this.randS = new Array(256);
    this.randF = new Array(256);
    let s = seed;
    for (let i = 0; i < 256; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      this.randF[i] = s / 0x7fffffff;
      this.randS[i] = 2.0 * (0.5 - this.randF[i]);
    }
  }

  srand(): number {
    this.index = (this.index + 1) % 256;
    return this.randS[this.index];
  }

  frand(): number {
    this.index = (this.index + 1) % 256;
    return this.randF[this.index];
  }
}

export const rng = new Rng();

export function srand(): number {
  return rng.srand();
}

export function frand(): number {
  return rng.frand();
}
