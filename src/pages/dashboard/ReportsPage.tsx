import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import StatCard from '@/components/dashboard/StatCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Eye,
  Plus,
  Loader2,
  Building,
  Users,
  Microscope,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Report {
  id: string;
  name: string;
  type: 'activity' | 'performance' | 'diagnostic' | 'custom';
  period: string;
  generatedAt: string;
  generatedBy: string;
  status: 'ready' | 'generating' | 'scheduled';
  format: 'pdf' | 'excel' | 'csv';
  size: string;
}

const mockReports: Report[] = [
  { id: 'RPT-001', name: 'Rapport d\'activité mensuel - Janvier 2025', type: 'activity', period: 'Janvier 2025', generatedAt: '2025-01-19 08:00', generatedBy: 'Système', status: 'ready', format: 'pdf', size: '2.4 MB' },
  { id: 'RPT-002', name: 'Performance des pathologistes - Q4 2024', type: 'performance', period: 'Oct-Déc 2024', generatedAt: '2025-01-15 10:30', generatedBy: 'Dr. Admin', status: 'ready', format: 'excel', size: '1.8 MB' },
  { id: 'RPT-003', name: 'Distribution diagnostics - 2024', type: 'diagnostic', period: 'Année 2024', generatedAt: '2025-01-10 14:00', generatedBy: 'Système', status: 'ready', format: 'pdf', size: '5.2 MB' },
  { id: 'RPT-004', name: 'Rapport hebdomadaire - Semaine 3', type: 'activity', period: 'Semaine 3/2025', generatedAt: '2025-01-19 06:00', generatedBy: 'Système', status: 'generating', format: 'pdf', size: '-' },
  { id: 'RPT-005', name: 'Analyse par centre - CHU Abidjan', type: 'custom', period: 'Janvier 2025', generatedAt: '2025-01-18 16:45', generatedBy: 'Dr. Konan', status: 'ready', format: 'excel', size: '892 KB' },
];

const activityData = [
  { month: 'Août', cases: 145, analyzed: 142, validated: 138 },
  { month: 'Sept', cases: 162, analyzed: 158, validated: 155 },
  { month: 'Oct', cases: 178, analyzed: 175, validated: 170 },
  { month: 'Nov', cases: 185, analyzed: 182, validated: 178 },
  { month: 'Déc', cases: 198, analyzed: 195, validated: 190 },
  { month: 'Jan', cases: 156, analyzed: 148, validated: 142 },
];

const diagnosisData = [
  { name: 'Normal', value: 42, color: 'hsl(var(--success))' },
  { name: 'Bénin', value: 28, color: 'hsl(var(--primary))' },
  { name: 'Atypique', value: 15, color: 'hsl(var(--warning))' },
  { name: 'Suspect', value: 10, color: 'hsl(var(--accent))' },
  { name: 'Malin', value: 5, color: 'hsl(var(--destructive))' },
];

const centerPerformance = [
  { center: 'CHU Abidjan', cases: 245, avgTime: 18, validation: 96 },
  { center: 'CHU Bouaké', cases: 189, avgTime: 22, validation: 94 },
  { center: 'CS Yamoussoukro', cases: 134, avgTime: 25, validation: 92 },
  { center: 'CS San-Pedro', cases: 98, avgTime: 28, validation: 90 },
  { center: 'CHU Cocody', cases: 167, avgTime: 20, validation: 95 },
];

const ReportsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);
  const [newReportType, setNewReportType] = useState('');
  const [newReportPeriod, setNewReportPeriod] = useState('');
  const [newReportFormat, setNewReportFormat] = useState('pdf');

  // État Supabase pour un compteur réel
  const [realTotalCases, setRealTotalCases] = useState<number>(1024);

  useEffect(() => {
    const fetchRealStats = async () => {
      const { count } = await supabase.from('cases').select('*', { count: 'exact', head: true });
      if (count !== null) setRealTotalCases(count);
    };
    fetchRealStats();
  }, []);

  const filteredReports = mockReports.filter((report) => {
    const matchesType = filterType === 'all' || report.type === filterType;
    return matchesType;
  });

  const readyReports = mockReports.filter(r => r.status === 'ready').length;
  const generatingReports = mockReports.filter(r => r.status === 'generating').length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'activity':
        return <Badge className="bg-primary text-primary-foreground">{t('reports.typeActivity')}</Badge>;
      case 'performance':
        return <Badge className="bg-accent text-accent-foreground">{t('reports.typePerformance')}</Badge>;
      case 'diagnostic':
        return <Badge className="bg-success text-success-foreground">{t('reports.typeDiagnostic')}</Badge>;
      case 'custom':
        return <Badge variant="outline">{t('reports.typeCustom')}</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle className="h-3 w-3" />{t('reports.statusReady')}</Badge>;
      case 'generating':
        return <Badge className="bg-warning text-warning-foreground gap-1"><Loader2 className="h-3 w-3 animate-spin" />{t('reports.statusGenerating')}</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{t('reports.statusScheduled')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-destructive" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-success" />;
      case 'csv':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerateProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setGenerateProgress(i);
    }
    
    setIsGenerating(false);
    setShowNewReportDialog(false);
    setNewReportType('');
    setNewReportPeriod('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('reports.title')}
          </h1>
          <p className="text-muted-foreground">{t('reports.subtitle')}</p>
        </div>
        <Button onClick={() => setShowNewReportDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('reports.generateNew')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('reports.totalReports')}
          value={mockReports.length}
          icon={FileText}
          iconColor="text-primary"
        />
        <StatCard
          title={t('reports.readyToDownload')}
          value={readyReports}
          icon={Download}
          iconColor="text-success"
        />
        <StatCard
          title={t('reports.generating')}
          value={generatingReports}
          icon={Loader2}
          iconColor="text-warning"
        />
        <StatCard
          title={t('reports.thisMonth')}
          value={3}
          icon={Calendar}
          iconColor="text-accent"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('reports.dashboardTab')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('reports.reportsTab')}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('reports.activityTrend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cases" stroke="hsl(var(--primary))" strokeWidth={2} name={t('reports.casesCreated')} />
                    <Line type="monotone" dataKey="analyzed" stroke="hsl(var(--accent))" strokeWidth={2} name={t('reports.casesAnalyzed')} />
                    <Line type="monotone" dataKey="validated" stroke="hsl(var(--success))" strokeWidth={2} name={t('reports.casesValidated')} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Diagnosis Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-accent" />
                  {t('reports.diagnosisDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={diagnosisData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {diagnosisData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Center Performance */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-success" />
                  {t('reports.centerPerformance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={centerPerformance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="center" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="cases" fill="hsl(var(--primary))" name={t('reports.totalCases')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="validation" fill="hsl(var(--success))" name={t('reports.validationRate')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Microscope className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{realTotalCases}</p>
              <p className="text-sm text-muted-foreground">{t('reports.totalCasesYear')}</p>
            </Card>
            <Card className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold">22min</p>
              <p className="text-sm text-muted-foreground">{t('reports.avgAnalysisTime')}</p>
            </Card>
            <Card className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">{t('reports.activePathologists')}</p>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-warning mb-2" />
              <p className="text-2xl font-bold">94%</p>
              <p className="text-sm text-muted-foreground">{t('reports.validationRate')}</p>
            </Card>
          </div>
        </TabsContent>

        {/* Reports List Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('reports.filterType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reports.allTypes')}</SelectItem>
                    <SelectItem value="activity">{t('reports.typeActivity')}</SelectItem>
                    <SelectItem value="performance">{t('reports.typePerformance')}</SelectItem>
                    <SelectItem value="diagnostic">{t('reports.typeDiagnostic')}</SelectItem>
                    <SelectItem value="custom">{t('reports.typeCustom')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('reports.filterPeriod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reports.allPeriods')}</SelectItem>
                    <SelectItem value="week">{t('reports.thisWeek')}</SelectItem>
                    <SelectItem value="month">{t('reports.thisMonth')}</SelectItem>
                    <SelectItem value="quarter">{t('reports.thisQuarter')}</SelectItem>
                    <SelectItem value="year">{t('reports.thisYear')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getFormatIcon(report.format)}
                      <span className="text-xs text-muted-foreground uppercase">{report.format}</span>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>
                  <CardTitle className="text-base mt-2">{report.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {report.period}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{report.generatedAt}</span>
                    <span>{report.size}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    {getTypeBadge(report.type)}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="h-4 w-4" />
                      {t('reports.preview')}
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1"
                      disabled={report.status !== 'ready'}
                    >
                      <Download className="h-4 w-4" />
                      {t('reports.download')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Generate New Report Dialog */}
      <Dialog open={showNewReportDialog} onOpenChange={setShowNewReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('reports.generateNewTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('reports.reportType')}</label>
              <Select value={newReportType} onValueChange={setNewReportType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity">{t('reports.typeActivity')}</SelectItem>
                  <SelectItem value="performance">{t('reports.typePerformance')}</SelectItem>
                  <SelectItem value="diagnostic">{t('reports.typeDiagnostic')}</SelectItem>
                  <SelectItem value="custom">{t('reports.typeCustom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('reports.period')}</label>
              <Select value={newReportPeriod} onValueChange={setNewReportPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectPeriod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{t('reports.today')}</SelectItem>
                  <SelectItem value="week">{t('reports.thisWeek')}</SelectItem>
                  <SelectItem value="month">{t('reports.thisMonth')}</SelectItem>
                  <SelectItem value="quarter">{t('reports.thisQuarter')}</SelectItem>
                  <SelectItem value="year">{t('reports.thisYear')}</SelectItem>
                  <SelectItem value="custom">{t('reports.customPeriod')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('reports.format')}</label>
              <Select value={newReportFormat} onValueChange={setNewReportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{t('reports.generatingReport')}</span>
                  <span>{generateProgress}%</span>
                </div>
                <Progress value={generateProgress} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewReportDialog(false)} disabled={isGenerating}>
              {t('action.cancel')}
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={!newReportType || !newReportPeriod || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('reports.generating')}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  {t('reports.generate')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedReport?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.type')}</p>
                  {getTypeBadge(selectedReport.type)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.status')}</p>
                  {getStatusBadge(selectedReport.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.period')}</p>
                  <p className="font-medium">{selectedReport.period}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.generatedAt')}</p>
                  <p className="font-medium">{selectedReport.generatedAt}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.generatedBy')}</p>
                  <p className="font-medium">{selectedReport.generatedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.fileSize')}</p>
                  <p className="font-medium">{selectedReport.size}</p>
                </div>
              </div>

              {/* Preview placeholder */}
              <div className="aspect-video bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t('reports.previewPlaceholder')}</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  {t('action.close')}
                </Button>
                <Button variant="outline" className="gap-2">
                  <Printer className="h-4 w-4" />
                  {t('reports.print')}
                </Button>
                <Button className="gap-2" disabled={selectedReport.status !== 'ready'}>
                  <Download className="h-4 w-4" />
                  {t('reports.download')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;