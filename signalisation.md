# CAHIER DES CHARGES

## TRAFFIC SIGN & ROAD RULES ENGINE — V1.0

### Projet : Simulateur de conduite automobile 3D

---

# 1. OBJECTIF DU MODULE

Le module `Traffic Sign & Road Rules Engine` est responsable de la génération, du placement, de l'orientation, de la cohérence et de la validation de toute la signalisation routière présente dans le monde 3D.

Le système ne doit JAMAIS fonctionner comme un générateur aléatoire de panneaux.

Chaque panneau doit être la conséquence logique d'un élément réel de l'infrastructure routière.

Exemple :

```text
VIRAGE DANGEREUX
        ↓
Analyse de la géométrie
        ↓
Analyse de la visibilité
        ↓
Analyse de la vitesse
        ↓
Détermination de la nécessité d'un avertissement
        ↓
Choix du panneau
        ↓
Calcul de la distance
        ↓
Orientation vers les usagers concernés
        ↓
Validation
        ↓
Placement 3D
```

Le système doit donc transformer :

```text
INFRASTRUCTURE ROUTIÈRE
```

en :

```text
RÈGLES DE CIRCULATION
+
SIGNALISATION
+
MARQUAGE
+
INFORMATIONS DE GUIDAGE
```

---

# 2. PRINCIPE ABSOLU

## Un panneau ne doit jamais exister sans raison.

Chaque panneau doit posséder au minimum :

```text
signId
signType
category
roadId
laneId
direction
triggerObjectId
triggerType
position
rotation
effectiveStart
effectiveEnd
visibilityStatus
validationStatus
```

Exemple :

```json
{
  "signId": "SIGN_00482",
  "signType": "DANGEROUS_CURVE_RIGHT",
  "category": "WARNING",
  "roadId": "ROAD_014",
  "laneId": "LANE_014_01",
  "direction": "FORWARD",
  "triggerObjectId": "CURVE_008",
  "triggerType": "DANGEROUS_CURVE",
  "distanceToTrigger": 150,
  "validationStatus": "VALID"
}
```

---

# 3. RÉFÉRENTIEL ROUTIER

Le moteur doit utiliser le référentiel réglementaire du projet.

Pour la version Togo :

```text
REGULATORY_PROFILE = TOGO
```

Toutes les règles réglementaires doivent être isolées dans un fichier/configuration spécifique.

Exemple :

```text
/regulations/
    /togo/
        signs.json
        priorities.json
        distances.json
        speed_limits.json
        markings.json
        temporary_signs.json
```

NE PAS coder toutes les distances et règles directement dans le moteur.

Cela permettra plus tard de créer :

```text
TOGO
FRANCE
BENIN
COTE_D_IVOIRE
SENEGAL
GHANA
```

sans réécrire le moteur.

---

# 4. HIÉRARCHIE DES INFORMATIONS ROUTIÈRES

Le moteur doit connaître la hiérarchie suivante :

```text
AGENT DE CIRCULATION
        ↓
SIGNAL LUMINEUX
        ↓
SIGNALISATION TEMPORAIRE / SITUATION SPÉCIALE
        ↓
SIGNALISATION PERMANENTE
        ↓
RÈGLES GÉNÉRALES DE CIRCULATION
```

Le Code de la route togolais précise notamment que les injonctions des agents prévalent sur les signaux et règles de circulation et que les signaux lumineux prévalent sur les autres signaux.

Le moteur doit donc être capable de représenter des situations où plusieurs règles coexistent.

---

# 5. ARCHITECTURE DU ROAD RULES ENGINE

Créer :

```text
ROAD_RULES_ENGINE
│
├── TrafficSignEngine
│
├── PriorityEngine
│
├── TrafficLightEngine
│
├── RoadMarkingEngine
│
├── SpeedLimitEngine
│
├── ParkingRuleEngine
│
├── OvertakingRuleEngine
│
├── PedestrianRuleEngine
│
├── RoundaboutEngine
│
├── IntersectionEngine
│
├── TemporaryTrafficEngine
│
├── VisibilityEngine
│
├── SignPlacementEngine
│
├── SignOrientationEngine
│
├── SignValidationEngine
│
└── RoadRuleConflictResolver
```

---

# 6. CATÉGORIES DE SIGNALISATION

Le moteur doit supporter au minimum :

```text
WARNING
PRIORITY
PROHIBITION
MANDATORY
INFORMATION
DIRECTION
LOCALIZATION
SERVICE
TEMPORARY
SUPPLEMENTARY
ROADWORK
RAILWAY
PEDESTRIAN
CYCLIST
PARKING
```

---

# 7. PANNEAUX DE DANGER

## Fonction

Avertir l'usager d'un danger situé en aval.

Les panneaux de danger sont normalement des panneaux avancés.

Pour le référentiel pédagogique togolais :

```text
AGGLOMERATION ≈ 50 m
HORS_AGGLOMERATION ≈ 150 m
```

Ces valeurs sont des valeurs générales et doivent rester configurables, car certains panneaux et certaines configurations constituent des exceptions.

---

# 8. RÈGLE DE PLACEMENT DES DANGERS

Créer :

```text
DangerObject
```

avec :

```text
danger.position
danger.type
danger.severity
danger.visibility
danger.speed
danger.roadId
```

Puis :

```text
signPosition =
calculateAdvanceWarningPosition(
    danger,
    roadContext,
    regulatoryProfile
)
```

---

# 9. VIRAGE DANGEREUX À DROITE

```text
SIGN_TYPE = DANGEROUS_CURVE_RIGHT
```

Condition :

```text
curve.severity >= WARNING_THRESHOLD
```

Placement :

