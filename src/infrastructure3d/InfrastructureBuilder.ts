import * as THREE from 'three';
import { RoadNetwork } from '../engine/RoadNetwork';
import { RoadMeshGenerator } from './RoadMeshGenerator';
import { IntersectionMeshGenerator } from './IntersectionMeshGenerator';
import { RoundaboutMeshGenerator } from './RoundaboutMeshGenerator';
import { SidewalkMeshGenerator } from './SidewalkMeshGenerator';
import { CurbMeshGenerator } from './CurbMeshGenerator';
import { MedianMeshGenerator } from './MedianMeshGenerator';
import { MarkingMeshGenerator } from './MarkingMeshGenerator';
import { MaterialManager } from './MaterialManager';
import { CollisionManager } from './CollisionManager';
import { ChunkManager } from './ChunkManager';
import { LODLevel, InfrastructureMetrics } from './types';
import { MeshOptimizer } from './MeshOptimizer';

export class InfrastructureBuilder {
  public group: THREE.Group = new THREE.Group();
  public collisionManager = new CollisionManager();
  public chunkManager = new ChunkManager();
  public metrics: InfrastructureMetrics = {
    totalMeshes: 0,
    totalTriangles: 0,
    totalVertices: 0,
    drawCalls: 0,
    generationTimeMs: 0,
  };

  /**
   * Construit l'ensemble de l'infrastructure 3D photoréaliste à partir du réseau logique
   */
  build(network: RoadNetwork, lod: LODLevel = 'LOD0'): THREE.Group {
    const startTime = performance.now();
    this.clear();

    const matMgr = MaterialManager.getInstance();

    // 1. Chaussées de routes (STEP 1, 2, 3)
    for (const road of network.roads.values()) {
      const roadMeshes = RoadMeshGenerator.generate(road, { lod, segmentLengthMeters: 25.0 });
      for (const mesh of roadMeshes) {
        mesh.material = matMgr.asphaltMat;
        this.group.add(mesh);
        this.chunkManager.addMeshToChunk(mesh, mesh.position.x, mesh.position.z);
      }

      // Terre-pleins centraux pour les 4 voies
      const medianMesh = MedianMeshGenerator.generate(road, 2.0, lod);
      if (medianMesh) {
        this.group.add(medianMesh);
      }
    }

    // 2. Carrefours et Giratoires avec Terre-Plein Central Paysager (STEP 4 & 5)
    for (const node of network.nodes.values()) {
      if (node.type === 'roundabout') {
        const r3d = RoundaboutMeshGenerator.generate(node, lod);
        if (r3d) {
          this.group.add(r3d.circulatingRingMesh);
          this.group.add(r3d.cobblestoneApronMesh);
          this.group.add(r3d.curbRingMesh);
          this.group.add(r3d.centralIslandMesh);
        }
      } else {
        const intMesh = IntersectionMeshGenerator.generate(node, lod);
        if (intMesh) {
          intMesh.material = matMgr.asphaltMat;
          this.group.add(intMesh);
        }
      }
    }

    // 3. Trottoirs & Bordures extrudées (STEP 6 & 7)
    for (const sidewalk of network.sidewalks.values()) {
      const parentRoad = network.roads.get(sidewalk.parentRoadId);
      const swMesh = SidewalkMeshGenerator.generate(sidewalk, parentRoad, lod);
      if (swMesh) {
        this.group.add(swMesh);
      }

      // Bordure 3D extrudée le long du trottoir
      if (sidewalk.surfacePolygon.vertices.length >= 2) {
        const curb = CurbMeshGenerator.generateExtrudedCurb(
          sidewalk.surfacePolygon.vertices,
          parentRoad ? parentRoad.centerline.getElevation(0.5) : 0,
          0.15,
          0.12,
          lod
        );
        if (curb) this.group.add(curb);
      }
    }

    // 4. Marquages au sol procéduraux (STEP 8)
    for (const marking of network.markings.values()) {
      const parentRoad = marking.parentRoadId ? network.roads.get(marking.parentRoadId) : undefined;
      const markMesh = MarkingMeshGenerator.generateLineMarking(marking, parentRoad, lod);
      if (markMesh) this.group.add(markMesh);
    }

    for (const cw of network.crosswalks.values()) {
      const cwStripes = MarkingMeshGenerator.generateCrosswalk(cw);
      for (const stripe of cwStripes) this.group.add(stripe);
    }

    for (const stopLine of network.stopLines.values()) {
      const slMesh = MarkingMeshGenerator.generateStopLine(stopLine);
      this.group.add(slMesh);
    }

    // 5. Couche de collision (STEP 10)
    this.collisionManager.buildCollisions(network);

    // 6. Métriques de performance (STEP 15)
    this.metrics = MeshOptimizer.computeMetrics(this.group, startTime);

    return this.group;
  }

  clear(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child instanceof THREE.Mesh && child.geometry) {
        child.geometry.dispose();
      }
    }
    this.chunkManager.clear();
  }
}
