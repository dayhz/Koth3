import { ICurve } from '../core/curves/Curve';
import { MarkingType } from './types';

export class RoadMarking {
  public tStart: number = 0;
  public tEnd: number = 1;

  constructor(
    public readonly id: string,
    public type: MarkingType,
    public centerline: ICurve,
    public width: number = 0.15,
    public parentRoadId?: string,
    public parentIntersectionId?: string,
    public dashPattern?: [number, number],
    tStart: number = 0,
    tEnd: number = 1
  ) {
    this.tStart = tStart;
    this.tEnd = tEnd;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      width: this.width,
      parentRoadId: this.parentRoadId,
      parentIntersectionId: this.parentIntersectionId,
      dashPattern: this.dashPattern,
      tStart: this.tStart,
      tEnd: this.tEnd,
    };
  }
}