```text
avant le virage
```

Jamais :

```text
dans le virage
après le virage
sur la mauvaise voie
face au mauvais sens
```

---

# 10. VIRAGE DANGEREUX À GAUCHE

Même logique :

```text
SIGN_TYPE = DANGEROUS_CURVE_LEFT
```

Le panneau doit être orienté vers les conducteurs arrivant dans le sens concerné.

---

# 11. SUCCESSION DE VIRAGES

Le moteur doit détecter :

```text
CURVE
+
CURVE
+
CURVE
```

dans une distance donnée.

Il doit pouvoir remplacer plusieurs panneaux individuels par un panneau :

```text
SERIES_OF_DANGEROUS_CURVES
```

si le profil réglementaire l'autorise.

NE PAS générer :

```text
⚠️ virage 1

⚠️ virage 2

⚠️ virage 3

⚠️ virage 4
```

automatiquement.

---

# 12. DOS D'ÂNE / RALENTISSEUR

Créer :

```text
SPEED_BUMP
ROAD_HUMP
DANGEROUS_DIP
```

Le panneau doit être placé en amont du dispositif.

Il doit être relié à :

```text
triggerObjectId = SPEED_BUMP_XX
```

et non simplement à :

```text
roadId
```

---

# 13. CHAUSSÉE RÉTRÉCIE

Détecter :

```text
laneWidthBefore
laneWidthAfter
```

Si :

```text
laneWidthAfter < laneWidthBefore
```

et que la réduction est suffisamment importante :

```text
GENERATE_NARROW_ROAD_WARNING
```

Placement :

```text
avant le rétrécissement
```

---

# 14. RÉTRÉCISSEMENT PAR LA DROITE / GAUCHE / DEUX CÔTÉS

Le moteur doit distinguer :

```text
NARROW_RIGHT
NARROW_LEFT
NARROW_BOTH
```

Le symbole doit correspondre à la géométrie réelle.

---

# 15. OBSTACLE SUR LA CHAUSSÉE

Créer :

```text
ROAD_OBSTACLE
```

Si :

```text
obstacle.blocks_lane == true
```

alors le moteur doit envisager :

```text
WARNING_SIGN
+
ROAD_MARKING
+
OBSTACLE_MARKER
+
MANDATORY_DIRECTION
```

selon la configuration.

---

# 16. TRAVAUX ROUTIERS

Créer un sous-système :

```text
TEMPORARY_TRAFFIC_ENGINE
```

Une zone de travaux doit pouvoir contenir :

```text
workZone
warningSigns
cones
barriers
temporaryMarkings
temporarySpeedLimit
laneClosure
detour
workers
```

Les panneaux temporaires doivent être différenciés de la signalisation permanente.

Les supports pédagogiques togolais décrivent notamment les panneaux à fond jaune comme signalisation temporaire et indiquent que celle-ci sert notamment à annoncer les chantiers et à ralentir les usagers.

---

# 17. PASSAGE À NIVEAU

Le moteur doit supporter :

```text
RAILWAY_CROSSING
```

avec :

```text
singleTrack
multipleTracks
barriers
automaticBarriers
lights
sound
visibility
```

Le référentiel togolais distingue notamment différentes configurations de passages à niveau.

Le moteur doit pouvoir générer :

```text
WARNING
RAILWAY_SIGN
CROSSING_MARKING
LIGHT
BARRIER
```

selon la configuration réelle.

---

# 18. CIRCULATION DANS LES DEUX SENS

Ce panneau doit être traité comme une exception importante.

Le support pédagogique togolais indique que le panneau annonçant la circulation dans les deux sens est normalement placé en signal de position, contrairement aux panneaux de danger généralement avancés.

Donc :

```text
SIGN_TYPE = TWO_WAY_TRAFFIC
PLACEMENT_MODE = POSITION
```

et non :

```text
ADVANCE_WARNING
```

par défaut.

---

# 19. INTERSECTION

Toute intersection doit être analysée avant de générer des panneaux.

Créer :

```text
IntersectionObject
```

avec :

```text
intersectionType
connectedRoads
approaches
trafficFlow
priorityRule
trafficLights
stopControl
yieldControl
roundabout
visibility
```

---

# 20. TYPES D'INTERSECTIONS

Supporter :

```text
T_JUNCTION
CROSSROAD
Y_JUNCTION
OFFSET_JUNCTION
MULTI_ARM_JUNCTION
ROUNDABOUT
MINI_ROUNDABOUT
GRADE_SEPARATED
DEAD_END
```

---

# 21. PRIORITÉ À DROITE

Le moteur doit pouvoir créer :

```text
priorityRule = RIGHT_HAND_PRIORITY
```

sans générer automatiquement un panneau.

C'est essentiel.

Une intersection peut donc être :

```text
priorityRule = RIGHT_HAND_PRIORITY
signs = []
```

et rester parfaitement valide.

---

# 22. CÉDEZ-LE-PASSAGE

Créer :

```text
YIELD
```

Le panneau doit être associé à :

```text
intersectionId
approachLaneId
```

Il doit être placé à proximité de l'intersection / du point où le conducteur doit céder.

Il ne doit pas être placé arbitrairement à 50 ou 150 m comme un panneau de danger.

Les règles internationales de signalisation décrivent également le cédez-le-passage comme un signal de position placé à proximité immédiate de l'intersection.

---

# 23. STOP

Créer :

```text
STOP
```

Le STOP doit être associé à une ligne/zone d'arrêt :

```text
stopLineId
intersectionId
```

Placement :

```text
avant la ligne d'arrêt
```

et proche de l'intersection.

Il ne faut surtout pas appliquer la règle :

