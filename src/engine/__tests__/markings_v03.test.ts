import { describe, it, expect } from 'vitest';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve } from '../../core/curves/Curve';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { RoadProfile } from '../types';

const default4LaneProfile: RoadProfile = {
  roadType: 'avenue',
  laneCount: 4,
  laneWidth: 3.5,
  sidewalkWidthLeft: 3.0,
  sidewalkWidthRight: 3.0,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

const default2LaneProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 30,
};

describe('Lane & Road Marking Engine V0.3', () => {
  it('generates crosswalks on road approaches before intersections', () => {
    const engine = new RoadWorldEngine(301);
    const n1 = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'W');
    const n2 = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'CENTER');
    const n3 = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'E');
    const n4 = engine.network.createNode(new Vector2D(0, 50), 'dead_end', 'N');

    engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), default2LaneProfile, 'R_W');
    engine.network.createRoad(n2.id, n3.id, new LinearCurve(n2.position, n3.position), default2LaneProfile, 'R_E');
    engine.network.createRoad(n4.id, n2.id, new LinearCurve(n4.position, n2.position), default2LaneProfile, 'R_N');

    engine.build();

    expect(engine.network.crosswalks.size).toBeGreaterThan(0);

    const firstCrosswalk = Array.from(engine.network.crosswalks.values())[0];
    expect(firstCrosswalk.stripes.length).toBeGreaterThan(3);
    expect(firstCrosswalk.length).toBe(3.0);
  });

  it('generates transverse stop lines and directional arrows on incoming lanes', () => {
    const engine = new RoadWorldEngine(302);
    const n1 = engine.network.createNode(new Vector2D(-60, 0), 'dead_end', 'W');
    const n2 = engine.network.createNode(new Vector2D(0, 0), 'four_way', 'CENTER');
    const n3 = engine.network.createNode(new Vector2D(60, 0), 'dead_end', 'E');
    const n4 = engine.network.createNode(new Vector2D(0, 60), 'dead_end', 'N');
    const n5 = engine.network.createNode(new Vector2D(0, -60), 'dead_end', 'S');

    engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), default4LaneProfile, 'R_W');
    engine.network.createRoad(n2.id, n3.id, new LinearCurve(n2.position, n3.position), default4LaneProfile, 'R_E');
    engine.network.createRoad(n4.id, n2.id, new LinearCurve(n4.position, n2.position), default4LaneProfile, 'R_N');
    engine.network.createRoad(n5.id, n2.id, new LinearCurve(n5.position, n2.position), default4LaneProfile, 'R_S');

    engine.build();

    // Doit avoir des lignes d'arrêt pour les voies entrantes
    expect(engine.network.stopLines.size).toBeGreaterThan(0);

    // Doit avoir des flèches directionnelles
    expect(engine.network.directionalArrows.size).toBeGreaterThan(0);

    // Vérifier les lignes de rive
    const edgeMarkings = Array.from(engine.network.markings.values()).filter(
      (m) => m.type === 'edge_solid'
    );
    expect(edgeMarkings.length).toBeGreaterThan(0);
  });
});
