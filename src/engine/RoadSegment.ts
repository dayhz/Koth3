import { ICurve } from '../core/curves/Curve';
import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';
import { RoadProfile } from './types';

export class RoadSegment {
  public laneIds: string[] = [];
  public leftSidewalkId?: string;
  public rightSidewalkId?: string;
  public markingIds: string[] = [];
  
  // Intervalles utiles après recul aux intersections
  public startSetback: number = 0;
  public endSetback: number = 0;
  public tStart: number = 0;
  public tEnd: number = 1;

  // Polygone d'emprise asphaltique calculé
  public surfacePolygon: Polygon2D = new Polygon2D();
  public leftBoundary: Vector2D[] = [];
  public rightBoundary: Vector2D[] = [];

  constructor(
    public readonly id: string,
    public startNodeId: string,
    public endNodeId: string,
    public centerline: ICurve,
    public profile: RoadProfile,
    public name: string = `Route ${id}`
  ) {}

  get totalWidth(): number {
    return this.profile.laneCount * this.profile.laneWidth;
  }

  get halfWidth(): number {
    return this.totalWidth / 2;
  }

  get length(): number {
    return this.centerline.getLength();
  }

  updateSetbacks(startSetback: number, endSetback: number): void {
    const len = this.length;
    this.startSetback = startSetback;
    this.endSetback = endSetback;

    // Limiter le recul à 45% de la longueur max de chaque côté
    const maxCut = len * 0.45;
    const clampedStart = Math.min(startSetback, maxCut);
    const clampedEnd = Math.min(endSetback, maxCut);

    this.tStart = len > 0 ? clampedStart / len : 0;
    this.tEnd = len > 0 ? 1.0 - clampedEnd / len : 1;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      startNodeId: this.startNodeId,
      endNodeId: this.endNodeId,
      profile: this.profile,
      laneIds: this.laneIds,
      leftSidewalkId: this.leftSidewalkId,
      rightSidewalkId: this.rightSidewalkId,
      markingIds: this.markingIds,
    };
  }
}
