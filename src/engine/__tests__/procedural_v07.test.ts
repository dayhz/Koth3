import { describe, it, expect } from 'vitest';
import { PRNG } from '../procedural/PRNG';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { CityBuilder } from '../procedural/CityBuilder';

describe('Procedural City Generation Engine V0.7', () => {
  it('PRNG generates deterministic pseudo-random sequences', () => {
    const prng1 = new PRNG(482915);
    const seq1 = [prng1.next(), prng1.range(0, 100), prng1.rangeInt(1, 10)];

    const prng2 = new PRNG(482915);
    const seq2 = [prng2.next(), prng2.range(0, 100), prng2.rangeInt(1, 10)];

    expect(seq1).toEqual(seq2);
  });

  it('generates a full Manhattan grid city with correct topology', () => {
    const engine = new RoadWorldEngine(701);
    CityBuilder.createGridCity(engine, { rows: 4, cols: 4, blockSizeX: 60, blockSizeY: 40 }, 701);

    const stats = engine.getStats();
    expect(stats.nodesCount).toBe(16);
    // 4 rows of 3 H-roads + 4 cols of 3 V-roads = 12 + 12 = 24 roads
    expect(stats.roadsCount).toBe(24);
    expect(stats.lanesCount).toBeGreaterThan(48);
    expect(stats.crosswalksCount).toBeGreaterThan(0);
    expect(stats.trafficLightsCount).toBeGreaterThan(0);
  });

  it('generates an organic network with curved arteries and branches', () => {
    const engine = new RoadWorldEngine(702);
    CityBuilder.createOrganicCity(engine, { mainArteriesCount: 2, branchesPerArtery: 2 }, 702);

    const stats = engine.getStats();
    expect(stats.nodesCount).toBeGreaterThan(4);
    expect(stats.roadsCount).toBeGreaterThan(2);
    expect(stats.sidewalksCount).toBeGreaterThan(0);
  });

  it('generates a radial-concentrique city with rings and spokes', () => {
    const engine = new RoadWorldEngine(703);
    CityBuilder.createRadialCity(engine, { centerRadius: 18, ringRadii: [50, 90], spokesCount: 4 });

    const stats = engine.getStats();
    // 1 center node + 4 inner exit nodes + 4 on ring 0 + 4 on ring 1 = 13 nodes
    expect(stats.nodesCount).toBeGreaterThanOrEqual(13);
    // Ring 0 (4 arcs) + Ring 1 (4 arcs) + 4 radial inner + 4 radial outer = 16 roads
    expect(stats.roadsCount).toBe(16);
  });
});
