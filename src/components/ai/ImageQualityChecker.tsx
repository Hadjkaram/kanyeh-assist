import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface QualityMetric {
  name: string;
  score: number;
  status: 'good' | 'warning' | 'error';
  message: string;
}

interface ImageQualityCheckerProps {
  imageUrl?: string;
  onQualityCheck?: (passed: boolean, metrics: QualityMetric[]) => void;
}

const ImageQualityChecker: React.FC<ImageQualityCheckerProps> = ({ imageUrl, onQualityCheck }) => {
  const { t } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  // LA VRAIE FONCTION CONNECTÉE AU SERVEUR PYTHON
  const runQualityCheck = async () => {
    if (!imageUrl) {
      toast.error("Aucune image détectée pour le contrôle qualité.");
      return;
    }

    setIsChecking(true);
    setCheckComplete(false);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, "quality-check.jpg");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

      // Appel à la route de vérification de qualité du serveur Python
      const aiResponse = await fetch(`${apiUrl}/check-quality`, {
        method: "POST",
        body: formData,
      });

      if (!aiResponse.ok) {
        throw new Error("Erreur de connexion au serveur de vérification de qualité.");
      }

      const data = await aiResponse.json();
      
      // On s'attend à ce que le backend Python renvoie un tableau de métriques et un score global
      const fetchedMetrics: QualityMetric[] = data.metrics || [];
      const avgScore = data.overall_score || Math.round(fetchedMetrics.reduce((acc, m) => acc + m.score, 0) / (fetchedMetrics.length || 1));
      
      setMetrics(fetchedMetrics);
      setOverallScore(avgScore);
      setCheckComplete(true);
      
      const passed = avgScore >= 80 && !fetchedMetrics.some(m => m.status === 'error');
      onQualityCheck?.(passed, fetchedMetrics);
      
      toast.success("Contrôle de qualité terminé.");

    } catch (error: any) {
      console.error("Erreur de contrôle de qualité:", error);
      toast.error(error.message || "Le contrôle de qualité a échoué.");
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-destructive';
  };

  const getOverallStatus = () => {
    if (overallScore >= 85) return { label: t('quality.excellent'), color: 'bg-emerald-500' };
    if (overallScore >= 70) return { label: t('quality.acceptable'), color: 'bg-amber-500' };
    return { label: t('quality.insufficient'), color: 'bg-destructive' };
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-primary" />
          {t('quality.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!checkComplete && !isChecking && (
          <div className="text-center py-6">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {t('quality.description')}
            </p>
            <Button onClick={runQualityCheck} className="gap-2">
              <Camera className="h-4 w-4" />
              {t('quality.checkButton')}
            </Button>
          </div>
        )}

        {isChecking && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground text-primary animate-pulse">
              Transfert vers le serveur qualité...
            </p>
          </div>
        )}

        {checkComplete && (
          <div className="space-y-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              <Badge className={`mt-2 ${getOverallStatus().color}`}>
                {getOverallStatus().label}
              </Badge>
            </div>

            <div className="space-y-3">
              {metrics.map((metric, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(metric.status)}
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <span className={getScoreColor(metric.score)}>{metric.score}%</span>
                  </div>
                  <Progress 
                    value={metric.score} 
                    className={`h-1.5 ${
                      metric.status === 'error' ? '[&>div]:bg-destructive' :
                      metric.status === 'warning' ? '[&>div]:bg-amber-500' :
                      '[&>div]:bg-emerald-500'
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">{metric.message}</p>
                </div>
              ))}
            </div>

            {metrics.some(m => m.status !== 'good') && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm font-medium text-amber-800 mb-1">
                  {t('quality.recommendations')}
                </p>
                <ul className="text-xs text-amber-600 list-disc list-inside space-y-1">
                  {metrics
                    .filter(m => m.status !== 'good')
                    .map((m, i) => (
                      <li key={i}>{m.message}</li>
                    ))}
                </ul>
              </div>
            )}

            <Button onClick={runQualityCheck} variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('quality.recheckButton')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageQualityChecker;