import { CANVAS_HEIGHT, CANVAS_WIDTH, GRAVITY, SKI_SPEED, MAX_SKI_ANGLE, degreesToRadians } from '../utils/gameUtils';

export class Skier {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  isSkiingUp: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 60;
    this.angle = 0;
    this.isSkiingUp = false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(degreesToRadians(this.angle));
    ctx.fillStyle = 'blue';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  update(terrainHeight: number) {
    if (this.isSkiingUp) {
      this.angle = Math.min(this.angle + 1, MAX_SKI_ANGLE);
    } else {
      this.angle = Math.max(this.angle - 1, -MAX_SKI_ANGLE);
    }

    const angleRadians = degreesToRadians(this.angle);
    this.x += Math.cos(angleRadians) * SKI_SPEED;
    this.y += Math.sin(angleRadians) * SKI_SPEED;

    // Keep the skier above the terrain
    if (this.y > terrainHeight - this.height / 2) {
      this.y = terrainHeight - this.height / 2;
    }

    // Wrap around the screen
    if (this.x > CANVAS_WIDTH) {
      this.x = 0;
    }
  }
}

export class Terrain {
  points: { x: number; y: number }[];

  constructor(numPoints: number) {
    this.points = [];
    for (let i = 0; i <= numPoints; i++) {
      this.points.push({
        x: (i / numPoints) * CANVAS_WIDTH,
        y: CANVAS_HEIGHT - 50 + Math.sin(i * 0.5) * 20 + Math.random() * 15,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.fillStyle = 'white';
    ctx.fill();
  }

  getTerrainHeightAtX(x: number): number {
    const index = Math.floor((x / CANVAS_WIDTH) * (this.points.length - 1));
    const nextIndex = Math.min(index + 1, this.points.length - 1);
    const t = (x - this.points[index].x) / (this.points[nextIndex].x - this.points[index].x);
    return this.points[index].y * (1 - t) + this.points[nextIndex].y * t;
  }
}

export class Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 40;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x - this.width / 2, this.y - this.height, this.width, this.height);
  }
}
