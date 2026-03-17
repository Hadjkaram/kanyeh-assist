import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import AIAssistantChat from '@/components/ai/AIAssistantChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react';

const ClinicianDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // NOUVEAU : État pour les vraies données
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, validated: 0, pending: 0 });

  // NOUVEAU : Récupération depuis Supabase
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        // On pourrait filtrer par l'hôpital du clinicien ici
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map(c => ({
          id: c.patient_id || 'N/A',
          name: c.patient_name,
          caseId: c.case_reference,
          pathology: c.pathology,
          status: c.status,
          result: c.diagnosis, // Le résultat vient de l'analyse du pathologiste
          date: new Date(c.created_at).toLocaleDateString('fr-FR')
        }));
        setPatients(formatted);
        
        setStats({
          total: data.length,
          validated: data.filter(c => c.status === 'validated').length,
          pending: data.filter(c => c.status === 'pending' || c.status === 'analyzing').length
        });
      }
      setIsLoading(false);
    };

    fetchPatients();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-success hover:bg-success/90">{t('status.validated')}</Badge>;
      case 'analyzing':
        return <Badge>{t('status.analyzing')}</Badge>;
      case 'pending':
        return <Badge variant="outline">{t('status.pending')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t('dashboard.clinician.welcome')}, {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.clinician.subtitle')} · {user?.centerName}
        </p>
      </div>

      {/* Integration Notice (GARDÉ INTACT) */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExternalLink className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{t('dashboard.clinician.passSanteIntegration')}</p>
              <p className="text-sm text-muted-foreground">{t('dashboard.clinician.passSanteDesc')}</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            {t('action.openPassSante')}
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.myPatients')}
          value={stats.total}
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title={t('stats.resultsAvailable')}
          value={stats.validated}
          icon={FileText}
          iconColor="text-success"
        />
        <StatCard
          title={t('stats.awaitingResults')}
          value={stats.pending}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title={t('stats.avgWaitTime')}
          value="Temps Réel"
          change={-20}
          changeLabel={t('stats.faster')}
          icon={CheckCircle}
          iconColor="text-accent"
        />
      </div>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('dashboard.clinician.myPatients')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
             <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : patients.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">Aucun dossier patient trouvé.</div>
          ) : (
            patients.map((patient, index) => (
              <div 
                key={index}
                className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{patient.name}</span>
                      {getStatusBadge(patient.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{patient.id}</span>
                      <span>·</span>
                      <span className="font-mono">{patient.caseId}</span>
                      <span>·</span>
                      <Badge variant="outline" className={patient.pathology === 'breast' ? 'border-accent text-accent' : 'border-primary text-primary'}>
                        {patient.pathology === 'breast' ? t('pathology.breast') : t('pathology.cervical')}
                      </Badge>
                    </div>
                    {patient.result && (
                      <p className="text-sm font-medium text-foreground mt-2 p-2 bg-background rounded border">
                        {patient.result}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.status === 'validated' && (
                      <>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          {t('action.viewReport')}
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                      </>
                    )}
                    {patient.status === 'analyzing' && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">{t('status.analyzing')}...</p>
                        <Progress value={65} className="w-32 h-2" />
                      </div>
                    )}
                    {patient.status === 'pending' && (
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.clinician.waitingForAnalysis')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* AI Assistant & Stats (GARDÉ INTACT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Assistant Chat */}
        <div className="h-[400px]">
          <AIAssistantChat />
        </div>

        {/* Pathology Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.clinician.pathologyDistribution')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  {t('pathology.breast')}
                </span>
                <span className="font-medium">14 {t('stats.patients')}</span>
              </div>
              <Progress value={58} className="h-3 [&>div]:bg-accent" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  {t('pathology.cervical')}
                </span>
                <span className="font-medium">10 {t('stats.patients')}</span>
              </div>
              <Progress value={42} className="h-3" />
            </div>

            {/* Response Time Summary */}
            <div className="pt-4 border-t mt-4">
              <h4 className="text-sm font-medium mb-3">{t('dashboard.clinician.responseTime')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-primary">4.2h</p>
                  <p className="text-xs text-muted-foreground">Moyenne</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-success">2.1h</p>
                  <p className="text-xs text-muted-foreground">Urgent</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClinicianDashboard;