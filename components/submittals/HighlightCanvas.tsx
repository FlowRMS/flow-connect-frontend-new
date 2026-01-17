'use client';

import React, { useEffect } from 'react';
import type { HighlightRegion, HighlightShape } from '../../lib/types/submittals';
import { useHighlightCanvas } from './hooks/useHighlightCanvas';
import { drawRegion, drawPreview } from './highlight/drawingUtils';

interface HighlightCanvasProps {
  width: number;
  height: number;
  regions: HighlightRegion[];
  onRegionsChange: (regions: HighlightRegion[]) => void;
  activeTool: HighlightShape | 'select';
  activeColor: string;
  strokeWidth: number;
  pageNumber: number;
  zoom: number;
  selectedRegionId?: string;
  onRegionSelect?: (id: string | null) => void;
}

export default function HighlightCanvas({
  width,
  height,
  regions,
  onRegionsChange,
  activeTool,
  activeColor,
  strokeWidth,
  pageNumber,
  zoom,
  selectedRegionId,
  onRegionSelect,
}: HighlightCanvasProps) {
  const canvas = useHighlightCanvas({
    width,
    height,
    regions,
    onRegionsChange,
    activeTool,
    activeColor,
    strokeWidth,
    pageNumber,
    selectedRegionId,
    onRegionSelect,
  });

  // Draw regions on canvas
  useEffect(() => {
    const canvasEl = canvas.canvasRef.current;
    if (!canvasEl) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw existing regions
    canvas.pageRegions.forEach(region => {
      drawRegion({
        ctx,
        region,
        width,
        height,
        isSelected: region.id === selectedRegionId,
      });
    });

    // Draw current drawing preview
    if (canvas.isDrawing && canvas.startPoint && canvas.currentPoint && activeTool !== 'select') {
      drawPreview({
        ctx,
        startPoint: canvas.startPoint,
        currentPoint: canvas.currentPoint,
        activeTool,
        activeColor,
        strokeWidth,
      });
    }
  }, [canvas.pageRegions, selectedRegionId, canvas.isDrawing, canvas.startPoint, canvas.currentPoint, activeTool, activeColor, strokeWidth, width, height]);

  // Handle delete key for selected region
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRegionId) {
        onRegionsChange(regions.filter(r => r.id !== selectedRegionId));
        onRegionSelect?.(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRegionId, regions, onRegionsChange, onRegionSelect]);

  return (
    <canvas
      ref={canvas.canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 cursor-crosshair"
      style={{
        cursor: activeTool === 'select' ? 'default' : 'crosshair',
      }}
      onMouseDown={canvas.handleMouseDown}
      onMouseMove={canvas.handleMouseMove}
      onMouseUp={canvas.handleMouseUp}
      onMouseLeave={canvas.handleMouseUp}
    />
  );
}

// Region display component for read-only view
export function HighlightRegionDisplay({
  region,
  containerWidth,
  containerHeight,
}: {
  region: HighlightRegion;
  containerWidth: number;
  containerHeight: number;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
    pointerEvents: 'none',
  };

  switch (region.shape) {
    case 'highlight':
      return <div style={{ ...style, backgroundColor: region.color, opacity: 0.5 }} />;
    case 'rectangle':
      return <div style={{ ...style, border: `${region.strokeWidth || 2}px solid ${region.color}` }} />;
    case 'oval':
      return <div style={{ ...style, border: `${region.strokeWidth || 2}px solid ${region.color}`, borderRadius: '50%' }} />;
    default:
      return null;
  }
}
