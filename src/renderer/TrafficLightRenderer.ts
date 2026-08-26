import * as THREE from 'three';
import { Vector2D } from '../core/math/Vector2D';
import { TrafficLightPole, TrafficLightState } from '../engine/traffic-lights/types';

interface PoleVisual {
  group: THREE.Group;
  redMat: THREE.MeshStandardMaterial;
  yellowMat: THREE.MeshStandardMaterial;
  greenMat: THREE.MeshStandardMaterial;
}

export class TrafficLightRenderer {
  public group: THREE.Group = new THREE.Group();
  private poleVisuals: Map<string, PoleVisual> = new Map();

  private poleMat = new THREE.MeshStandardMaterial({
    color: 0x2b2e35,
    roughness: 0.4,
    metalness: 0.8,
  });

  private housingMat = new THREE.MeshStandardMaterial({
    color: 0x111215,
    roughness: 0.6,
    metalness: 0.3,
  });

  buildPoles(poles: Map<string, TrafficLightPole>): void {
    this.clear();

    for (const pole of poles.values()) {
      const poleGroup = new THREE.Group();

      // Vecteurs d'approche et d'orientation
      // heading = angle du vecteur d'approche
      const approachDir = new Vector2D(Math.cos(pole.heading), Math.sin(pole.heading));
      const leftNormal = approachDir.normalLeft(); // Vers la gauche du conducteur (donc vers la chaussée)

      const basePos = Vector2D.from(pole.position);
      const headPos = basePos.addScaled(leftNormal, pole.armLength);

      const height = pole.height;

      // 1. Mât vertical au sol (sur le trottoir)
      const mastGeom = new THREE.CylinderGeometry(0.12, 0.16, height, 16);
      const mastMesh = new THREE.Mesh(mastGeom, this.poleMat);
      mastMesh.position.set(basePos.x, height / 2, basePos.y);
      mastMesh.castShadow = true;
      poleGroup.add(mastMesh);

      // 2. Potence horizontale s'étendant vers la chaussée
      const armMid = basePos.addScaled(leftNormal, pole.armLength / 2);
      const armGeom = new THREE.CylinderGeometry(0.08, 0.08, pole.armLength, 16);
      const armMesh = new THREE.Mesh(armGeom, this.poleMat);
      armMesh.position.set(armMid.x, height - 0.2, armMid.y);
      
      // Orienter le cylindre de la potence le long de leftNormal
      armMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(leftNormal.x, 0, leftNormal.y)
      );
      armMesh.castShadow = true;
      poleGroup.add(armMesh);

      // 3. Boîtier principal suspendu au bout de la potence
      const boxY = height - 0.9;
      const boxGeom = new THREE.BoxGeometry(0.42, 1.25, 0.3);
      const boxMesh = new THREE.Mesh(boxGeom, this.housingMat);
      boxMesh.position.set(headPos.x, boxY, headPos.y);

      // Rotation pour que la face avant du boîtier regarde vers -approachDir (face aux conducteurs)
      const boxAngle = Math.atan2(approachDir.x, approachDir.y);
      boxMesh.rotation.y = boxAngle;
      boxMesh.castShadow = true;
      poleGroup.add(boxMesh);

      // 4. Optiques Rouge, Jaune, Verte sur le boîtier principal
      // Décalage vers l'avant du boîtier face aux véhicules
      const forwardOffset = approachDir.multiplyScalar(-0.16);
      const lensGeom = new THREE.SphereGeometry(0.13, 16, 16);

      const redMat = new THREE.MeshStandardMaterial({
        color: 0x330505,
        emissive: 0x000000,
        roughness: 0.2,
      });
      const yellowMat = new THREE.MeshStandardMaterial({
        color: 0x332200,
        emissive: 0x000000,
        roughness: 0.2,
      });
      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x052b05,
        emissive: 0x000000,
        roughness: 0.2,
      });

      const redLens = new THREE.Mesh(lensGeom, redMat);
      redLens.position.set(headPos.x + forwardOffset.x, boxY + 0.36, headPos.y + forwardOffset.y);

      const yellowLens = new THREE.Mesh(lensGeom, yellowMat);
      yellowLens.position.set(headPos.x + forwardOffset.x, boxY, headPos.y + forwardOffset.y);

      const greenLens = new THREE.Mesh(lensGeom, greenMat);
      greenLens.position.set(headPos.x + forwardOffset.x, boxY - 0.36, headPos.y + forwardOffset.y);

      poleGroup.add(redLens);
      poleGroup.add(yellowLens);
      poleGroup.add(greenLens);

      // 5. Boîtier répétiteur bas sur le mât (hauteur conducteur ~2.4m)
      const repBoxY = 2.4;
      const repBoxGeom = new THREE.BoxGeometry(0.35, 0.95, 0.25);
      const repBoxMesh = new THREE.Mesh(repBoxGeom, this.housingMat);
      repBoxMesh.position.set(basePos.x, repBoxY, basePos.y);
      repBoxMesh.rotation.y = boxAngle;
      repBoxMesh.castShadow = true;
      poleGroup.add(repBoxMesh);

      const repRedLens = new THREE.Mesh(lensGeom, redMat);
      repRedLens.scale.set(0.7, 0.7, 0.7);
      repRedLens.position.set(basePos.x + forwardOffset.x * 0.8, repBoxY + 0.28, basePos.y + forwardOffset.y * 0.8);

      const repYellowLens = new THREE.Mesh(lensGeom, yellowMat);
      repYellowLens.scale.set(0.7, 0.7, 0.7);
      repYellowLens.position.set(basePos.x + forwardOffset.x * 0.8, repBoxY, basePos.y + forwardOffset.y * 0.8);

      const repGreenLens = new THREE.Mesh(lensGeom, greenMat);
      repGreenLens.scale.set(0.7, 0.7, 0.7);
      repGreenLens.position.set(basePos.x + forwardOffset.x * 0.8, repBoxY - 0.28, basePos.y + forwardOffset.y * 0.8);

      poleGroup.add(repRedLens);
      poleGroup.add(repYellowLens);
      poleGroup.add(repGreenLens);

      this.group.add(poleGroup);

      this.poleVisuals.set(pole.id, {
        group: poleGroup,
        redMat,
        yellowMat,
        greenMat,
      });
    }

    this.updateLights(poles);
  }

  updateLights(poles: Map<string, TrafficLightPole>): void {
    for (const [id, pole] of poles.entries()) {
      const visual = this.poleVisuals.get(id);
      if (!visual) continue;

      this.applyState(visual, pole.currentState);
    }
  }

  private applyState(visual: PoleVisual, state: TrafficLightState): void {
    visual.redMat.color.setHex(0x330505);
    visual.redMat.emissive.setHex(0x000000);

    visual.yellowMat.color.setHex(0x332200);
    visual.yellowMat.emissive.setHex(0x000000);

    visual.greenMat.color.setHex(0x052b05);
    visual.greenMat.emissive.setHex(0x000000);

    if (state === 'red') {
      visual.redMat.color.setHex(0xff1e1e);
      visual.redMat.emissive.setHex(0xff0000);
      visual.redMat.emissiveIntensity = 3.0;
    } else if (state === 'yellow' || state === 'flashing_yellow') {
      visual.yellowMat.color.setHex(0xffaa00);
      visual.yellowMat.emissive.setHex(0xff8800);
      visual.yellowMat.emissiveIntensity = 3.0;
    } else if (state === 'green') {
      visual.greenMat.color.setHex(0x00ff44);
      visual.greenMat.emissive.setHex(0x00ff22);
      visual.greenMat.emissiveIntensity = 3.0;
    }
  }

  clear(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.poleVisuals.clear();
  }
}
