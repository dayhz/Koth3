import { RoadProfile } from '../types';

export interface GridCityConfig {
  rows: number;               // Nombre d'avenues horizontales (ex: 4)
  cols: number;               // Nombre de rues verticales (ex: 4)
  blockSizeX: number;         // Longueur d'un bloc en mètres (ex: 70)
  blockSizeY: number;         // Largeur d'un bloc en mètres (ex: 50)
  avenueFrequencyX?: number;  // Fréquence des avenues 4 voies sur X (ex: toutes les 2 rues)
  avenueFrequencyY?: number;  // Fréquence des avenues 4 voies sur Y (ex: toutes les 2 rues)
  majorProfile?: RoadProfile;
  minorProfile?: RoadProfile;
}

export interface OrganicCityConfig {
  boundsWidth: number;        // Largeur de la zone (ex: 200m)
  boundsHeight: number;       // Hauteur de la zone (ex: 200m)
  mainArteriesCount: number;  // Nombre de grandes artères sinueuses (ex: 3)
  branchesPerArtery: number;  // Nombre de branches par artère (ex: 4)
  curviness: number;          // Degré de courbure (0 = rectiligne, 1 = très sinueux)
  snapDistance: number;       // Distance seuil de fusion de carrefours (ex: 8m)
  majorProfile?: RoadProfile;
  minorProfile?: RoadProfile;
}

export interface RadialCityConfig {
  centerRadius: number;       // Rayon de la place ou giratoire central (ex: 20m)
  ringRadii: number[];        // Rayons des anneaux périphériques (ex: [50, 90])
  spokesCount: number;        // Nombre de radiales (ex: 6 ou 8)
  majorProfile?: RoadProfile;
  minorProfile?: RoadProfile;
}