```text
STOP = 50m avant intersection
```

par défaut.

Le principe de placement à proximité immédiate de l'intersection est également décrit dans les références de signalisation routière.

---

# 24. ROUTE À PRIORITÉ

Créer :

```text
PRIORITY_ROAD
```

Le moteur doit pouvoir mémoriser :

```text
road.priorityStatus = PRIORITY
```

Le panneau peut être répété après certaines intersections selon le référentiel réglementaire.

Le moteur doit donc connaître :

```text
priorityStart
priorityEnd
```

---

# 25. FIN DE PRIORITÉ

Créer :

```text
END_PRIORITY
```

Le panneau doit apparaître uniquement lorsque :

```text
previousPriority == true
newPriority != true
```

Ne jamais générer :

```text
END_PRIORITY
```

sur une route qui n'était pas prioritaire.

---

# 26. GIRATOIRE

Créer :

```text
ROUNDABOUT
```

L'existence du panneau doit dépendre de :

```text
intersection.type == ROUNDABOUT
```

Le panneau doit être positionné sur les approches concernées et non au centre du giratoire.

Le moteur doit également générer :

```text
lane_arrows
yield_rule
circulation_direction
```

selon le profil réglementaire.

---

# 27. SENS INTERDIT

Le panneau :

```text
NO_ENTRY
```

doit être placé sur l'approche où l'entrée est interdite.

Il doit être orienté :

```text
face_to_forbidden_traffic
```

Il ne doit pas être visible comme une interdiction pour les véhicules circulant dans le sens autorisé.

---

# 28. SENS UNIQUE

Le moteur doit différencier :

```text
ONE_WAY_ROAD
```

et :

```text
NO_ENTRY
```

Une rue à sens unique ne signifie pas automatiquement qu'il faut placer un panneau sens interdit à chaque intersection.

Le moteur doit placer les panneaux aux points où l'information est nécessaire.

---

# 29. LIMITATION DE VITESSE

Créer :

```text
SPEED_LIMIT
```

avec :

```text
value
startPosition
endPosition
reason
roadId
```

Exemple :

```text
50 km/h
↓
START_SPEED_ZONE
↓
50 km/h
↓
END_SPEED_ZONE
```

Le moteur doit maintenir une carte de la vitesse réglementaire :

```text
SpeedRuleMap
```

---

# 30. FIN DE LIMITATION

Créer :

```text
END_SPEED_LIMIT
```

Le moteur doit savoir exactement quelle limitation il termine.

Exemple :

```text
previousSpeedLimit = 50
newSpeedLimit = unrestricted/default
```

---

# 31. INTERDICTION DE DÉPASSER

Créer :

```text
NO_OVERTAKING
```

Condition possible :

```text
visibilityPoor
+
roadGeometry
+
regulatoryCondition
```

Le panneau doit être cohérent avec le marquage au sol.

Il est interdit au moteur de créer :

```text
NO_OVERTAKING
```

sur une route où aucun élément ne justifie la restriction selon le profil réglementaire.

---

# 32. FIN D'INTERDICTION DE DÉPASSER

Créer :

```text
END_NO_OVERTAKING
```

et vérifier :

```text
activeRestriction == NO_OVERTAKING
```

avant de l'autoriser.

---

# 33. INTERDICTION DE DEMI-TOUR

Créer :

```text
NO_U_TURN
```

uniquement si la géométrie / réglementation nécessite cette restriction.

Ne pas en mettre automatiquement à chaque carrefour.

---

# 34. INTERDICTION DE TOURNER

Types :

```text
NO_LEFT_TURN
NO_RIGHT_TURN
```

La règle fondamentale :

```text
if forbiddenTurnExists:
    sign may exist
```

et jamais :

```text
if intersection:
    spawn random turn restriction
```

---

# 35. STATIONNEMENT

Créer :

```text
PARKING_RULE_ENGINE
```

Types :

```text
NO_PARKING
NO_STOPPING
PARKING_ALLOWED
LOADING_ZONE
DISABLED_PARKING
BUS_STOP
```

Chaque restriction doit posséder une zone d'effet.

---

# 36. PANNEAUX D'OBLIGATION

Supporter :

```text
MANDATORY_RIGHT
MANDATORY_LEFT
MANDATORY_STRAIGHT
MANDATORY_STRAIGHT_OR_RIGHT
MANDATORY_STRAIGHT_OR_LEFT
MANDATORY_LEFT_OR_RIGHT
KEEP_RIGHT
KEEP_LEFT
MANDATORY_CYCLEWAY
MANDATORY_FOOTWAY
```

Le panneau doit toujours être compatible avec la géométrie.

Exemple :

```text
MANDATORY_RIGHT
```

est INVALID si aucune branche droite n'existe.

---

# 37. PANNEAUX DE DIRECTION

Le moteur doit distinguer :

```text
DIRECTION_AT_INTERSECTION
```

de :

```text
ADVANCE_DIRECTION
```

Le panneau directionnel placé à l'intersection doit correspondre aux destinations accessibles par chaque branche.

Les supports pédagogiques togolais distinguent explicitement les panneaux de direction placés à l'intersection des panneaux de présignalisation placés en amont.

---

# 38. PRÉSIGNALISATION

Créer :

```text
ADVANCE_DIRECTION_SIGN
```

avec :

```text
distanceToIntersection
destinations
arrows
lanes
```

Le panneau doit permettre au conducteur d'anticiper son choix.

---

# 39. PANNEAUX DE LOCALISATION

Supporter :

```text
CITY_ENTRY
CITY_EXIT
LOCALITY
RIVER
DISTRICT
ROAD_NAME
```

Le panneau doit être placé à la limite géographique correspondante.

