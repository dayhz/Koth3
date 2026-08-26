import { describe, it, expect } from 'vitest';
import { RoadWorldEngine } from '../../engine/RoadWorldEngine';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve, CubicBezierCurve } from '../../core/curves/Curve';
import { RoadProfile } from '../../engine/types';
import { RoadSegmenter } from '../RoadSegmenter';
import { RoadMeshGenerator } from '../RoadMeshGenerator';

const standardProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

describe('STEP 2 — SEGMENTATION & CONTINUITY (Cahier des charges V1.1)', () => {
  it('divides a 100m straight road into exactly 4 continuous 25m slices', () => {
    const engine = new RoadWorldEngine(201);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(100, 0));
    const road = engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), standardProfile);

    const slices = RoadSegmenter.segmentRoad(road, 25.0);
    expect(slices.length).toBe(4);

    for (let i = 0; i < slices.length; i++) {
      expect(slices[i].index).toBe(i);
      expect(slices[i].length).toBeCloseTo(25.0, 3);
      expect(slices[i].sStart).toBeCloseTo(i * 25.0, 3);
      expect(slices[i].sEnd).toBeCloseTo((i + 1) * 25.0, 3);
      expect(slices[i].bounds.isEmpty()).toBe(false);
    }
  });

  it('guarantees zero gap between adjacent road segment meshes (gap = 0.000m)', () => {
    const engine = new RoadWorldEngine(202);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(100, 0));
    const road = engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), standardProfile);

    const meshes = RoadMeshGenerator.generate(road, { segmentLengthMeters: 25.0 });
    expect(meshes.length).toBe(4);

    // Vérifier la continuité exacte entre le segment k (fin) et segment k+1 (début)
    for (let k = 0; k < meshes.length - 1; k++) {
      const geomA = meshes[k].geometry;
      const geomB = meshes[k + 1].geometry;

      const posA = geomA.attributes.position.array;
      const posB = geomB.attributes.position.array;

      // 3 derniers sommets de geomA (left, center, right)
      const countA = geomA.attributes.position.count;
      const lastLeftA = [posA[(countA - 3) * 3], posA[(countA - 3) * 3 + 1], posA[(countA - 3) * 3 + 2]];
      const lastCenterA = [posA[(countA - 2) * 3], posA[(countA - 2) * 3 + 1], posA[(countA - 2) * 3 + 2]];
      const lastRightA = [posA[(countA - 1) * 3], posA[(countA - 1) * 3 + 1], posA[(countA - 1) * 3 + 2]];

      // 3 premiers sommets de geomB
      const firstLeftB = [posB[0], posB[1], posB[2]];
      const firstCenterB = [posB[3], posB[4], posB[5]];
      const firstRightB = [posB[6], posB[7], posB[8]];

      // Écart maximal absolu < 0.00001 mètre
      expect(Math.hypot(lastLeftA[0] - firstLeftB[0], lastLeftA[1] - firstLeftB[1], lastLeftA[2] - firstLeftB[2])).toBeLessThan(0.0001);
      expect(Math.hypot(lastCenterA[0] - firstCenterB[0], lastCenterA[1] - firstCenterB[1], lastCenterA[2] - firstCenterB[2])).toBeLessThan(0.0001);
      expect(Math.hypot(lastRightA[0] - firstRightB[0], lastRightA[1] - firstRightB[1], lastRightA[2] - firstRightB[2])).toBeLessThan(0.0001);
    }
  });

  it('preserves continuous UV mapping across segmented curve with elevation slope', () => {
    const engine = new RoadWorldEngine(203);
    const n1 = engine.network.createNode(new Vector2D(0, 0), 'dead_end', 'N1', 0);
    const n2 = engine.network.createNode(new Vector2D(120, 80), 'dead_end', 'N2', 15);

    const curve = new CubicBezierCurve(
      new Vector2D(0, 0),
      new Vector2D(60, 0),
      new Vector2D(60, 80),
      new Vector2D(120, 80)
    );
    const road = engine.network.createRoad(n1.id, n2.id, curve, standardProfile);

    const meshes = RoadMeshGenerator.generate(road, { segmentLengthMeters: 30.0 });
    expect(meshes.length).toBeGreaterThanOrEqual(4);

    for (let k = 0; k < meshes.length - 1; k++) {
      const geomA = meshes[k].geometry;
      const geomB = meshes[k + 1].geometry;

      const uvA = geomA.attributes.uv.array;
      const uvB = geomB.attributes.uv.array;

      const countA = geomA.attributes.uv.count;
      const vEndA = uvA[(countA - 1) * 2 + 1];
      const vStartB = uvB[1];

      // La coordonnée V de texture doit être continue sans décrochage
      expect(Math.abs(vEndA - vStartB)).toBeLessThan(0.001);
    }
  });
});
