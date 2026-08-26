import { describe, it, expect } from 'vitest';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve } from '../../core/curves/Curve';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { RoadProfile } from '../types';

const resProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 30,
};

const avenueProfile: RoadProfile = {
  roadType: 'avenue',
  laneCount: 4,
  laneWidth: 3.5,
  sidewalkWidthLeft: 3.0,
  sidewalkWidthRight: 3.0,
  curbHeight: 0.15,
  speedLimitKmH: 70,
};

describe('Traffic Regulation Engine V0.4', () => {
  it('arbitrates priority-to-the-right at standard four-way intersections', () => {
    const engine = new RoadWorldEngine(401);
    const center = engine.network.createNode(new Vector2D(0, 0), 'four_way', 'CENTER');
    const south = engine.network.createNode(new Vector2D(0, -50), 'dead_end', 'S');
    const east = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'E');
    const west = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'W');

    engine.network.createRoad(south.id, center.id, new LinearCurve(south.position, center.position), resProfile, 'R_S');
    engine.network.createRoad(west.id, center.id, new LinearCurve(west.position, center.position), resProfile, 'R_W');
    engine.network.createRoad(center.id, east.id, new LinearCurve(center.position, east.position), resProfile, 'R_E');

    engine.build();

    const rule = engine.regulation.getPriorityRule(center.id);
    expect(rule).toBeDefined();
    expect(rule?.regime).toBe('priority_to_right');

    // Trouver deux connexions qui se croisent (ex: de Ouest vers Est tout droit, et de Sud vers Nord)
    const connections = Array.from(engine.network.laneConnections.values());
    expect(connections.length).toBeGreaterThan(1);

    const res = engine.regulation.arbitrate(connections[0].id, connections[1].id);
    expect(res.hasConflict).toBeDefined();
  });

  it('enforces major road priority over minor residential roads', () => {
    const engine = new RoadWorldEngine(402);
    const center = engine.network.createNode(new Vector2D(0, 0), 'four_way', 'CENTER');
    const west = engine.network.createNode(new Vector2D(-60, 0), 'dead_end', 'W');
    const east = engine.network.createNode(new Vector2D(60, 0), 'dead_end', 'E');
    const north = engine.network.createNode(new Vector2D(0, 60), 'dead_end', 'N');

    // Axe Ouest-Est = Avenue (Axe prioritaire)
    engine.network.createRoad(west.id, center.id, new LinearCurve(west.position, center.position), avenueProfile, 'R_AVE_W');
    engine.network.createRoad(center.id, east.id, new LinearCurve(center.position, east.position), avenueProfile, 'R_AVE_E');
    // Axe Nord = Résidentiel (Rue affluente secondaire)
    engine.network.createRoad(north.id, center.id, new LinearCurve(north.position, center.position), resProfile, 'R_RES_N');

    engine.build();

    const rule = engine.regulation.getPriorityRule(center.id);
    expect(rule?.regime).toBe('priority_road');
    expect(rule?.majorRoadIds).toContain('R_AVE_W');
    expect(rule?.minorRoadIds).toContain('R_RES_N');
  });

  it('applies speed limits and custom speed zones', () => {
    const engine = new RoadWorldEngine(403);
    const n1 = engine.network.createNode(new Vector2D(0, 0), 'dead_end', 'N1');
    const n2 = engine.network.createNode(new Vector2D(100, 0), 'dead_end', 'N2');
    const road = engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), resProfile, 'R_ZONE');

    engine.build();

    // Vitesse par défaut du profil résidentiel = 30 km/h
    expect(engine.regulation.getSpeedLimitForRoad(road.id)).toBe(30);

    // Définir une Zone 20 (Zone de rencontre)
    engine.regulation.addSpeedZone({
      id: 'ZONE_20_CENTRE',
      name: 'Zone de rencontre piétonne',
      speedLimitKmH: 20,
      roadIds: [road.id],
    });

    expect(engine.regulation.getSpeedLimitForRoad(road.id)).toBe(20);
  });
});
