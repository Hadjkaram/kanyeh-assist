import React, { useRef, useEffect } from 'react';

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx || !img || detectedRegions.length === 0) return;

    const drawBoxes = () => {
      // Calibrage exact du calque sur les dimensions réelles de la photo
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      detectedRegions.forEach(region => {
        const { x, y, width, height, classification } = region;
        
        const color =
          classification === 'malignant' ? '#ef4444' : // Rouge
          classification === 'suspicious' ? '#f59e0b' : // Orange
          '#10b981'; // Vert (Bénin)

        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(4, canvas.width * 0.005); // Épaisseur dynamique
        ctx.strokeRect(x, y, width, height);

        // Remplissage léger pour mieux voir les zones
        ctx.fillStyle = color + '33'; 
        ctx.fillRect(x, y, width, height);
      });
    };

    // On s'assure que l'image est bien chargée avant de dessiner
    if (img.complete && img.naturalWidth !== 0) {
      drawBoxes();
    } else {
      img.onload = drawBoxes;
    }
  }, [imageUrl, detectedRegions]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto p-4 transition-transform duration-200" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}>
        <div className='relative inline-block leading-none'>
            <img
              ref={imgRef}
              src={imageUrl}
              alt={`Prélèvement ${patientName}`}
              className="max-h-[600px] w-auto object-contain rounded-lg shadow-sm"
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