export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const SLOPE_ANGLE = 15;
export const MOVEMENT_SPEED = 1.5;
export const TREE_GENERATION_INTERVAL = 120;
export const GRAVITY = 0.2;
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 32;

export const COLORS = {
  sky: '#ffffff',
  snow: '#ffffff',
  cliff: '#0066cc',
  treeGreen: '#33cc99',
  treeShadow: '#269973',
  skiTrail: '#e6f2ff'
};

export function createTreePath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size/2, y);
  ctx.lineTo(x + size/2, y);
  ctx.closePath();
}
