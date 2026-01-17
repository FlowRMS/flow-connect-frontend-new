import type { HighlightRegion, HighlightShape } from '../../../lib/types/submittals';

interface DrawRegionParams {
  ctx: CanvasRenderingContext2D;
  region: HighlightRegion;
  width: number;
  height: number;
  isSelected: boolean;
}

export function drawRegion({ ctx, region, width, height, isSelected }: DrawRegionParams) {
  const x = (region.x / 100) * width;
  const y = (region.y / 100) * height;
  const w = (region.width / 100) * width;
  const h = (region.height / 100) * height;

  switch (region.shape) {
    case 'highlight':
      ctx.fillStyle = region.color + '80';
      ctx.fillRect(x, y, w, h);
      break;

    case 'rectangle':
      ctx.fillStyle = region.color + '80';
      ctx.strokeStyle = region.color;
      ctx.lineWidth = region.strokeWidth || 2;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      break;

    case 'oval':
      ctx.fillStyle = region.color + '80';
      ctx.strokeStyle = region.color;
      ctx.lineWidth = region.strokeWidth || 2;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;

    case 'arrow':
      ctx.strokeStyle = region.color;
      ctx.fillStyle = region.color;
      ctx.lineWidth = region.strokeWidth || 2;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y);
      ctx.stroke();
      // Draw arrowhead
      const angle = Math.atan2(-h, w);
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w - headLen * Math.cos(angle - Math.PI / 6), y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x + w - headLen * Math.cos(angle + Math.PI / 6), y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      break;

    case 'underline':
      ctx.strokeStyle = region.color;
      ctx.lineWidth = region.strokeWidth || 2;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.stroke();
      break;

    case 'text':
      ctx.strokeStyle = region.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      if (region.annotation) {
        ctx.fillStyle = region.color;
        ctx.font = '14px sans-serif';
        ctx.fillText(region.annotation, x + 4, y + 16);
      }
      break;
  }

  if (isSelected) {
    drawSelectionHandles(ctx, x, y, w, h);
  }
}

function drawSelectionHandles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = '#2196F3';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.setLineDash([]);

  const handleSize = 8;
  ctx.fillStyle = '#2196F3';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;

  const drawHandle = (hx: number, hy: number) => {
    ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
  };

  // Corner handles
  drawHandle(x, y);
  drawHandle(x + w, y);
  drawHandle(x, y + h);
  drawHandle(x + w, y + h);
  // Edge handles
  drawHandle(x + w / 2, y);
  drawHandle(x + w / 2, y + h);
  drawHandle(x, y + h / 2);
  drawHandle(x + w, y + h / 2);
}

interface DrawPreviewParams {
  ctx: CanvasRenderingContext2D;
  startPoint: { x: number; y: number };
  currentPoint: { x: number; y: number };
  activeTool: HighlightShape;
  activeColor: string;
  strokeWidth: number;
}

export function drawPreview({ ctx, startPoint, currentPoint, activeTool, activeColor, strokeWidth }: DrawPreviewParams) {
  const x = Math.min(startPoint.x, currentPoint.x);
  const y = Math.min(startPoint.y, currentPoint.y);
  const w = Math.abs(currentPoint.x - startPoint.x);
  const h = Math.abs(currentPoint.y - startPoint.y);

  ctx.save();
  ctx.globalAlpha = 0.5;

  switch (activeTool) {
    case 'highlight':
      ctx.fillStyle = activeColor;
      ctx.fillRect(x, y, w, h);
      break;

    case 'rectangle':
      ctx.fillStyle = activeColor + '80';
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      break;

    case 'oval':
      ctx.fillStyle = activeColor + '80';
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;

    case 'arrow':
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      break;

    case 'underline':
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.stroke();
      break;

    case 'text':
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      break;
  }

  ctx.restore();
}
