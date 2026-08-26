import { describe, it, expect } from 'vitest';
import { Vector2D } from '../../core/math/Vector2D';
import { CurbReturnBuilder } from '../../core/curves/CurbReturnBuilder';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { LinearCurve } from '../../core/curves/Curve';
import { RoadProfile } from '../types';

const testProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 30,
};

describe('Intersection Engine V0.2: Curb Returns & Splitter Islands', () => {
  it('CurbReturnBuilder computes tangent arc fillet between perpendicular lines', () => {
    const p1 = new Vector2D(-20, -3.5);
    const p2 = new Vector2D(0, -3.5); // Ligne horizontale allant vers (0,0)
    const q1 = new Vector2D(-3.5, 0);   // Ligne verticale partant de (0,0) vers le bas
    const q2 = new Vector2D(-3.5, -20);

    const fillet = CurbReturnBuilder.computeFillet(p1, p2, q1, q2, 5.0, 10);
    expect(fillet).not.toBeNull();
    expect(fillet?.points.length).toBe(10);
    expect(fillet?.radius).toBe(5.0);
  });

  it('IntersectionBuilder populates curbReturns and creates smooth rounded polygon for T-junction', () => {
    const engine = new RoadWorldEngine(201);
    const center = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'T_NODE');
    center.curbRadius = 6.0;

    const west = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'W');
    const east = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'E');
    const north = engine.network.createNode(new Vector2D(0, 50), 'dead_end', 'N');

    engine.network.createRoad(west.id, center.id, new LinearCurve(west.position, center.position), testProfile, 'R_W');
    engine.network.createRoad(center.id, east.id, new LinearCurve(center.position, east.position), testProfile, 'R_E');
    engine.network.createRoad(north.id, center.id, new LinearCurve(north.position, center.position), testProfile, 'R_N');

    engine.build();

    expect(center.curbReturns.length).toBeGreaterThan(0);
    expect(center.surfacePolygon.length).toBeGreaterThan(6); // Polygone enrichi par les arcs de congés
  });

  it('Generates 3D Splitter Islands on roundabouts', () => {
    const engine = new RoadWorldEngine(202);
    const rb = engine.network.createRoundaboutNode(new Vector2D(0, 0), 20, 10, 1, 'RB_TEST');
    rb.roundaboutConfig!.hasSplitterIslands = true;

    const w = engine.network.createNode(new Vector2D(-60, 0), 'dead_end', 'W');
    const e = engine.network.createNode(new Vector2D(60, 0), 'dead_end', 'E');

    engine.network.createRoad(w.id, rb.id, new LinearCurve(w.position, new Vector2D(-20, 0)), testProfile, 'R_W');
    engine.network.createRoad(rb.id, e.id, new LinearCurve(new Vector2D(20, 0), e.position), testProfile, 'R_E');

    engine.build();

    expect(rb.splitterIslands.length).toBe(2);
    expect(rb.splitterIslands[0].polygon.length).toBe(3); // Triangle d'îlot
  });
});
