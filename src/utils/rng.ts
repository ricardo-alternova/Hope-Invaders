// Deterministic RNG tables matching original define.h SRAND/FRAND/IRAND macros

class Rng {
  private index = 0;
  readonly randS: number[];
  readonly randF: number[];
  readonly randI: number[];

  constructor(seed = 12345) {
    this.randS = new Array(256);
    this.randF = new Array(256);
    this.randI = new Array(256);
    let s = seed;
    for (let i = 0; i < 256; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      this.randI[i] = s;
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

  irand(): number {
    this.index = (this.index + 1) % 256;
    return this.randI[this.index];
  }
}

export const rng = new Rng();

export function srand(): number {
  return rng.srand();
}

export function frand(): number {
  return rng.frand();
}

export function irand(): number {
  return rng.irand();
}
