import { Vector2D } from '../core/math/Vector2D';
import { LinearCurve, CubicBezierCurve } from '../core/curves/Curve';
import { RoadWorldEngine } from '../engine/RoadWorldEngine';
import { RoadProfile } from '../engine/types';
import { CityBuilder } from '../engine/procedural/CityBuilder';

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
  {
    id: 'TEST-11',
    name: 'Carrefour Urbain à Feux Tricolores Synchronisés',
    category: 'Signalisation Lumineuse V0.5',
    description: 'Carrefour à 4 branches régulé par feux tricolores dynamiques 3D alternant phases Vert, Jaune et Tous-Rouges.',
    expectedResult: 'Poteaux 3D avec optiques lumineuses émissives qui alternent en temps réel.',
    createEngine: () => {
      const engine = new RoadWorldEngine(111);
      const center = engine.network.createNode(new Vector2D(0, 0), 'four_way', 'CENTER_TL');
      const w = engine.network.createNode(new Vector2D(-60, 0), 'dead_end', 'W');
      const e = engine.network.createNode(new Vector2D(60, 0), 'dead_end', 'E');
      const n = engine.network.createNode(new Vector2D(0, 60), 'dead_end', 'N');
      const s = engine.network.createNode(new Vector2D(0, -60), 'dead_end', 'S');

      engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), fourLaneAvenueProfile, 'R_AVE_W');
      engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), fourLaneAvenueProfile, 'R_AVE_E');
      engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), defaultResidentialProfile, 'R_RES_N');
      engine.network.createRoad(center.id, s.id, new LinearCurve(center.position, s.position), defaultResidentialProfile, 'R_RES_S');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-12',
    name: 'Route de Montagne 3D avec Pente et Dévers (Col 8%)',
    category: 'Élévation & Relief V0.6',
    description: 'Route en S sinueuse grimpant de 0m à 15m d’altitude avec pente longitudinale et dévers de virage automatique.',
    expectedResult: 'Profil altimétrique 3D fluide, montée continue et dévers transversaux en virage.',
    createEngine: () => {
      const engine = new RoadWorldEngine(112);
      const start = engine.network.createNode(new Vector2D(-60, -20), 'dead_end', 'VALLEE', 0);
      const end = engine.network.createNode(new Vector2D(60, 20), 'dead_end', 'SOMMET', 15);

      const sCurve = new CubicBezierCurve(
        start.position,
        new Vector2D(-20, -40),
        new Vector2D(20, 40),
        end.position
      );

      engine.network.createRoad(start.id, end.id, sCurve, defaultResidentialProfile, 'R_COL');
      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-13',
    name: 'Viaduc Routier Surélevé (Carrefour Étagé)',
    category: 'Élévation & Relief V0.6',
    description: 'Carrefour en T surélevé à 10m de hauteur avec rampes d’accès descendantes vers le niveau du sol (0m).',
    expectedResult: 'Jonction routière suspendue avec déclivité contrôlée sur les rampes.',
    createEngine: () => {
      const engine = new RoadWorldEngine(113);
      const centerBridge = engine.network.createNode(new Vector2D(0, 0), 't_junction', 'PONT_HAUT', 10);
      const rWest = engine.network.createNode(new Vector2D(-60, 0), 'dead_end', 'RAMPE_OUEST', 0);
      const rEast = engine.network.createNode(new Vector2D(60, 0), 'dead_end', 'RAMPE_EST', 0);
      const rNorth = engine.network.createNode(new Vector2D(0, 50), 'dead_end', 'RAMPE_NORD', 0);

      engine.network.createRoad(rWest.id, centerBridge.id, new LinearCurve(rWest.position, centerBridge.position), defaultResidentialProfile, 'R_RAMPE_W');
      engine.network.createRoad(centerBridge.id, rEast.id, new LinearCurve(centerBridge.position, rEast.position), defaultResidentialProfile, 'R_RAMPE_E');
      engine.network.createRoad(rNorth.id, centerBridge.id, new LinearCurve(rNorth.position, centerBridge.position), defaultResidentialProfile, 'R_RAMPE_N');

      engine.build();
      return engine;
    },
  },
  {
    id: 'TEST-14',
    name: 'Ville Procédurale en Grille Manhattan (16 Blocs Urbains)',
    category: 'Génération Procédurale V0.7',
    description: 'Grille urbaine complète 4x4 avec alternance avenues 4 voies et rues secondaires, trottoirs, passages piétons et carrefours régulés.',
    expectedResult: 'Trame viaire dense, géométriquement parfaite, avec congés de trottoirs et marquages complets.',
    createEngine: () => {
      const engine = new RoadWorldEngine(114);
      CityBuilder.createGridCity(engine, { rows: 4, cols: 4, blockSizeX: 70, blockSizeY: 55 }, 114);
      return engine;
    },
  },
  {
    id: 'TEST-15',
    name: 'Réseau Routier Organique & Sinueux (Quartier Historique)',
    category: 'Génération Procédurale V0.7',
    description: 'Génération procédurale de grandes artères en courbes de Bézier avec embranchements et fusion de carrefours.',
    expectedResult: 'Structure urbaine fluide et naturelle sans cassure de courbure.',
    createEngine: () => {
      const engine = new RoadWorldEngine(115);
      CityBuilder.createOrganicCity(engine, { mainArteriesCount: 3, branchesPerArtery: 3, snapDistance: 12 }, 115);
      return engine;
    },
  },
  {
    id: 'TEST-16',
    name: 'Réseau Radial-Concentrique (Périphérique & Radiales)',
    category: 'Génération Procédurale V0.7',
    description: 'Giratoire central, 2 anneaux de boulevards circulaires concentriques et 6 artères radiales connectées.',
    expectedResult: 'Réseau concentrique symétrique avec giratoire, arcs de cercle et carrefours régulés.',
    createEngine: () => {
      const engine = new RoadWorldEngine(116);
      CityBuilder.createRadialCity(engine, { centerRadius: 20, ringRadii: [60, 100], spokesCount: 6 });
      return engine;
    },
  },
  {
    id: 'TEST-17',
    name: 'Trafic Dynamique Urbain en Grille Manhattan (IDM + Feux)',
    category: 'Trafic Microscopique V0.8',
    description: 'Simulation autonome de 30+ véhicules circulant sur une grille urbaine 4x4 avec modèle IDM, respect des feux tricolores et feux stop arrière.',
    expectedResult: 'Véhicules 3D multicolores circulant en file indienne, freinant aux feux rouges et redémarrant aux feux verts.',
    createEngine: () => {
      const engine = new RoadWorldEngine(117);
      CityBuilder.createGridCity(engine, { rows: 4, cols: 4, blockSizeX: 70, blockSizeY: 55 }, 117);
      engine.traffic.config.maxVehicles = 40;
      engine.traffic.config.spawnIntervalSeconds = 1.0;
      return engine;
    },
  },
  {
    id: 'TEST-18',
    name: 'Trafic Continu en Giratoire Multi-Voies (Insertion & Sorties)',
    category: 'Trafic Microscopique V0.8',
    description: 'Véhicules autonomes s’insérant sur un rond-point à îlots séparateurs, tournant sur l’anneau et sortant de manière fluide.',
    expectedResult: 'Circulation circulaire avec ralentissement à l’entrée et dégagement sans blocage.',
    createEngine: () => {
      const engine = new RoadWorldEngine(118);
      const center = engine.network.createRoundaboutNode(new Vector2D(0, 0), 22, 12, 2, 'RND_TRAFFIC');
      const w = engine.network.createNode(new Vector2D(-70, 0), 'dead_end', 'W');
      const e = engine.network.createNode(new Vector2D(70, 0), 'dead_end', 'E');
      const n = engine.network.createNode(new Vector2D(0, 70), 'dead_end', 'N');
      const s = engine.network.createNode(new Vector2D(0, -70), 'dead_end', 'S');

      engine.network.createRoad(w.id, center.id, new LinearCurve(w.position, center.position), defaultResidentialProfile, 'R_W');
      engine.network.createRoad(center.id, e.id, new LinearCurve(center.position, e.position), defaultResidentialProfile, 'R_E');
      engine.network.createRoad(n.id, center.id, new LinearCurve(n.position, center.position), defaultResidentialProfile, 'R_N');
      engine.network.createRoad(center.id, s.id, new LinearCurve(center.position, s.position), defaultResidentialProfile, 'R_S');

      engine.build();
      engine.traffic.config.maxVehicles = 25;
      engine.traffic.config.spawnIntervalSeconds = 1.2;
      return engine;
    },
  },
  {
    id: 'TEST-19',
    name: 'Méga-Circuit Métropolitain Complet V1.0 (Tous Systèmes V0.1 à V1.0 Intégrés)',
    category: 'Version Finale V1.0',
    description: 'La synthèse ultime : 3 grands giratoires, viaduc autoroutier à +15m enjambant une avenue au sol, lacets de montagne sinueux en S déversés grimpant à +14m, quartier organique en courbes de Bézier avec carrefour en Y, grille Manhattan à feux synchronisés et 80 véhicules autonomes IDM.',
    expectedResult: 'Un monde 3D continu et spectaculaire combinant 100% des technologies développées depuis la V0.1.',
    createEngine: () => {
      const engine = new RoadWorldEngine(119);
      const net = engine.network;

      // =========================================================================
      // 1. LES 3 GRANDS GIRATOIRES (V0.2 & V0.4 - Priorité Anneau & Îlots)
      // =========================================================================
      const rndC = net.createRoundaboutNode(new Vector2D(0, 0), 24, 13, 2, 'Giratoire Central (Étoile)');
      const rndN = net.createRoundaboutNode(new Vector2D(0, 170), 22, 12, 2, 'Giratoire Nord (Parc)');
      const rndS = net.createRoundaboutNode(new Vector2D(0, -170), 22, 12, 2, 'Giratoire Sud (Colline)');

      // Boulevards centraux reliant les giratoires
      net.createRoad(rndC.id, rndN.id, new LinearCurve(rndC.position, rndN.position), fourLaneAvenueProfile, 'BD_CENTRAL_NORD');
      net.createRoad(rndC.id, rndS.id, new LinearCurve(rndC.position, rndS.position), fourLaneAvenueProfile, 'BD_CENTRAL_SUD');

      // =========================================================================
      // 2. BOUCLE AUTOROUTIÈRE EN VIADUC À +15M & PONT SUPÉRIEUR (V0.6)
      // =========================================================================
      const viaN = net.createNode(new Vector2D(-100, 170), 'dead_end', 'Viaduc Montée Nord (+15m)', 15);
      const viaW = net.createNode(new Vector2D(-180, 0), 'dead_end', 'Viaduc Pont Supérieur (+15m)', 15);
      const viaS = net.createNode(new Vector2D(-100, -170), 'dead_end', 'Viaduc Descente Sud (+15m)', 15);

      net.createRoad(rndN.id, viaN.id, new LinearCurve(rndN.position, viaN.position, 0, 15), fourLaneAvenueProfile, 'RAMPE_VIADUC_NORD');
      net.createRoad(viaN.id, viaW.id, new LinearCurve(viaN.position, viaW.position, 15, 15), fourLaneAvenueProfile, 'VIADUC_TABLIER_1');
      net.createRoad(viaW.id, viaS.id, new LinearCurve(viaW.position, viaS.position, 15, 15), fourLaneAvenueProfile, 'VIADUC_TABLIER_2');
      net.createRoad(viaS.id, rndS.id, new LinearCurve(viaS.position, rndS.position, 15, 0), fourLaneAvenueProfile, 'RAMPE_VIADUC_SUD');

      // Avenue transversale au sol (0m) passant DIRECTEMENT sous le tablier du viaduc et bouclant vers le Sud
      const underpassW = net.createNode(new Vector2D(-240, 0), 't_junction', 'Avenue Sous Pont Ouest', 0);
      const underpassLoopS = net.createNode(new Vector2D(-200, -130), 't_junction', 'Boucle Ouest Sud', 0);

      net.createRoad(rndC.id, underpassW.id, new LinearCurve(rndC.position, underpassW.position, 0, 0), fourLaneAvenueProfile, 'AVENUE_SOUS_VIADUC_1');
      net.createRoad(underpassW.id, underpassLoopS.id, new CubicBezierCurve(underpassW.position, new Vector2D(-250, -70), new Vector2D(-240, -110), underpassLoopS.position), fourLaneAvenueProfile, 'AVENUE_SOUS_VIADUC_2');
      net.createRoad(underpassLoopS.id, rndS.id, new LinearCurve(underpassLoopS.position, rndS.position, 0, 0), fourLaneAvenueProfile, 'AVENUE_SOUS_VIADUC_3');

      // =========================================================================
      // 3. QUARTIER HISTORIQUE ORGANIQUE EN BÉZIERS & BIFURCATION EN Y (V0.1, V0.2, V0.7)
      // =========================================================================
      const forkY = net.createNode(new Vector2D(90, 240), 't_junction', 'Bifurcation en Y Historique');
      const orgBranch1 = net.createNode(new Vector2D(180, 270), 't_junction', 'Place Haute Nord-Est');
      const orgBranch2 = net.createNode(new Vector2D(180, 170), 'four_way', 'Porte Nord-Est');

      // Grande courbe de Bézier sinueuse reliant le Giratoire Nord à la bifurcation en Y
      const curveOrganicMain = new CubicBezierCurve(
        rndN.position,
        new Vector2D(20, 230),
        new Vector2D(60, 250),
        forkY.position
      );
      // Deux branches en Y sinueuses
      const curveFork1 = new CubicBezierCurve(
        forkY.position,
        new Vector2D(120, 260),
        new Vector2D(150, 275),
        orgBranch1.position
      );
      const curveFork2 = new CubicBezierCurve(
        forkY.position,
        new Vector2D(120, 220),
        new Vector2D(150, 190),
        orgBranch2.position
      );

      // Reconnexion de la branche haute orgBranch1 vers orgBranch2 pour boucler le quartier Nord
      const curveLoopNorth = new CubicBezierCurve(
        orgBranch1.position,
        new Vector2D(220, 260),
        new Vector2D(220, 200),
        orgBranch2.position
      );

      net.createRoad(rndN.id, forkY.id, curveOrganicMain, defaultResidentialProfile, 'ART_ORGANIC_MAIN');
      net.createRoad(forkY.id, orgBranch1.id, curveFork1, defaultResidentialProfile, 'BRANCHE_Y_1');
      net.createRoad(forkY.id, orgBranch2.id, curveFork2, defaultResidentialProfile, 'BRANCHE_Y_2');
      net.createRoad(orgBranch1.id, orgBranch2.id, curveLoopNorth, defaultResidentialProfile, 'BOUCLE_NORD_EST');

      // =========================================================================
      // 4. COL DE MONTAGNE EN LACETS SINUEUX EN S À +14M AVEC DÉVERS (V0.6)
      // =========================================================================
      const mntStage1 = net.createNode(new Vector2D(60, -220), 'dead_end', 'Lacet 1 (+6m)', 6);
      const mntPeak = net.createNode(new Vector2D(120, -270), 'dead_end', 'Col Sommet (+14m)', 14);
      const mntStage2 = net.createNode(new Vector2D(180, -220), 'dead_end', 'Lacet 2 (+6m)', 6);
      const mntExit = net.createNode(new Vector2D(240, -170), 'four_way', 'Sortie Col Sud-Est', 0);

      const curveMnt1 = new CubicBezierCurve(
        rndS.position,
        new Vector2D(10, -200),
        new Vector2D(40, -225),
        mntStage1.position,
        0,
        6
      );
      const curveMnt2 = new CubicBezierCurve(
        mntStage1.position,
        new Vector2D(80, -260),
        new Vector2D(95, -275),
        mntPeak.position,
        6,
        14
      );
      const curveMnt3 = new CubicBezierCurve(
        mntPeak.position,
        new Vector2D(145, -275),
        new Vector2D(160, -260),
        mntStage2.position,
        14,
        6
      );
      const curveMnt4 = new CubicBezierCurve(
        mntStage2.position,
        new Vector2D(200, -200),
        new Vector2D(220, -180),
        mntExit.position,
        6,
        0
      );

      net.createRoad(rndS.id, mntStage1.id, curveMnt1, defaultResidentialProfile, 'LACET_MONTAGNE_1');
      net.createRoad(mntStage1.id, mntPeak.id, curveMnt2, defaultResidentialProfile, 'LACET_MONTAGNE_2');
      net.createRoad(mntPeak.id, mntStage2.id, curveMnt3, defaultResidentialProfile, 'LACET_MONTAGNE_3');
      net.createRoad(mntStage2.id, mntExit.id, curveMnt4, defaultResidentialProfile, 'LACET_MONTAGNE_4');

      // =========================================================================
      // 5. QUARTIER D'AFFAIRES DOWNTOWN MANHATTAN TOTALEMENT MAILLÉ (EST)
      // =========================================================================
      const dtC1 = net.createNode(new Vector2D(80, 0), 'four_way', 'Carrefour Finance 1');
      const dtC2 = net.createNode(new Vector2D(160, 0), 'four_way', 'Carrefour Finance 2');
      const dtC3 = net.createNode(new Vector2D(240, 0), 'four_way', 'Carrefour Finance 3');

      net.createRoad(rndC.id, dtC1.id, new LinearCurve(rndC.position, dtC1.position), fourLaneAvenueProfile, 'AV_FINANCE_1');
      net.createRoad(dtC1.id, dtC2.id, new LinearCurve(dtC1.position, dtC2.position), fourLaneAvenueProfile, 'AV_FINANCE_2');
      net.createRoad(dtC2.id, dtC3.id, new LinearCurve(dtC2.position, dtC3.position), fourLaneAvenueProfile, 'AV_FINANCE_3');

      // Ligne Nord Est
      const dtN1 = net.createNode(new Vector2D(80, 170), 'four_way', 'Carrefour Nord 1');
      const dtN2 = net.createNode(new Vector2D(160, 170), 'four_way', 'Carrefour Nord 2');
      const dtN3 = orgBranch2; // Reconnexion directe de la branche organique !

      net.createRoad(rndN.id, dtN1.id, new LinearCurve(rndN.position, dtN1.position), fourLaneAvenueProfile, 'BD_NE_1');
      net.createRoad(dtN1.id, dtN2.id, new LinearCurve(dtN1.position, dtN2.position), fourLaneAvenueProfile, 'BD_NE_2');
      net.createRoad(dtN2.id, dtN3.id, new LinearCurve(dtN2.position, dtN3.position), fourLaneAvenueProfile, 'BD_NE_3');

      // Ligne Sud Est
      const dtS1 = net.createNode(new Vector2D(80, -170), 'four_way', 'Carrefour Sud 1');
      const dtS2 = net.createNode(new Vector2D(160, -170), 'four_way', 'Carrefour Sud 2');
      const dtS3 = mntExit; // Reconnexion directe de la sortie des lacets de montagne !

      net.createRoad(rndS.id, dtS1.id, new LinearCurve(rndS.position, dtS1.position), fourLaneAvenueProfile, 'BD_SE_1');
      net.createRoad(dtS1.id, dtS2.id, new LinearCurve(dtS1.position, dtS2.position), fourLaneAvenueProfile, 'BD_SE_2');
      net.createRoad(dtS2.id, dtS3.id, new LinearCurve(dtS2.position, dtS3.position), fourLaneAvenueProfile, 'BD_SE_3');

      // Avenues transversales Nord-Sud
      net.createRoad(dtN1.id, dtC1.id, new LinearCurve(dtN1.position, dtC1.position), defaultResidentialProfile, 'RUE_N1_C1');
      net.createRoad(dtC1.id, dtS1.id, new LinearCurve(dtC1.position, dtS1.position), defaultResidentialProfile, 'RUE_C1_S1');

      net.createRoad(dtN2.id, dtC2.id, new LinearCurve(dtN2.position, dtC2.position), defaultResidentialProfile, 'RUE_N2_C2');
      net.createRoad(dtC2.id, dtS2.id, new LinearCurve(dtC2.position, dtS2.position), defaultResidentialProfile, 'RUE_C2_S2');

      net.createRoad(dtN3.id, dtC3.id, new LinearCurve(dtN3.position, dtC3.position), fourLaneAvenueProfile, 'PERIPH_EST_NORD');
      net.createRoad(dtC3.id, dtS3.id, new LinearCurve(dtC3.position, dtS3.position), fourLaneAvenueProfile, 'PERIPH_EST_SUD');

      // =========================================================================
      // 6. CONSTRUCTION, FEUX TRICOLORES & TRAFIC MULTI-AGENTS (V0.3, V0.5, V0.8)
      // =========================================================================
      engine.build();

      // Régulation par feux tricolores synchronisés Downtown
      engine.regulation.setPriorityRule(dtC1.id, 'traffic_light', [], dtC1.connectedRoadIds, 'Feux Finance 1');
      engine.regulation.setPriorityRule(dtC2.id, 'traffic_light', [], dtC2.connectedRoadIds, 'Feux Finance 2');
      engine.regulation.setPriorityRule(dtN2.id, 'traffic_light', [], dtN2.connectedRoadIds, 'Feux Nord 2');
      engine.regulation.setPriorityRule(dtS2.id, 'traffic_light', [], dtS2.connectedRoadIds, 'Feux Sud 2');
      engine.trafficLights.build();

      // Flotte de 80 véhicules autonomes circulant en continu
      engine.traffic.config.maxVehicles = 80;
      engine.traffic.config.spawnIntervalSeconds = 0.6;

      return engine;
    },
  },
];
