import * as THREE from 'three';

export type DebugVisualizationMode = 'NORMAL' | 'WIREFRAME' | 'CHUNKS' | 'LOD' | 'COLLISIONS' | 'METADATA';

export class InfrastructureDebugger {
  public mode: DebugVisualizationMode = 'NORMAL';
  public debugGroup = new THREE.Group();

  setMode(mode: DebugVisualizationMode, sceneGroup: THREE.Group): void {
    this.mode = mode;

    sceneGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (this.mode === 'WIREFRAME') {
          child.material.wireframe = true;
        } else {
          child.material.wireframe = false;
        }
      }
    });
  }
}
