import * as THREE from 'three';
import { Sidewalk } from '../engine/Sidewalk';
import { RoadSegment } from '../engine/RoadSegment';
import { UVManager } from './UVManager';
import { LODLevel, MeshMetadata } from './types';
import { MaterialManager } from './MaterialManager';

export class SidewalkMeshGenerator {
  /**
   * Génère le maillage 3D d'un trottoir continu avec dérivation altimétrique de sa route parente
   */
  static generate(sidewalk: Sidewalk, parentRoad?: RoadSegment, lod: LODLevel = 'LOD0'): THREE.Mesh | null {
    if (sidewalk.surfacePolygon.vertices.length < 3) return null;

    const { indices } = sidewalk.surfacePolygon.triangulate();
    if (indices.length === 0) return null;

    const zBase = parentRoad ? parentRoad.centerline.getElevation(0.5) : 0;
    const sidewalkHeight = 0.15; // Trottoir surélevé de +15cm

    const positions: number[] = [];
    for (const v of sidewalk.surfacePolygon.vertices) {
      positions.push(v.x, zBase + sidewalkHeight, v.y);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);

    const uvs = UVManager.generatePlanarUVs(positions, 2.5);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    geometry.computeVertexNormals();

    const matMgr = MaterialManager.getInstance();
    const mesh = new THREE.Mesh(geometry, matMgr.sidewalkMat);
    mesh.name = `SidewalkMesh_${sidewalk.id}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const metadata: MeshMetadata = {
      id: mesh.name,
      type: 'sidewalk',
      sourceId: sidewalk.id,
      lod,
      chunk: { cx: Math.floor(positions[0] / 100), cz: Math.floor(positions[2] / 100) },
    };
    mesh.userData = metadata;

    return mesh;
  }
}
