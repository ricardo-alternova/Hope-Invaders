import { describe, expect, it } from 'vitest';
import { EnemyType } from '../constants';
import { shadePose } from './shadeAnim';

describe('shadePose', () => {
  it('leaves other shades still', () => {
    const pose = shadePose(EnemyType.RayGun, 40, 3);
    expect(pose.rot).toBe(0);
    expect(pose.scaleX).toBe(1);
    expect(pose.scaleY).toBe(1);
    expect(pose.originY).toBe(0.5);
  });

  it('sways kelp around the hood', () => {
    const a = shadePose(EnemyType.Straight, 0, 1);
    const b = shadePose(EnemyType.Straight, 48, 1);
    expect(a.originY).toBeLessThan(0.5);
    expect(Math.abs(a.rot - b.rot)).toBeGreaterThan(0.02);
    expect(Math.abs(a.scaleY - 1)).toBeLessThan(0.1);
  });

  it('flaps moth wings more than it tilts', () => {
    let maxFlap = 0;
    let maxTilt = 0;
    for (let age = 0; age < 80; age++) {
      const pose = shadePose(EnemyType.Omni, age, 2);
      maxFlap = Math.max(maxFlap, Math.abs(pose.scaleX - 1));
      maxTilt = Math.max(maxTilt, Math.abs(pose.rot));
    }
    expect(maxFlap).toBeGreaterThan(0.08);
    expect(maxFlap).toBeLessThan(0.2);
    expect(maxTilt).toBeLessThan(0.08);
  });

  it('desyncs two of the same type', () => {
    const a = shadePose(EnemyType.Omni, 20, 0);
    const b = shadePose(EnemyType.Omni, 20, 8);
    expect(a.scaleX).not.toBeCloseTo(b.scaleX, 3);
  });
});
