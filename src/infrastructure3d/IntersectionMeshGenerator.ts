import * as THREE from 'three';
import { IntersectionNode } from '../engine/IntersectionNode';
import { UVManager } from './UVManager';
import { LODLevel, MeshMetadata } from './types';

export class IntersectionMeshGenerator {
  /**
   * Génère le maillage 3D d'un carrefour en T, X ou complexe
   */
  static generate(node: IntersectionNode, lod: LODLevel = 'LOD0'): THREE.Mesh | null {
    if (node.type === 'dead_end' || node.surfacePolygon.length < 3) {
      return null;
    }

    const { indices } = node.surfacePolygon.triangulate();
    if (indices.length === 0) return null;

    const positions: number[] = [];
    for (const v of node.surfacePolygon.vertices) {
      positions.push(v.x, node.elevation, v.y);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);

    const uvs = UVManager.generatePlanarUVs(positions, 4.0);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry);
    mesh.name = `IntersectionMesh_${node.id}`;
    mesh.receiveShadow = true;

    const metadata: MeshMetadata = {
      id: mesh.name,
      type: 'intersection',
      sourceId: node.id,
      lod,
      chunk: { cx: Math.floor(node.position.x / 100), cz: Math.floor(node.position.y / 100) },
    };
    mesh.userData = metadata;

    return mesh;
  }
}
