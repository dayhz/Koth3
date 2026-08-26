import * as THREE from 'three';
import { TrafficSignType } from '../engine/signs/TrafficSignTypes';

export class TrafficSignTextures {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  static getTexture(type: TrafficSignType): THREE.CanvasTexture {
    if (this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Anti-aliasing
    ctx.imageSmoothingEnabled = true;

    if (type === 'stop') {
      this.drawStopSign(ctx);
    } else if (type === 'yield') {
      this.drawYieldSign(ctx);
    } else if (type === 'roundabout') {
      this.drawRoundaboutSign(ctx);
    } else if (type === 'speed_30') {
      this.drawSpeedLimitSign(ctx, '30');
    } else if (type === 'speed_50') {
      this.drawSpeedLimitSign(ctx, '50');
    } else if (type === 'speed_70') {
      this.drawSpeedLimitSign(ctx, '70');
    } else if (type === 'speed_90') {
      this.drawSpeedLimitSign(ctx, '90');
    } else if (type === 'pedestrian_crossing') {
      this.drawPedestrianSign(ctx);
    } else if (type === 'no_entry') {
      this.drawNoEntrySign(ctx);
    } else {
      this.drawSpeedLimitSign(ctx, '50');
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(type, texture);
    return texture;
  }

  private static drawStopSign(ctx: CanvasRenderingContext2D): void {
    const cx = 128;
    const cy = 128;
    const r = 115;

    // Octogone Rouge
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + Math.PI / 8;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#dc2626'; // Rouge normalisé
    ctx.fill();

    // Bordure blanche intérieure
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Texte STOP
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STOP', cx, cy + 4);
  }

  private static drawYieldSign(ctx: CanvasRenderingContext2D): void {
    const cx = 128;

    // Triangle Inversé
    ctx.beginPath();
    ctx.moveTo(20, 30);
    ctx.lineTo(236, 30);
    ctx.lineTo(cx, 230);
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.lineWidth = 26;
    ctx.strokeStyle = '#dc2626';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  private static drawRoundaboutSign(ctx: CanvasRenderingContext2D): void {
    const cx = 128;
    const cy = 128;

    // Disque Bleu
    ctx.beginPath();
    ctx.arc(cx, cy, 115, 0, Math.PI * 2);
    ctx.fillStyle = '#1d4ed8'; // Bleu européen
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // 3 Flèches tournantes
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 65, 0.2, Math.PI * 1.8);
    ctx.stroke();

    // Pointe de flèche
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx + 65, cy - 25);
    ctx.lineTo(cx + 90, cy + 15);
    ctx.lineTo(cx + 40, cy + 15);
    ctx.closePath();
    ctx.fill();
  }

  private static drawSpeedLimitSign(ctx: CanvasRenderingContext2D, speed: string): void {
    const cx = 128;
    const cy = 128;

    // Disque Blanc
    ctx.beginPath();
    ctx.arc(cx, cy, 115, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Bordure Rouge
    ctx.lineWidth = 24;
    ctx.strokeStyle = '#dc2626';
    ctx.stroke();

    // Vitesse en noir
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 84px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(speed, cx, cy + 4);
  }

  private static drawPedestrianSign(ctx: CanvasRenderingContext2D): void {
    const cx = 128;

    // Carré Bleu
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(15, 15, 226, 226);

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(15, 15, 226, 226);

    // Triangle Blanc Intérieur
    ctx.beginPath();
    ctx.moveTo(cx, 35);
    ctx.lineTo(215, 215);
    ctx.lineTo(40, 215);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Silhouette Piéton Noir
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(cx, 90, 14, 0, Math.PI * 2); // Tête
    ctx.fill();

    ctx.fillRect(cx - 6, 110, 12, 45); // Corps
    ctx.fillRect(cx - 16, 150, 10, 40); // Jambe G
    ctx.fillRect(cx + 6, 150, 10, 40); // Jambe D
  }

  private static drawNoEntrySign(ctx: CanvasRenderingContext2D): void {
    const cx = 128;
    const cy = 128;

    // Disque Rouge
    ctx.beginPath();
    ctx.arc(cx, cy, 115, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Barre Blanche Horizontale
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(35, 110, 186, 36);
  }
}
