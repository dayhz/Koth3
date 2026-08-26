import * as THREE from 'three';
import { IVector2D } from '../core/math/Vector2D';
import { MaterialManager } from './MaterialManager';
import { LODLevel } from './types';

export class CurbMeshGenerator {
  /**
   * Extrude une bordure de trottoir 3D chanfreinée le long d'une polyligne de points
   */
  static generateExtrudedCurb(
    points: IVector2D[],
    elevation: number,
    curbHeight: number = 0.15,
    curbWidth: number = 0.12,
    _lod: LODLevel = 'LOD0'
  ): THREE.Mesh | null {
    if (points.length < 2) return null;

    const positions: number[] = [];
    const indices: number[] = [];

    // Profil de bordure : 0 = bas chaussée, 1 = chanfrein, 2 = haut trottoir
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      // Calcul normale 2D approximative
      let nx = 0;
      let ny = 1;
      if (i < points.length - 1) {
        const dx = points[i + 1].x - p.x;
        const dy = points[i + 1].y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        nx = -dy / len;
        ny = dx / len;
      } else if (i > 0) {
        const dx = p.x - points[i - 1].x;
        const dy = p.y - points[i - 1].y;
        const len = Math.hypot(dx, dy) || 1;
        nx = -dy / len;
        ny = dx / len;
      }

      // Point 0 : Bas au niveau de l'asphalte
      positions.push(p.x, elevation, p.y);
      // Point 1 : Haut de la bordure surélevé de +curbHeight
      positions.push(p.x + nx * curbWidth, elevation + curbHeight, p.y + ny * curbWidth);

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
    const mesh = new THREE.Mesh(geometry, matMgr.curbMat);
    mesh.name = `CurbMesh_${Math.round(points[0].x)}_${Math.round(points[0].y)}`;
    mesh.castShadow = true;

    return mesh;
  }
}
