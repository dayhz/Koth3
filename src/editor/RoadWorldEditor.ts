import * as THREE from 'three';
import { RoadWorldEngine } from '../engine/RoadWorldEngine';
import { Vector2D } from '../core/math/Vector2D';
import { LinearCurve } from '../core/curves/Curve';
import { RoadProfile } from '../engine/types';
import { IntersectionNode } from '../engine/IntersectionNode';

const editorResidentialProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 30,
};

const editorAvenueProfile: RoadProfile = {
  roadType: 'avenue',
  laneCount: 4,
  laneWidth: 3.5,
  sidewalkWidthLeft: 3.0,
  sidewalkWidthRight: 3.0,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

export type EditorTool = 'select' | 'road_2lane' | 'road_avenue' | 'road_residential' | 'roundabout' | 'traffic_light' | 'delete';

export class RoadWorldEditor {
  public activeTool: EditorTool = 'road_2lane';
  public selectedNode: IntersectionNode | null = null;
  public hoverNode: IntersectionNode | null = null;
  public gridSnapSize: number = 5.0; // Snap magnétique à la grille de 5m
  public isEditorActive: boolean = false;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(
    public engine: RoadWorldEngine,
    public camera: THREE.Camera,
    public domElement: HTMLElement,
    public onWorldModified?: () => void
  ) {
    this.setupMouseEvents();
  }

  setEngine(engine: RoadWorldEngine): void {
    this.engine = engine;
    this.selectedNode = null;
    this.hoverNode = null;
  }

  private setupMouseEvents(): void {
    this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.domElement.addEventListener('click', (e) => this.onMouseClick(e));
  }

  private getIntersectionPoint(e: MouseEvent): Vector2D | null {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const target = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, target);

    if (!hit) return null;

    // Snap magnétique
    const snapX = Math.round(target.x / this.gridSnapSize) * this.gridSnapSize;
    const snapY = Math.round(target.z / this.gridSnapSize) * this.gridSnapSize;

    return new Vector2D(snapX, snapY);
  }

  private findNearestNode(pos: Vector2D, maxDist: number = 8.0): IntersectionNode | null {
    let nearest: IntersectionNode | null = null;
    let minDist = maxDist;

    for (const node of this.engine.network.nodes.values()) {
      const d = node.position.distanceTo(pos);
      if (d < minDist) {
        minDist = d;
        nearest = node;
      }
    }
    return nearest;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isEditorActive) return;
    const pos = this.getIntersectionPoint(e);
    if (!pos) return;

    this.hoverNode = this.findNearestNode(pos, 6.0);
  }

  private onMouseClick(e: MouseEvent): void {
    if (!this.isEditorActive) return;
    const pos = this.getIntersectionPoint(e);
    if (!pos) return;

    // Outil Création de Rond-Point
    if (this.activeTool === 'roundabout') {
      this.engine.network.createRoundaboutNode(pos, 22, 12, 2, `Rond-Point (${pos.x}, ${pos.y})`);
      this.engine.build();
      this.onWorldModified?.();
      return;
    }

    // Outil Pose de Route (2 voies, avenue, résidentiel)
    if (
      this.activeTool === 'road_2lane' ||
      this.activeTool === 'road_avenue' ||
      this.activeTool === 'road_residential'
    ) {
      let targetNode = this.findNearestNode(pos, 6.0);
      if (!targetNode) {
        targetNode = this.engine.network.createNode(pos, 'dead_end');
      }

      if (!this.selectedNode) {
        // Premier clic : sélection du nœud de départ
        this.selectedNode = targetNode;
      } else if (this.selectedNode.id !== targetNode.id) {
        // Deuxième clic : création de la route reliant A et B
        const profile = this.activeTool === 'road_avenue' ? editorAvenueProfile : editorResidentialProfile;

        const curve = new LinearCurve(this.selectedNode.position, targetNode.position);
        this.engine.network.createRoad(this.selectedNode.id, targetNode.id, curve, profile);
        this.engine.build();

        this.selectedNode = targetNode; // Enchaîner le tracé
        this.onWorldModified?.();
      }
      return;
    }

    // Outil Feu Tricolore
    if (this.activeTool === 'traffic_light') {
      const node = this.findNearestNode(pos, 10.0);
      if (node && node.connectedRoadIds.length >= 3) {
        this.engine.regulation.setPriorityRule(node.id, 'traffic_light', [], node.connectedRoadIds, 'Régulé par feux');
        this.engine.build();
        this.onWorldModified?.();
      }
      return;
    }

    // Outil Suppression
    if (this.activeTool === 'delete') {
      const node = this.findNearestNode(pos, 6.0);
      if (node) {
        // Supprimer le nœud et ses routes associées
        for (const rId of [...node.connectedRoadIds]) {
          this.engine.network.roads.delete(rId);
        }
        this.engine.network.nodes.delete(node.id);
        this.engine.build();
        this.selectedNode = null;
        this.onWorldModified?.();
      }
    }
  }

  clearSelection(): void {
    this.selectedNode = null;
    this.hoverNode = null;
  }
}
