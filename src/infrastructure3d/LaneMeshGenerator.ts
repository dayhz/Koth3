import * as THREE from 'three';
import { LaneConnection } from '../engine/types';
import { LODLevel, MeshMetadata } from './types';
import { UVManager } from './UVManager';
import { MaterialManager } from './MaterialManager';

export class LaneMeshGenerator {
  /**
   * Génère le ruban 3D d'une trajectoire interne de carrefour
   */
  static generate(
    conn: LaneConnection,
    laneWidth: number = 3.5,
    elevation: number = 0,
    lod: LODLevel = 'LOD0'
  ): THREE.Mesh {
    const samples = lod === 'LOD0' ? 20 : lod === 'LOD1' ? 10 : 6;
    const halfW = laneWidth / 2;
    const pts = conn.trajectory.samplePoints(samples);

    const positions: number[] = [];
    const arcLengths: number[] = [];
    const indices: number[] = [];

    let totalDist = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i > 0) {
        totalDist += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
      }
      arcLengths.push(totalDist);

      // Tangente 2D
      let dx = 0;
      let dy = 1;
      if (i < pts.length - 1) {
        dx = pts[i + 1].x - p.x;
        dy = pts[i + 1].y - p.y;
      } else if (i > 0) {
        dx = p.x - pts[i - 1].x;
        dy = p.y - pts[i - 1].y;
      }
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * halfW;
      const ny = (dx / len) * halfW;

      positions.push(p.x + nx, elevation, p.y + ny);
      positions.push(p.x - nx, elevation, p.y - ny);

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

    const uvs = UVManager.generateRibbonUVs(arcLengths, [0, 1], 4.0);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    geometry.computeVertexNormals();

    const matMgr = MaterialManager.getInstance();
    const mesh = new THREE.Mesh(geometry, matMgr.asphaltMat);
    mesh.name = `LaneConnection_${conn.id}`;
    mesh.receiveShadow = true;

    const metadata: MeshMetadata = {
      id: mesh.name,
      type: 'lane_connection',
      sourceId: conn.id,
      lod,
      chunk: { cx: Math.floor(pts[0].x / 100), cz: Math.floor(pts[0].y / 100) },
    };
    mesh.userData = metadata;

    return mesh;
  }
}
