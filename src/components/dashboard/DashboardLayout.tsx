import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DashboardSidebar from './DashboardSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import kanyehLogo from '@/assets/kanyeh-logo.jpg';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`;
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'system_admin': return 'bg-primary text-primary-foreground';
      case 'center_admin': return 'bg-accent text-white';
      case 'lab_technician': return 'bg-success text-white';
      case 'pathologist': return 'bg-warning text-white';
      case 'clinician': return 'bg-info text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="hidden md:flex items-center gap-2">
                <img src={kanyehLogo} alt="KANYEH" className="h-8 w-8 rounded-lg" />
                <span className="font-display font-bold text-foreground">KANYEH ASSIST</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </Button>

              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}>
                    {t(`dashboard.role.${user?.role}`)}
                  </span>
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
