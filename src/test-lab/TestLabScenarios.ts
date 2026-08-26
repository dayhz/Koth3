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
    name: 'Intersection en T (Congés Arrondis)',
    category: 'Intersections V0.2',
    description: 'Jonction en T avec calcul de congés de trottoir arrondis tangents (R = 5m).',
    expectedResult: 'Coins de trottoir arrondis fluides, connexions de virage gauche et droite réalistes.',
    createEngine: () => {
      const engine = new RoadWorldEngine(104);
      const center = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'CARREFOUR_T');
      center.curbRadius = 6.0;

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
    name: 'Carrefour en X (4 Congés Arrondis)',
    category: 'Intersections V0.2',
    description: 'Croisement orthogonal complet avec 4 congés de trottoir tangents de 5m de rayon.',
    expectedResult: 'Surface de carrefour aux 4 coins adoucis, 12 trajectoires de virages calculées.',
    createEngine: () => {
      const engine = new RoadWorldEngine(105);
      const center = engine.network.createNode(new Vector2D(0, 0), 'four_way', 'CARREFOUR_X');
      center.curbRadius = 5.0;

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
    name: 'Carrefour en Y Oblique (Angles Asymétriques)',
    category: 'Intersections V0.2',
    description: 'Carrefour à 3 branches obliques non orthogonales avec calcul des congés adaptés.',
    expectedResult: 'Congés asymétriques adaptés aux angles aigus et obtus sans inversion de normales.',
    createEngine: () => {
      const engine = new RoadWorldEngine(106);
      const center = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'Y_NODE');
      center.curbRadius = 4.0;

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
    name: 'Giratoire avec Îlots Séparateurs (Splitter Islands)',
    category: 'Giratoires V0.2',
    description: 'Rond-point giratoire avec 4 îlots séparateurs triangulaires surélevés guidant les entrées/sorties.',
    expectedResult: 'Anneau circulaire et 4 îlots séparateurs 3D géométriquement parfaits.',
    createEngine: () => {
      const engine = new RoadWorldEngine(107);
      const rbNode = engine.network.createRoundaboutNode(new Vector2D(0, 0), 22, 12, 1, 'ROND_POINT');
      rbNode.roundaboutConfig!.hasSplitterIslands = true;

      const w = engine.network.createNode(new Vector2D(-65, 0), 'dead_end', 'W');
      const e = engine.network.createNode(new Vector2D(65, 0), 'dead_end', 'E');
      const n = engine.network.createNode(new Vector2D(0, 65), 'dead_end', 'N');
      const s = engine.network.createNode(new Vector2D(0, -65), 'dead_end', 'S');

      engine.network.createRoad(w.id, rbNode.id, new LinearCurve(w.position, rbNode.position), defaultResidentialProfile, 'R_RB_W');
      engine.network.createRoad(rbNode.id, e.id, new LinearCurve(rbNode.position, e.position), defaultResidentialProfile, 'R_RB_E');
      engine.network.createRoad(n.id, rbNode.id, new LinearCurve(n.position, rbNode.position), defaultResidentialProfile, 'R_RB_N');
      engine.network.createRoad(rbNode.id, s.id, new LinearCurve(rbNode.position, s.position), defaultResidentialProfile, 'R_RB_S');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-08',
    name: 'Boucle Réseau Fermée (Îlot Urbain 4 Carrefours)',
    category: 'Réseau Topologique',
    description: 'Quadrilatère de 4 routes formant un cycle fermé avec congés de trottoir aux 4 intersections.',
    expectedResult: 'Graphe cyclique sans discontinuité, 4 carrefours connectés et arrondis.',
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
    name: 'Continuité Trottoirs & Carrefours',
    category: 'Infrastructure Piétonne',
    description: 'Vérification de la continuité des trottoirs piétons longeant les carrefours en T et courbes.',
    expectedResult: 'Trottoirs surélevés (15cm) continus et connectés le long des branches.',
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
      const n2 = engine.network.createNode(new Vector2D(0.4, 0), 'dead_end', 'N2');

      const invalidProfile: RoadProfile = {
        roadType: 'narrow',
        laneCount: 1,
        laneWidth: 1.2,
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
