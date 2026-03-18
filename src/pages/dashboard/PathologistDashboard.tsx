import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import RecentCasesTable from '@/components/dashboard/RecentCasesTable';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Microscope,
  CheckCircle,
  Clock,
  Users,
  AlertCircle,
  ArrowRight,
  Loader2,
  FileText // <-- CORRECTION : L'icône manquante est ajoutée ici !
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PathologistDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // États pour stocker les VRAIES données
  const [pendingCases, setPendingCases] = useState<any[]>([]);
  const [validatedCases, setValidatedCases] = useState<any[]>([]);
  const [secondOpinions, setSecondOpinions] = useState<any[]>([]); 
  const [stats, setStats] = useState({ toAnalyze: 0, urgent: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour récupérer les données en temps réel
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      // 1. On récupère les cas EN ATTENTE (Pending)
      const { data: pendingData, error: pendingError } = await supabase
        .from('cases')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false }) // Les urgents en premier
        .order('created_at', { ascending: false })
        .limit(5);

      // 2. On récupère les cas DÉJÀ ANALYSÉS (Validated) pour le tableau du bas
      const { data: validatedData } = await supabase
        .from('cases')
        .select('*')
        .eq('status', 'validated')
        .order('created_at', { ascending: false })
        .limit(5);

      // 3. On récupère les demandes de SECOND AVIS
      const { data: opinionsData } = await supabase
        .from('second_opinions')
        .select('*')
        .eq('requested_to', user?.id)
        .eq('status', 'pending');

      if (opinionsData) {
        setSecondOpinions(opinionsData);
      }

      if (!pendingError && pendingData) {
        setPendingCases(pendingData);
        
        // On compte les vraies statistiques globales
        const { count: totalPending } = await supabase.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: totalUrgent } = await supabase.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('priority', 'urgent');
        
        setStats({
          toAnalyze: totalPending || 0,
          urgent: totalUrgent || 0
        });
      }

      if (validatedData) {
        // On formate les données validées
        const formattedValidated = validatedData.map(c => ({
          id: c.case_reference || c.id,
          patientId: c.patient_id || 'N/A',
          patientName: c.patient_name,
          pathology: c.pathology,
          status: c.status,
          createdAt: new Date(c.created_at).toLocaleDateString('fr-FR'),
          center: c.center
        }));
        setValidatedCases(formattedValidated);
      }

      setIsLoading(false);
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('dashboard.pathologist.welcome')}, {user?.firstName}
          </h1>
          <p className="text-muted-foreground">{t('dashboard.pathologist.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.urgent > 0 && (
            <Badge variant="destructive" className="text-destructive-foreground">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t('dashboard.pathologist.urgentCases')}: {stats.urgent}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.toAnalyze')}
          value={stats.toAnalyze}
          icon={Microscope}
          iconColor="text-primary"
        />
        <StatCard
          title={t('stats.analyzedToday')}
          value={validatedCases.length} 
          icon={CheckCircle}
          iconColor="text-success"
        />
        <StatCard
          title={t('stats.avgAnalysisTime')}
          value="Temps Réel"
          icon={Clock}
          iconColor="text-accent"
        />
        <StatCard
          title={t('stats.secondOpinions')}
          value={secondOpinions.length}
          icon={Users}
          iconColor="text-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases to Analyze (VRAIES DONNÉES) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-primary" />
              {t('dashboard.pathologist.casesToAnalyze')}
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/dashboard/to-analyze')}>
              {t('action.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : pendingCases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucun dossier en attente d'analyse.
              </div>
            ) : (
              pendingCases.map((caseItem) => (
                <div 
                  key={caseItem.id}
                  onClick={() => navigate('/dashboard/to-analyze')}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-full min-h-[40px] rounded-full ${caseItem.priority === 'urgent' ? 'bg-destructive' : caseItem.priority === 'high' ? 'bg-warning' : 'bg-primary'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{caseItem.case_reference || caseItem.id.substring(0,8)}</span>
                        {(caseItem.priority === 'urgent' || caseItem.priority === 'high') && (
                          <Badge variant={caseItem.priority === 'urgent' ? 'destructive' : 'outline'} className={caseItem.priority === 'high' ? 'border-warning text-warning text-xs' : 'text-xs'}>
                            {caseItem.priority.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.patient_name} · {caseItem.center}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={caseItem.pathology === 'breast' ? 'border-accent text-accent' : 'border-primary text-primary'}>
                      {caseItem.pathology === 'breast' ? t('pathology.breast') : t('pathology.cervical')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(caseItem.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI Analysis Panel */}
        <AIAnalysisPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Second Opinion Requests (VRAIES DONNÉES) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-warning" />
              {t('dashboard.pathologist.secondOpinions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {secondOpinions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucune demande de second avis.
              </div>
            ) : (
              secondOpinions.map((request) => (
                <div 
                  key={request.id}
                  className="p-4 bg-warning/10 border border-warning/20 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium">{request.case_id || request.id.substring(0,8)}</span>
                    <Badge variant="outline" className="text-warning border-warning text-xs">
                      {t('status.pending')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('dashboard.pathologist.requestFrom')} {request.requested_by_name || 'Un confrère'}
                  </p>
                  <p className="text-xs text-muted-foreground">{request.center || '-'}</p>
                  <Button size="sm" className="w-full mt-3" onClick={() => navigate('/dashboard/second-opinion')}>
                    {t('action.review')}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Placeholder for image viewer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-primary" />
              {t('ai.analysisTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
              <p className="text-sm text-muted-foreground">
                {t('ai.analysisDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Analyses (VRAIES DONNÉES) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-success" />
            {t('dashboard.pathologist.recentAnalyses')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <RecentCasesTable cases={validatedCases} showCenter />
        </CardContent>
      </Card>
    </div>
  );
};

export default PathologistDashboard;