import * as THREE from 'three';
import { CollisionHull } from './types';
import { RoadNetwork } from '../engine/RoadNetwork';

export class CollisionManager {
  public hulls: Map<string, CollisionHull> = new Map();

  /**
   * Construit la couche de collision à partir du graphe routier
   */
  buildCollisions(network: RoadNetwork): void {
    this.hulls.clear();

    // 1. Surfaces roulables (Routes)
    for (const road of network.roads.values()) {
      const halfW = road.totalWidth / 2;
      const samples = 12;
      const positions: number[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = road.tStart + (i / samples) * (road.tEnd - road.tStart);
        const pt = road.centerline.getPoint(t);
        const tg = road.centerline.getTangent(t);
        const nx = -tg.y * halfW;
        const ny = tg.x * halfW;
        const elev = road.centerline.getElevation(t);

        positions.push(pt.x + nx, elev, pt.y + ny);
        positions.push(pt.x - nx, elev, pt.y - ny);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.computeBoundingSphere();

      this.hulls.set(`col_road_${road.id}`, {
        id: `col_road_${road.id}`,
        type: 'drivable_surface',
        geometry: geom,
        boundingSphere: geom.boundingSphere || new THREE.Sphere(),
      });
    }

    // 2. Surfaces de carrefours
    for (const node of network.nodes.values()) {
      if (node.surfacePolygon.length >= 3) {
        const positions: number[] = [];
        for (const v of node.surfacePolygon.vertices) {
          positions.push(v.x, node.elevation, v.y);
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.computeBoundingSphere();

        this.hulls.set(`col_node_${node.id}`, {
          id: `col_node_${node.id}`,
          type: 'drivable_surface',
          geometry: geom,
          boundingSphere: geom.boundingSphere || new THREE.Sphere(),
        });
      }
    }
  }

  /**
   * Retourne l'altitude du sol pour un véhicule à une coordonnée (X, Z)
   */
  getGroundHeight(_x: number, _z: number, defaultElev: number = 0): number {
    return defaultElev;
  }
}
