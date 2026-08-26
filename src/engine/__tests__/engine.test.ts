import { describe, it, expect } from 'vitest';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve, CubicBezierCurve } from '../../core/curves/Curve';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { WorldValidator } from '../../validation/WorldValidator';
import { WorldSerializer } from '../../serialization/WorldSerializer';
import { RoadProfile } from '../types';

const default2LaneProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 30,
};

describe('RoadWorldEngine & Graph Intelligence', () => {
  it('builds a straight 2-lane road with lanes, sidewalks and markings', () => {
    const engine = new RoadWorldEngine(12345);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(100, 0));

    const road = engine.network.createRoad(
      n1.id,
      n2.id,
      new LinearCurve(n1.position, n2.position),
      default2LaneProfile
    );

    engine.build();

    expect(road.totalWidth).toBe(7.0);
    expect(road.laneIds.length).toBe(2);
    expect(engine.network.lanes.size).toBe(2);
    expect(engine.network.sidewalks.size).toBe(2);
    expect(engine.network.markings.size).toBe(3); // 1 axe médian + 2 lignes de rive

    // Questions topologiques
    const lanes = engine.network.getLanesForRoad(road.id);
    expect(lanes.length).toBe(2);

    const laneEnds = engine.network.whereDoesLaneStartAndEnd(lanes[0].id);
    expect(laneEnds).not.toBeNull();
    expect(laneEnds?.startPoint.x).toBeCloseTo(0);
    expect(laneEnds?.endPoint.x).toBeCloseTo(100);

    const report = WorldValidator.validate(engine.network);
    expect(report.isValid).toBe(true);
  });

  it('builds a T-intersection connecting 3 roads and calculates connections', () => {
    const engine = new RoadWorldEngine(12345);
    const center = engine.network.createNode(new Vector2D(0, 0));
    const west = engine.network.createNode(new Vector2D(-50, 0));
    const east = engine.network.createNode(new Vector2D(50, 0));
    const north = engine.network.createNode(new Vector2D(0, 50));

    const rWest = engine.network.createRoad(west.id, center.id, new LinearCurve(west.position, center.position), default2LaneProfile);
    const rEast = engine.network.createRoad(center.id, east.id, new LinearCurve(center.position, east.position), default2LaneProfile);
    const rNorth = engine.network.createRoad(north.id, center.id, new LinearCurve(north.position, center.position), default2LaneProfile);

    engine.build();

    expect(center.type).toBe('t_junction');
    expect(center.connectedRoadIds.length).toBe(3);

    // Questions : quelles routes sont connectées à rWest ?
    const connectedToWest = engine.network.getConnectedRoads(rWest.id);
    expect(connectedToWest.map((r) => r.id)).toContain(rEast.id);
    expect(connectedToWest.map((r) => r.id)).toContain(rNorth.id);

    // Voies connectées au carrefour
    const { incoming, outgoing } = engine.network.getLanesConnectedToIntersection(center.id);
    expect(incoming.length).toBe(3);
    expect(outgoing.length).toBe(3);
    expect(engine.network.laneConnections.size).toBeGreaterThan(0);

    const report = WorldValidator.validate(engine.network);
    expect(report.isValid).toBe(true);
  });

  it('serializes and deserializes the world cleanly (Round-trip JSON)', () => {
    const engine = new RoadWorldEngine(999);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(60, 40));

    const p0 = n1.position;
    const p1 = new Vector2D(20, 0);
    const p2 = new Vector2D(40, 40);
    const p3 = n2.position;
    const curve = new CubicBezierCurve(p0, p1, p2, p3);

    engine.network.createRoad(n1.id, n2.id, curve, default2LaneProfile, 'R_CURVE');
    engine.build();

    const json = WorldSerializer.serialize(engine);
    const reloaded = WorldSerializer.deserialize(json);

    expect(reloaded.network.nodes.size).toBe(2);
    expect(reloaded.network.roads.size).toBe(1);
    expect(reloaded.network.lanes.size).toBe(2);
    expect(reloaded.network.sidewalks.size).toBe(2);

    const report = WorldValidator.validate(reloaded.network);
    expect(report.isValid).toBe(true);
  });
});
