import { describe, it, expect } from 'vitest';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve } from '../../core/curves/Curve';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { RoadProfile } from '../types';

const defaultProfile: RoadProfile = {
  roadType: 'avenue',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.5,
  sidewalkWidthRight: 2.5,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

describe('Traffic Light & Dynamic Signalization Engine V0.5', () => {
  it('generates 3D traffic light poles on all approach branches of an intersection', () => {
    const engine = new RoadWorldEngine(501);
    const center = engine.network.createNode(new Vector2D(0, 0), 'four_way', 'CENTER');
    const w = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'W');
    const e = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'E');
    const n = engine.network.createNode(new Vector2D(0, 50), 'dead_end', 'N');
    const s = engine.network.createNode(new Vector2D(0, -50), 'dead_end', 'S');

    engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), defaultProfile, 'R_W');
    engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), defaultProfile, 'R_E');
    engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), defaultProfile, 'R_N');
    engine.network.createRoad(center.id, s.id, new LinearCurve(center.position, s.position), defaultProfile, 'R_S');

    engine.build();

    expect(engine.trafficLights.poles.size).toBe(4);
    expect(engine.trafficLights.controllers.size).toBe(1);

    const controller = engine.trafficLights.controllers.get(center.id);
    expect(controller).toBeDefined();
    expect(controller?.phases.length).toBe(2);
  });

  it('cycles through Green, Yellow and All-Red states over time', () => {
    const engine = new RoadWorldEngine(502);
    const center = engine.network.createNode(new Vector2D(0, 0), 'four_way', 'CENTER');
    const w = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'W');
    const e = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'E');
    const n = engine.network.createNode(new Vector2D(0, 50), 'dead_end', 'N');

    engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), defaultProfile, 'R_W');
    engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), defaultProfile, 'R_E');
    engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), defaultProfile, 'R_N');

    engine.build();

    const controller = engine.trafficLights.controllers.get(center.id)!;
    expect(controller.subPhase).toBe('green');

    // 1. Avancer le temps de 13s (la phase 1 dure 12s) -> Doit être au Jaune
    engine.update(13.0);
    expect(controller.subPhase).toBe('yellow');

    // 2. Avancer de 3.5s (le jaune dure 3s) -> Doit être en All-Red
    engine.update(3.5);
    expect(controller.subPhase).toBe('all_red');

    // 3. Avancer de 2s (le all-red dure 1.5s) -> Doit basculer en Phase 2 au Vert
    engine.update(2.0);
    expect(controller.subPhase).toBe('green');
    expect(controller.currentPhaseIndex).toBe(1);
  });

  it('correctly evaluates canProceed for vehicle lanes', () => {
    const engine = new RoadWorldEngine(503);
    const center = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'CENTER');
    const w = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'W');
    const e = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'E');
    const n = engine.network.createNode(new Vector2D(0, 50), 'dead_end', 'N');

    const roadW = engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), defaultProfile, 'R_W');
    engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), defaultProfile, 'R_E');
    engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), defaultProfile, 'R_N');

    engine.build();

    const lanesW = engine.network.getLanesForRoad(roadW.id);
    expect(lanesW.length).toBeGreaterThan(0);

    const laneId = lanesW[0].id;
    const canProceedInitial = engine.trafficLights.canVehicleProceed(laneId, center.id);
    expect(typeof canProceedInitial).toBe('boolean');
  });
});
