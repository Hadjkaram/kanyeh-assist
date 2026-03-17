import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileImage,
  Microscope,
  ClipboardList,
  BarChart3,
  Settings,
  FolderOpen,
  FileText,
  Activity,
  Database,
  Shield,
} from 'lucide-react';
import kanyehLogo from '@/assets/kanyeh-logo.jpg';

const DashboardSidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { title: t('sidebar.dashboard'), url: '/dashboard', icon: LayoutDashboard },
    ];

    switch (user?.role) {
      case 'system_admin':
        return [
          ...baseItems,
          { title: t('sidebar.centers'), url: '/dashboard/centers', icon: Building2 },
          { title: t('sidebar.users'), url: '/dashboard/users', icon: Users },
          { title: t('sidebar.statistics'), url: '/dashboard/statistics', icon: BarChart3 },
          { title: t('sidebar.audit'), url: '/dashboard/audit', icon: Shield },
          { title: t('sidebar.system'), url: '/dashboard/system', icon: Database },
          { title: t('sidebar.settings'), url: '/dashboard/settings', icon: Settings },
        ];
      
      case 'center_admin':
        return [
          ...baseItems,
          { title: t('sidebar.team'), url: '/dashboard/team', icon: Users },
          { title: t('sidebar.cases'), url: '/dashboard/cases', icon: FolderOpen },
          { title: t('sidebar.statistics'), url: '/dashboard/statistics', icon: BarChart3 },
          { title: t('sidebar.activity'), url: '/dashboard/activity', icon: Activity },
          { title: t('sidebar.settings'), url: '/dashboard/settings', icon: Settings },
        ];

      case 'lab_technician':
        return [
          ...baseItems,
          { title: t('sidebar.newCase'), url: '/dashboard/new-case', icon: FileImage },
          { title: t('sidebar.myCases'), url: '/dashboard/my-cases', icon: FolderOpen },
          { title: t('sidebar.pending'), url: '/dashboard/pending', icon: ClipboardList },
          { title: t('sidebar.statistics'), url: '/dashboard/statistics', icon: BarChart3 },
        ];

      case 'pathologist':
        return [
          ...baseItems,
          { title: t('sidebar.toAnalyze'), url: '/dashboard/to-analyze', icon: Microscope },
          { title: t('sidebar.myAnalyses'), url: '/dashboard/my-analyses', icon: FileText },
          { title: t('sidebar.secondOpinion'), url: '/dashboard/second-opinion', icon: Users },
          { title: t('sidebar.statistics'), url: '/dashboard/statistics', icon: BarChart3 },
          { title: t('sidebar.reports'), url: '/dashboard/reports', icon: ClipboardList },
        ];

      case 'clinician':
        return [
          ...baseItems,
          { title: t('sidebar.myPatients'), url: '/dashboard/my-patients', icon: Users },
          { title: t('sidebar.results'), url: '/dashboard/results', icon: FileText },
          { title: t('sidebar.pending'), url: '/dashboard/pending', icon: ClipboardList },
          { title: t('sidebar.statistics'), url: '/dashboard/statistics', icon: BarChart3 },
        ];

      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={kanyehLogo} alt="KANYEH" className="h-10 w-10 rounded-lg" />
          {!collapsed && (
            <div>
              <h2 className="font-display font-bold text-foreground">KANYEH</h2>
              <p className="text-xs text-muted-foreground">ASSIST V2</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && t('sidebar.menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/dashboard'}
                      className="flex items-center gap-3 w-full"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && user?.centerName && (
          <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
            <p className="font-medium text-foreground">{user.centerName}</p>
            <p>{t('sidebar.connectedCenter')}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
