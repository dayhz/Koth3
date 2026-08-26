import * as THREE from 'three';
import { RoadNetwork } from '../engine/RoadNetwork';
import { MeshGenerators } from './MeshGenerators';
import { DebugRenderer } from './DebugRenderer';

export class ThreeRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public debugRenderer: DebugRenderer;

  private roadGroup: THREE.Group = new THREE.Group();
  private intersectionGroup: THREE.Group = new THREE.Group();
  private sidewalkGroup: THREE.Group = new THREE.Group();
  private markingGroup: THREE.Group = new THREE.Group();

  // Matériaux
  private asphaltMat: THREE.MeshStandardMaterial;
  private sidewalkMat: THREE.MeshStandardMaterial;
  private markingMat: THREE.MeshBasicMaterial;
  private groundMat: THREE.MeshStandardMaterial;

  // Contrôle caméra orbital simple intégré (sans dépendance externe OrbitControls)
  private isMouseDown = false;
  private isRightMouseDown = false;
  private prevMousePos = { x: 0, y: 0 };
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private spherical = { radius: 80, theta: Math.PI / 4, phi: Math.PI / 4 };

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1d24);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Sol / Grille
    const grid = new THREE.GridHelper(500, 100, 0x444d5d, 0x272c36);
    grid.position.y = -0.01;
    this.scene.add(grid);

    this.groundMat = new THREE.MeshStandardMaterial({ color: 0x1e242b, roughness: 0.9 });
    const groundGeom = new THREE.PlaneGeometry(1000, 1000);
    const ground = new THREE.Mesh(groundGeom, this.groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    this.scene.add(ground);

    // Matériaux routiers
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x8a929a,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.markingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    this.scene.add(this.roadGroup);
    this.scene.add(this.intersectionGroup);
    this.scene.add(this.sidewalkGroup);
    this.scene.add(this.markingGroup);

    this.debugRenderer = new DebugRenderer();
    this.scene.add(this.debugRenderer.group);

    this.initControls(container);
    this.updateCameraPosition();

    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    this.animate();
  }

  private initControls(container: HTMLElement): void {
    container.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.isMouseDown = true;
      if (e.button === 2) this.isRightMouseDown = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      this.isRightMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;
      this.prevMousePos = { x: e.clientX, y: e.clientY };

      if (this.isMouseDown) {
        // Rotation orbitale
        this.spherical.theta -= dx * 0.008;
        this.spherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, this.spherical.phi - dy * 0.008));
        this.updateCameraPosition();
      } else if (this.isRightMouseDown) {
        // Pan
        const factor = this.spherical.radius * 0.001;
        const forward = new THREE.Vector3().subVectors(this.cameraTarget, this.camera.position);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        this.cameraTarget.addScaledVector(right, -dx * factor);
        this.cameraTarget.addScaledVector(forward, dy * factor);
        this.updateCameraPosition();
      }
    });

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.spherical.radius = Math.max(5, Math.min(400, this.spherical.radius + e.deltaY * 0.05));
      this.updateCameraPosition();
    });

    container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private updateCameraPosition(): void {
    const sinPhi = Math.sin(this.spherical.phi);
    const cosPhi = Math.cos(this.spherical.phi);
    const sinTheta = Math.sin(this.spherical.theta);
    const cosTheta = Math.cos(this.spherical.theta);

    this.camera.position.x = this.cameraTarget.x + this.spherical.radius * sinPhi * sinTheta;
    this.camera.position.y = this.cameraTarget.y + this.spherical.radius * cosPhi;
    this.camera.position.z = this.cameraTarget.z + this.spherical.radius * sinPhi * cosTheta;

    this.camera.lookAt(this.cameraTarget);
  }

  resetCamera(center: THREE.Vector3 = new THREE.Vector3(0, 0, 0), distance: number = 80): void {
    this.cameraTarget.copy(center);
    this.spherical.radius = distance;
    this.spherical.theta = Math.PI / 4;
    this.spherical.phi = Math.PI / 4;
    this.updateCameraPosition();
  }

  setTopDownView(center: THREE.Vector3 = new THREE.Vector3(0, 0, 0), distance: number = 100): void {
    this.cameraTarget.copy(center);
    this.spherical.radius = distance;
    this.spherical.theta = 0;
    this.spherical.phi = 0.05; // quasi zénithal
    this.updateCameraPosition();
  }

  renderWorld(network: RoadNetwork): void {
    // 1. Vider les anciens maillages
    this.clearGroup(this.roadGroup);
    this.clearGroup(this.intersectionGroup);
    this.clearGroup(this.sidewalkGroup);
    this.clearGroup(this.markingGroup);

    // 2. Routes (Asphalte)
    for (const road of network.roads.values()) {
      const geom = MeshGenerators.createRoadMesh(road);
      const mesh = new THREE.Mesh(geom, this.asphaltMat);
      mesh.receiveShadow = true;
      this.roadGroup.add(mesh);
    }

    // 3. Intersections (Asphalte)
    for (const node of network.nodes.values()) {
      const geom = MeshGenerators.createIntersectionMesh(node);
      const mesh = new THREE.Mesh(geom, this.asphaltMat);
      mesh.receiveShadow = true;
      this.intersectionGroup.add(mesh);
    }

    // 4. Trottoirs & Îlots séparateurs (Béton)
    for (const sidewalk of network.sidewalks.values()) {
      const geom = MeshGenerators.createSidewalkMesh(sidewalk);
      const mesh = new THREE.Mesh(geom, this.sidewalkMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.sidewalkGroup.add(mesh);
    }

    for (const node of network.nodes.values()) {
      for (const island of node.splitterIslands) {
        const geom = MeshGenerators.createSplitterIslandMesh(island);
        const mesh = new THREE.Mesh(geom, this.sidewalkMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.sidewalkGroup.add(mesh);
      }
    }

    // 5. Marquages au sol (Blanc)
    for (const marking of network.markings.values()) {
      const geom = MeshGenerators.createMarkingMesh(marking);
      const mesh = new THREE.Mesh(geom, this.markingMat);
      this.markingGroup.add(mesh);
    }

    // 6. Debug
    this.debugRenderer.update(network);
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };
}
