import { describe, it, expect } from 'vitest';
import { RoadWorldEngine } from '../../engine/RoadWorldEngine';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve } from '../../core/curves/Curve';
import { RoadProfile } from '../../engine/types';
import { RoadConnector } from '../RoadConnector';
import { LaneMeshGenerator } from '../LaneMeshGenerator';

const standardProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

describe('STEP 3 — ROAD & LANE CONNECTIONS (Cahier des charges V1.1)', () => {
  it('computes exact connection interface geometry at road setback points', () => {
    const engine = new RoadWorldEngine(301);
    const center = engine.network.createNode(new Vector2D(0, 0), 't_junction');
    const w = engine.network.createNode(new Vector2D(-50, 0));
    const e = engine.network.createNode(new Vector2D(50, 0));
    const n = engine.network.createNode(new Vector2D(0, 50));

    const rw = engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), standardProfile);
    engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), standardProfile);
    engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), standardProfile);

    engine.build();

    const conn = RoadConnector.computeConnectionInterface(rw, center, false);
    expect(conn.roadId).toBe(rw.id);
    expect(conn.nodeId).toBe(center.id);
    expect(conn.isStartOfRoad).toBe(false);
    expect(conn.laneCount).toBe(2);

    // Vérifier la demi-largeur
    const halfW = Math.hypot(
      conn.leftBoundaryPoint.x - conn.setbackPoint.x,
      conn.leftBoundaryPoint.y - conn.setbackPoint.y
    );
    expect(halfW).toBeCloseTo(rw.totalWidth / 2, 2);

    const isValid = RoadConnector.validateConnection(conn, rw, center);
    expect(isValid).toBe(true);
  });

  it('generates 3D continuous ribbon mesh for internal intersection lane connections', () => {
    const engine = new RoadWorldEngine(302);
    const center = engine.network.createNode(new Vector2D(0, 0), 'four_way');
    const w = engine.network.createNode(new Vector2D(-40, 0));
    const e = engine.network.createNode(new Vector2D(40, 0));
    const n = engine.network.createNode(new Vector2D(0, 40));
    const s = engine.network.createNode(new Vector2D(0, -40));

    engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), standardProfile);
    engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), standardProfile);
    engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), standardProfile);
    engine.network.createRoad(center.id, s.id, new LinearCurve(center.position, s.position), standardProfile);

    engine.build();

    const connections = Array.from(engine.network.laneConnections.values());
    expect(connections.length).toBeGreaterThan(0);

    const firstConn = connections[0];
    const mesh = LaneMeshGenerator.generate(firstConn, 3.5, center.elevation);

    expect(mesh).toBeDefined();
    expect(mesh.geometry.attributes.position.count).toBeGreaterThan(10);
    expect(mesh.geometry.attributes.uv).toBeDefined();
    expect(mesh.userData.type).toBe('lane_connection');
  });

  it('guarantees altimetric continuity deltaZ = 0 across elevated ramp intersection', () => {
    const elevatedNode = new Vector2D(0, 0);
    const engine = new RoadWorldEngine(303);
    const center = engine.network.createNode(elevatedNode, 't_junction', 'Elevated_Center', 12.0);
    const w = engine.network.createNode(new Vector2D(-60, 0), 'dead_end', 'W', 12.0);
    const e = engine.network.createNode(new Vector2D(60, 0), 'dead_end', 'E', 12.0);
    const s = engine.network.createNode(new Vector2D(0, -60), 'dead_end', 'S_Ramp', 0.0);

    const rw = engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), standardProfile);
    engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), standardProfile);
    const ramp = engine.network.createRoad(s.id, center.id, new LinearCurve(s.position, center.position), standardProfile);

    engine.build();

    const connW = RoadConnector.computeConnectionInterface(rw, center, false);
    const connRamp = RoadConnector.computeConnectionInterface(ramp, center, false);

    expect(RoadConnector.validateConnection(connW, rw, center)).toBe(true);
    expect(RoadConnector.validateConnection(connRamp, ramp, center)).toBe(true);
    expect(center.elevation).toBeCloseTo(12.0, 1);
  });
});
