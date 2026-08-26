import { LODLevel } from './types';

export class LODManager {
  public lod0Distance: number = 80.0;
  public lod1Distance: number = 200.0;

  getLODForDistance(distance: number): LODLevel {
    if (distance <= this.lod0Distance) {
      return 'LOD0';
    } else if (distance <= this.lod1Distance) {
      return 'LOD1';
    }
    return 'LOD2';
  }
}
