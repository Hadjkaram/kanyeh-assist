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
  Stethoscope
} from 'lucide-react';

const ClinicianDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, validated: 0, pending: 0 });
  
  // NOUVEAU : État pour le rapport sélectionné
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
          notes: c.analysis_notes, // On récupère les notes du pathologiste !
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

  // NOUVEAU : Fonction de téléchargement de rapport
  const handleDownloadPDF = (patient: any) => {
    toast.success(`Génération du document pour ${patient.name}...`);
    
    setTimeout(() => {
      // Création d'un faux fichier texte/PDF pour la démo
      const content = `
===================================================
      RAPPORT D'ANALYSE ANATOMOPATHOLOGIQUE
===================================================

INFORMATIONS PATIENT:
- Nom : ${patient.name}
- ID CMU : ${patient.id}
- N° Dossier : ${patient.caseId}
- Date : ${patient.date}

ANALYSE DEMANDÉE:
${patient.pathology === 'breast' ? 'Cancer du Sein' : 'Cancer du Col de l\'Utérus'}

CONCLUSION DU DIAGNOSTIC:
${patient.result || 'En attente'}

NOTES DU PATHOLOGISTE:
${patient.notes || 'Aucune note supplémentaire.'}

===================================================
Généré par KANYEH ASSIST - Portail Sécurisé
===================================================
      `;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Rapport_Medical_${patient.caseId}.txt`;
      link.click();
      toast.success('Document téléchargé avec succès !');
    }, 1500);
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
        <StatCard title={t('stats.myPatients')} value={stats.total} icon={Users} iconColor="text-primary" />
        <StatCard title={t('stats.resultsAvailable')} value={stats.validated} icon={FileText} iconColor="text-success" />
        <StatCard title={t('stats.awaitingResults')} value={stats.pending} icon={Clock} iconColor="text-warning" />
        <StatCard title={t('stats.avgWaitTime')} value="Temps Réel" change={-20} changeLabel={t('stats.faster')} icon={CheckCircle} iconColor="text-accent" />
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
              <div key={index} className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
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
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDownloadPDF(patient)}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* NOUVEAU : Modal pour lire le rapport en plein écran */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Rapport Médical - {selectedReport?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                  <p className="text-xs text-muted-foreground">ID Patient</p>
                  <p className="font-medium">{selectedReport.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dossier</p>
                  <p className="font-mono">{selectedReport.caseId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date d'analyse</p>
                  <p className="font-medium">{selectedReport.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pathologie</p>
                  <p className="font-medium">{selectedReport.pathology === 'breast' ? 'Cancer du Sein' : 'Cancer du Col de l\'Utérus'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase text-muted-foreground border-b pb-2 mb-3">Diagnostic Confirmé</h3>
                <div className="p-4 bg-primary/5 text-primary border border-primary/20 rounded-lg font-medium text-lg">
                  {selectedReport.result}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase text-muted-foreground border-b pb-2 mb-3">Notes Cliniques du Pathologiste</h3>
                <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                  {selectedReport.notes || "Aucune note additionnelle n'a été fournie par le pathologiste."}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>Fermer</Button>
                <Button onClick={() => handleDownloadPDF(selectedReport)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger le document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicianDashboard;