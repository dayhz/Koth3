import { Vector2D } from '../core/math/Vector2D';
import { Polygon2D } from '../core/polygon/Polygon2D';

export class Sidewalk {
  public surfacePolygon: Polygon2D = new Polygon2D();
  public outerBoundary: Vector2D[] = [];
  public innerBoundary: Vector2D[] = [];
  public connectedSidewalkIds: string[] = [];

  constructor(
    public readonly id: string,
    public parentRoadId: string,
    public side: 'left' | 'right',
    public width: number,
    public height: number = 0.15
  ) {}

  toJSON() {
    return {
      id: this.id,
      parentRoadId: this.parentRoadId,
      side: this.side,
      width: this.width,
      height: this.height,
      connectedSidewalkIds: this.connectedSidewalkIds,
    };
  }
}
