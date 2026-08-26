import * as THREE from 'three';
import { IntersectionNode } from '../engine/IntersectionNode';
import { UVManager } from './UVManager';
import { LODLevel, MeshMetadata } from './types';
import { MaterialManager } from './MaterialManager';

export interface Roundabout3DResult {
  circulatingRingMesh: THREE.Mesh;
  centralIslandMesh: THREE.Mesh;
  curbRingMesh: THREE.Mesh;
  cobblestoneApronMesh: THREE.Mesh;
}

export class RoundaboutMeshGenerator {
  /**
   * Génère l'infrastructure 3D complète d'un carrefour giratoire avec anneau et vrai terre-plein central surélevé
   */
  static generate(node: IntersectionNode, lod: LODLevel = 'LOD0'): Roundabout3DResult | null {
    if (node.type !== 'roundabout' || !node.roundaboutConfig) {
      return null;
    }

    const outerRadius = node.roundaboutConfig.radius;
    const innerRadius = node.roundaboutConfig.innerRadius;
    const center = node.position;
    const baseElev = node.elevation;
    const segments = lod === 'LOD0' ? 48 : lod === 'LOD1' ? 32 : 16;
    const matMgr = MaterialManager.getInstance();

    // -------------------------------------------------------------------------
    // 1. Anneau de circulation (Asphalte)
    // -------------------------------------------------------------------------
    const ringPositions: number[] = [];
    const ringIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Point intérieur et extérieur de l'anneau
      ringPositions.push(center.x + cos * innerRadius, baseElev, center.y + sin * innerRadius);
      ringPositions.push(center.x + cos * outerRadius, baseElev - 0.05, center.y + sin * outerRadius);

      if (i > 0) {
        const p0 = (i - 1) * 2;
        const p1 = i * 2;
        ringIndices.push(p0, p1, p0 + 1);
        ringIndices.push(p0 + 1, p1, p1 + 1);
      }
    }

    const ringGeom = new THREE.BufferGeometry();
    ringGeom.setAttribute('position', new THREE.Float32BufferAttribute(ringPositions, 3));
    ringGeom.setIndex(ringIndices);
    ringGeom.setAttribute('uv', new THREE.Float32BufferAttribute(UVManager.generatePlanarUVs(ringPositions, 4.0), 2));
    ringGeom.computeVertexNormals();

    const circulatingRingMesh = new THREE.Mesh(ringGeom, matMgr.asphaltMat);
    circulatingRingMesh.name = `Roundabout_Ring_${node.id}`;
    circulatingRingMesh.receiveShadow = true;

    // -------------------------------------------------------------------------
    // 2. Couronne de pavés franchissable (Tablier pavé R_inner - 1.5m)
    // -------------------------------------------------------------------------
    const apronInnerRadius = Math.max(2.0, innerRadius - 1.5);
    const apronPositions: number[] = [];
    const apronIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      apronPositions.push(center.x + cos * apronInnerRadius, baseElev + 0.08, center.y + sin * apronInnerRadius);
      apronPositions.push(center.x + cos * innerRadius, baseElev + 0.03, center.y + sin * innerRadius);

      if (i > 0) {
        const p0 = (i - 1) * 2;
        const p1 = i * 2;
        apronIndices.push(p0, p1, p0 + 1);
        apronIndices.push(p0 + 1, p1, p1 + 1);
      }
    }

    const apronGeom = new THREE.BufferGeometry();
    apronGeom.setAttribute('position', new THREE.Float32BufferAttribute(apronPositions, 3));
    apronGeom.setIndex(apronIndices);
    apronGeom.setAttribute('uv', new THREE.Float32BufferAttribute(UVManager.generatePlanarUVs(apronPositions, 2.0), 2));
    apronGeom.computeVertexNormals();

    const cobblestoneApronMesh = new THREE.Mesh(apronGeom, matMgr.cobblestoneMat);
    cobblestoneApronMesh.name = `Roundabout_Apron_${node.id}`;
    cobblestoneApronMesh.receiveShadow = true;

    // -------------------------------------------------------------------------
    // 3. Bordure circulaire en béton (Curb Ring)
    // -------------------------------------------------------------------------
    const curbPositions: number[] = [];
    const curbIndices: number[] = [];
    const curbHeight = 0.22;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Bas et haut de la bordure
      curbPositions.push(center.x + cos * apronInnerRadius, baseElev + 0.08, center.y + sin * apronInnerRadius);
      curbPositions.push(center.x + cos * apronInnerRadius, baseElev + curbHeight, center.y + sin * apronInnerRadius);

      if (i > 0) {
        const p0 = (i - 1) * 2;
        const p1 = i * 2;
        curbIndices.push(p0, p1, p0 + 1);
        curbIndices.push(p0 + 1, p1, p1 + 1);
      }
    }

    const curbGeom = new THREE.BufferGeometry();
    curbGeom.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeom.setIndex(curbIndices);
    curbGeom.computeVertexNormals();

    const curbRingMesh = new THREE.Mesh(curbGeom, matMgr.curbMat);
    curbRingMesh.name = `Roundabout_Curb_${node.id}`;
    curbRingMesh.castShadow = true;

    // -------------------------------------------------------------------------
    // 4. Dôme Central en Gazon Paysager (Central Island Grass Dome)
    // -------------------------------------------------------------------------
    const islandPositions: number[] = [];
    const islandIndices: number[] = [];

    // Sommet central du dôme
    islandPositions.push(center.x, baseElev + curbHeight + 0.35, center.y);

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      islandPositions.push(center.x + cos * apronInnerRadius, baseElev + curbHeight, center.y + sin * apronInnerRadius);

      if (i > 0) {
        islandIndices.push(0, i, i + 1);
      }
    }

    const islandGeom = new THREE.BufferGeometry();
    islandGeom.setAttribute('position', new THREE.Float32BufferAttribute(islandPositions, 3));
    islandGeom.setIndex(islandIndices);
    islandGeom.setAttribute('uv', new THREE.Float32BufferAttribute(UVManager.generatePlanarUVs(islandPositions, 3.0), 2));
    islandGeom.computeVertexNormals();

    const centralIslandMesh = new THREE.Mesh(islandGeom, matMgr.grassMat);
    centralIslandMesh.name = `Roundabout_CentralIsland_${node.id}`;
    centralIslandMesh.castShadow = true;
    centralIslandMesh.receiveShadow = true;

    const chunk = { cx: Math.floor(node.position.x / 100), cz: Math.floor(node.position.y / 100) };
    const metadata: MeshMetadata = {
      id: centralIslandMesh.name,
      type: 'central_island',
      sourceId: node.id,
      lod,
      chunk,
    };
    centralIslandMesh.userData = metadata;
    circulatingRingMesh.userData = { ...metadata, type: 'roundabout' };

    return {
      circulatingRingMesh,
      centralIslandMesh,
      curbRingMesh,
      cobblestoneApronMesh,
    };
  }
}
