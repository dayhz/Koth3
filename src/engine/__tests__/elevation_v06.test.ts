import { describe, it, expect } from 'vitest';
import { Vector2D } from '../../core/math/Vector2D';
import { CubicBezierCurve, LinearCurve } from '../../core/curves/Curve';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { RoadProfile } from '../types';

const defaultProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

describe('Elevation Engine & 3D Topography V0.6', () => {
  it('smoothly interpolates 3D elevation and computes slope percentage', () => {
    const curve = new LinearCurve(new Vector2D(0, 0), new Vector2D(100, 0), 0, 10);

    expect(curve.getLength()).toBe(100);
    expect(curve.getElevation(0)).toBe(0);
    expect(curve.getElevation(1)).toBe(10);
    expect(curve.getElevation(0.5)).toBe(5);

    // Pente moyenne = 10m / 100m = 10%
    const maxSlope = curve.getSlopePercent(0.5);
    expect(maxSlope).toBeGreaterThan(10); // En raccordement cubique Hermite, pente max au milieu ~15%
  });

  it('calculates superelevation and camber delta across road width', () => {
    const engine = new RoadWorldEngine(601);
    const n1 = engine.network.createNode(new Vector2D(0, 0), 'dead_end', 'N1', 0);
    const n2 = engine.network.createNode(new Vector2D(100, 50), 'dead_end', 'N2', 5);

    const sCurve = new CubicBezierCurve(
      n1.position,
      new Vector2D(50, 0),
      new Vector2D(50, 50),
      n2.position,
      0,
      5
    );

    const road = engine.network.createRoad(n1.id, n2.id, sCurve, defaultProfile, 'R_SLOPE');
    engine.build();

    // Vérifier calcul du dévers
    const superElev = engine.elevation.calculateSuperelevation(road.centerline, 0.3, 50);
    expect(typeof superElev).toBe('number');

    // Vérifier delta altimétrique transversal
    const deltaZ = engine.elevation.getTransverseElevationDelta(road.centerline, 0.5, 3.5, 50);
    expect(typeof deltaZ).toBe('number');
  });

  it('correctly builds a multi-level viaduct network', () => {
    const engine = new RoadWorldEngine(602);
    const lowNode = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'BAS', 0);
    const bridgeNode = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'HAUT', 12);
    const highNode = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'SOMMET', 12);

    engine.network.createRoad(lowNode.id, bridgeNode.id, new LinearCurve(lowNode.position, bridgeNode.position), defaultProfile, 'R_RAMPE');
    engine.network.createRoad(bridgeNode.id, highNode.id, new LinearCurve(bridgeNode.position, highNode.position), defaultProfile, 'R_PONT');

    engine.build();

    expect(bridgeNode.elevation).toBe(12);
    expect(bridgeNode.position3D.y).toBe(12);

    const rampe = engine.network.roads.get('R_RAMPE')!;
    expect(rampe.centerline.startElevation).toBe(0);
    expect(rampe.centerline.endElevation).toBe(12);
  });
});
