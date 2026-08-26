import * as THREE from 'three';
import { ChunkCoord } from './types';

export class ChunkManager {
  public chunkSizeMeters: number = 100.0;
  public chunks: Map<string, THREE.Group> = new Map();

  getChunkKey(cx: number, cz: number): string {
    return `${cx}_${cz}`;
  }

  getChunkCoord(x: number, z: number): ChunkCoord {
    return {
      cx: Math.floor(x / this.chunkSizeMeters),
      cz: Math.floor(z / this.chunkSizeMeters),
    };
  }

  addMeshToChunk(mesh: THREE.Mesh, x: number, z: number): void {
    const { cx, cz } = this.getChunkCoord(x, z);
    const key = this.getChunkKey(cx, cz);

    let group = this.chunks.get(key);
    if (!group) {
      group = new THREE.Group();
      group.name = `Chunk_${key}`;
      this.chunks.set(key, group);
    }
    group.add(mesh);
  }

  clear(): void {
    this.chunks.clear();
  }
}
