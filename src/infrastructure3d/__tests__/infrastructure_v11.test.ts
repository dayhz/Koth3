import { describe, it, expect } from 'vitest';
import { RoadWorldEngine } from '../../engine/RoadWorldEngine';
import { Vector2D } from '../../core/math/Vector2D';
import { LinearCurve } from '../../core/curves/Curve';
import { RoadProfile } from '../../engine/types';
import { InfrastructureBuilder } from '../InfrastructureBuilder';
import { RoadMeshGenerator } from '../RoadMeshGenerator';
import { RoundaboutMeshGenerator } from '../RoundaboutMeshGenerator';
import { IntersectionMeshGenerator } from '../IntersectionMeshGenerator';
import { SidewalkMeshGenerator } from '../SidewalkMeshGenerator';
import { CurbMeshGenerator } from '../CurbMeshGenerator';
import { MarkingMeshGenerator } from '../MarkingMeshGenerator';
import { MaterialManager } from '../MaterialManager';
import { UVManager } from '../UVManager';
import { CollisionManager } from '../CollisionManager';
import { ChunkManager } from '../ChunkManager';
import { LODManager } from '../LODManager';
import { InfrastructureValidator } from '../InfrastructureValidator';
import { InfrastructureDebugger } from '../InfrastructureDebugger';

const standardProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