Exemple :

```text
CITY_ZONE
      ↓
CITY_ENTRY_SIGN
      ↓
URBAN_RULES
```

---

# 40. SERVICES

Supporter notamment :

```text
PARKING
HOSPITAL
POLICE
FUEL
RESTAURANT
HOTEL
BUS_STOP
AIRPORT
RAILWAY
TOURIST_INFORMATION
```

Mais :

```text
service_exists == false
```

doit empêcher toute génération.

---

# 41. ÉCOLES

Une école dans la base 3D ne doit pas automatiquement générer tous les panneaux possibles.

Créer :

```text
SCHOOL_ZONE
```

avec :

```text
schoolId
pedestrianRisk
crosswalk
schoolHours
roadExposure
```

Le moteur décide ensuite quelles mesures sont réellement nécessaires.

---

# 42. HÔPITAL

Même logique :

```text
HOSPITAL
```

peut permettre une signalisation directionnelle ou de service.

Mais :

```text
hospital == true
```

ne signifie pas automatiquement :

```text
STOP
SPEED_LIMIT
NO_PARKING
CROSSWALK
```

---

# 43. PASSAGE PIÉTON

Créer :

```text
PEDESTRIAN_CROSSING
```

avec :

```text
crosswalkId
roadId
approachDirection
visibility
trafficLevel
```

La signalisation doit être cohérente avec le passage réel.

Il ne doit jamais y avoir :

```text
PEDESTRIAN_SIGN
```

sans :

```text
PEDESTRIAN_CROSSING
```

sauf lorsqu'il s'agit d'une autre fonction réglementaire explicitement prévue.

---

# 44. ARRÊT DE BUS

Créer :

```text
BUS_STOP
```

Le panneau doit correspondre à :

```text
busStopObject
```

et ne doit pas être généré simplement parce qu'un bâtiment ressemble à une station.

---

# 45. IMPASSE

Créer :

```text
DEAD_END
```

Condition :

```text
road.graph.outgoingConnections == 0
```

ou configuration équivalente.

Ne jamais afficher un panneau impasse lorsqu'une autre sortie routière existe.

---

# 46. PANONCEAUX

Les panonceaux doivent être des objets enfants :

```text
TrafficSign
└── SupplementaryPanel[]
```

Types :

```text
DISTANCE
EXTENT
CATEGORY
DIRECTION
TIME
EXCEPTION
DIAGRAM
```

Le support pédagogique togolais décrit notamment les panonceaux de distance, d'étendue, de catégorie et directionnels.

---

# 47. DISTANCE

Exemple :

```text
WARNING
150 m
```

Le moteur doit interpréter :

```text
triggerDistance = 150
```

et non :

```text
effectiveDistance = 150
```

Ces deux concepts doivent être différents.

---

# 48. ÉTENDUE

Exemple :

```text
NO_PARKING
50 m
```

signifie :

```text
restriction.length = 50m
```

et non :

```text
dangerDistance = 50m
```

---

# 49. DIRECTION DU PANONCEAU

Un panonceau directionnel doit pouvoir préciser :

```text
LEFT
RIGHT
STRAIGHT
BOTH
```

ou une géométrie plus complexe selon le référentiel.

---

# 50. ORIENTATION DES PANNEAUX

Chaque panneau doit être orienté vers les usagers auxquels il s'adresse.

Créer :

```text
SignOrientationEngine
```

Entrées :

```text
roadCenterline
laneDirection
signPosition
targetLane
```

Sortie :

```text
signRotation
```

Le panneau doit être lisible depuis la trajectoire concernée.

---

# 51. MAUVAIS CÔTÉ DE LA ROUTE

Le validateur doit détecter :

```text
SIGN_ON_WRONG_SIDE
```

sauf exceptions prévues.

---

# 52. VISIBILITÉ

Créer :

```text
VisibilityEngine
```

Il doit effectuer un raycast depuis la zone d'approche du conducteur.

Vérifier :

```text
building
tree
vehicle
otherSign
bridge
wall
terrain
```

Si un objet bloque le panneau :

```text
visibilityStatus = INVALID
```

Le moteur doit tenter :

```text
reposition
```

avant :

```text
delete
```

---

# 53. DISTANCE DE VISIBILITÉ

Chaque panneau doit avoir :

```text
minimumRequiredVisibilityDistance
```

Le moteur doit vérifier que le conducteur dispose d'une distance raisonnable pour :

```text
SEE
READ
UNDERSTAND
REACT
```

---

# 54. DENSITÉ DE PANNEAUX

Créer un :

```text
SignDensityManager
```

Il doit empêcher :

```text
SIGN
SIGN
SIGN
SIGN
SIGN
```

sans nécessité.

Une zone trop chargée doit être analysée.

---

# 55. DUPLICATION

Avant chaque création :

```text
checkNearbyEquivalentSigns()
```

Si :

```text
sameType
sameRoad
sameDirection
samePurpose
tooClose
```

alors :

```text
REJECT
```

---

# 56. CONFLIT DE PANNEAUX

Créer :

```text
RoadRuleConflictResolver
```

Exemple :

```text
SPEED_LIMIT_50
+
SPEED_LIMIT_90
```

au même endroit.

Le moteur doit déterminer :

```text
whichRuleStarts
whichRuleEnds
whichRuleHasPriority
```

---

# 57. CONTRADICTION AVEC LE MARQUAGE

Exemple :

```text
NO_OVERTAKING
```

mais :

```text
roadMarking = overtaking_allowed
```

Le validateur doit signaler :

```text
RULE_CONFLICT
```

Le système doit ensuite appliquer la hiérarchie réglementaire du profil choisi.

---

