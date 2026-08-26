import { RoadWorldEngine } from '../RoadWorldEngine';

export class OpenDriveExporter {
  /**
   * Exporte le réseau routier au format XML ASAM OpenDRIVE (rev 1.4)
   */
  static export(engine: RoadWorldEngine): string {
    const net = engine.network;
    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<OpenDRIVE>\n`;
    xml += `  <header revMajor="1" revMinor="4" name="RoadWorldNetwork" version="1.00" date="${now}" north="0.0" south="0.0" east="0.0" west="0.0">\n`;
    xml += `    <geoReference><![CDATA[+proj=utm +zone=32 +ellps=WGS84 +datum=WGS84 +units=m +no_defs]]></geoReference>\n`;
    xml += `  </header>\n`;

    // 1. Tronçons routiers (<road>)
    let roadIndex = 1;
    for (const road of net.roads.values()) {
      const startNode = net.nodes.get(road.startNodeId);
      const endNode = net.nodes.get(road.endNodeId);
      const isJunction = false;
      const junctionId = isJunction ? '1' : '-1';
      const len = road.length.toFixed(3);

      xml += `  <road name="${road.name || road.id}" length="${len}" id="${roadIndex++}" junction="${junctionId}">\n`;

      // Raccordements topologiques
      xml += `    <link>\n`;
      if (startNode && startNode.type === 'dead_end') {
        // pas de prédécesseur direct
      } else if (startNode) {
        xml += `      <predecessor elementType="junction" elementId="${startNode.id}" contactPoint="end"/>\n`;
      }
      if (endNode && endNode.type === 'dead_end') {
        // pas de successeur direct
      } else if (endNode) {
        xml += `      <successor elementType="junction" elementId="${endNode.id}" contactPoint="start"/>\n`;
      }
      xml += `    </link>\n`;

      // PlanView & Géométrie analytique
      xml += `    <planView>\n`;
      const pStart = road.centerline.getPoint(0);
      const tStart = road.centerline.getTangent(0);
      const hdg = Math.atan2(tStart.y, tStart.x).toFixed(6);

      if (road.centerline.type === 'linear') {
        xml += `      <geometry s="0.000" x="${pStart.x.toFixed(3)}" y="${pStart.y.toFixed(3)}" hdg="${hdg}" length="${len}">\n`;
        xml += `        <line/>\n`;
        xml += `      </geometry>\n`;
      } else if (road.centerline.type === 'arc') {
        const arc = road.centerline as any;
        const curvature = (1 / arc.radius * (arc.clockwise ? -1 : 1)).toFixed(6);
        xml += `      <geometry s="0.000" x="${pStart.x.toFixed(3)}" y="${pStart.y.toFixed(3)}" hdg="${hdg}" length="${len}">\n`;
        xml += `        <arc curvature="${curvature}"/>\n`;
        xml += `      </geometry>\n`;
      } else {
        // Bézier cubique discrétisé en géométrie paramPoly3
        xml += `      <geometry s="0.000" x="${pStart.x.toFixed(3)}" y="${pStart.y.toFixed(3)}" hdg="${hdg}" length="${len}">\n`;
        xml += `        <paramPoly3 aU="0.0" bU="1.0" cU="0.0" dU="0.0" aV="0.0" bV="0.0" cV="0.0" dV="0.0" pRange="arcLength"/>\n`;
        xml += `      </geometry>\n`;
      }
      xml += `    </planView>\n`;

      // Profil Altimétrique (ElevationProfile)
      xml += `    <elevationProfile>\n`;
      const z0 = road.centerline.startElevation.toFixed(3);
      const slope = ((road.centerline.endElevation - road.centerline.startElevation) / Math.max(1, road.length)).toFixed(6);
      xml += `      <elevation s="0.000" a="${z0}" b="${slope}" c="0.000" d="0.000"/>\n`;
      xml += `    </elevationProfile>\n`;

      // Profil Transversal (LateralProfile - Dévers)
      xml += `    <lateralProfile>\n`;
      xml += `      <superelevation s="0.000" a="-0.025" b="0.000" c="0.000" d="0.000"/>\n`;
      xml += `    </lateralProfile>\n`;

      // Voies (Lanes & LaneSections)
      xml += `    <lanes>\n`;
      xml += `      <laneSection s="0.000">\n`;

      const roadLanes = net.getLanesForRoad(road.id);
      const leftLanes = roadLanes.filter((l) => l.direction === 'backward');
      const rightLanes = roadLanes.filter((l) => l.direction === 'forward');

      // Voies de gauche (backward - sens inverse)
      if (leftLanes.length > 0) {
        xml += `        <left>\n`;
        let laneIdCounter = leftLanes.length;
        for (const lane of leftLanes) {
          xml += `          <lane id="${laneIdCounter--}" type="driving" level="false">\n`;
          xml += `            <link/>\n`;
          xml += `            <width sOffset="0.000" a="${lane.width.toFixed(2)}" b="0.0" c="0.0" d="0.0"/>\n`;
          xml += `            <speed sOffset="0.000" max="${(lane.speedLimitKmH / 3.6).toFixed(2)}" unit="m/s"/>\n`;
          xml += `          </lane>\n`;
        }
        xml += `        </left>\n`;
      }

      // Voie centrale (marquage d'axe)
      xml += `        <center>\n`;
      xml += `          <lane id="0" type="none" level="false">\n`;
      xml += `            <link/>\n`;
      xml += `            <roadMark sOffset="0.000" type="broken" weight="standard" color="white" width="0.15"/>\n`;
      xml += `          </lane>\n`;
      xml += `        </center>\n`;

      // Voies de droite (forward - sens direct)
      if (rightLanes.length > 0) {
        xml += `        <right>\n`;
        let laneIdCounter = -1;
        for (const lane of rightLanes) {
          xml += `          <lane id="${laneIdCounter--}" type="driving" level="false">\n`;
          xml += `            <link/>\n`;
          xml += `            <width sOffset="0.000" a="${lane.width.toFixed(2)}" b="0.0" c="0.0" d="0.0"/>\n`;
          xml += `            <speed sOffset="0.000" max="${(lane.speedLimitKmH / 3.6).toFixed(2)}" unit="m/s"/>\n`;
          xml += `          </lane>\n`;
        }
        xml += `        </right>\n`;
      }

      xml += `      </laneSection>\n`;
      xml += `    </lanes>\n`;

      // Signaux & Feux tricolores (<signals>)
      xml += `    <signals>\n`;
      if (engine.trafficLights) {
        for (const [sId, pole] of engine.trafficLights.poles.entries()) {
          if (pole.roadId === road.id) {
            const zLight = (pole.elevation || 0).toFixed(3);
            xml += `      <signal s="${(road.length * 0.95).toFixed(2)}" t="0.00" id="${sId}" name="TrafficLight" dynamic="yes" orientation="+" zOffset="${zLight}" type="1000001" subtype="-1"/>\n`;
          }
        }
      }
      xml += `    </signals>\n`;

      xml += `  </road>\n`;
    }

    // 2. Carrefours (<junction>)
    for (const node of net.nodes.values()) {
      if (node.type === 'dead_end') continue;

      xml += `  <junction id="${node.id}" name="${node.name}">\n`;
      let connIndex = 1;
      for (const connId of node.laneConnectionIds) {
        const conn = net.laneConnections.get(connId);
        if (!conn) continue;
        const fromLane = net.lanes.get(conn.fromLaneId);
        const toLane = net.lanes.get(conn.toLaneId);
        if (!fromLane || !toLane) continue;

        xml += `    <connection id="${connIndex++}" incomingRoad="${fromLane.parentRoadId}" connectingRoad="${conn.id}" contactPoint="start">\n`;
        xml += `      <laneLink from="${fromLane.indexFromCenter}" to="${toLane.indexFromCenter}"/>\n`;
        xml += `    </connection>\n`;
      }
      xml += `  </junction>\n`;
    }

    xml += `</OpenDRIVE>\n`;
    return xml;
  }
}