describe('ROAD WORLD ENGINE V1.1 — INFRASTRUCTURE 3D (15 Steps)', () => {
  // STEP 1, 2, 3 : Chaussées, Segmentation & Continuité
  it('STEP 1, 2, 3: generates continuous segmented 3D road meshes with UVs and normals', () => {
    const engine = new RoadWorldEngine(101);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(100, 0));
    const road = engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), standardProfile);

    const meshes = RoadMeshGenerator.generate(road, { segmentLengthMeters: 25.0 });
    expect(meshes.length).toBe(4); // 100m / 25m = 4 segments

    for (const mesh of meshes) {
      expect(mesh.geometry.attributes.position).toBeDefined();
      expect(mesh.geometry.attributes.uv).toBeDefined();
      expect(mesh.geometry.attributes.normal).toBeDefined();
      expect(mesh.geometry.index).toBeDefined();
      expect(mesh.userData.type).toBe('road');
    }
  });

  // STEP 4 : Carrefours T et X
  it('STEP 4: generates 3D intersection surfaces for T and X nodes', () => {
    const engine = new RoadWorldEngine(102);
    const center = engine.network.createNode(new Vector2D(0, 0), 'four_way');
    const w = engine.network.createNode(new Vector2D(-50, 0));
    const e = engine.network.createNode(new Vector2D(50, 0));
    const n = engine.network.createNode(new Vector2D(0, 50));
    const s = engine.network.createNode(new Vector2D(0, -50));

    engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), standardProfile);
    engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), standardProfile);
    engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), standardProfile);
    engine.network.createRoad(center.id, s.id, new LinearCurve(center.position, s.position), standardProfile);

    engine.build();

    const mesh = IntersectionMeshGenerator.generate(center);
    expect(mesh).not.toBeNull();
    expect(mesh!.geometry.attributes.position.count).toBeGreaterThan(3);
    expect(mesh!.userData.type).toBe('intersection');
  });

  // STEP 5 : Giratoire avec vrai terre-plein central paysager
  it('STEP 5: generates roundabout with circulating ring and raised central grass island', () => {
    const engine = new RoadWorldEngine(103);
    const hub = engine.network.createRoundaboutNode(new Vector2D(0, 0), 24, 13, 2);
    const n = engine.network.createNode(new Vector2D(0, 60));
    const s = engine.network.createNode(new Vector2D(0, -60));

    engine.network.createRoad(n.id, hub.id, new LinearCurve(n.position, hub.position), standardProfile);
    engine.network.createRoad(hub.id, s.id, new LinearCurve(hub.position, s.position), standardProfile);

    engine.build();

    const r3d = RoundaboutMeshGenerator.generate(hub);
    expect(r3d).not.toBeNull();
    expect(r3d!.circulatingRingMesh).toBeDefined();
    expect(r3d!.cobblestoneApronMesh).toBeDefined();
    expect(r3d!.curbRingMesh).toBeDefined();
    expect(r3d!.centralIslandMesh).toBeDefined();

    expect(r3d!.centralIslandMesh.userData.type).toBe('central_island');
  });

  // STEP 6 & 7 : Trottoirs et bordures 3D extrudées
  it('STEP 6 & 7: generates continuous sidewalks and extruded beveled curbs', () => {
    const engine = new RoadWorldEngine(104);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(50, 0));
    const road = engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), standardProfile);

    engine.build();

    const sw = Array.from(engine.network.sidewalks.values())[0];
    expect(sw).toBeDefined();

    const swMesh = SidewalkMeshGenerator.generate(sw, road);
    expect(swMesh).not.toBeNull();

    const curbMesh = CurbMeshGenerator.generateExtrudedCurb(sw.surfacePolygon.vertices, 0, 0.15, 0.12);
    expect(curbMesh).not.toBeNull();
  });

  // STEP 8 : Marquages routiers, zébras et lignes d'arrêt
  it('STEP 8: generates road markings, zebra crosswalks and stop lines', () => {
    const engine = new RoadWorldEngine(105);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(60, 0));
    engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), standardProfile);

    engine.build();

    const marking = Array.from(engine.network.markings.values())[0];
    expect(marking).toBeDefined();

    const markMesh = MarkingMeshGenerator.generateLineMarking(marking);
    expect(markMesh).not.toBeNull();
  });

  // STEP 9 : Matériaux et UVs
  it('STEP 9: manages centralized PBR materials and uniform UV tiling', () => {
    const matMgr = MaterialManager.getInstance();
    expect(matMgr.asphaltMat).toBeDefined();
    expect(matMgr.grassMat).toBeDefined();
    expect(matMgr.curbMat).toBeDefined();

    const uvs = UVManager.generateRibbonUVs([0, 10, 20], [0, 1], 4.0);
    expect(uvs.length).toBe(12);
  });

  // STEP 10 : CollisionManager
  it('STEP 10: builds drivable surface collision hulls', () => {
    const engine = new RoadWorldEngine(106);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(50, 0));
    engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), standardProfile);
    engine.build();

    const colMgr = new CollisionManager();
    colMgr.buildCollisions(engine.network);
    expect(colMgr.hulls.size).toBeGreaterThan(0);
  });

  // STEP 11 & 12 : ChunkManager & LODManager
  it('STEP 11 & 12: partitions meshes into spatial chunks and evaluates LOD distances', () => {
    const chunkMgr = new ChunkManager();
    const lodMgr = new LODManager();

    const coord = chunkMgr.getChunkCoord(150, 250);
    expect(coord.cx).toBe(1);
    expect(coord.cz).toBe(2);

    expect(lodMgr.getLODForDistance(50)).toBe('LOD0');
    expect(lodMgr.getLODForDistance(150)).toBe('LOD1');
    expect(lodMgr.getLODForDistance(300)).toBe('LOD2');
  });

  // STEP 13, 14, 15 : Validation, Debugger & Optimizer Metrics
  it('STEP 13, 14, 15: validates infrastructure, controls debug modes and measures performance', () => {
    const engine = new RoadWorldEngine(107);
    const n1 = engine.network.createNode(new Vector2D(0, 0));
    const n2 = engine.network.createNode(new Vector2D(50, 0));
    engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), standardProfile);
    engine.build();

    // 13. Validation
    const report = InfrastructureValidator.validate(engine.network);
    expect(report.isValid).toBe(true);

    // 14. Builder & Optimizer
    const builder = new InfrastructureBuilder();
    const group = builder.build(engine.network, 'LOD0');
    expect(group.children.length).toBeGreaterThan(0);
    expect(builder.metrics.totalTriangles).toBeGreaterThan(0);

    // 15. Debugger
    const dbg = new InfrastructureDebugger();
    dbg.setMode('WIREFRAME', group);
    expect(dbg.mode).toBe('WIREFRAME');
  });
});
