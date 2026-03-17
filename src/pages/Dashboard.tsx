import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SystemAdminDashboard from './dashboard/SystemAdminDashboard';
import CenterAdminDashboard from './dashboard/CenterAdminDashboard';
import TechnicianDashboard from './dashboard/TechnicianDashboard';
import PathologistDashboard from './dashboard/PathologistDashboard';
import ClinicianDashboard from './dashboard/ClinicianDashboard';
import NewCasePage from './dashboard/NewCasePage';
import MyCasesPage from './dashboard/MyCasesPage';
import PendingCasesPage from './dashboard/PendingCasesPage';
import StatisticsPage from './dashboard/StatisticsPage';
import ToAnalyzePage from './dashboard/ToAnalyzePage';
import MyAnalysesPage from './dashboard/MyAnalysesPage';
import SecondOpinionPage from './dashboard/SecondOpinionPage';
import ReportsPage from './dashboard/ReportsPage';
import TeamPage from './dashboard/TeamPage';
import CasesPage from './dashboard/CasesPage';
import ActivityPage from './dashboard/ActivityPage';
import SettingsPage from './dashboard/SettingsPage';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'system_admin':
        return <SystemAdminDashboard />;
      case 'center_admin':
        return <CenterAdminDashboard />;
      case 'lab_technician':
        return <TechnicianDashboard />;
      case 'pathologist':
        return <PathologistDashboard />;
      case 'clinician':
        return <ClinicianDashboard />;
      default:
        return <SystemAdminDashboard />;
    }
  };

  return (
    <DashboardLayout>
      <Routes>
        <Route index element={renderDashboard()} />
        <Route path="new-case" element={<NewCasePage />} />
        <Route path="my-cases" element={<MyCasesPage />} />
        <Route path="pending" element={<PendingCasesPage />} />
        {/* Placeholder routes for other menu items */}
        <Route path="to-analyze" element={<ToAnalyzePage />} />
        <Route path="my-analyses" element={<MyAnalysesPage />} />
        <Route path="second-opinion" element={<SecondOpinionPage />} />
        <Route path="my-patients" element={<ComingSoonPage title="Mes patients" />} />
        <Route path="results" element={<ComingSoonPage title="Résultats" />} />
        <Route path="centers" element={<ComingSoonPage title="Centres" />} />
        <Route path="users" element={<ComingSoonPage title="Utilisateurs" />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<ComingSoonPage title="Audit" />} />
        <Route path="system" element={<ComingSoonPage title="Système" />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={renderDashboard()} />
      </Routes>
    </DashboardLayout>
  );
};

// Placeholder component for routes not yet implemented
const ComingSoonPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-display font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground">Cette fonctionnalité sera disponible prochainement.</p>
    </div>
  );
};

export default Dashboard;
