import * as THREE from 'three';

export class MaterialManager {
  private static instance: MaterialManager;

  public asphaltMat: THREE.MeshStandardMaterial;
  public sidewalkMat: THREE.MeshStandardMaterial;
  public curbMat: THREE.MeshStandardMaterial;
  public markingMat: THREE.MeshStandardMaterial;
  public grassMat: THREE.MeshStandardMaterial;
  public cobblestoneMat: THREE.MeshStandardMaterial;
  public barrierMat: THREE.MeshStandardMaterial;

  private constructor() {
    // 1. Asphalte PBR
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x22252a,
      roughness: 0.88,
      metalness: 0.08,
      name: 'mat_asphalt',
    });

    // 2. Trottoirs Béton
    this.sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x8a929e,
      roughness: 0.82,
      metalness: 0.05,
      name: 'mat_sidewalk',
    });

    // 3. Bordures Granit
    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0x6e7683,
      roughness: 0.75,
      metalness: 0.12,
      name: 'mat_curb',
    });

    // 4. Marquages Blancs Réflectifs
    this.markingMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.1,
      name: 'mat_marking',
    });

    // 5. Gazon / Pelouse pour Îlots Centraux
    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // Vert gazon naturel
      roughness: 0.95,
      metalness: 0.02,
      name: 'mat_grass',
    });

    // 6. Pavés Décoratifs pour Giratoires
    this.cobblestoneMat = new THREE.MeshStandardMaterial({
      color: 0x5c5042,
      roughness: 0.9,
      metalness: 0.05,
      name: 'mat_cobblestone',
    });

    // 7. Barrières Métalliques
    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.85,
      name: 'mat_barrier',
    });
  }

  public static getInstance(): MaterialManager {
    if (!MaterialManager.instance) {
      MaterialManager.instance = new MaterialManager();
    }
    return MaterialManager.instance;
  }
}
