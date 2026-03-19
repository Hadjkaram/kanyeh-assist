import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCases } from '@/contexts/CaseContext';
import StatCard from '@/components/dashboard/StatCard';
import RecentCasesTable from '@/components/dashboard/RecentCasesTable';
import CreateCaseModal from '@/components/cases/CreateCaseModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  FileImage,
  Send,
  Clock,
  CheckCircle,
  Plus,
  Upload,
  FileEdit,
  ShieldCheck // NOUVELLE ICÔNE
} from 'lucide-react';

const TechnicianDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { cases, getDraftCases, getPendingCases } = useCases();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Filter cases for current user's center
  const userCases = cases.filter(c => c.centerId === user?.centerId || c.createdBy === user?.id);
  const draftCount = getDraftCases().length;
  const pendingCount = getPendingCases().length;
  const analyzingCount = cases.filter(c => c.status === 'analyzing').length;
  const validatedCount = cases.filter(c => c.status === 'validated').length;

  // Transform cases for table
  const tableCases = userCases.slice(0, 5).map(c => ({
    id: c.id,
    patientId: c.patientInfo.id,
    patientName: `${c.patientInfo.firstName} ${c.patientInfo.lastName}`,
    pathology: c.pathology as 'breast' | 'cervical',
    status: c.status as 'draft' | 'pending' | 'analyzing' | 'validated' | 'archived',
    createdAt: c.createdAt.split('T')[0],
    center: c.centerName,
  }));

  const handleNewCase = () => {
    setCreateModalOpen(true);
  };

  const handleContinueDraft = () => {
    const drafts = getDraftCases();
    if (drafts.length > 0) {
      toast.info(t('case.continueDraftInfo') || 'Fonctionnalité bientôt disponible');
    } else {
      toast.info(t('case.noDrafts') || 'Aucun brouillon disponible');
    }
  };

  const quickActions = [
    { icon: Plus, label: 'action.newCase', color: 'bg-primary', onClick: handleNewCase },
    { icon: Upload, label: 'action.uploadImages', color: 'bg-accent', onClick: () => toast.info('Fonctionnalité bientôt disponible') },
    { icon: FileEdit, label: 'action.continueDraft', color: 'bg-warning', onClick: handleContinueDraft },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('dashboard.technician.welcome')}, {user?.firstName}
          </h1>
          <p className="text-muted-foreground">{user?.centerName}</p>
        </div>
        <Button className="gap-2" onClick={handleNewCase}>
          <Plus className="h-4 w-4" />
          {t('action.createNewCase')}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={action.onClick}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${action.color} text-white group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6" />
              </div>
              <span className="font-medium">{t(action.label)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.casesToday')}
          value={userCases.filter(c => c.createdAt.startsWith(new Date().toISOString().split('T')[0])).length}
          icon={FileImage}
          iconColor="text-primary"
        />
        <StatCard
          title={t('stats.sentForAnalysis')}
          value={pendingCount + analyzingCount}
          change={8}
          changeLabel={t('stats.thisWeek')}
          icon={Send}
          iconColor="text-accent"
        />
        <StatCard
          title={t('stats.drafts')}
          value={draftCount}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title={t('stats.validated')}
          value={validatedCount}
          change={15}
          changeLabel={t('stats.thisMonth')}
          icon={CheckCircle}
          iconColor="text-success"
        />
      </div>

      {/* Cases Table & Quality Check */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.technician.myCases')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RecentCasesTable cases={tableCases} />
          </CardContent>
        </Card>

        {/* NOUVEAU: Encart informatif IA (remplace le composant buggé) */}
        <Card className="bg-gradient-to-b from-accent/10 to-accent/5 border-accent/20 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="h-16 w-16 bg-accent/20 rounded-full flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Contrôle Qualité IA</h3>
          <p className="text-sm text-muted-foreground">
            L'analyse IA de la qualité des images s'effectue automatiquement à l'intérieur de la fenêtre de création d'un nouveau dossier patient.
          </p>
          <Button onClick={handleNewCase} className="w-full mt-4 gap-2" variant="outline">
            <Plus className="h-4 w-4" /> Démarrer une capture
          </Button>
        </Card>
      </div>

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.technician.workflowStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" />
                <span className="font-medium">{t('status.draft')}</span>
              </div>
              <span className="text-2xl font-bold text-warning">{draftCount}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-primary" />
                <span className="font-medium">{t('status.pending')}</span>
              </div>
              <span className="text-2xl font-bold text-primary">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-3">
                <FileImage className="h-5 w-5 text-accent" />
                <span className="font-medium">{t('status.analyzing')}</span>
              </div>
              <span className="text-2xl font-bold text-accent">{analyzingCount}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="font-medium">{t('status.validated')}</span>
              </div>
              <span className="text-2xl font-bold text-success">{validatedCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Case Modal */}
      <CreateCaseModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen}
        onSuccess={(caseId) => {
          toast.success(`Cas ${caseId} créé avec succès`);
        }}
      />
    </div>
  );
};

export default TechnicianDashboard;