import React, { useRef, useEffect, useState } from 'react';

// Re-définition du type de région
interface DetectedRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  classification: 'suspicious' | 'benign' | 'malignant';
  description: string;
}

interface AnnotationOverlayProps {
  imageUrl: string;
  detectedRegions: DetectedRegion[];
  zoomLevel: number;
  patientName?: string;
}

const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({ imageUrl, detectedRegions, zoomLevel, patientName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const container = containerRef.current;
    const img = imgRef.current;

    if (!canvas || !ctx || !container || !img || !imageUrl || imageSize.width === 0) return;

    // Set canvas dimensions to match the base image size
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;

    // Draw outlines for each detected region
    ctx.lineWidth = 5; // Utilisation d'un trait plus épais car dessiné sur les dimensions d'origine
    detectedRegions.forEach(region => {
      const { x, y, width, height, classification } = region;
      const color =
        classification === 'malignant' ? 'red' :
        classification === 'suspicious' ? 'orange' : 'green';

      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, width, height);
    });

  }, [imageUrl, detectedRegions, imageSize]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-auto p-4 transition-transform duration-200" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}>
        <div className='relative flex items-center justify-center'>
            <img
            ref={imgRef}
            src={imageUrl}
            alt={`Prélèvement ${patientName}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm block"
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ objectFit: 'contain' }} />
        </div>
    </div>
  );
};

export default AnnotationOverlay;