import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';
import { IntersectionArm, IntersectionType, RoundaboutConfig } from './types';

export class IntersectionNode {
  public connectedRoadIds: string[] = [];
  public arms: IntersectionArm[] = [];
  public surfacePolygon: Polygon2D = new Polygon2D();
  public laneConnectionIds: string[] = [];
  public roundaboutConfig?: RoundaboutConfig;

  constructor(
    public readonly id: string,
    public position: Vector2D,
    public type: IntersectionType = 'dead_end',
    public name: string = `Intersection ${id}`
  ) {}

  addConnectedRoad(roadId: string, isStartOfRoad: boolean, angleRadians: number, roadWidth: number): void {
    if (!this.connectedRoadIds.includes(roadId)) {
      this.connectedRoadIds.push(roadId);
    }
    this.arms = this.arms.filter((a) => a.roadId !== roadId);
    this.arms.push({ roadId, isStartOfRoad, angleRadians, roadWidth });
    this.sortArms();
    this.updateType();
  }

  private sortArms(): void {
    this.arms.sort((a, b) => a.angleRadians - b.angleRadians);
  }

  public updateType(): void {
    if (this.roundaboutConfig) {
      this.type = 'roundabout';
      return;
    }
    const count = this.connectedRoadIds.length;
    if (count <= 1) {
      this.type = 'dead_end';
    } else if (count === 3) {
      this.type = 't_junction';
    } else if (count === 4) {
      this.type = 'four_way';
    } else {
      this.type = 'multi_branch';
    }
  }

  toJSON() {
    return {
      id: this.id,
      position: this.position.toJSON(),
      type: this.type,
      name: this.name,
      connectedRoadIds: this.connectedRoadIds,
      arms: this.arms,
      roundaboutConfig: this.roundaboutConfig,
      laneConnectionIds: this.laneConnectionIds,
    };
  }
}
