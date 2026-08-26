import { ICurve } from '../core/curves/Curve';
import { MarkingType } from './types';

export class RoadMarking {
  constructor(
    public readonly id: string,
    public type: MarkingType,
    public centerline: ICurve,
    public width: number = 0.15,
    public parentRoadId?: string,
    public parentIntersectionId?: string,
    public dashPattern?: [number, number] // [length, gap] en mètres
  ) {}

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      width: this.width,
      parentRoadId: this.parentRoadId,
      parentIntersectionId: this.parentIntersectionId,
      dashPattern: this.dashPattern,
    };
  }
}
