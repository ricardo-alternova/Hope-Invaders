import { EnemyType } from '../constants';

export interface ShadePose {
  rot: number;
  scaleX: number;
  scaleY: number;
  originY: number;
  bobY: number;
}

/** Idle motion for kelp (sway) and moth (flap). Other types stay still. */
export function shadePose(type: number, age: number, id: number): ShadePose {
  const phase = (id % 17) * 0.73;
  if (type === EnemyType.Straight) {
    const sway = Math.sin(age * 0.065 + phase);
    const breathe = Math.sin(age * 0.048 + phase * 0.5);
    return {
      rot: sway * 0.11,
      scaleX: 1 + breathe * 0.03,
      scaleY: 1 + breathe * 0.07,
      originY: 0.36,
      bobY: Math.sin(age * 0.055 + phase) * 3,
    };
  }
  if (type === EnemyType.Omni) {
    const flap = Math.sin(age * 0.15 + phase);
    const drift = Math.sin(age * 0.08 + phase);
    return {
      rot: drift * 0.05,
      scaleX: 1 + flap * 0.13,
      scaleY: 1 - flap * 0.045,
      originY: 0.5,
      bobY: Math.sin(age * 0.1 + phase) * 2,
    };
  }
  return { rot: 0, scaleX: 1, scaleY: 1, originY: 0.5, bobY: 0 };
}
