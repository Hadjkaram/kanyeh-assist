import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Brain, AlertTriangle, CheckCircle, Loader2, ZoomIn, Target } from 'lucide-react';
import { toast } from 'sonner';

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

interface AIAnalysisPanelProps {
  imageUrl?: string;
  onAnalysisComplete?: (regions: DetectedRegion[]) => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ imageUrl, onAnalysisComplete }) => {
  const { t } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [detectedRegions, setDetectedRegions] = useState<DetectedRegion[]>([]);

  // La VRAIE fonction d'analyse connectée au serveur Python
  const runAnalysis = async () => {
    // 1. VÉRIFICATION STRICTE : Y a-t-il une image ?
    if (!imageUrl) {
      toast.error("Aucune image détectée. Veuillez d'abord sélectionner une image de la lame.");
      return; // On arrête tout ici, on n'appelle même pas le Python !
    }

    setIsAnalyzing(true);
    setProgress(10);
    setAnalysisComplete(false);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      setProgress(40);
      
      const formData = new FormData();
      formData.append("file", blob, "capture-lame.jpg");

      const aiResponse = await fetch("http://localhost:8000/analyze-slide", {
        method: "POST",
        body: formData,
      });

      if (!aiResponse.ok) {
        // Si le Python renvoie une erreur (ex: image illisible)
        const errorData = await aiResponse.json();
        throw new Error(errorData.detail || "Erreur d'analyse IA");
      }

      setProgress(80);
      const data = await aiResponse.json();
      
      if (data.status === "success") {
        const mappedRegions = data.diagnostics.detected_regions.map((region: any, index: number) => ({
          id: `region-${index}`,
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          confidence: data.diagnostics.confidence_score,
          classification: region.classification,
          description: region.description
        }));
        
        setDetectedRegions(mappedRegions);
        if (onAnalysisComplete) onAnalysisComplete(mappedRegions);
      }

      setProgress(100);
      setAnalysisComplete(true);
      toast.success("L'analyse IA est terminée avec succès !");

    } catch (error: any) {
      console.error("Erreur d'analyse:", error);
      toast.error(error.message || "Impossible de terminer l'analyse.");
      setProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          {t('ai.analysisTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* État initial ou en cours */}
        {!analysisComplete && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
              {isAnalyzing ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Brain className="h-8 w-8 text-primary" />
              )}
            </div>
            
            {isAnalyzing ? (
              <div className="space-y-2">
                <p className="text-sm font-medium animate-pulse text-primary">
                  L'IA Python analyse la lame...
                </p>
                <Progress value={progress} className="h-2" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('ai.analysisDescription')}
                </p>
                <Button onClick={runAnalysis} className="w-full gap-2">
                  <Brain className="h-4 w-4" />
                  Lancer la VRAIE analyse IA
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Résultats de l'analyse */}
        {analysisComplete && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{t('ai.analysisComplete')}</span>
              </div>
              <Badge variant="outline" className="bg-background">
                {detectedRegions.length} {t('ai.regionsDetected')}
              </Badge>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {t('ai.detailedFindings')}
              </h4>
              
              {detectedRegions.map((region) => (
                <div key={region.id} className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          region.classification === 'malignant' ? 'destructive' :
                          region.classification === 'suspicious' ? 'default' : 'secondary'
                        }>
                          {t(`diagnosis.${region.classification}`)}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground">
                          {region.confidence}% {t('ai.confidence')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {region.description}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {detectedRegions.some(r => r.classification === 'suspicious' || r.classification === 'malignant') && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    {t('ai.reviewRequired')}
                  </p>
                  <p className="text-xs text-amber-600">
                    {t('ai.reviewDescription')}
                  </p>
                </div>
              </div>
            )}

            <Button onClick={runAnalysis} variant="outline" className="w-full gap-2">
              <Brain className="h-4 w-4" />
              {t('ai.reanalyze')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisPanel;