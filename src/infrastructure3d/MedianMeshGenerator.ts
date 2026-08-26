import * as THREE from 'three';
import { RoadSegment } from '../engine/RoadSegment';
import { MaterialManager } from './MaterialManager';
import { LODLevel } from './types';

export class MedianMeshGenerator {
  /**
   * Génère un terre-plein central surélevé végétalisé le long d'une avenue
   */
  static generate(road: RoadSegment, medianWidth: number = 2.0, lod: LODLevel = 'LOD0'): THREE.Mesh | null {
    if (road.profile.laneCount < 4) return null;

    const samples = lod === 'LOD0' ? 24 : 12;
    const halfMedian = medianWidth / 2;
    const height = 0.18;

    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const t = road.tStart + (i / samples) * (road.tEnd - road.tStart);
      const point = road.centerline.getPoint(t);
      const tangent = road.centerline.getTangent(t);
      const normal = new THREE.Vector2(-tangent.y, tangent.x).normalize();
      const elev = road.centerline.getElevation(t);

      positions.push(point.x + normal.x * halfMedian, elev + height, point.y + normal.y * halfMedian);
      positions.push(point.x - normal.x * halfMedian, elev + height, point.y - normal.y * halfMedian);

      if (i > 0) {
        const p0 = (i - 1) * 2;
        const p1 = i * 2;
        indices.push(p0, p1, p0 + 1);
        indices.push(p0 + 1, p1, p1 + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const matMgr = MaterialManager.getInstance();
    const mesh = new THREE.Mesh(geometry, matMgr.grassMat);
    mesh.name = `MedianMesh_${road.id}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }
}
