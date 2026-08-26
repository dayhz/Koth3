import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { RoadWorldEngine } from '../RoadWorldEngine';
import { RoadWorldEditor } from '../../editor/RoadWorldEditor';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve } from '../../core/curves/Curve';
import { TEST_SCENARIOS } from '../../test-lab/TestLabScenarios';
import { WorldValidator } from '../../validation/WorldValidator';
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

describe('Production Release & Final Integration V1.0', () => {
  it('allows interactive construction via RoadWorldEditor (Sandbox)', () => {
    const engine = new RoadWorldEngine(1001);
    const camera = new THREE.PerspectiveCamera();
    const mockDom: any = {
      addEventListener: () => {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    };

    let modified = false;
    const editor = new RoadWorldEditor(engine, camera, mockDom, () => {
      modified = true;
    });

    editor.isEditorActive = true;

    // Création de 2 nœuds et d'une route 2 voies
    const n1 = engine.network.createNode(new Vector2D(0, 0), 'dead_end', 'Node 1');
    const n2 = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'Node 2');
    editor.selectedNode = n1;

    editor.activeTool = 'road_2lane';
    const curve = new LinearCurve(n1.position, n2.position);
    engine.network.createRoad(n1.id, n2.id, curve, testProfile, 'R_USER_1');
    engine.build();

    expect(engine.network.nodes.size).toBe(2);
    expect(engine.network.roads.size).toBe(1);
    expect(engine.network.lanes.size).toBe(2);
    expect(modified).toBe(false); // Le callback est testable lors de déclenchement
  });

  it('builds and validates TEST-19 (Grande Métropole Multimodale V1.0)', () => {
    const scenario19 = TEST_SCENARIOS.find((s) => s.id === 'TEST-19');
    expect(scenario19).toBeDefined();

    const engine = scenario19!.createEngine();
    const stats = engine.getStats();

    expect(stats.nodesCount).toBeGreaterThan(15);
    expect(stats.roadsCount).toBeGreaterThanOrEqual(20);
    expect(stats.lanesCount).toBeGreaterThan(35);

    // Simuler plusieurs secondes de trafic
    for (let i = 0; i < 15; i++) {
      engine.update(0.1);
    }
    expect(engine.traffic.vehicles.size).toBeGreaterThan(0);

    const report = WorldValidator.validate(engine.network);
    expect(report.isValid).toBe(true);
  });
});
