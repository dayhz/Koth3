import { describe, it, expect } from 'vitest';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve } from '../../core/curves/Curve';
import { RoadProfile } from '../types';

const defaultProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 30,
};

describe('3D Traffic Signs & Physical Road Panels', () => {
  it('automatically places STOP and YIELD signs according to regulation', async () => {
    const engine = new RoadWorldEngine(777);
    const center = engine.network.createNode(new Vector2D(0, 0), 'four_way');
    const w = engine.network.createNode(new Vector2D(-50, 0), 'dead_end');
    const e = engine.network.createNode(new Vector2D(50, 0), 'dead_end');
    const n = engine.network.createNode(new Vector2D(0, 50), 'dead_end');
    const s = engine.network.createNode(new Vector2D(0, -50), 'dead_end');

    const rw = engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), defaultProfile, 'RW');
    const re = engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), defaultProfile, 'RE');
    const rn = engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), defaultProfile, 'RN');
    const rs = engine.network.createRoad(center.id, s.id, new LinearCurve(center.position, s.position), defaultProfile, 'RS');

    engine.build();
    // Réguler avec STOP sur RN et RS
    engine.regulation.setPriorityRule(center.id, 'stop', [rw.id, re.id], [rn.id, rs.id], 'Arrêt obligatoire');
    engine.signs = engine.network ? (await import('../signs/TrafficSignGenerator')).TrafficSignGenerator.generate(engine.network, engine.regulation) : engine.signs;

    expect(engine.signs.size).toBeGreaterThan(0);

    const stopSigns = Array.from(engine.signs.values()).filter((s) => s.type === 'stop');
    expect(stopSigns.length).toBeGreaterThanOrEqual(2);

    const speedSigns = Array.from(engine.signs.values()).filter((s) => s.type === 'speed_30');
    expect(speedSigns.length).toBe(4);
  });

  it('places blue Roundabout signs at roundabout entries', () => {
    const engine = new RoadWorldEngine(888);
    const hub = engine.network.createRoundaboutNode(new Vector2D(0, 0), 22, 12, 2);
    const n = engine.network.createNode(new Vector2D(0, 60), 'dead_end');
    const s = engine.network.createNode(new Vector2D(0, -60), 'dead_end');

    engine.network.createRoad(n.id, hub.id, new LinearCurve(n.position, hub.position), defaultProfile);
    engine.network.createRoad(hub.id, s.id, new LinearCurve(hub.position, s.position), defaultProfile);

    engine.build();

    const roundaboutSigns = Array.from(engine.signs.values()).filter((s) => s.type === 'roundabout');
    expect(roundaboutSigns.length).toBe(2);
  });
});
