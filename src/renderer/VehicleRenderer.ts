import * as THREE from 'three';
import { Vehicle } from '../engine/traffic/Vehicle';

interface VehicleMeshInstance {
  group: THREE.Group;
  brakeLightsMat: THREE.MeshStandardMaterial;
}

export class VehicleRenderer {
  public group: THREE.Group = new THREE.Group();
  private visualInstances: Map<string, VehicleMeshInstance> = new Map();

  private wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
  });

  private glassMat = new THREE.MeshStandardMaterial({
    color: 0x112233,
    roughness: 0.1,
    metalness: 0.9,
  });

  private headLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffee,
    emissiveIntensity: 2.0,
  });

  update(vehicles: Map<string, Vehicle>): void {
    // 1. Supprimer les véhicules qui ont disparu
    for (const [id, instance] of this.visualInstances.entries()) {
      if (!vehicles.has(id)) {
        this.group.remove(instance.group);
        this.visualInstances.delete(id);
      }
    }

    // 2. Créer ou mettre à jour les véhicules actifs
    for (const vehicle of vehicles.values()) {
      let instance = this.visualInstances.get(vehicle.id);

      if (!instance) {
        instance = this.createVehicleMesh(vehicle);
        this.visualInstances.set(vehicle.id, instance);
        this.group.add(instance.group);
      }

      // Mettre à jour la pose 3D vectorielle exacte (sans rotation Euler approximative)
      const t = Math.max(0, Math.min(1, vehicle.tProgress));
      const pt2D = vehicle.currentCurve.getPoint(t);
      const elev = vehicle.currentCurve.getElevation(t);
      const tangent2D = vehicle.currentCurve.getTangent(t);
      const slopePct = vehicle.currentCurve.getSlopePercent(t);

      // 1. Vecteur Avant 3D (Forward : long de la route en montée/descente)
      const forward3D = new THREE.Vector3(tangent2D.x, slopePct / 100, tangent2D.y).normalize();

      // 2. Vecteur Droite 3D (Right : transversal horizontal)
      const right3D = new THREE.Vector3(tangent2D.y, 0, -tangent2D.x).normalize();

      // 3. Vecteur Haut 3D (Up : orthogonal à la surface de la route)
      const up3D = new THREE.Vector3().crossVectors(forward3D, right3D).normalize();

      // Construire la matrice de rotation orthonormée directe
      // Dans le maillage local du véhicule : +Z est l'avant, +X est la droite, +Y est le haut
      const rotMatrix = new THREE.Matrix4().makeBasis(right3D, up3D, forward3D);
      instance.group.quaternion.setFromRotationMatrix(rotMatrix);

      // Rehausse de garde au sol (+0.12m pour que les pneus touchent le dessus de l'asphalte)
      instance.group.position.set(pt2D.x, elev + 0.12, pt2D.y);

      // Mettre à jour les feux stop et warnings en temps réel
      if (vehicle.isCrashed) {
        // Feux de détresse clignotants (Warning)
        const isBlinkOn = Math.floor(Date.now() / 300) % 2 === 0;
        instance.brakeLightsMat.color.setHex(isBlinkOn ? 0xff8800 : 0x331100);
        instance.brakeLightsMat.emissive.setHex(isBlinkOn ? 0xff7700 : 0x000000);
        instance.brakeLightsMat.emissiveIntensity = isBlinkOn ? 4.0 : 0.0;
      } else if (vehicle.isBraking) {
        instance.brakeLightsMat.color.setHex(0xff1111);
        instance.brakeLightsMat.emissive.setHex(0xff0000);
        instance.brakeLightsMat.emissiveIntensity = 3.5;
      } else {
        instance.brakeLightsMat.color.setHex(0x440505);
        instance.brakeLightsMat.emissive.setHex(0x220000);
        instance.brakeLightsMat.emissiveIntensity = 0.5;
      }
    }
  }

  private createVehicleMesh(vehicle: Vehicle): VehicleMeshInstance {
    const vGroup = new THREE.Group();
    const dim = vehicle.dimensions;

    // Matériau carrosserie avec la couleur du véhicule
    const bodyMat = new THREE.MeshStandardMaterial({
      color: vehicle.color,
      roughness: 0.3,
      metalness: 0.6,
    });

    const brakeLightsMat = new THREE.MeshStandardMaterial({
      color: 0x440505,
      emissive: 0x220000,
      emissiveIntensity: 0.5,
    });

    // 1. Châssis principal
    const chassisHeight = dim.height * 0.55;
    const chassisGeom = new THREE.BoxGeometry(dim.width, chassisHeight, dim.length);
    const chassisMesh = new THREE.Mesh(chassisGeom, bodyMat);
    chassisMesh.position.y = chassisHeight / 2 + 0.2;
    chassisMesh.castShadow = true;
    vGroup.add(chassisMesh);

    // 2. Habitacle / Cabine
    const cabinHeight = dim.height * 0.45;
    const cabinLength = vehicle.type === 'bus' ? dim.length * 0.9 : dim.length * 0.55;
    const cabinWidth = dim.width * 0.88;
    const cabinGeom = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabinMesh = new THREE.Mesh(cabinGeom, this.glassMat);
    cabinMesh.position.y = chassisHeight + cabinHeight / 2 + 0.15;
    cabinMesh.position.z = vehicle.type === 'bus' ? 0 : -dim.length * 0.08;
    cabinMesh.castShadow = true;
    vGroup.add(cabinMesh);

    // 3. Phares avant (blancs)
    const headLightGeom = new THREE.BoxGeometry(0.25, 0.12, 0.08);
    const hlLeft = new THREE.Mesh(headLightGeom, this.headLightMat);
    hlLeft.position.set(-dim.width * 0.38, chassisHeight * 0.6 + 0.2, dim.length * 0.49);
    vGroup.add(hlLeft);

    const hlRight = new THREE.Mesh(headLightGeom, this.headLightMat);
    hlRight.position.set(dim.width * 0.38, chassisHeight * 0.6 + 0.2, dim.length * 0.49);
    vGroup.add(hlRight);

    // 4. Feux arrière / Stop (rouges)
    const brakeLightGeom = new THREE.BoxGeometry(0.25, 0.12, 0.08);
    const blLeft = new THREE.Mesh(brakeLightGeom, brakeLightsMat);
    blLeft.position.set(-dim.width * 0.38, chassisHeight * 0.6 + 0.2, -dim.length * 0.49);
    vGroup.add(blLeft);

    const blRight = new THREE.Mesh(brakeLightGeom, brakeLightsMat);
    blRight.position.set(dim.width * 0.38, chassisHeight * 0.6 + 0.2, -dim.length * 0.49);
    vGroup.add(blRight);

    // 5. Roues (posées au niveau y=0 du véhicule)
    const wheelRadius = 0.32;
    const wheelWidth = 0.22;
    const wheelGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 12);
    wheelGeom.rotateZ(Math.PI / 2);

    const wheelOffsets = [
      { x: -dim.width / 2, z: dim.wheelBase / 2 },
      { x: dim.width / 2, z: dim.wheelBase / 2 },
      { x: -dim.width / 2, z: -dim.wheelBase / 2 },
      { x: dim.width / 2, z: -dim.wheelBase / 2 },
    ];

    for (const off of wheelOffsets) {
      const wheel = new THREE.Mesh(wheelGeom, this.wheelMat);
      wheel.position.set(off.x, wheelRadius, off.z);
      wheel.castShadow = true;
      vGroup.add(wheel);
    }

    return {
      group: vGroup,
      brakeLightsMat,
    };
  }

  clear(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.visualInstances.clear();
  }
}
