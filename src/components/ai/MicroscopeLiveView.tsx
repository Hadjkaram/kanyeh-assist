import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, StopCircle, Play, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MicroscopeLiveViewProps {
  onImageCaptured?: (imageUrl: string) => void;
}

const MicroscopeLiveView: React.FC<MicroscopeLiveViewProps> = ({ onImageCaptured }) => {
  const { t } = useLanguage();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
      setError("Impossible d'accéder au microscope ou à la caméra. Veuillez vérifier les permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        if (onImageCaptured) {
          onImageCaptured(imageUrl);
        }
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-primary" />
          Vue Directe Microscope
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
            {error}
          </div>
        )}

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-muted">
          {!isStreaming && !error && (
            <div className="text-muted-foreground flex flex-col items-center">
              <Camera className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Caméra désactivée</p>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-contain ${!isStreaming ? 'hidden' : ''}`}
          />
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {!isStreaming ? (
            <Button onClick={startCamera} className="gap-2 bg-primary">
              <Play className="h-4 w-4" />
              Connecter le Microscope
            </Button>
          ) : (
            <>
              <Button onClick={captureImage} className="gap-2 bg-success hover:bg-success/90 text-white">
                <ImageIcon className="h-4 w-4" />
                Capturer l'image
              </Button>
              <Button onClick={stopCamera} variant="destructive" className="gap-2">
                <StopCircle className="h-4 w-4" />
                Arrêter
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MicroscopeLiveView;