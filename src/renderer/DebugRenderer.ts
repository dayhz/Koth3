import * as THREE from 'three';
import { RoadNetwork } from '../engine/RoadNetwork';

export class DebugRenderer {
  public group: THREE.Group = new THREE.Group();

  public showCenterlines: boolean = true;
  public showLanes: boolean = true;
  public showNodes: boolean = true;
  public showIntersections: boolean = true;

  update(network: RoadNetwork): void {
    // Nettoyer les anciens objets
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.LineSegments) {
        obj.geometry.dispose();
      }
    }

    // 1. Centerlines de routes (jaune)
    if (this.showCenterlines) {
      for (const road of network.roads.values()) {
        const frames = road.centerline.sampleFrames(24, road.tStart, road.tEnd);
        const geom = new THREE.BufferGeometry().setFromPoints(
          frames.map((f) => new THREE.Vector3(f.point.x, 0.05, f.point.y))
        );
        const mat = new THREE.LineBasicMaterial({ color: 0xffcc00, linewidth: 2 });
        const line = new THREE.Line(geom, mat);
        this.group.add(line);
      }
    }

    // 2. Trajectoires de voies (vert = forward, cyan = backward)
    if (this.showLanes) {
      for (const lane of network.lanes.values()) {
        const pts = lane.centerline.samplePoints(24);
        const geom = new THREE.BufferGeometry().setFromPoints(
          pts.map((p) => new THREE.Vector3(p.x, 0.08, p.y))
        );
        const color = lane.direction === 'forward' ? 0x00ff88 : 0x00bbff;
        const mat = new THREE.LineBasicMaterial({ color, linewidth: 1 });
        const line = new THREE.Line(geom, mat);
        this.group.add(line);

        // Flèche de direction au milieu
        const midPt = lane.centerline.getPoint(0.5);
        const dir = lane.direction === 'forward'
          ? lane.centerline.getTangent(0.5)
          : lane.centerline.getTangent(0.5).multiplyScalar(-1);

        const arrow = new THREE.ArrowHelper(
          new THREE.Vector3(dir.x, 0, dir.y),
          new THREE.Vector3(midPt.x, 0.1, midPt.y),
          2.0,
          color,
          0.8,
          0.5
        );
        this.group.add(arrow);
      }

      // Connexions de voies de carrefour (orange pointillé)
      for (const conn of network.laneConnections.values()) {
        const pts = conn.trajectory.samplePoints(16);
        const geom = new THREE.BufferGeometry().setFromPoints(
          pts.map((p) => new THREE.Vector3(p.x, 0.09, p.y))
        );
        const mat = new THREE.LineDashedMaterial({ color: 0xff8800, dashSize: 0.5, gapSize: 0.3 });
        const line = new THREE.Line(geom, mat);
        line.computeLineDistances();
        this.group.add(line);
      }
    }

    // 3. Marqueurs de nœuds (sphères violettes)
    if (this.showNodes) {
      const sphereGeom = new THREE.SphereGeometry(0.8, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x9933ff });

      for (const node of network.nodes.values()) {
        const mesh = new THREE.Mesh(sphereGeom, nodeMat);
        mesh.position.set(node.position.x, 0.5, node.position.y);
        this.group.add(mesh);
      }
    }

    // 4. Contours des polygones d'intersection (rouge)
    if (this.showIntersections) {
      for (const node of network.nodes.values()) {
        if (node.surfacePolygon.length >= 3) {
          const pts = node.surfacePolygon.vertices.map((v) => new THREE.Vector3(v.x, 0.06, v.y));
          pts.push(pts[0]); // Fermer le polygone
          const geom = new THREE.BufferGeometry().setFromPoints(pts);
          const mat = new THREE.LineBasicMaterial({ color: 0xff3344 });
          const line = new THREE.Line(geom, mat);
          this.group.add(line);
        }
      }
    }
  }
}
