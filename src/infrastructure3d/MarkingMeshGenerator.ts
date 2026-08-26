import * as THREE from 'three';
import { RoadMarking } from '../engine/RoadMarking';
import { CrosswalkData, StopLineData } from '../engine/types';
import { RoadSegment } from '../engine/RoadSegment';
import { MaterialManager } from './MaterialManager';
import { LODLevel } from './types';

export class MarkingMeshGenerator {
  /**
   * Génère les marquages au sol continus et discontinus le long des routes
   */
  static generateLineMarking(marking: RoadMarking, parentRoad?: RoadSegment, lod: LODLevel = 'LOD0'): THREE.Mesh | null {
    const samples = lod === 'LOD0' ? 24 : 12;
    const halfWidth = marking.width / 2;
    const elev = parentRoad ? parentRoad.centerline.getElevation(0.5) : 0;
    const zBias = 0.02; // Prévention Z-Fighting

    const frames = marking.centerline.sampleFrames(samples);
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const pLeft = f.point.addScaled(f.normal, halfWidth);
      const pRight = f.point.addScaled(f.normal, -halfWidth);

      positions.push(pLeft.x, elev + zBias, pLeft.y);
      positions.push(pRight.x, elev + zBias, pRight.y);

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
    const mesh = new THREE.Mesh(geometry, matMgr.markingMat);
    mesh.name = `MarkingMesh_${marking.id}`;

    return mesh;
  }

  /**
   * Génère les bandes zébrées d'un passage piéton
   */
  static generateCrosswalk(cw: CrosswalkData): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    const matMgr = MaterialManager.getInstance();
    const zBias = 0.025;

    for (let i = 0; i < cw.stripes.length; i++) {
      const stripe = cw.stripes[i];
      const p1 = stripe.p1;
      const p2 = stripe.p2;

      // Vecteur directeur de la bande
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * 0.25; // Demi-largeur de bande 25cm
      const ny = (dx / len) * 0.25;

      const positions = [
        p1.x + nx, cw.elevation + zBias, p1.y + ny,
        p1.x - nx, cw.elevation + zBias, p1.y - ny,
        p2.x + nx, cw.elevation + zBias, p2.y + ny,
        p2.x - nx, cw.elevation + zBias, p2.y - ny,
      ];
      const indices = [0, 2, 1, 1, 2, 3];

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const mesh = new THREE.Mesh(geometry, matMgr.markingMat);
      mesh.name = `CrosswalkStripe_${cw.id}_${i}`;
      meshes.push(mesh);
    }

    return meshes;
  }

  /**
   * Génère une ligne d'arrêt transversale
   */
  static generateStopLine(stopLine: StopLineData): THREE.Mesh {
    const p1 = stopLine.p1;
    const p2 = stopLine.p2;
    const elev = stopLine.elevation || 0;
    const zBias = 0.025;
    const width = 0.4; // 40cm

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (width / 2);
    const ny = (dx / len) * (width / 2);

    const positions = [
      p1.x + nx, elev + zBias, p1.y + ny,
      p1.x - nx, elev + zBias, p1.y - ny,
      p2.x + nx, elev + zBias, p2.y + ny,
      p2.x - nx, elev + zBias, p2.y - ny,
    ];
    const indices = [0, 2, 1, 1, 2, 3];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const matMgr = MaterialManager.getInstance();
    const mesh = new THREE.Mesh(geometry, matMgr.markingMat);
    mesh.name = `StopLineMesh_${stopLine.id}`;

    return mesh;
  }
}
