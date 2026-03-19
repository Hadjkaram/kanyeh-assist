import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import AIAssistantChat from '@/components/ai/AIAssistantChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Download,
  ExternalLink,
  Loader2,
  Stethoscope,
  Printer,
  Brain,
  Target
} from 'lucide-react';

const ClinicianDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, validated: 0, pending: 0 });
  
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map(c => ({
          id: c.patient_id || 'N/A',
          name: c.patient_name,
          caseId: c.case_reference || c.id.substring(0,8),
          pathology: c.pathology,
          status: c.status,
          result: c.diagnosis,
          notes: c.analysis_notes, 
          date: new Date(c.created_at).toLocaleDateString('fr-FR'),
          aiData: c.ai_analysis_results // NOUVEAU: On récupère les cadres de l'IA !
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

  // NOUVEAU : Fonction de génération de vrai PDF via l'impression du navigateur
  const handlePrintPDF = () => {
    toast.success("Génération du rapport médical...");
    setTimeout(() => {
      // Ouvre une fenêtre d'impression native (qui permet de Sauvegarder en PDF)
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Style spécial caché pour l'impression PDF */}
      <style dangerouslySetContents={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            padding: 20mm;
          }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Welcome Header */}
      <div className="no-print">
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t('dashboard.clinician.welcome')}, {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          {t('dashboard.clinician.subtitle')} · {user?.centerName}
        </p>
      </div>

      <Card className="no-print bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
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
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('stats.myPatients')} value={stats.total} icon={Users} iconColor="text-primary" />
        <StatCard title={t('stats.resultsAvailable')} value={stats.validated} icon={FileText} iconColor="text-success" />
        <StatCard title={t('stats.awaitingResults')} value={stats.pending} icon={Clock} iconColor="text-warning" />
        <StatCard title={t('stats.avgWaitTime')} value="Temps Réel" change={-20} changeLabel={t('stats.faster')} icon={CheckCircle} iconColor="text-accent" />
      </div>

      {/* Patients List */}
      <Card className="no-print">
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
              <div key={index} className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                      Diagnostiqué : {patient.result}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {patient.status === 'validated' && (
                    <>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelectedReport(patient)}>
                        <Eye className="h-4 w-4" />
                        {t('action.viewReport')}
                      </Button>
                      <Button onClick={() => { setSelectedReport(patient); setTimeout(handlePrintPDF, 300); }} size="sm" className="gap-2">
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
            ))
          )}
        </CardContent>
      </Card>

      <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px]">
          <AIAssistantChat />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.clinician.pathologyDistribution')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent" />{t('pathology.breast')}</span>
                <span className="font-medium">14 {t('stats.patients')}</span>
              </div>
              <Progress value={58} className="h-3 [&>div]:bg-accent" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" />{t('pathology.cervical')}</span>
                <span className="font-medium">10 {t('stats.patients')}</span>
              </div>
              <Progress value={42} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal pour lire le rapport en plein écran ET qui sera imprimé */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div id="printable-report" className="space-y-8 p-4">
            
            <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-primary tracking-tight">KANYEH ASSIST</h1>
                <p className="text-sm font-medium text-muted-foreground">Rapport d'Analyse Anatomopathologique</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
                <p className="text-sm font-mono font-bold mt-1">REF: {selectedReport?.caseId}</p>
              </div>
            </div>

            {selectedReport && (
              <>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-muted/20 p-6 rounded-lg border border-border/50">
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Patient</p><p className="font-bold text-lg">{selectedReport.name}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ID CMU</p><p className="font-medium">{selectedReport.id}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pathologie examinée</p><p className="font-medium">{selectedReport.pathology === 'breast' ? 'Cancer du Sein' : 'Cancer du Col de l\'Utérus'}</p></div>
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date d'analyse</p><p className="font-medium">{selectedReport.date}</p></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase text-primary border-b border-primary/20 pb-2">Diagnostic Confirmé par le Pathologiste</h3>
                  <div className={`p-4 rounded-lg font-medium text-lg border ${
                    selectedReport.result === 'normal' || selectedReport.result === 'benign' ? 'bg-success/10 text-success-foreground border-success/30' :
                    selectedReport.result === 'suspicious' || selectedReport.result === 'atypical' ? 'bg-warning/10 text-warning-foreground border-warning/30' :
                    'bg-destructive/10 text-destructive border-destructive/30'
                  }`}>
                    {selectedReport.result ? selectedReport.result.toUpperCase() : 'Non défini'}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase text-primary border-b border-primary/20 pb-2">Notes et Observations Cliniques</h3>
                  <div className="p-5 bg-muted/40 rounded-lg whitespace-pre-wrap text-sm leading-relaxed border border-border/50">
                    {selectedReport.notes || "Aucune note additionnelle n'a été fournie par le pathologiste."}
                  </div>
                </div>

                {/* NOUVEAU : Section d'Analyse IA Intégrée */}
                {selectedReport.aiData && selectedReport.aiData.length > 0 && (
                  <div className="space-y-4 mt-8 pt-6 border-t-2 border-dashed border-border">
                    <h3 className="text-sm font-bold uppercase flex items-center gap-2 text-accent">
                      <Brain className="h-4 w-4" /> Analyse Complémentaire de l'IA Kanyeh
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      L'intelligence artificielle a détecté {selectedReport.aiData.length} région(s) d'intérêt lors du pré-screening.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {selectedReport.aiData.map((region: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card text-sm">
                          <Target className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={
                                region.classification === 'malignant' ? 'border-destructive text-destructive' :
                                region.classification === 'suspicious' ? 'border-warning text-warning' : 'border-success text-success'
                              }>
                                Zone {region.classification}
                              </Badge>
                              <span className="text-xs font-mono text-muted-foreground">Fiabilité: {region.confidence}%</span>
                            </div>
                            <p className="text-muted-foreground">{region.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-12 pt-4 border-t text-center text-xs text-muted-foreground">
                  <p>Ce document est généré de manière sécurisée par la plateforme KANYEH ASSIST.</p>
                  <p>Il est destiné à un usage médical strict et confidentiel.</p>
                </div>
              </>
            )}
          </div>

          {/* Boutons cachés à l'impression */}
          <div className="no-print flex justify-end gap-3 pt-6 border-t mt-4 bg-background">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Fermer</Button>
            <Button onClick={handlePrintPDF} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer / Sauvegarder en PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicianDashboard;