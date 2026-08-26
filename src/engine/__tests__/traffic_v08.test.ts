import { describe, it, expect } from 'vitest';
import { IDMController } from '../traffic/IDMController';
import { IDMParameters } from '../traffic/types';
import { Vehicle } from '../traffic/Vehicle';
import { LinearCurve } from '../../core/curves/Curve';
import { Vector2D } from '../../core/math/Vector2D';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { CityBuilder } from '../procedural/CityBuilder';

const testParams: IDMParameters = {
  desiredSpeed: 13.8, // 50 km/h
  freeAcceleration: 2.0,
  comfortableDecel: 2.0,
  minimumGap: 2.0,
  safeTimeHeadway: 1.5,
  accelerationExponent: 4,
};

describe('Microscopic Traffic Simulation & IDM V0.8', () => {
  it('accelerates toward desired speed on free road', () => {
    const accelFromStop = IDMController.calculateAcceleration(0, 13.8, Infinity, 0, testParams);
    expect(accelFromStop).toBeCloseTo(2.0, 1);

    const accelAtDesired = IDMController.calculateAcceleration(13.8, 13.8, Infinity, 0, testParams);
    expect(accelAtDesired).toBeCloseTo(0, 1);
  });

  it('brakes smoothly when following a slower leader', () => {
    const accelApproaching = IDMController.calculateAcceleration(12.0, 13.8, 15.0, 4.0, testParams);
    expect(accelApproaching).toBeLessThan(0); // Doit ralentir
  });

  it('triggers emergency braking when too close to leader', () => {
    const emergencyAccel = IDMController.calculateAcceleration(10.0, 13.8, 1.0, 5.0, testParams);
    expect(emergencyAccel).toBeLessThanOrEqual(-4.0); // Freinage fort
  });

  it('updates vehicle pose and position along curve', () => {
    const curve = new LinearCurve(new Vector2D(0, 0), new Vector2D(100, 0));
    const vehicle = new Vehicle('V_1', 'sedan', curve, 'L_1', 0);

    expect(vehicle.velocity).toBeGreaterThan(0);
    vehicle.updatePhysics(0.5, Infinity, 0, 13.8);

    expect(vehicle.sDistance).toBeGreaterThan(0);
    const pose = vehicle.getPose();
    expect(pose.position.x).toBeGreaterThan(0);
    expect(pose.position.y).toBe(0);
  });

  it('spawns and updates fleet of vehicles in traffic simulation', () => {
    const engine = new RoadWorldEngine(801);
    CityBuilder.createGridCity(engine, { rows: 3, cols: 3, blockSizeX: 60, blockSizeY: 50 }, 801);

    engine.traffic.config.maxVehicles = 10;
    engine.traffic.config.spawnIntervalSeconds = 0.1;

    // Simuler plusieurs secondes
    for (let i = 0; i < 20; i++) {
      engine.update(0.1);
    }

    expect(engine.traffic.vehicles.size).toBeGreaterThan(0);
    const stats = engine.getStats();
    expect(stats.vehiclesCount).toBe(engine.traffic.vehicles.size);
  });
});