# 58. CONTRADICTION AVEC LES FEUX

Si une intersection possède :

```text
TRAFFIC_LIGHT
```

le moteur ne doit pas automatiquement ajouter :

```text
STOP
```

à chaque branche.

Il doit déterminer si les panneaux sont réellement nécessaires.

---

# 59. CONTRADICTION AVEC LA PRIORITÉ

Exemple :

```text
priorityRule = RIGHT_HAND_PRIORITY
```

mais :

```text
STOP_SIGN = true
```

Le système doit considérer le STOP comme une modification explicite du régime de priorité.

Il doit donc recalculer :

```text
priorityGraph
```

---

# 60. GRAPH DE PRIORITÉ

Chaque intersection doit produire :

```text
PriorityGraph
```

Exemple :

```text
ROAD_A
   ↓
PRIORITY
   ↓
ROAD_B
   ↓
YIELD
```

ou :

```text
ROAD_A
   ↓
RIGHT_HAND_PRIORITY
   ↓
ROAD_B
```

Ce graphe servira ensuite au comportement des véhicules IA.

---

# 61. SIGNALISATION ET IA DE TRAFIC

Le moteur de panneaux ne doit pas seulement servir au visuel.

Les véhicules IA doivent lire les mêmes règles.

Exemple :

```text
SIGN = STOP
```

doit produire :

```text
AI_VEHICLE
↓
detect STOP
↓
decelerate
↓
stop
↓
check traffic
↓
proceed
```

Le joueur et l'IA doivent donc partager :

```text
ROAD_RULES_ENGINE
```

---

# 62. SIGNALISATION ET GAMEPLAY PÉDAGOGIQUE

Chaque panneau doit pouvoir générer un événement pédagogique :

```text
SIGN_DETECTED
SIGN_IGNORED
SIGN_MISSED
SIGN_COMPLIED
SIGN_VIOLATED
```

Exemple :

```text
PLAYER_SPEED = 72
SPEED_LIMIT = 50
```

Le système peut enregistrer :

```text
SPEED_LIMIT_VIOLATION
```

---

# 63. SYSTÈME DE SCORING

Chaque situation peut produire :

```text
severity
```

Exemple :

```text
STOP_IGNORED = CRITICAL
RED_LIGHT_IGNORED = CRITICAL
NO_ENTRY = CRITICAL
SPEEDING = VARIABLE
PARKING_VIOLATION = LOW/MEDIUM
```

Les valeurs exactes doivent être configurables dans le moteur pédagogique.

---

# 64. MODE DEBUG

Le moteur doit disposer d'un mode :

```text
SIGN_DEBUG_MODE
```

Lorsque activé, afficher :

```text
SIGN ID
SIGN TYPE
TRIGGER
DISTANCE
ROAD
LANE
DIRECTION
RULE
VALIDATION
```

Exemple :

```text
┌───────────────────────────────┐
│ SIGN_00842                    │
│ TYPE: DANGEROUS_CURVE_RIGHT  │
│ TRIGGER: CURVE_0021           │
│ DISTANCE: 148.6 m             │
│ ROAD: R_014                   │
│ LANE: L_014_02                │
│ DIRECTION: FORWARD            │
│ STATUS: VALID                 │
└───────────────────────────────┘
```

---

# 65. VISUALISATION DES ZONES D'EFFET

En mode développeur :

```text
SIGN
│
├────── 150m ──────→ DANGER
```

Pour une interdiction :

```text
SIGN
│
├──────────── 50m ────────────┤
       EFFECTIVE ZONE
```

Pour une limitation :

```text
50 km/h
│
├──────────────────────────────→
```

---

# 66. VALIDATEUR AUTOMATIQUE

Créer :

```text
SignValidationEngine
```

Il doit exécuter au minimum :

```text
validateExistence
validatePurpose
validatePosition
validateDistance
validateOrientation
validateVisibility
validateRoadSide
validateDirection
validateTarget
validateGeometry
validatePriority
validateConflict
validateDuplication
validateDensity
validateRegulatoryCompliance
```

---

# 67. SCORE DE VALIDITÉ

Chaque panneau reçoit :

```text
validationScore
```

Exemple :

```text
100 = parfait
90-99 = acceptable
70-89 = correction recommandée
<70 = invalide
```

Un panneau critique invalide doit être supprimé ou corrigé.

---

# 68. RÈGLE "NO TARGET = NO SIGN"

Règle absolue :

```text
if triggerObjectId == null:
    rejectSign()
```

Exceptions :

```text
localization signs
general information
road identity
```

Ces exceptions doivent être explicitement déclarées dans le référentiel.

---

# 69. RÈGLE "WRONG GEOMETRY = NO SIGN"

Exemple :

```text
MANDATORY_RIGHT
```

mais :

```text
rightBranch == null
```

Résultat :

```text
INVALID
```

---

# 70. RÈGLE "WRONG DIRECTION = NO SIGN"

Si :

```text
sign.facingDirection
```

ne correspond pas au trafic ciblé :

```text
INVALID
```

---

# 71. RÈGLE "OBSTRUCTED = REPOSITION"

Ordre :

```text
CHECK VISIBILITY
        ↓
OBSTRUCTED?
   /          \
 YES           NO
 ↓             ↓
REPOSITION    VALID
 ↓
CHECK AGAIN
```

Après plusieurs tentatives :

```text
DELETE OR REPORT
```

---

# 72. RÈGLE "NEVER PUT WARNING AT THE HAZARD BY DEFAULT"

Pour les panneaux de danger :

```text
warningPosition != hazardPosition
```

sauf panneaux définis comme signal de position.

---

# 73. RÈGLE "POSITION SIGN ≠ ADVANCE SIGN"

