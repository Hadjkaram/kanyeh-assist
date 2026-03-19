import React, { useRef, useEffect, useState } from 'react';

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
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // On récupère la taille RÉELLE de l'image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // On dessine les cadres
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx || imageSize.width === 0) return;

    // Le canvas prend la dimension exacte de l'image d'origine
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;

    // On efface le canvas avant de redessiner
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessin des rectangles
    ctx.lineWidth = Math.max(5, imageSize.width * 0.005); // Épaisseur adaptative
    detectedRegions.forEach(region => {
      const { x, y, width, height, classification } = region;
      
      const color =
        classification === 'malignant' ? '#ef4444' : // Rouge
        classification === 'suspicious' ? '#f59e0b' : // Orange
        '#10b981'; // Vert

      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, width, height);

      // Petit effet : on colorie l'intérieur très légèrement
      ctx.fillStyle = color + '20'; // 20 = opacité
      ctx.fillRect(x, y, width, height);
    });

  }, [imageUrl, detectedRegions, imageSize]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto p-4 transition-transform duration-200" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}>
        {/* Le secret est ici : relative et inline-block pour que le canvas colle parfaitement à l'image */}
        <div className='relative inline-block'>
            <img
              ref={imgRef}
              src={imageUrl}
              alt={`Prélèvement ${patientName}`}
              className="max-h-[600px] w-auto object-contain rounded-lg shadow-sm block"
            />
            <canvas 
              ref={canvasRef} 
              className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg" 
            />
        </div>
    </div>
  );
};

export default AnnotationOverlay;