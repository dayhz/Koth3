import { RoadWorldEngine } from '../RoadWorldEngine';

export class SumoExporter {
  /**
   * Exporte le réseau routier au format XML Eclipse SUMO (.net.xml)
   */
  static export(engine: RoadWorldEngine): string {
    const net = engine.network;

    // Calcul de l'emprise englobante du réseau
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of net.nodes.values()) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x);
      maxY = Math.max(maxY, node.position.y);
    }
    if (minX === Infinity) { minX = 0; minY = 0; maxX = 100; maxY = 100; }

    const convBoundary = `${minX.toFixed(2)},${minY.toFixed(2)},${maxX.toFixed(2)},${maxY.toFixed(2)}`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<net version="1.16" junctionCornerDetail="5" limitTurnSpeed="5.50" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;
    xml += `  <location netOffset="0.00,0.00" convBoundary="${convBoundary}" origBoundary="${convBoundary}" projParameter="!"/>\n\n`;

    // 1. Arêtes routières (<edge>) et Voies (<lane>)
    for (const road of net.roads.values()) {
      const roadLanes = net.getLanesForRoad(road.id);
      const fwdLanes = roadLanes.filter((l) => l.direction === 'forward');
      const backLanes = roadLanes.filter((l) => l.direction === 'backward');

      // Arête sens direct
      if (fwdLanes.length > 0) {
        const edgeId = `${road.id}_fwd`;
        const speed = (road.profile.speedLimitKmH / 3.6).toFixed(2);
        xml += `  <edge id="${edgeId}" from="${road.startNodeId}" to="${road.endNodeId}" priority="3" numLanes="${fwdLanes.length}" speed="${speed}">\n`;
        
        fwdLanes.forEach((lane, idx) => {
          const shape = lane.centerline.samplePoints(12).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
          xml += `    <lane id="${lane.id}" index="${idx}" speed="${speed}" length="${lane.centerline.getLength().toFixed(2)}" width="${lane.width.toFixed(2)}" shape="${shape}"/>\n`;
        });
        xml += `  </edge>\n`;
      }

      // Arête sens retour
      if (backLanes.length > 0) {
        const edgeId = `${road.id}_back`;
        const speed = (road.profile.speedLimitKmH / 3.6).toFixed(2);
        xml += `  <edge id="${edgeId}" from="${road.endNodeId}" to="${road.startNodeId}" priority="3" numLanes="${backLanes.length}" speed="${speed}">\n`;
        
        backLanes.forEach((lane, idx) => {
          const shape = lane.centerline.samplePoints(12).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
          xml += `    <lane id="${lane.id}" index="${idx}" speed="${speed}" length="${lane.centerline.getLength().toFixed(2)}" width="${lane.width.toFixed(2)}" shape="${shape}"/>\n`;
        });
        xml += `  </edge>\n`;
      }
    }
    xml += `\n`;

    // 2. Contrôleurs de feux tricolores SUMO (<tlLogic>)
    if (engine.trafficLights) {
      for (const [nodeId, controller] of engine.trafficLights.controllers.entries()) {
        xml += `  <tlLogic id="${nodeId}" type="static" programID="0" offset="0">\n`;
        for (const phase of controller.phases) {
          const stateStr = phase.greenLaneIds.length > 0 ? 'GGGG' : 'rrrr';
          xml += `    <phase duration="${phase.durationSeconds.toFixed(1)}" state="${stateStr}"/>\n`;
          xml += `    <phase duration="${controller.yellowDuration.toFixed(1)}" state="yyyy"/>\n`;
          xml += `    <phase duration="${controller.allRedDuration.toFixed(1)}" state="rrrr"/>\n`;
        }
        xml += `  </tlLogic>\n`;
      }
      xml += `\n`;
    }

    // 3. Jonctions / Carrefours (<junction>)
    for (const node of net.nodes.values()) {
      let typeStr = 'priority';
      if (node.type === 'dead_end') typeStr = 'dead_end';
      else if (node.type === 'roundabout') typeStr = 'roundabout';
      else if (engine.trafficLights && engine.trafficLights.controllers.has(node.id)) typeStr = 'traffic_light';

      const shapePts = node.surfacePolygon.vertices.length >= 3
        ? node.surfacePolygon.vertices.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(' ')
        : `${node.position.x.toFixed(2)},${node.position.y.toFixed(2)}`;

      const incLanes = net.getLanesConnectedToIntersection(node.id).incoming.map((l) => l.id).join(' ');
      const intLanes = node.laneConnectionIds.join(' ');

      xml += `  <junction id="${node.id}" type="${typeStr}" x="${node.position.x.toFixed(2)}" y="${node.position.y.toFixed(2)}" z="${node.elevation.toFixed(2)}" incLanes="${incLanes}" intLanes="${intLanes}" shape="${shapePts}"/>\n`;
    }
    xml += `\n`;

    // 4. Raccordements / Connexions (<connection>)
    for (const conn of net.laneConnections.values()) {
      const fromLane = net.lanes.get(conn.fromLaneId);
      const toLane = net.lanes.get(conn.toLaneId);
      if (!fromLane || !toLane) continue;

      let dirStr = 's'; // straight
      if (conn.movement === 'turn_left') dirStr = 'l';
      else if (conn.movement === 'turn_right') dirStr = 'r';

      const stateStr = 'M'; // Major priority
      xml += `  <connection from="${fromLane.id}" to="${toLane.id}" fromLane="0" toLane="0" dir="${dirStr}" state="${stateStr}"/>\n`;
    }

    xml += `</net>\n`;
    return xml;
  }
}
