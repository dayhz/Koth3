import { ICurve } from '../core/curves/Curve';
import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';
import { RoadProfile } from './types';

export class RoadSegment {
  public laneIds: string[] = [];
  public leftSidewalkId?: string;
  public rightSidewalkId?: string;
  public markingIds: string[] = [];
  
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
