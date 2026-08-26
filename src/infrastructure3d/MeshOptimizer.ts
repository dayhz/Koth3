import * as THREE from 'three';
import { InfrastructureMetrics } from './types';

export class MeshOptimizer {
  /**
   * Calcule les métriques de performance du rendu 3D
   */
  static computeMetrics(group: THREE.Group, startTimeMs: number): InfrastructureMetrics {
    let totalMeshes = 0;
    let totalTriangles = 0;
    let totalVertices = 0;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        totalMeshes++;
        const geom = child.geometry;
        if (geom.index) {
          totalTriangles += geom.index.count / 3;
        } else if (geom.attributes.position) {
          totalTriangles += geom.attributes.position.count / 3;
        }
        if (geom.attributes.position) {
          totalVertices += geom.attributes.position.count;
        }
      }
    });

    return {
      totalMeshes,
      totalTriangles,
      totalVertices,
      drawCalls: totalMeshes,
      generationTimeMs: performance.now() - startTimeMs,
    };
  }
}
