import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, StopCircle, Play, Image as ImageIcon, Globe, Copy, Check, Share2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Peer from 'peerjs';

interface MicroscopeLiveViewProps {
  onImageCaptured?: (imageUrl: string) => void;
}

const MicroscopeLiveView: React.FC<MicroscopeLiveViewProps> = ({ onImageCaptured }) => {
  const { t } = useLanguage();
  
  // États de l'interface
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Références techniques
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);

  // Initialisation du moteur de partage (PeerJS) au chargement
  useEffect(() => {
    const peer = new Peer(); // Crée un identifiant unique sur le réseau
    peerRef.current = peer;

    peer.on('open', (id) => setPeerId(id));

    // ÉCOUTE : Si quelqu'un d'autre essaie de voir mon microscope
    peer.on('call', (call) => {
      if (streamRef.current) {
        call.answer(streamRef.current); // Envoie mon flux au médecin distant
      }
    });

    return () => {
      stopCamera();
      peer.destroy();
    };
  }, []);

  // FONCTION 1 : ACTIVER LE MICROSCOPE (LOCAL)
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          facingMode: "environment" // Priorité aux caméras externes/microscopes
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        toast.success("Microscope connecté et prêt pour le partage");
      }
    } catch (err) {
      console.error("Erreur microscope:", err);
      setError("Impossible d'accéder au microscope. Vérifiez le branchement USB.");
    }
  };

  // FONCTION 2 : SE CONNECTER À UN MICROSCOPE DISTANT (RESTE DU MONDE)
  const connectToRemote = () => {
    if (!remoteId) return toast.error("Veuillez entrer l'ID du microscope distant");
    
    setIsStreaming(true);
    const call = peerRef.current?.call(remoteId, new MediaStream()); // Appel sans envoyer ma vidéo
    
    call?.on('stream', (remoteStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
      }
    });
    toast.info("Connexion au flux distant établie");
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
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
        if (onImageCaptured) onImageCaptured(imageUrl);
        toast.success("Capture réussie");
      }
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(peerId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.info("ID copié ! Transmettez-le pour le partage.");
  };

  return (
    <Card className="border-primary/20 overflow-hidden shadow-md">
      <CardHeader className="pb-3 bg-muted/30 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-primary" />
            Vue Directe & Télépathologie
          </CardTitle>
          {isStreaming && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">{error}</div>}

        {/* ÉCRAN VIDÉO */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border-2 border-primary/10">
          {!isStreaming && (
            <div className="text-muted-foreground flex flex-col items-center">
              <Camera className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">En attente de connexion...</p>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain ${!isStreaming ? 'hidden' : ''}`} />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* PANNEAU DE CONTRÔLE HYBRIDE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SECTION ÉMETTEUR (Celui qui a le microscope) */}
          <div className="p-3 rounded-lg border bg-slate-50/50 space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Share2 className="h-3 w-3" /> Mon ID de Partage
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white border rounded px-2 py-1 text-xs font-mono truncate flex items-center">
                {peerId || "Génération..."}
              </div>
              <Button size="sm" variant="outline" onClick={copyId} className="h-8 w-8 p-0">
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={startCamera} className="w-full h-9 text-xs" variant={isStreaming ? "outline" : "default"}>
              <Play className="h-4 w-4 mr-2" /> Activer mon microscope
            </Button>
          </div>

          {/* SECTION RÉCEPTEUR (Celui qui regarde à distance) */}
          <div className="p-3 rounded-lg border bg-slate-50/50 space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" /> Connexion Distante
            </label>
            <Input 
              placeholder="Entrer ID distant..." 
              value={remoteId} 
              onChange={(e) => setRemoteId(e.target.value)}
              className="h-8 text-xs"
            />
            <Button onClick={connectToRemote} variant="outline" className="w-full h-9 text-xs border-primary text-primary hover:bg-primary/5">
              Rejoindre un flux
            </Button>
          </div>
        </div>

        {/* ACTIONS DE CAPTURE */}
        {isStreaming && (
          <div className="flex gap-3 border-t pt-4">
            <Button onClick={captureImage} className="flex-1 gap-2 bg-success hover:bg-success/90 text-white">
              <ImageIcon className="h-4 w-4" /> Capturer pour Analyse IA
            </Button>
            <Button onClick={stopCamera} variant="destructive" size="icon">
              <StopCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MicroscopeLiveView;