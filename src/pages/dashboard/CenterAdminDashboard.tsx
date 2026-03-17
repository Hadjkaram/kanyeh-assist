import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import RecentCasesTable from '@/components/dashboard/RecentCasesTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  FileImage,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

const mockCases = [
  { id: 'KA-2025-001', patientId: 'CMU-001234', patientName: 'Aminata Koné', pathology: 'breast' as const, status: 'validated' as const, createdAt: '2025-01-18', center: 'CHU Abidjan' },
  { id: 'KA-2025-002', patientId: 'CMU-005678', patientName: 'Fatou Diallo', pathology: 'cervical' as const, status: 'analyzing' as const, createdAt: '2025-01-18', center: 'CHU Abidjan' },
  { id: 'KA-2025-003', patientId: 'CMU-009012', patientName: 'Marie Ouattara', pathology: 'breast' as const, status: 'pending' as const, createdAt: '2025-01-17', center: 'CHU Abidjan' },
];

const teamMembers = [
  { name: 'Ibrahim Traoré', role: 'Technicien', casesToday: 5, status: 'online' },
  { name: 'Aïcha Konaté', role: 'Technicien', casesToday: 3, status: 'online' },
  { name: 'Moussa Diarra', role: 'Technicien', casesToday: 4, status: 'offline' },
];

const CenterAdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t('dashboard.centerAdmin.welcome')}
        </h1>
        <p className="text-muted-foreground">
          {user?.centerName} · {t('dashboard.centerAdmin.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.teamMembers')}
          value={8}
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title={t('stats.casesToday')}
          value={12}
          change={20}
          changeLabel={t('stats.vsYesterday')}
          icon={FileImage}
          iconColor="text-accent"
        />
        <StatCard
          title={t('stats.pendingAnalysis')}
          value={7}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title={t('stats.completedThisWeek')}
          value={45}
          change={15}
          changeLabel={t('stats.vsLastWeek')}
          icon={CheckCircle}
          iconColor="text-success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('dashboard.centerAdmin.teamActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-success' : 'bg-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">{member.casesToday} {t('stats.casesLabel')}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              {t('dashboard.centerAdmin.performance')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('stats.breastCancer')}</span>
                <span className="font-medium">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('stats.cervicalCancer')}</span>
                <span className="font-medium">35%</span>
              </div>
              <Progress value={35} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('stats.validationRate')}</span>
                <span className="font-medium text-success">92%</span>
              </div>
              <Progress value={92} className="h-2 [&>div]:bg-success" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('stats.avgTurnaround')}</span>
                <span className="font-medium">3.5h</span>
              </div>
              <Progress value={70} className="h-2 [&>div]:bg-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.centerAdmin.recentCases')}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertCircle className="h-4 w-4" />
            <span>{t('dashboard.centerAdmin.pendingAlert')}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <RecentCasesTable cases={mockCases} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CenterAdminDashboard;
