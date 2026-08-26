export class UVManager {
  /**
   * Calcule les coordonnées UV le long d'un ruban routier selon son abscisse curviligne
   * @param arcLengths Tableau des distances cumulées le long de la centerline
   * @param crossCoords Coordonnées transversales normalisées (ex: 0 = bord gauche, 1 = bord droit)
   * @param textureRepeatMeters Longueur en mètres pour une répétition complète de la texture (ex: 4.0m)
   */
  static generateRibbonUVs(
    arcLengths: number[],
    crossCoords: number[],
    textureRepeatMeters: number = 4.0
  ): Float32Array {
    const uvs = new Float32Array(arcLengths.length * crossCoords.length * 2);
    let ptr = 0;

    for (let i = 0; i < arcLengths.length; i++) {
      const v = arcLengths[i] / textureRepeatMeters;
      for (let j = 0; j < crossCoords.length; j++) {
        const u = crossCoords[j];
        uvs[ptr++] = u;
        uvs[ptr++] = v;
      }
    }

    return uvs;
  }

  /**
   * Génère les UVs d'un polygone plan projeté en coordonnées monde (mètre pour mètre)
   */
  static generatePlanarUVs(
    positions: ArrayLike<number>,
    scaleMeters: number = 4.0
  ): Float32Array {
    const vertexCount = positions.length / 3;
    const uvs = new Float32Array(vertexCount * 2);

    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      uvs[i * 2] = x / scaleMeters;
      uvs[i * 2 + 1] = z / scaleMeters;
    }

    return uvs;
  }
}
