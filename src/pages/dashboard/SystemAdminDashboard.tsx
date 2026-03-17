import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import StatCard from '@/components/dashboard/StatCard';
import RecentCasesTable from '@/components/dashboard/RecentCasesTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  FileImage,
  Activity,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { supabase } from '@/lib/supabase'; // <-- IMPORT SUPABASE

const SystemAdminDashboard: React.FC = () => {
  const { t } = useLanguage();

  // ÉTATS POUR LES VRAIES DONNÉES
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCenters: 24, // Valeur par défaut / fallback
    activeUsers: 156, // Valeur par défaut / fallback
    totalCases: "0",
    avgResponseTime: "4.2h" // Temps moyen gardé statique pour la fluidité du design
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      // 1. Récupération des 5 derniers dossiers créés sur toute la plateforme
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!casesError && casesData) {
        const formattedCases = casesData.map(c => ({
          id: c.case_reference || c.id,
          patientId: c.patient_id || 'N/A',
          patientName: c.patient_name,
          pathology: c.pathology,
          status: c.status,
          createdAt: new Date(c.created_at).toLocaleDateString('fr-FR'),
          center: c.center
        }));
        setRecentCases(formattedCases);
      }

      // 2. Récupération des statistiques globales (Comptage exact)
      const { count: casesCount } = await supabase.from('cases').select('*', { count: 'exact', head: true });
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      // 3. Mise à jour des compteurs
      setStats(prev => ({
        ...prev,
        totalCases: casesCount ? casesCount.toString() : prev.totalCases,
        activeUsers: usersCount || prev.activeUsers,
      }));
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t('dashboard.admin.welcome')}
        </h1>
        <p className="text-muted-foreground">{t('dashboard.admin.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.totalCenters')}
          value={stats.totalCenters}
          change={8}
          changeLabel={t('stats.thisMonth')}
          icon={Building2}
          iconColor="text-primary"
        />
        <StatCard
          title={t('stats.activeUsers')}
          value={stats.activeUsers}
          change={12}
          changeLabel={t('stats.thisMonth')}
          icon={Users}
          iconColor="text-accent"
        />
        <StatCard
          title={t('stats.totalCases')}
          value={stats.totalCases}
          change={23}
          changeLabel={t('stats.thisMonth')}
          icon={FileImage}
          iconColor="text-success"
        />
        <StatCard
          title={t('stats.avgResponseTime')}
          value={stats.avgResponseTime}
          change={-15}
          changeLabel={t('stats.improvement')}
          icon={Activity}
          iconColor="text-warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('dashboard.admin.casesTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">{t('dashboard.chartPlaceholder')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              {t('dashboard.admin.centerDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">{t('dashboard.mapPlaceholder')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.admin.recentCases')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <RecentCasesTable cases={recentCases.length > 0 ? recentCases : []} showCenter />
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAdminDashboard;