import * as THREE from 'three';
import { RoadNetwork } from '../engine/RoadNetwork';
import { TrafficRegulationEngine } from '../engine/regulation/TrafficRegulationEngine';

export class DebugRenderer {
  public group: THREE.Group = new THREE.Group();

  public showCenterlines: boolean = true;
  public showLanes: boolean = true;
  public showNodes: boolean = true;
  public showIntersections: boolean = true;
  public showPriorityBadges: boolean = true;

  update(network: RoadNetwork, regulation?: TrafficRegulationEngine): void {
    // Nettoyer les anciens objets
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.LineSegments) {
        obj.geometry.dispose();
      }
    }

    // 1. Centerlines de routes (jaune) avec altitude 3D
    if (this.showCenterlines) {
      for (const road of network.roads.values()) {
        const frames = road.centerline.sampleFrames(24, road.tStart, road.tEnd);
        const geom = new THREE.BufferGeometry().setFromPoints(
          frames.map((f) => new THREE.Vector3(f.point.x, f.elevation + 0.05, f.point.y))
        );
        const mat = new THREE.LineBasicMaterial({ color: 0xffcc00, linewidth: 2 });
        const line = new THREE.Line(geom, mat);
        this.group.add(line);
      }
    }

    // 2. Trajectoires de voies (vert = forward, cyan = backward)
    if (this.showLanes) {
      for (const lane of network.lanes.values()) {
        const parentRoad = network.roads.get(lane.parentRoadId);
        const pts = lane.centerline.samplePoints(24);
        const geom = new THREE.BufferGeometry().setFromPoints(
          pts.map((p, idx) => {
            const t = idx / (pts.length - 1);
            const z = parentRoad ? parentRoad.centerline.getElevation(t) : 0;
            return new THREE.Vector3(p.x, z + 0.08, p.y);
          })
        );
        const color = lane.direction === 'forward' ? 0x00ff88 : 0x00bbff;
        const mat = new THREE.LineBasicMaterial({ color, linewidth: 1 });
        const line = new THREE.Line(geom, mat);
        this.group.add(line);

        // Flèche de direction au milieu
        const midPt = lane.centerline.getPoint(0.5);
        const midZ = parentRoad ? parentRoad.centerline.getElevation(0.5) : 0;
        const dir = lane.direction === 'forward'
          ? lane.centerline.getTangent(0.5)
          : lane.centerline.getTangent(0.5).multiplyScalar(-1);

        const arrow = new THREE.ArrowHelper(
          new THREE.Vector3(dir.x, 0, dir.y),
          new THREE.Vector3(midPt.x, midZ + 0.1, midPt.y),
          2.0,
          color,
          0.8,
          0.5
        );
        this.group.add(arrow);
      }

      // Connexions de voies de carrefour (orange pointillé)
      for (const conn of network.laneConnections.values()) {
        const node = network.nodes.get(conn.intersectionId);
        const nodeZ = node ? node.elevation : 0;
        const pts = conn.trajectory.samplePoints(16);
        const geom = new THREE.BufferGeometry().setFromPoints(
          pts.map((p) => new THREE.Vector3(p.x, nodeZ + 0.09, p.y))
        );
        const mat = new THREE.LineDashedMaterial({ color: 0xff8800, dashSize: 0.5, gapSize: 0.3 });
        const line = new THREE.Line(geom, mat);
        line.computeLineDistances();
        this.group.add(line);
      }
    }

    // 3. Marqueurs de nœuds (sphères violettes) à leur altitude réelle
    if (this.showNodes) {
      const sphereGeom = new THREE.SphereGeometry(0.8, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x9933ff });

      for (const node of network.nodes.values()) {
        const mesh = new THREE.Mesh(sphereGeom, nodeMat);
        mesh.position.set(node.position.x, node.elevation + 0.5, node.position.y);
        this.group.add(mesh);
      }
    }

    // 4. Contours des polygones d'intersection (rouge)
    if (this.showIntersections) {
      for (const node of network.nodes.values()) {
        if (node.surfacePolygon.length >= 3) {
          const pts = node.surfacePolygon.vertices.map(
            (v) => new THREE.Vector3(v.x, node.elevation + 0.06, v.y)
          );
          pts.push(pts[0]);
          const geom = new THREE.BufferGeometry().setFromPoints(pts);
          const mat = new THREE.LineBasicMaterial({ color: 0xff3344 });
          const line = new THREE.Line(geom, mat);
          this.group.add(line);
        }
      }
    }

    // 5. Badges de priorité 3D au-dessus des carrefours
    if (this.showPriorityBadges && regulation) {
      for (const [nodeId, rule] of regulation.priorityRules.entries()) {
        const node = network.nodes.get(nodeId);
        if (!node) continue;

        let badgeColor = 0x3388ff;
        if (rule.regime === 'stop') badgeColor = 0xff2222;
        else if (rule.regime === 'yield') badgeColor = 0xffaa00;
        else if (rule.regime === 'priority_road') badgeColor = 0xffdd00;
        else if (rule.regime === 'roundabout') badgeColor = 0x00ddaa;

        const prismGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 6);
        const mat = new THREE.MeshBasicMaterial({ color: badgeColor });
        const badge = new THREE.Mesh(prismGeom, mat);
        badge.position.set(node.position.x, node.elevation + 2.5, node.position.y);
        this.group.add(badge);
      }
    }
  }
}
