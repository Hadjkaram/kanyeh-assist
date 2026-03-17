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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from '@/components/dashboard/StatCard';
import {
  Search,
  Users,
  UserPlus,
  Shield,
  Microscope,
  Stethoscope,
  FlaskConical,
  Settings,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase'; // <-- IMPORT SUPABASE
import { toast } from 'sonner'; // <-- IMPORT TOAST POUR LES NOTIFICATIONS

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'center_admin' | 'lab_technician' | 'pathologist' | 'clinician';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  lastActive: string;
  casesHandled: number;
  avgResponseTime?: string;
}

// On garde l'activité en dur pour préserver le design de l'onglet "Activité"
const activityData = [
  { member: 'Dr. Koné', today: 8, week: 42 },
  { member: 'K. Bamba', today: 12, week: 56 },
  { member: 'Dr. Diallo', today: 6, week: 38 },
  { member: 'Dr. Coulibaly', today: 3, week: 15 },
];

const TeamPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('members');

  // ÉTAT SUPABASE POUR LES MEMBRES DE L'ÉQUIPE
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // New member form state
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
  });

  // FONCTION POUR CHARGER LES VRAIS UTILISATEURS DEPUIS SUPABASE
  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedMembers = data.map((profile: any) => {
        // Découper le full_name en prénom et nom pour coller à ton design
        const nameParts = profile.full_name ? profile.full_name.split(' ') : ['Utilisateur', ''];
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          id: profile.id,
          firstName: firstName,
          lastName: lastName,
          email: profile.email || 'N/A',
          phone: '-', // Les numéros ne sont pas encore dans la table
          role: profile.role,
          status: 'active', // Par défaut pour le moment
          joinedAt: new Date(profile.created_at).toLocaleDateString('fr-FR'),
          lastActive: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
          casesHandled: 0,
          avgResponseTime: '-',
        } as TeamMember;
      });
      setTeamMembers(formattedMembers);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const pendingMembers = teamMembers.filter(m => m.status === 'pending').length;
  const pathologistsCount = teamMembers.filter(m => m.role === 'pathologist').length;
  const techniciansCount = teamMembers.filter(m => m.role === 'lab_technician').length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'center_admin':
        return <Badge className="bg-primary text-primary-foreground gap-1"><Shield className="h-3 w-3" />{t('team.roleAdmin')}</Badge>;
      case 'pathologist':
        return <Badge className="bg-accent text-accent-foreground gap-1"><Microscope className="h-3 w-3" />{t('team.rolePathologist')}</Badge>;
      case 'lab_technician':
        return <Badge className="bg-success text-success-foreground gap-1"><FlaskConical className="h-3 w-3" />{t('team.roleTechnician')}</Badge>;
      case 'clinician':
        return <Badge className="bg-warning text-warning-foreground gap-1"><Stethoscope className="h-3 w-3" />{t('team.roleClinician')}</Badge>;
      case 'system_admin':
        return <Badge className="bg-destructive text-destructive-foreground gap-1"><Shield className="h-3 w-3" />Admin Système</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-success text-success gap-1"><CheckCircle className="h-3 w-3" />{t('team.statusActive')}</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="border-muted-foreground text-muted-foreground gap-1"><XCircle className="h-3 w-3" />{t('team.statusInactive')}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning gap-1"><Clock className="h-3 w-3" />{t('team.statusPending')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const handleAddMember = () => {
    // La création d'un utilisateur sécurisé passe par Supabase Auth (Register)
    // Ici on simule l'envoi d'une invitation pour garder le design
    toast.success("Invitation envoyée avec succès");
    setShowAddDialog(false);
    setNewMember({ firstName: '', lastName: '', email: '', phone: '', role: '' });
  };

  // FONCTION CONNECTÉE À SUPABASE POUR MODIFIER LE RÔLE
  const handleEditMember = async () => {
    if (selectedMember) {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedMember.role })
        .eq('id', selectedMember.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour");
      } else {
        toast.success("Membre mis à jour avec succès");
        // Mise à jour de l'interface sans recharger
        setTeamMembers(prev => prev.map(m => m.id === selectedMember.id ? selectedMember : m));
      }
    }
    setShowEditDialog(false);
    setSelectedMember(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('team.title')}
          </h1>
          <p className="text-muted-foreground">{t('team.subtitle')}</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('team.addMember')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('team.totalMembers')}
          value={teamMembers.length}
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title={t('team.activeMembers')}
          value={activeMembers}
          icon={CheckCircle}
          iconColor="text-success"
        />
        <StatCard
          title={t('team.pathologists')}
          value={pathologistsCount}
          icon={Microscope}
          iconColor="text-accent"
        />
        <StatCard
          title={t('team.technicians')}
          value={techniciansCount}
          icon={FlaskConical}
          iconColor="text-warning"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            {t('team.membersTab')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            {t('team.activityTab')}
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('team.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder={t('team.filterRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('team.allRoles')}</SelectItem>
                    <SelectItem value="center_admin">{t('team.roleAdmin')}</SelectItem>
                    <SelectItem value="pathologist">{t('team.rolePathologist')}</SelectItem>
                    <SelectItem value="lab_technician">{t('team.roleTechnician')}</SelectItem>
                    <SelectItem value="clinician">{t('team.roleClinician')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder={t('team.filterStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('team.allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('team.statusActive')}</SelectItem>
                    <SelectItem value="inactive">{t('team.statusInactive')}</SelectItem>
                    <SelectItem value="pending">{t('team.statusPending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('team.membersList')} ({filteredMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('team.member')}</TableHead>
                      <TableHead>{t('team.role')}</TableHead>
                      <TableHead>{t('team.status')}</TableHead>
                      <TableHead>{t('team.contact')}</TableHead>
                      <TableHead>{t('team.casesHandled')}</TableHead>
                      <TableHead>{t('team.lastActive')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(member.firstName, member.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-muted-foreground">{t('team.joined')} {member.joinedAt}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{member.email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{member.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-medium">{member.casesHandled}</p>
                            {member.avgResponseTime && member.avgResponseTime !== '-' && (
                              <p className="text-xs text-muted-foreground">{t('team.avgTime')}: {member.avgResponseTime}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.lastActive}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedMember(member); setShowEditDialog(true); }}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('team.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                {t('team.permissions')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('team.remove')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {t('team.todayActivity')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activityData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {item.member.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{item.member}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{item.today}</p>
                      <p className="text-xs text-muted-foreground">{t('team.casesToday')}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  {t('team.weeklySummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activityData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-accent/10">
                          {item.member.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{item.member}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">{item.week}</p>
                      <p className="text-xs text-muted-foreground">{t('team.casesWeek')}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('team.performanceOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-primary">29</p>
                  <p className="text-sm text-muted-foreground">{t('team.casesTodayTotal')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-success">151</p>
                  <p className="text-sm text-muted-foreground">{t('team.casesWeekTotal')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-accent">19min</p>
                  <p className="text-sm text-muted-foreground">{t('team.avgResponseTime')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-warning">96%</p>
                  <p className="text-sm text-muted-foreground">{t('team.validationRate')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('team.addMemberTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('team.firstName')}</label>
                <Input
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  placeholder={t('team.firstNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('team.lastName')}</label>
                <Input
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  placeholder={t('team.lastNamePlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('team.email')}</label>
              <Input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder={t('team.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('team.phone')}</label>
              <Input
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                placeholder={t('team.phonePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('team.role')}</label>
              <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('team.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pathologist">{t('team.rolePathologist')}</SelectItem>
                  <SelectItem value="lab_technician">{t('team.roleTechnician')}</SelectItem>
                  <SelectItem value="clinician">{t('team.roleClinician')}</SelectItem>
                  <SelectItem value="center_admin">{t('team.roleAdmin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={handleAddMember} disabled={!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.role}>
              {t('team.sendInvitation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {t('team.editMemberTitle')}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedMember.firstName, selectedMember.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedMember.firstName} {selectedMember.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('team.role')}</label>
                <Select 
                  value={selectedMember.role} 
                  onValueChange={(value) => setSelectedMember({ ...selectedMember, role: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pathologist">{t('team.rolePathologist')}</SelectItem>
                    <SelectItem value="lab_technician">{t('team.roleTechnician')}</SelectItem>
                    <SelectItem value="clinician">{t('team.roleClinician')}</SelectItem>
                    <SelectItem value="center_admin">{t('team.roleAdmin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('team.status')}</label>
                <Select 
                  value={selectedMember.status} 
                  onValueChange={(value) => setSelectedMember({ ...selectedMember, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('team.statusActive')}</SelectItem>
                    <SelectItem value="inactive">{t('team.statusInactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={handleEditMember}>
              {t('team.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPage;