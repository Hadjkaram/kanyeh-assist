import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Filter,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Microscope,
  Building,
  Calendar,
  MoreVertical,
  RefreshCw,
  XCircle,
  TrendingUp,
  Archive,
  Loader2, // NOUVEAU: Importé pour le chargement
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase'; // NOUVEAU: Import Supabase

// Les interfaces ont été adaptées pour correspondre à Supabase
interface Case {
  id: string;
  patientId: string;
  patientName: string;
  pathology: 'breast' | 'cervical';
  status: 'draft' | 'pending' | 'analyzing' | 'validated' | 'archived';
  priority: 'normal' | 'high' | 'urgent';
  center: string;
  createdBy: string;
  createdAt: string;
  assignedTo?: string;
  validatedAt?: string;
  diagnosis?: string;
}

// On garde ces données pour les graphiques
const trendData = [
  { date: '13 Jan', created: 12, validated: 10 },
  { date: '14 Jan', created: 15, validated: 13 },
  { date: '15 Jan', created: 18, validated: 16 },
  { date: '16 Jan', created: 14, validated: 15 },
  { date: '17 Jan', created: 20, validated: 18 },
  { date: '18 Jan', created: 22, validated: 19 },
  { date: '19 Jan', created: 16, validated: 12 },
];

const centerData = [
  { center: 'CHU Abidjan', cases: 45 },
  { center: 'CHU Bouaké', cases: 32 },
  { center: 'CS Yamoussoukro', cases: 28 },
  { center: 'CS San-Pedro', cases: 18 },
  { center: 'CHU Cocody', cases: 25 },
];

const CasesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPathology, setFilterPathology] = useState<string>('all');
  const [filterCenter, setFilterCenter] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // NOUVEAUX ÉTATS POUR SUPABASE
  const [dbCases, setDbCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCasesFromDB = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Transformation pour s'adapter à ton interface existante
      const formatted = data.map((d: any) => ({
        id: d.case_reference || d.id, // On utilise la référence courte si dispo
        patientId: d.patient_id || 'N/A',
        patientName: d.patient_name,
        pathology: d.pathology,
        status: d.status,
        priority: d.priority,
        center: d.center,
        createdBy: 'Système', // Si on a fait la jointure on pourrait avoir le vrai nom
        createdAt: new Date(d.created_at).toLocaleString('fr-FR'),
        assignedTo: d.assigned_to,
        validatedAt: d.validated_at ? new Date(d.validated_at).toLocaleString('fr-FR') : undefined,
        diagnosis: d.diagnosis
      }));
      setDbCases(formatted);
    } else if (error) {
      console.error("Erreur de récupération Supabase:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCasesFromDB();
  }, []);

  // On utilise dbCases au lieu de mockCases
  const filteredCases = dbCases.filter((caseItem) => {
    const matchesSearch =
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    const matchesPathology = filterPathology === 'all' || caseItem.pathology === filterPathology;
    const matchesCenter = filterCenter === 'all' || caseItem.center === filterCenter;
    const matchesPriority = filterPriority === 'all' || caseItem.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPathology && matchesCenter && matchesPriority;
  });

  const totalCases = dbCases.length;
  const pendingCases = dbCases.filter(c => c.status === 'pending').length;
  const analyzingCases = dbCases.filter(c => c.status === 'analyzing').length;
  const validatedCases = dbCases.filter(c => c.status === 'validated').length;
  const urgentCases = dbCases.filter(c => c.priority === 'urgent' && c.status !== 'validated' && c.status !== 'archived').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="gap-1"><FileText className="h-3 w-3" />{t('cases.statusDraft')}</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground gap-1"><Clock className="h-3 w-3" />{t('cases.statusPending')}</Badge>;
      case 'analyzing':
        return <Badge className="bg-primary text-primary-foreground gap-1"><Microscope className="h-3 w-3" />{t('cases.statusAnalyzing')}</Badge>;
      case 'validated':
        return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle className="h-3 w-3" />{t('cases.statusValidated')}</Badge>;
      case 'archived':
        return <Badge variant="outline" className="gap-1"><Archive className="h-3 w-3" />{t('cases.statusArchived')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">{t('priority.urgent')}</Badge>;
      case 'high':
        return <Badge className="bg-warning text-warning-foreground">{t('priority.high')}</Badge>;
      default:
        return null;
    }
  };

  const getPathologyBadge = (pathology: string) => {
    return pathology === 'breast' ? (
      <Badge variant="outline" className="border-accent text-accent">{t('pathology.breast')}</Badge>
    ) : (
      <Badge variant="outline" className="border-primary text-primary">{t('pathology.cervical')}</Badge>
    );
  };

  const uniqueCenters = [...new Set(dbCases.map(c => c.center))].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('cases.title')}
          </h1>
          <p className="text-muted-foreground">{t('cases.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {urgentCases > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {urgentCases} {t('cases.urgentPending')}
            </Badge>
          )}
          <Button variant="outline" className="gap-2" onClick={fetchCasesFromDB} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('action.refresh')}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('cases.export')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title={t('cases.totalCases')}
          value={totalCases}
          icon={FileText}
          iconColor="text-primary"
        />
        <StatCard
          title={t('cases.pending')}
          value={pendingCases}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title={t('cases.analyzing')}
          value={analyzingCases}
          icon={Microscope}
          iconColor="text-accent"
        />
        <StatCard
          title={t('cases.validated')}
          value={validatedCases}
          icon={CheckCircle}
          iconColor="text-success"
        />
        <StatCard
          title={t('cases.urgent')}
          value={urgentCases}
          icon={AlertTriangle}
          iconColor="text-destructive"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('cases.listTab')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('cases.analyticsTab')}
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('cases.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder={t('cases.filterStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('cases.allStatuses')}</SelectItem>
                    <SelectItem value="draft">{t('cases.statusDraft')}</SelectItem>
                    <SelectItem value="pending">{t('cases.statusPending')}</SelectItem>
                    <SelectItem value="analyzing">{t('cases.statusAnalyzing')}</SelectItem>
                    <SelectItem value="validated">{t('cases.statusValidated')}</SelectItem>
                    <SelectItem value="archived">{t('cases.statusArchived')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPathology} onValueChange={setFilterPathology}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder={t('filter.pathology')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filter.allPathologies')}</SelectItem>
                    <SelectItem value="breast">{t('pathology.breast')}</SelectItem>
                    <SelectItem value="cervical">{t('pathology.cervical')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCenter} onValueChange={setFilterCenter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <Building className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('cases.filterCenter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('cases.allCenters')}</SelectItem>
                    {uniqueCenters.map(center => (
                      <SelectItem key={center as string} value={center as string}>{center as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-full lg:w-36">
                    <SelectValue placeholder={t('filter.priority')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filter.allPriorities')}</SelectItem>
                    <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                    <SelectItem value="high">{t('priority.high')}</SelectItem>
                    <SelectItem value="normal">{t('priority.normal')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cases Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('cases.casesList')} ({filteredCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredCases.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg mx-4 mb-4">
                    Aucun dossier trouvé selon vos critères.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('table.caseId')}</TableHead>
                        <TableHead>{t('table.patient')}</TableHead>
                        <TableHead>{t('table.pathology')}</TableHead>
                        <TableHead>{t('table.status')}</TableHead>
                        <TableHead>{t('table.priority')}</TableHead>
                        <TableHead>{t('table.center')}</TableHead>
                        <TableHead>{t('cases.assignedTo')}</TableHead>
                        <TableHead>{t('table.date')}</TableHead>
                        <TableHead className="text-right">{t('table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.map((caseItem) => (
                        <TableRow key={caseItem.id} className={caseItem.priority === 'urgent' && caseItem.status !== 'validated' ? 'bg-destructive/5' : ''}>
                          <TableCell className="font-mono font-medium">{caseItem.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{caseItem.patientName}</p>
                              <p className="text-xs text-muted-foreground">{caseItem.patientId}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getPathologyBadge(caseItem.pathology)}</TableCell>
                          <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                          <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                          <TableCell className="text-sm">{caseItem.center}</TableCell>
                          <TableCell className="text-sm">
                            {caseItem.assignedTo || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{caseItem.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedCase(caseItem)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('cases.viewDetails')}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  {t('cases.downloadReport')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {caseItem.status === 'validated' && (
                                  <DropdownMenuItem>
                                    <Archive className="h-4 w-4 mr-2" />
                                    {t('cases.archive')}
                                  </DropdownMenuItem>
                                )}
                                {caseItem.status === 'pending' && (
                                  <DropdownMenuItem>
                                    <Microscope className="h-4 w-4 mr-2" />
                                    {t('cases.assignPathologist')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {t('cases.cancel')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('cases.trendChart')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} name={t('cases.created')} />
                    <Line type="monotone" dataKey="validated" stroke="hsl(var(--success))" strokeWidth={2} name={t('cases.validated')} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Center Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-accent" />
                  {t('cases.centerDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={centerData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="center" type="category" className="text-xs" width={120} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="cases" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t('cases.summaryStats')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-primary">1,248</p>
                  <p className="text-sm text-muted-foreground">{t('cases.totalThisYear')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-success">94%</p>
                  <p className="text-sm text-muted-foreground">{t('cases.validationRate')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-accent">4.2h</p>
                  <p className="text-sm text-muted-foreground">{t('cases.avgTurnaround')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-warning">5</p>
                  <p className="text-sm text-muted-foreground">{t('cases.activeCenters')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Details Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('cases.caseDetails')} - {selectedCase?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.patient')}</p>
                  <p className="font-medium">{selectedCase.patientName}</p>
                  <p className="text-sm text-muted-foreground">{selectedCase.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.pathology')}</p>
                  {getPathologyBadge(selectedCase.pathology)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.status')}</p>
                  {getStatusBadge(selectedCase.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.priority')}</p>
                  {getPriorityBadge(selectedCase.priority) || <span className="text-muted-foreground">{t('priority.normal')}</span>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.center')}</p>
                  <p className="font-medium">{selectedCase.center}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('cases.createdBy')}</p>
                  <p className="font-medium">{selectedCase.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('cases.createdAt')}</p>
                  <p className="font-medium">{selectedCase.createdAt}</p>
                </div>
                {selectedCase.assignedTo && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('cases.assignedTo')}</p>
                    <p className="font-medium">{selectedCase.assignedTo}</p>
                  </div>
                )}
                {selectedCase.validatedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('cases.validatedAt')}</p>
                    <p className="font-medium">{selectedCase.validatedAt}</p>
                  </div>
                )}
                {selectedCase.diagnosis && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('cases.diagnosis')}</p>
                    <p className="font-medium">{selectedCase.diagnosis}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedCase(null)}>
                  {t('action.close')}
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('cases.downloadReport')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CasesPage;