Chaque type doit définir :

```text
placementMode
```

valeurs :

```text
ADVANCE
POSITION
BOTH
CONTEXTUAL
```

---

# 74. RÈGLE DE CONTEXTE

Le moteur doit analyser :

```text
urban
rural
highway
residential
commercial
school
industrial
intersection
roundabout
bridge
tunnel
railway
workzone
```

Le même objet routier peut nécessiter une signalisation différente selon le contexte.

---

# 75. BASE DE DONNÉES DES PANNEAUX

Créer un fichier :

```text
sign_catalog.json
```

Chaque panneau doit contenir :

```json
{
  "id": "DANGER_CURVE_RIGHT",
  "category": "WARNING",
  "shape": "TRIANGLE",
  "placementMode": "ADVANCE",
  "requiresTrigger": true,
  "allowedContexts": [],
  "forbiddenContexts": [],
  "orientation": "TRAFFIC_DIRECTION",
  "supplementaryPanels": [],
  "validationRules": []
}
```

---

# 76. TABLE DES TYPES MINIMAUX À IMPLÉMENTER

## Danger

```text
DANGEROUS_CURVE_LEFT
DANGEROUS_CURVE_RIGHT
SERIES_OF_CURVES
DANGEROUS_DIP
SPEED_BUMP
NARROW_ROAD
NARROW_LEFT
NARROW_RIGHT
NARROW_BOTH
ROAD_WORKS
ROAD_OBSTACLE
SLIPPERY_ROAD
LOOSE_GRAVEL
FALLING_ROCKS
PEDESTRIAN_DANGER
CHILDREN
CROSSROAD
SIDE_ROAD_LEFT
SIDE_ROAD_RIGHT
T_JUNCTION
ROUNDABOUT_ADVANCE
TRAFFIC_LIGHT_ADVANCE
RAILWAY_CROSSING
TWO_WAY_TRAFFIC
```

---

# 77. PRIORITÉ

```text
YIELD
STOP
PRIORITY_ROAD
END_PRIORITY
RIGHT_HAND_PRIORITY_WARNING
ROUNDABOUT_PRIORITY
```

---

# 78. INTERDICTION

```text
NO_ENTRY
NO_VEHICLES
NO_MOTOR_VEHICLES
NO_TRUCKS
NO_MOTORCYCLES
NO_BICYCLES
NO_PEDESTRIANS
NO_LEFT_TURN
NO_RIGHT_TURN
NO_U_TURN
NO_OVERTAKING
END_NO_OVERTAKING
NO_STOPPING
NO_PARKING
SPEED_LIMIT
END_SPEED_LIMIT
```

---

# 79. OBLIGATION

```text
MANDATORY_STRAIGHT
MANDATORY_RIGHT
MANDATORY_LEFT
STRAIGHT_OR_RIGHT
STRAIGHT_OR_LEFT
LEFT_OR_RIGHT
KEEP_RIGHT
KEEP_LEFT
MANDATORY_ROUNDABOUT_DIRECTION
MANDATORY_CYCLEWAY
MANDATORY_FOOTWAY
```

---

# 80. INFORMATION

```text
ONE_WAY
DEAD_END
PEDESTRIAN_CROSSING
BUS_STOP
PARKING
HOSPITAL
POLICE
FUEL
REST_AREA
INFORMATION
```

---

# 81. DIRECTION

```text
DIRECTION_INTERSECTION
DIRECTION_ADVANCE
LOCAL_DESTINATION
CITY_DESTINATION
HIGHWAY_DESTINATION
TOURIST_DESTINATION
TEMPORARY_DETOUR
```

---

# 82. LOCALISATION

```text
CITY_ENTRY
CITY_EXIT
DISTRICT
LOCALITY
RIVER
BRIDGE
ROAD_NAME
```

---

# 83. TEMPORAIRE

Chaque panneau permanent doit pouvoir avoir :

```text
temporaryOverride = true
```

Le système doit pouvoir représenter :

```text
PERMANENT_SIGN
+
TEMPORARY_SIGN
```

et appliquer la hiérarchie réglementaire appropriée.

---

# 84. GÉNÉRATION PAR ÉTAPES

La génération doit suivre exactement :

```text
STEP 01
GenerateRoadNetwork

STEP 02
GenerateLaneNetwork

STEP 03
DetectIntersections

STEP 04
DetectHazards

STEP 05
DetectSpecialZones

STEP 06
BuildPriorityGraph

STEP 07
BuildSpeedRules

STEP 08
BuildParkingRules

STEP 09
GenerateRequiredSigns

STEP 10
CalculateSignPositions

STEP 11
CalculateOrientation

STEP 12
ValidateVisibility

STEP 13
ValidateConflicts

STEP 14
RemoveDuplicates

STEP 15
RunGlobalValidation

STEP 16
Bake/Store Traffic Rules

STEP 17
Spawn 3D Signs
```

---

# 85. NE PAS GÉNÉRER LES PANNEAUX PENDANT LA PREMIÈRE GÉNÉRATION DE ROUTE

Le générateur de route doit d'abord produire :

```text
ROAD GRAPH
```

puis le moteur de règles doit analyser ce graphe.

Architecture :

```text
ROAD GENERATOR
       ↓
ROAD GRAPH
       ↓
ROAD ANALYZER
       ↓
RULE ENGINE
       ↓
SIGN ENGINE
       ↓
VALIDATOR
       ↓
3D WORLD
```

---

# 86. SYSTÈME DE CORRECTION AUTOMATIQUE

Si un panneau est invalide :

```text
INVALID
```

Le moteur tente :

```text
1. Reposition
2. Reorient
3. Replace with valid equivalent
4. Remove
5. Log error
```

---

# 87. LOGS

Chaque correction doit être enregistrée.

Exemple :

```text
[SIGN_VALIDATOR]

SIGN_842
TYPE = SPEED_LIMIT_50

ERROR:
Position conflicts with intersection.

ACTION:
Moved 7.4m upstream.

STATUS:
FIXED
```

---

# 88. TESTS AUTOMATIQUES

Créer une suite :

```text
/sign-tests/
```

Tests :

```text
test_danger_distance
test_stop_position
test_yield_position
test_wrong_direction
test_wrong_side
test_visibility
test_duplicate_sign
test_conflicting_speed_limits
test_roundabout
test_priority
test_dead_end
test_no_entry
test_temporary_sign
test_school_zone
test_railway_crossing
```

---

# 89. TEST DE VIRAGE

Créer automatiquement :

```text
ROAD
+
DANGEROUS_CURVE
```

Résultat attendu :

```text
WARNING_SIGN
```

dans la zone réglementaire appropriée.

---

# 90. TEST D'INTERSECTION SANS PRIORITÉ EXPLICITE

Créer :

```text
4-way intersection
no traffic light
no stop
no yield
no priority road
```

Résultat :

```text
RIGHT_HAND_PRIORITY
```

si cette règle est celle du profil réglementaire.

Et :

```text
NO RANDOM STOP
NO RANDOM YIELD
```

---

# 91. TEST STOP

Créer :

```text
intersection
+
stopRule
```

Résultat :

```text
STOP
+
STOP_LINE
```

Le panneau doit être proche du point d'arrêt.

---

# 92. TEST PANNEAU IMPASSE

Créer :

```text
road graph
branch count = 0
```

Résultat :

```text
DEAD_END
```

Créer ensuite une nouvelle connexion.

Résultat :

```text
DEAD_END = INVALID
```

Le panneau doit disparaître.

---

# 93. TEST NO ENTRY

Créer une route :

```text
ONE_WAY
```

Le panneau doit être généré pour les approches interdites.

Créer une approche autorisée.

Aucun `NO_ENTRY` ne doit être placé face aux véhicules autorisés.

---

# 94. TEST LIMITATION

Créer :

```text
ZONE A = 90
ZONE B = 50
```

Le moteur doit générer la transition :

```text
90
↓
50
```

et maintenir :

```text
activeSpeedLimit = 50
```

jusqu'à la prochaine règle applicable.

---

# 95. TEST VISIBILITÉ

Créer :

```text
SIGN
+
BUILDING
```

si le bâtiment masque le panneau :

```text
INVALID
```

Puis repositionner :

```text
VALID
```

---

# 96. TEST DE DENSITÉ

Créer une route longue sans événement.

Résultat :

```text
NO_RANDOM_SIGNS
```

Le système ne doit produire aucun panneau uniquement pour "faire réaliste".

---

# 97. RÈGLE ESTHÉTIQUE

La signalisation doit être :

```text
REALISTIC
SPARSE
CONSISTENT
READABLE
REGULATORY
```

et non :

```text
DECORATIVE
RANDOM
OVERSATURATED
```

---

# 98. RÈGLE DE PRIORITÉ POUR LE RÉALISME

Lorsque le moteur hésite entre :

```text
AJOUTER UN PANNEAU
```

et :

```text
NE PAS AJOUTER DE PANNEAU
```

il doit choisir :

```text
NE PAS AJOUTER
```

sauf si une règle réglementaire ou une situation routière justifie explicitement le panneau.

---

# 99. MODE ÉDITEUR

L'éditeur de carte doit permettre de sélectionner un panneau et afficher :

```text
Sign ID
Type
Category
Road
Lane
Direction
Trigger
Distance
Effective Zone
Priority
Visibility
Validation
```

---

# 100. OUTIL "WHY THIS SIGN?"

Ajouter une fonction extrêmement importante :

```text
WHY_THIS_SIGN?
```

Lorsqu'un développeur clique sur un panneau :

```text
SIGN:
DANGEROUS_CURVE_RIGHT

WHY?

Curve:
CURVE_007

Severity:
HIGH

Approach speed:
70 km/h

Visibility:
LIMITED

Context:
OUTSIDE_BUILT_UP_AREA

Required warning:
YES

Placement rule:
ADVANCE_WARNING

Distance:
150 m

Validation:
PASS
```

---

# 101. OUTIL "WHY NOT A SIGN?"

Également indispensable.

Sur une intersection sans panneau :

```text
WHY_NO_SIGN?
```

Réponse :

```text
Intersection detected.

Priority:
RIGHT_HAND_PRIORITY

Traffic lights:
NONE

STOP:
NO

YIELD:
NO

Priority road:
NO

Result:
NO VERTICAL PRIORITY SIGN REQUIRED.
```

Cela permettra de comprendre pourquoi le moteur ne met rien.

---

# 102. OUTIL "ROAD RULE INSPECTOR"

Créer une vue :

```text
ROAD RULE INSPECTOR
```

qui montre :

```text
Current road:
R_104

Speed:
50 km/h

Priority:
RIGHT HAND

Parking:
PROHIBITED

Overtaking:
ALLOWED

One Way:
YES

Pedestrian crossing:
120 m

Next intersection:
84 m
```

---

# 103. DONNÉES PARTAGÉES AVEC LE SIMULATEUR

Le moteur doit exposer une API interne :

```text
getCurrentSpeedLimit()
getCurrentPriorityRule()
getUpcomingSigns()
getUpcomingHazards()
getUpcomingIntersection()
getParkingRule()
getOvertakingRule()
getPedestrianRule()
```

