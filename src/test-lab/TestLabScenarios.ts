import { Vector2D } from '../core/math/Vector2D';
import { LinearCurve, CubicBezierCurve } from '../core/curves/Curve';
import { RoadWorldEngine } from '../engine/RoadWorldEngine';
import { RoadProfile } from '../engine/types';

export interface TestScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  expectedResult: string;
  createEngine: () => RoadWorldEngine;
}

const defaultResidentialProfile: RoadProfile = {
  roadType: 'residential',
  laneCount: 2,
  laneWidth: 3.5,
  sidewalkWidthLeft: 2.0,
  sidewalkWidthRight: 2.0,
  curbHeight: 0.15,
  speedLimitKmH: 30,
};

const fourLaneAvenueProfile: RoadProfile = {
  roadType: 'avenue',
  laneCount: 4,
  laneWidth: 3.5,
  sidewalkWidthLeft: 3.0,
  sidewalkWidthRight: 3.0,
  curbHeight: 0.15,
  speedLimitKmH: 50,
};

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'TEST-01',
    name: 'Route Droite (2 Voies)',
    category: 'Géométrie de Base',
    description: 'Une route droite standard à 2 voies (3.5m chacune) avec trottoirs bilatéraux de 2m et marquage central.',
    expectedResult: 'Ruban asphalté droit continu, 2 voies navigables opposées, 2 trottoirs et 1 ligne médiane discontinue.',
    createEngine: () => {
      const engine = new RoadWorldEngine(101);
      const n1 = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'N1');
      const n2 = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'N2');
      engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), defaultResidentialProfile, 'R1', 'Rue Principale');
      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-02',
    name: 'Route Courbe (Bézier S-Curve)',
    category: 'Géométrie de Base',
    description: 'Courbe en S fluide définie par une cubique de Bézier.',
    expectedResult: 'Parallélisme parfait des voies et trottoirs le long de la courbe sans distorsion ni pincement.',
    createEngine: () => {
      const engine = new RoadWorldEngine(102);
      const n1 = engine.network.createNode(new Vector2D(-60, -30), 'dead_end', 'N1');
      const n2 = engine.network.createNode(new Vector2D(60, 30), 'dead_end', 'N2');
      const curve = new CubicBezierCurve(
        n1.position,
        new Vector2D(-20, -30),
        new Vector2D(20, 30),
        n2.position
      );
      engine.network.createRoad(n1.id, n2.id, curve, defaultResidentialProfile, 'R_SCURVE', 'Chemin Sinueux');
      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-03',
    name: 'Avenue à 4 Voies',
    category: 'Sections & Profils',
    description: 'Avenue large composée de 4 voies (2 par sens) et larges trottoirs piétons.',
    expectedResult: 'Chaussée de 14m de large, 4 voies navigables distinctes et lignes de séparation de voies.',
    createEngine: () => {
      const engine = new RoadWorldEngine(103);
      const n1 = engine.network.createNode(new Vector2D(-70, 0), 'dead_end', 'N1');
      const n2 = engine.network.createNode(new Vector2D(70, 0), 'dead_end', 'N2');
      engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), fourLaneAvenueProfile, 'R_AVENUE', 'Avenue de la République');
      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-04',
    name: 'Intersection en T',
    category: 'Intersections',
    description: 'Jonction orthogonale à 3 branches avec calcul des congés de trottoir et connexions de voies.',
    expectedResult: 'Polygone de carrefour fermé, 3 branches connectées, connexions de virage gauche/droite calculées.',
    createEngine: () => {
      const engine = new RoadWorldEngine(104);
      const center = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'CARREFOUR_T');
      const west = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'WEST');
      const east = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'EAST');
      const north = engine.network.createNode(new Vector2D(0, 50), 'dead_end', 'NORTH');

      engine.network.createRoad(west.id, center.id, new LinearCurve(west.position, center.position), defaultResidentialProfile, 'R_OUEST');
      engine.network.createRoad(center.id, east.id, new LinearCurve(center.position, east.position), defaultResidentialProfile, 'R_EST');
      engine.network.createRoad(north.id, center.id, new LinearCurve(north.position, center.position), defaultResidentialProfile, 'R_NORD');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-05',
    name: 'Carrefour en X (4 Voies)',
    category: 'Intersections',
    description: 'Croisement orthogonal complet reliant 4 routes bidirectionnelles.',
    expectedResult: 'Carrefour 4-way régulier avec 12 trajectoires de virages possibles (tout droit, gauche, droite).',
    createEngine: () => {
      const engine = new RoadWorldEngine(105);
      const center = engine.network.createNode(new Vector2D(0, 0), 'four_way', 'CARREFOUR_X');
      const west = engine.network.createNode(new Vector2D(-50, 0), 'dead_end', 'W');
      const east = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'E');
      const north = engine.network.createNode(new Vector2D(0, 50), 'dead_end', 'N');
      const south = engine.network.createNode(new Vector2D(0, -50), 'dead_end', 'S');

      engine.network.createRoad(west.id, center.id, new LinearCurve(west.position, center.position), defaultResidentialProfile, 'R_W');
      engine.network.createRoad(center.id, east.id, new LinearCurve(center.position, east.position), defaultResidentialProfile, 'R_E');
      engine.network.createRoad(north.id, center.id, new LinearCurve(north.position, center.position), defaultResidentialProfile, 'R_N');
      engine.network.createRoad(south.id, center.id, new LinearCurve(south.position, center.position), defaultResidentialProfile, 'R_S');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-06',
    name: 'Carrefour Asymétrique (3 Branches Obliques)',
    category: 'Intersections',
    description: 'Jonction de routes avec des angles obliques non orthogonaux (ex: 60° et 120°).',
    expectedResult: 'Polygone de carrefour correctement adapté aux angles sans inversion de normales.',
    createEngine: () => {
      const engine = new RoadWorldEngine(106);
      const center = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'ASYM_NODE');
      const b1 = engine.network.createNode(new Vector2D(-45, -20), 'dead_end', 'B1');
      const b2 = engine.network.createNode(new Vector2D(50, 0), 'dead_end', 'B2');
      const b3 = engine.network.createNode(new Vector2D(-20, 50), 'dead_end', 'B3');

      engine.network.createRoad(b1.id, center.id, new LinearCurve(b1.position, center.position), defaultResidentialProfile, 'R_ASYM_1');
      engine.network.createRoad(center.id, b2.id, new LinearCurve(center.position, b2.position), defaultResidentialProfile, 'R_ASYM_2');
      engine.network.createRoad(b3.id, center.id, new LinearCurve(b3.position, center.position), defaultResidentialProfile, 'R_ASYM_3');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-07',
    name: 'Rond-Point Giratoire (4 Branches)',
    category: 'Giratoires',
    description: 'Anneau circulaire avec 4 voies affluentes tangentielles.',
    expectedResult: 'Surface annulaire, voies d’entrée/sortie connectées et îlot central défini.',
    createEngine: () => {
      const engine = new RoadWorldEngine(107);
      const rbNode = engine.network.createRoundaboutNode(new Vector2D(0, 0), 20, 10, 1, 'ROND_POINT');
      const w = engine.network.createNode(new Vector2D(-60, 0), 'dead_end', 'W');
      const e = engine.network.createNode(new Vector2D(60, 0), 'dead_end', 'E');
      const n = engine.network.createNode(new Vector2D(0, 60), 'dead_end', 'N');
      const s = engine.network.createNode(new Vector2D(0, -60), 'dead_end', 'S');

      engine.network.createRoad(w.id, rbNode.id, new LinearCurve(w.position, new Vector2D(-20, 0)), defaultResidentialProfile, 'R_RB_W');
      engine.network.createRoad(rbNode.id, e.id, new LinearCurve(new Vector2D(20, 0), e.position), defaultResidentialProfile, 'R_RB_E');
      engine.network.createRoad(n.id, rbNode.id, new LinearCurve(n.position, new Vector2D(0, 20)), defaultResidentialProfile, 'R_RB_N');
      engine.network.createRoad(rbNode.id, s.id, new LinearCurve(new Vector2D(0, -20), s.position), defaultResidentialProfile, 'R_RB_S');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-08',
    name: 'Boucle Réseau Fermée (Îlot Urbain 4 Carrefours)',
    category: 'Réseau Topologique',
    description: 'Quadrilatère de 4 routes formant un cycle fermé complet.',
    expectedResult: 'Graphe cyclique sans discontinuité, 4 carrefours connectés, surface intérieure délimitée.',
    createEngine: () => {
      const engine = new RoadWorldEngine(108);
      const nNW = engine.network.createNode(new Vector2D(-40, 40), 'four_way', 'N_NW');
      const nNE = engine.network.createNode(new Vector2D(40, 40), 'four_way', 'N_NE');
      const nSE = engine.network.createNode(new Vector2D(40, -40), 'four_way', 'N_SE');
      const nSW = engine.network.createNode(new Vector2D(-40, -40), 'four_way', 'N_SW');

      engine.network.createRoad(nNW.id, nNE.id, new LinearCurve(nNW.position, nNE.position), defaultResidentialProfile, 'R_NORTH');
      engine.network.createRoad(nNE.id, nSE.id, new LinearCurve(nNE.position, nSE.position), defaultResidentialProfile, 'R_EAST');
      engine.network.createRoad(nSE.id, nSW.id, new LinearCurve(nSE.position, nSW.position), defaultResidentialProfile, 'R_SOUTH');
      engine.network.createRoad(nSW.id, nNW.id, new LinearCurve(nSW.position, nNW.position), defaultResidentialProfile, 'R_WEST');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-09',
    name: 'Continuité des Trottoirs Piétons',
    category: 'Infrastructure Piétonne',
    description: 'Vérification de la présence et cohérence des trottoirs le long de carrefours en T et virages.',
    expectedResult: 'Tous les trottoirs sont modélisés avec bordure surélevée (15cm) et géométrie connexe.',
    createEngine: () => {
      const engine = new RoadWorldEngine(109);
      const n1 = engine.network.createNode(new Vector2D(-40, 0), 'dead_end', 'N1');
      const n2 = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'N2');
      const n3 = engine.network.createNode(new Vector2D(40, 30), 'dead_end', 'N3');
      const n4 = engine.network.createNode(new Vector2D(0, -40), 'dead_end', 'N4');

      engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), defaultResidentialProfile, 'R1');
      const curve = new CubicBezierCurve(n2.position, new Vector2D(20, 0), new Vector2D(20, 30), n3.position);
      engine.network.createRoad(n2.id, n3.id, curve, defaultResidentialProfile, 'R2');
      engine.network.createRoad(n4.id, n2.id, new LinearCurve(n4.position, n2.position), defaultResidentialProfile, 'R3');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-10',
    name: 'Détection d’Erreur Géométrique (Rejet par Validateur)',
    category: 'Validation & Intégrité',
    description: 'Injection intentionnelle d’une route anormalement courte (0.4m) et d’une voie trop étroite.',
    expectedResult: 'Le moteur de validation détecte et signale précisément les anomalies sans planter.',
    createEngine: () => {
      const engine = new RoadWorldEngine(110);
      const n1 = engine.network.createNode(new Vector2D(0, 0), 'dead_end', 'N1');
      const n2 = engine.network.createNode(new Vector2D(0.4, 0), 'dead_end', 'N2'); // < 1.0m

      const invalidProfile: RoadProfile = {
        roadType: 'narrow',
        laneCount: 1,
        laneWidth: 1.2, // < 2.0m (trop étroit)
        sidewalkWidthLeft: 0,
        sidewalkWidthRight: 0,
        curbHeight: 0.15,
        speedLimitKmH: 20,
      };

      engine.network.createRoad(n1.id, n2.id, new LinearCurve(n1.position, n2.position), invalidProfile, 'R_INVALID');
      engine.build();
      return engine;
    },
  },
];
