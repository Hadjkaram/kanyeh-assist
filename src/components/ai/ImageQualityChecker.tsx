import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

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

  const runQualityCheck = async () => {
    setIsChecking(true);
    setCheckComplete(false);

    // Simulate quality check
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock quality metrics
    const mockMetrics: QualityMetric[] = [
      {
        name: t('quality.sharpness'),
        score: 92,
        status: 'good',
        message: t('quality.sharpnessGood'),
      },
      {
        name: t('quality.lighting'),
        score: 85,
        status: 'good',
        message: t('quality.lightingGood'),
      },
      {
        name: t('quality.focus'),
        score: 78,
        status: 'warning',
        message: t('quality.focusWarning'),
      },
      {
        name: t('quality.contrast'),
        score: 88,
        status: 'good',
        message: t('quality.contrastGood'),
      },
      {
        name: t('quality.artifacts'),
        score: 95,
        status: 'good',
        message: t('quality.artifactsGood'),
      },
    ];

    const avgScore = Math.round(mockMetrics.reduce((acc, m) => acc + m.score, 0) / mockMetrics.length);
    
    setMetrics(mockMetrics);
    setOverallScore(avgScore);
    setIsChecking(false);
    setCheckComplete(true);
    
    const passed = avgScore >= 80 && !mockMetrics.some(m => m.status === 'error');
    onQualityCheck?.(passed, mockMetrics);
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
            <p className="text-sm text-muted-foreground">{t('quality.checking')}</p>
          </div>
        )}

        {checkComplete && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              <Badge className={`mt-2 ${getOverallStatus().color}`}>
                {getOverallStatus().label}
              </Badge>
            </div>

            {/* Individual Metrics */}
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

            {/* Recommendations */}
            {metrics.some(m => m.status !== 'good') && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  {t('quality.recommendations')}
                </p>
                <ul className="text-xs text-amber-600 dark:text-amber-400 list-disc list-inside space-y-1">
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
