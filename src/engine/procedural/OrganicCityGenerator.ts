import { Vector2D } from '../../core/math/Vector2D';
import { CubicBezierCurve, LinearCurve } from '../../core/curves/Curve';
import { RoadNetwork } from '../RoadNetwork';
import { defaultResidentialProfile, fourLaneAvenueProfile } from './GridCityGenerator';
import { OrganicCityConfig } from './types';

export class OrganicCityGenerator {
  /**
   * Génère un véritable quartier historique organique interconnecté
   * avec artère sinueuse centrale, places urbaines en Y et ruelles bouclées.
   */
  static generate(network: RoadNetwork, config: OrganicCityConfig, _seed: number = 5432): void {
    const majorProfile = config.majorProfile || fourLaneAvenueProfile;
    const minorProfile = config.minorProfile || defaultResidentialProfile;

    // 1. Place Centrale & Places Secondaires du Vieux Quartier
    const squareWest = network.createNode(new Vector2D(-100, 0), 't_junction', 'Place Ouest');
    const squareCenter = network.createNode(new Vector2D(0, 20), 'four_way', 'Place du Marché');
    const squareEast = network.createNode(new Vector2D(100, -10), 't_junction', 'Place Est');

    const squareNorth = network.createNode(new Vector2D(-20, 90), 't_junction', 'Place Haute');
    const squareSouth = network.createNode(new Vector2D(20, -70), 't_junction', 'Place Basse');

    // 2. Artère Principale Sinueuse Ouest -> Centre -> Est (Courbes de Bézier)
    const curveMainW_C = new CubicBezierCurve(
      squareWest.position,
      new Vector2D(-60, 40),
      new Vector2D(-30, -10),
      squareCenter.position
    );
    const curveMainC_E = new CubicBezierCurve(
      squareCenter.position,
      new Vector2D(30, 50),
      new Vector2D(70, -30),
      squareEast.position
    );

    network.createRoad(squareWest.id, squareCenter.id, curveMainW_C, majorProfile, 'R_ORG_MAIN_1');
    network.createRoad(squareCenter.id, squareEast.id, curveMainC_E, majorProfile, 'R_ORG_MAIN_2');

    // 3. Boucle Nord (Ruelles sinueuses formant un anneau complet)
    const curveW_N = new CubicBezierCurve(
      squareWest.position,
      new Vector2D(-80, 60),
      new Vector2D(-50, 95),
      squareNorth.position
    );
    const curveN_C = new CubicBezierCurve(
      squareNorth.position,
      new Vector2D(10, 80),
      new Vector2D(-10, 50),
      squareCenter.position
    );
    const curveN_E = new CubicBezierCurve(
      squareNorth.position,
      new Vector2D(40, 90),
      new Vector2D(80, 50),
      squareEast.position
    );

    network.createRoad(squareWest.id, squareNorth.id, curveW_N, minorProfile, 'R_ORG_NORD_1');
    network.createRoad(squareNorth.id, squareCenter.id, curveN_C, minorProfile, 'R_ORG_NORD_2');
    network.createRoad(squareNorth.id, squareEast.id, curveN_E, minorProfile, 'R_ORG_NORD_3');

    // 4. Boucle Sud (Ruelles sinueuses reliant l'Ouest, le Sud et l'Est)
    const curveW_S = new CubicBezierCurve(
      squareWest.position,
      new Vector2D(-70, -50),
      new Vector2D(-30, -75),
      squareSouth.position
    );
    const curveS_C = new CubicBezierCurve(
      squareSouth.position,
      new Vector2D(0, -40),
      new Vector2D(10, -10),
      squareCenter.position
    );
    const curveS_E = new CubicBezierCurve(
      squareSouth.position,
      new Vector2D(50, -80),
      new Vector2D(85, -50),
      squareEast.position
    );

    network.createRoad(squareWest.id, squareSouth.id, curveW_S, minorProfile, 'R_ORG_SUD_1');
    network.createRoad(squareSouth.id, squareCenter.id, curveS_C, minorProfile, 'R_ORG_SUD_2');
    network.createRoad(squareSouth.id, squareEast.id, curveS_E, minorProfile, 'R_ORG_SUD_3');

    // 5. Entrées / Sorties extérieures du quartier (Connectées aux limites)
    const gateWest = network.createNode(new Vector2D(-140, 0), 'dead_end', 'Porte Ouest');
    const gateEast = network.createNode(new Vector2D(140, -10), 'dead_end', 'Porte Est');
    network.createRoad(gateWest.id, squareWest.id, new LinearCurve(gateWest.position, squareWest.position), majorProfile, 'R_GATE_W');
    network.createRoad(squareEast.id, gateEast.id, new LinearCurve(squareEast.position, gateEast.position), majorProfile, 'R_GATE_E');
  }
}