---

# 104. DONNÉES POUR L'IA

L'IA des véhicules doit pouvoir demander :

```text
getRoadRules(vehicle.position)
```

et recevoir :

```json
{
  "speedLimit": 50,
  "priority": "RIGHT_HAND",
  "upcomingSign": "PEDESTRIAN_CROSSING",
  "distance": 72,
  "intersection": true
}
```

---

# 105. DONNÉES POUR LE JOUEUR

Le simulateur doit également pouvoir déterminer :

```text
player.shouldSlowDown
player.mustStop
player.mustYield
player.speedLimit
player.forbiddenDirection
player.allowedDirection
```

---

# 106. OBJECTIF FINAL

Le système doit produire une route où :

```text
CHAQUE PANNEAU A UNE RAISON
```

```text
CHAQUE RAISON CORRESPOND À UNE SITUATION
```

```text
CHAQUE SITUATION CORRESPOND À UNE RÈGLE
```

```text
CHAQUE RÈGLE EST COHÉRENTE AVEC LA GÉOMÉTRIE
```

```text
CHAQUE PANNEAU EST ORIENTÉ VERS LE BON USAGER
```

```text
CHAQUE PANNEAU EST PLACÉ À LA BONNE POSITION
```

```text
AUCUN PANNEAU INUTILE N'EST GÉNÉRÉ
```

---

# 107. CRITÈRES D'ACCEPTATION

La V1.0 ne sera considérée comme terminée que si :

* [ ] Aucun panneau n'est généré aléatoirement.
* [ ] Chaque panneau possède une cause ou un contexte explicite.
* [ ] Chaque panneau possède une direction.
* [ ] Chaque panneau possède une route cible.
* [ ] Les panneaux de danger sont placés en amont selon le profil réglementaire.
* [ ] Les panneaux de position sont distingués des panneaux avancés.
* [ ] STOP et CÉDEZ-LE-PASSAGE sont traités comme des panneaux de position.
* [ ] La priorité à droite peut exister sans panneau.
* [ ] Les limitations de vitesse possèdent une zone d'effet.
* [ ] Les interdictions possèdent une zone d'effet.
* [ ] Les panneaux temporaires sont gérés séparément.
* [ ] Les panonceaux sont attachés au panneau principal.
* [ ] Les panneaux peuvent être orientés automatiquement.
* [ ] Les panneaux masqués sont détectés.
* [ ] Les panneaux contradictoires sont détectés.
* [ ] Les panneaux dupliqués sont supprimés.
* [ ] Les panneaux impossibles géométriquement sont refusés.
* [ ] Les panneaux sont cohérents avec les intersections.
* [ ] Les panneaux sont cohérents avec le marquage au sol.
* [ ] Les panneaux sont cohérents avec les feux.
* [ ] L'IA des véhicules utilise les mêmes règles.
* [ ] Le simulateur utilise les mêmes règles.
* [ ] Un mode DEBUG permet d'expliquer chaque panneau.
* [ ] Un système de tests automatiques vérifie la génération.
* [ ] Le référentiel réglementaire est séparé du code moteur.
* [ ] Le système est extensible à d'autres pays.

---

# 108. RÈGLE D'OR POUR L'IA CODEUSE

NE JAMAIS implémenter :

```javascript
spawnRandomTrafficSigns()
```

ou une logique équivalente.

Implémenter :

```text
analyzeRoad()
→ detectSituations()
→ determineRules()
→ determineRequiredSigns()
→ calculatePlacement()
→ calculateOrientation()
→ validate()
→ spawn()
```

Le panneau doit être une **conséquence du monde routier**, et non un élément décoratif ajouté au monde.

---

# 109. ARCHITECTURE FINALE

```text
                    3D WORLD
                       │
                       ▼
                ROAD NETWORK
                       │
                       ▼
              ROAD ANALYSIS ENGINE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     INTERSECTIONS   HAZARDS     SPECIAL ZONES
          │            │            │
          └────────────┼────────────┘
                       ▼
                ROAD RULES ENGINE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      PRIORITY      SPEED       RESTRICTIONS
          │            │            │
          └────────────┼────────────┘
                       ▼
              TRAFFIC SIGN ENGINE
                       │
                       ▼
             SIGN PLACEMENT ENGINE
                       │
                       ▼
            SIGN ORIENTATION ENGINE
                       │
                       ▼
               VISIBILITY ENGINE
                       │
                       ▼
             VALIDATION ENGINE
                       │
              ┌────────┴────────┐
              │                 │
            VALID             INVALID
              │                 │
              ▼                 ▼
           SPAWN              REPAIR
              │                 │
              └────────┬────────┘
                       ▼
                    3D SIGN
                       │
                       ▼
              SIMULATION + AI
                       │
                       ▼
               PEDAGOGICAL ENGINE
```

# 110. LIVRABLE ATTENDU DE L'IA DE DÉVELOPPEMENT

L'IA doit livrer :

```text
1. TrafficSignEngine
2. RoadRulesEngine
3. PriorityEngine
4. SignPlacementEngine
5. SignOrientationEngine
6. VisibilityEngine
7. SignValidationEngine
8. RoadRuleConflictResolver
9. TemporaryTrafficEngine
10. Sign Catalog
11. Togo Regulatory Profile
12. Automated Tests
13. Debug Inspector
14. Why This Sign tool
15. Why No Sign tool
16. Road Rule Inspector
17. Documentation
```

Aucune partie critique ne doit être hardcodée directement dans les scènes 3D.

Le moteur doit être **data-driven**, **testable**, **déterministe**, **extensible** et **indépendant du rendu 3D**.

# FIN DU CAHIER DES CHARGES
