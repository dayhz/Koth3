import * as THREE from 'three';

export class NormalManager {
  /**
   * Recalcule et lisse les normales d'une géométrie 3D pour un rendu d'éclairage propre
   */
  static computeSmoothNormals(geometry: THREE.BufferGeometry): void {
    geometry.computeVertexNormals();
  }

  /**
   * Génère des normales orientées selon la pente et le dévers d'un ruban routier
   */
  static generateRibbonNormals(
    lengthSegments: number,
    widthSegments: number,
    upVectors: THREE.Vector3[]
  ): Float32Array {
    const totalVertices = lengthSegments * widthSegments;
    const normals = new Float32Array(totalVertices * 3);
    let ptr = 0;

    for (let i = 0; i < lengthSegments; i++) {
      const up = upVectors[i] || new THREE.Vector3(0, 1, 0);
      for (let j = 0; j < widthSegments; j++) {
        normals[ptr++] = up.x;
        normals[ptr++] = up.y;
        normals[ptr++] = up.z;
      }
    }

    return normals;
  }
}
