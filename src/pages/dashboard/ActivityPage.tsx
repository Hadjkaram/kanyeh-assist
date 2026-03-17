import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import StatCard from '@/components/dashboard/StatCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Activity,
  Clock,
  FileText,
  UserPlus,
  CheckCircle,
  Upload,
  Download,
  Eye,
  LogIn,
  LogOut,
  Settings,
  Microscope,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ActivityEvent {
  id: string;
  type: string;
  user: string;
  userRole: string;
  center: string;
  description: string;
  details?: string;
  timestamp: string;
  relatedId?: string;
}

// ON GARDE LES DONNÉES STATIQUES POUR LES GRAPHIQUES POUR PRÉSERVER LE DESIGN
const hourlyData = [
  { hour: '06h', events: 2 },
  { hour: '07h', events: 5 },
  { hour: '08h', events: 12 },
  { hour: '09h', events: 18 },
  { hour: '10h', events: 22 },
  { hour: '11h', events: 25 },
  { hour: '12h', events: 15 },
  { hour: '13h', events: 8 },
  { hour: '14h', events: 20 },
  { hour: '15h', events: 24 },
  { hour: '16h', events: 19 },
  { hour: '17h', events: 14 },
  { hour: '18h', events: 6 },
];

const typeDistribution = [
  { type: 'Cas créés', count: 45 },
  { type: 'Cas validés', count: 38 },
  { type: 'Connexions', count: 120 },
  { type: 'Images', count: 156 },
  { type: 'Rapports', count: 12 },
];

const ActivityPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('today');
  const [activeTab, setActiveTab] = useState('timeline');
  
  // NOUVEAU : État pour stocker les vraies activités de Supabase
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    setIsLoading(true);
    // On fait une jointure avec la table profiles pour récupérer le nom de la personne
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles (
          full_name,
          role,
          center
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      const formatted = data.map((act: any) => ({
        id: act.id,
        type: act.action_type,
        user: act.profiles?.full_name || 'Utilisateur inconnu',
        userRole: act.profiles?.role || 'system',
        center: act.profiles?.center || 'Plateforme KANYEH',
        description: act.description,
        details: act.case_id ? `Lié au dossier` : undefined,
        timestamp: new Date(act.created_at).toLocaleString('fr-FR', { 
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        relatedId: act.case_id
      }));
      setActivities(formatted);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.details?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesType;
  });

  const todayEvents = activities.length;
  const caseEvents = activities.filter(a => a.type.startsWith('case_')).length;
  const userEvents = activities.filter(a => a.type.startsWith('user_')).length;

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'case_created': return <FileText className="h-4 w-4 text-primary" />;
      case 'case_submitted': return <Upload className="h-4 w-4 text-warning" />;
      case 'analysis_completed': return <Microscope className="h-4 w-4 text-accent" />;
      case 'case_validated': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'user_login': return <LogIn className="h-4 w-4 text-primary" />;
      case 'user_logout': return <LogOut className="h-4 w-4 text-muted-foreground" />;
      case 'user_created': return <UserPlus className="h-4 w-4 text-success" />;
      case 'settings_changed': return <Settings className="h-4 w-4 text-accent" />;
      case 'image_uploaded': return <Upload className="h-4 w-4 text-primary" />;
      case 'report_generated': return <Download className="h-4 w-4 text-success" />;
      case 'second_opinion': return <Users className="h-4 w-4 text-warning" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'case_created': return <Badge variant="outline" className="border-primary text-primary">{t('activity.typeCaseCreated')}</Badge>;
      case 'case_submitted': return <Badge className="bg-warning text-warning-foreground">{t('activity.typeCaseSubmitted')}</Badge>;
      case 'analysis_completed': return <Badge className="bg-accent text-accent-foreground">Analyse complétée</Badge>;
      case 'case_validated': return <Badge className="bg-success text-success-foreground">{t('activity.typeCaseValidated')}</Badge>;
      case 'user_login': return <Badge variant="outline">{t('activity.typeUserLogin')}</Badge>;
      case 'user_logout': return <Badge variant="secondary">{t('activity.typeUserLogout')}</Badge>;
      case 'user_created': return <Badge className="bg-success text-success-foreground">{t('activity.typeUserCreated')}</Badge>;
      case 'settings_changed': return <Badge variant="outline" className="border-accent text-accent">{t('activity.typeSettings')}</Badge>;
      case 'image_uploaded': return <Badge variant="outline" className="border-primary text-primary">{t('activity.typeImageUploaded')}</Badge>;
      case 'report_generated': return <Badge variant="outline" className="border-success text-success">{t('activity.typeReportGenerated')}</Badge>;
      case 'second_opinion': return <Badge className="bg-warning text-warning-foreground">{t('activity.typeSecondOpinion')}</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'pathologist': return <Badge variant="outline" className="text-xs">{t('team.rolePathologist')}</Badge>;
      case 'lab_technician': return <Badge variant="outline" className="text-xs">{t('team.roleTechnician')}</Badge>;
      case 'center_admin': return <Badge variant="outline" className="text-xs">{t('team.roleAdmin')}</Badge>;
      case 'system_admin': return <Badge variant="outline" className="text-xs">{t('activity.roleSystem')}</Badge>;
      case 'system': return <Badge variant="outline" className="text-xs">{t('activity.roleSystem')}</Badge>;
      default: return <Badge variant="outline" className="text-xs">{role}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('activity.title')}
          </h1>
          <p className="text-muted-foreground">{t('activity.subtitle')}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchActivities} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('activity.refresh')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('activity.todayEvents')} value={todayEvents} icon={Activity} iconColor="text-primary" />
        <StatCard title={t('activity.caseEvents')} value={caseEvents} icon={FileText} iconColor="text-accent" />
        <StatCard title={t('activity.userEvents')} value={userEvents} icon={Users} iconColor="text-success" />
        <StatCard title={t('activity.peakHour')} value="En direct" icon={Clock} iconColor="text-warning" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline" className="gap-2">
            <Clock className="h-4 w-4" />
            {t('activity.timelineTab')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('activity.analyticsTab')}
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('activity.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('activity.filterType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('activity.allTypes')}</SelectItem>
                    <SelectItem value="case_created">{t('activity.typeCaseCreated')}</SelectItem>
                    <SelectItem value="case_submitted">{t('activity.typeCaseSubmitted')}</SelectItem>
                    <SelectItem value="analysis_completed">Analyse complétée</SelectItem>
                    <SelectItem value="user_login">{t('activity.typeUserLogin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                {t('activity.recentActivity')} ({filteredActivities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {filteredActivities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {getEventIcon(activity.type)}
                          </div>
                          {index < filteredActivities.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border mt-2" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {getEventTypeBadge(activity.type)}
                            <span className="text-xs text-muted-foreground">
                              {activity.timestamp}
                            </span>
                          </div>
                          
                          <p className="font-medium">{activity.description}</p>
                          
                          {activity.details && (
                            <p className="text-sm text-muted-foreground">{activity.details}</p>
                          )}

                          <div className="flex items-center gap-3 pt-1">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-primary/10">
                                  {getInitials(activity.user)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{activity.user}</span>
                              {getRoleBadge(activity.userRole)}
                            </div>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{activity.center}</span>
                          </div>
                        </div>

                        {activity.relatedId && (
                          <Button variant="ghost" size="sm" className="shrink-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab (GARDÉ INTACT POUR LE DESIGN) */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t('activity.hourlyDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="events" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  {t('activity.eventDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="type" type="category" className="text-xs" width={100} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivityPage;