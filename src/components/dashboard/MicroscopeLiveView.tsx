import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, StopCircle, Play, Image as ImageIcon, Radio, Wifi, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Notre connexion Supabase !

interface MicroscopeLiveViewProps {
  roomId?: string; // L'ID du cas (ex: KA-2025-021) pour créer un salon unique
  isViewer?: boolean; // true pour le Pathologiste (Abidjan), false pour le Technicien (Bouaké)
  onImageCaptured?: (imageUrl: string) => void;
}

const MicroscopeLiveView: React.FC<MicroscopeLiveViewProps> = ({ 
  roomId = 'demo-room', 
  isViewer = false,
  onImageCaptured 
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Références pour WebRTC et Supabase
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);

  // Configuration des serveurs gratuits de Google pour s'y retrouver sur internet
  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    // Si on est le spectateur (Pathologiste), on se connecte automatiquement au salon
    if (isViewer) {
      joinStream();
    }

    return () => {
      stopCamera();
    };
  }, [isViewer]);

  const initWebRTC = () => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    // Quand on reçoit la vidéo de l'autre (Abidjan reçoit Bouaké)
    pc.ontrack = (event) => {
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
        setIsStreaming(true);
      }
    };

    // Partage des coordonnées internet (ICE Candidates)
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, isViewer }
        });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // --- LOGIQUE DIFFUSEUR (TECHNICIEN - BOUAKÉ) ---
  const startCamera = async () => {
    try {
      setError(null);
      // 1. Allumer la caméra
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }

      // 2. Préparer le WebRTC
      const pc = initWebRTC();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 3. Créer le salon Supabase
      const channel = supabase.channel(`live-${roomId}`);
      channelRef.current = channel;

      channel.on('broadcast', { event: 'viewer-joined' }, async () => {
        // Un spectateur (Pathologiste) est arrivé ! On lui envoie une offre vidéo.
        setIsConnected(true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({ type: 'broadcast', event: 'video-offer', payload: { offer } });
      });

      channel.on('broadcast', { event: 'video-answer' }, async ({ payload }) => {
        // Le spectateur a accepté l'offre
        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      });

      channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.isViewer) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("Diffuseur connecté au salon Supabase");
        }
      });

    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible d'accéder au microscope.");
    }
  };

  // --- LOGIQUE SPECTATEUR (PATHOLOGISTE - ABIDJAN) ---
  const joinStream = () => {
    setError(null);
    const pc = initWebRTC();
    
    const channel = supabase.channel(`live-${roomId}`);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'video-offer' }, async ({ payload }) => {
      // Le diffuseur (Technicien) nous envoie de la vidéo
      setIsConnected(true);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channel.send({ type: 'broadcast', event: 'video-answer', payload: { answer } });
    });

    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      if (!payload.isViewer) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log("Spectateur connecté au salon, en attente du diffuseur...");
        // On prévient le diffuseur qu'on est là
        channel.send({ type: 'broadcast', event: 'viewer-joined', payload: {} });
      }
    });
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsConnected(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && !isViewer) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
        if (onImageCaptured) onImageCaptured(imageUrl);
      }
    }
  };

  return (
    <Card className={`border-primary/20 overflow-hidden ${isConnected ? 'ring-2 ring-success' : ''}`}>
      <CardHeader className="pb-3 bg-muted/30 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isViewer ? <Radio className="h-5 w-5 text-primary" /> : <Camera className="h-5 w-5 text-primary" />}
          {isViewer ? "Réception en Direct (Abidjan)" : "Diffusion Microscope (Bouaké)"}
        </CardTitle>
        {isStreaming && (
          <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-success hover:bg-success" : "animate-pulse"}>
            <Wifi className="h-3 w-3 mr-1" />
            {isViewer ? "En direct" : (isConnected ? "Pathologiste connecté" : "En attente du Pathologiste...")}
          </Badge>
        )}
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
              {isViewer ? <Radio className="h-10 w-10 mb-2 opacity-50" /> : <Camera className="h-10 w-10 mb-2 opacity-50" />}
              <p className="text-sm">{isViewer ? "En attente du flux vidéo..." : "Caméra désactivée"}</p>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted={!isViewer} // Le diffuseur est muet pour lui-même pour éviter l'écho
            className={`w-full h-full object-contain ${!isStreaming ? 'hidden' : ''}`}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Boutons de contrôle uniquement pour le Technicien (Diffuseur) */}
        {!isViewer && (
          <div className="flex flex-wrap justify-center gap-3">
            {!isStreaming ? (
              <Button onClick={startCamera} className="gap-2 bg-primary">
                <Play className="h-4 w-4" />
                Diffuser le Microscope en Direct
              </Button>
            ) : (
              <>
                <Button onClick={captureImage} className="gap-2 bg-success hover:bg-success/90 text-white">
                  <ImageIcon className="h-4 w-4" />
                  Capturer l'image
                </Button>
                <Button onClick={stopCamera} variant="destructive" className="gap-2">
                  <StopCircle className="h-4 w-4" />
                  Arrêter la diffusion
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MicroscopeLiveView;