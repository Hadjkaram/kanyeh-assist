import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Search,
  Filter,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Eye,
  Download,
  Microscope,
  AlertTriangle,
  Target,
  Award,
  BarChart3,
  Loader2, // NOUVEAU: Importé pour l'état de chargement
} from 'lucide-react';
import { supabase } from '@/lib/supabase'; // NOUVEAU: Import Supabase

interface AnalyzedCase {
  id: string;
  patientId: string;
  patientName: string;
  pathology: 'breast' | 'cervical';
  diagnosis: 'normal' | 'benign' | 'atypical' | 'suspicious' | 'malignant';
  center: string;
  analyzedAt: string;
  analysisTime: string;
  submittedBy: string;
  hasSecondOpinion: boolean;
  aiAssisted: boolean;
  notes: string;
}

// Données statiques gardées pour préserver le design parfait de tes graphiques
const evolutionData = [
  { month: 'Août', analyses: 45, avgTime: 28 },
  { month: 'Sept', analyses: 52, avgTime: 25 },
  { month: 'Oct', analyses: 58, avgTime: 24 },
  { month: 'Nov', analyses: 61, avgTime: 22 },
  { month: 'Déc', analyses: 67, avgTime: 21 },
  { month: 'Jan', analyses: 72, avgTime: 20 },
];

const diagnosisDistribution = [
  { name: 'Normal', value: 35, color: 'hsl(var(--success))' },
  { name: 'Bénin', value: 28, color: 'hsl(var(--primary))' },
  { name: 'Atypique', value: 18, color: 'hsl(var(--warning))' },
  { name: 'Suspect', value: 12, color: 'hsl(var(--accent))' },
  { name: 'Malin', value: 7, color: 'hsl(var(--destructive))' },
];

const weeklyData = [
  { day: 'Lun', breast: 5, cervical: 3 },
  { day: 'Mar', breast: 4, cervical: 6 },
  { day: 'Mer', breast: 6, cervical: 4 },
  { day: 'Jeu', breast: 3, cervical: 5 },
  { day: 'Ven', breast: 7, cervical: 4 },
  { day: 'Sam', breast: 2, cervical: 1 },
  { day: 'Dim', breast: 0, cervical: 0 },
];

const MyAnalysesPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPathology, setFilterPathology] = useState<string>('all');
  const [filterDiagnosis, setFilterDiagnosis] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalyzedCase | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // ETATS SUPABASE
  const [dbAnalyses, setDbAnalyses] = useState<AnalyzedCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour récupérer les cas validés depuis Supabase
  useEffect(() => {
    const fetchAnalyses = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('status', 'validated')
        .order('validated_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map((d: any) => {
          // Mapping dynamique du diagnostic texte vers ta catégorisation stricte
          let mappedDiag: AnalyzedCase['diagnosis'] = 'normal';
          const dText = (d.diagnosis || '').toLowerCase();
          if (dText.includes('bénin') || dText.includes('benign') || dText.includes('benin')) mappedDiag = 'benign';
          else if (dText.includes('atypique') || dText.includes('atypical')) mappedDiag = 'atypical';
          else if (dText.includes('suspect') || dText.includes('suspicious')) mappedDiag = 'suspicious';
          else if (dText.includes('malin') || dText.includes('malignant') || dText.includes('carcinome')) mappedDiag = 'malignant';

          return {
            id: d.case_reference || d.id.substring(0, 8),
            patientId: d.patient_id || 'N/A',
            patientName: d.patient_name,
            pathology: d.pathology as 'breast' | 'cervical',
            diagnosis: mappedDiag,
            center: d.center,
            analyzedAt: d.validated_at 
              ? new Date(d.validated_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) 
              : new Date(d.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
            analysisTime: '20min', // Simulé pour l'instant
            submittedBy: 'Système',
            hasSecondOpinion: false,
            aiAssisted: true,
            notes: d.analysis_notes || 'Aucune note',
          };
        });
        setDbAnalyses(formatted);
      }
      setIsLoading(false);
    };

    fetchAnalyses();
  }, []);

  const filteredAnalyses = dbAnalyses.filter((analysis) => {
    const matchesSearch =
      analysis.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPathology = filterPathology === 'all' || analysis.pathology === filterPathology;
    const matchesDiagnosis = filterDiagnosis === 'all' || analysis.diagnosis === filterDiagnosis;
    return matchesSearch && matchesPathology && matchesDiagnosis;
  });

  const totalAnalyses = dbAnalyses.length;
  const todayDateStr = new Date().toLocaleDateString('fr-FR', { dateStyle: 'short' });
  const todayAnalyses = dbAnalyses.filter(a => a.analyzedAt.includes(todayDateStr)).length;
  const avgAnalysisTime = 20; // Moyenne simulée conservée
  const secondOpinionCount = dbAnalyses.filter(a => a.hasSecondOpinion).length;

  const getDiagnosisBadge = (diagnosis: string) => {
    switch (diagnosis) {
      case 'normal':
        return <Badge className="bg-success text-success-foreground">{t('diagnosis.normal')}</Badge>;
      case 'benign':
        return <Badge className="bg-primary text-primary-foreground">{t('diagnosis.benign')}</Badge>;
      case 'atypical':
        return <Badge className="bg-warning text-warning-foreground">{t('diagnosis.atypical')}</Badge>;
      case 'suspicious':
        return <Badge className="bg-accent text-accent-foreground">{t('diagnosis.suspicious')}</Badge>;
      case 'malignant':
        return <Badge variant="destructive">{t('diagnosis.malignant')}</Badge>;
      default:
        return <Badge variant="secondary">{diagnosis}</Badge>;
    }
  };

  const getPathologyBadge = (pathology: string) => {
    return pathology === 'breast' ? (
      <Badge variant="outline" className="border-accent text-accent">{t('pathology.breast')}</Badge>
    ) : (
      <Badge variant="outline" className="border-primary text-primary">{t('pathology.cervical')}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('myAnalyses.title')}
          </h1>
          <p className="text-muted-foreground">{t('myAnalyses.subtitle')}</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t('myAnalyses.exportReport')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('myAnalyses.totalAnalyses')}
          value={totalAnalyses}
          change={12}
          changeLabel={t('stats.thisMonth')}
          icon={FileText}
          iconColor="text-primary"
        />
        <StatCard
          title={t('myAnalyses.analyzedToday')}
          value={todayAnalyses}
          icon={CheckCircle}
          iconColor="text-success"
        />
        <StatCard
          title={t('myAnalyses.avgTime')}
          value={`${avgAnalysisTime}min`}
          change={-15}
          changeLabel={t('stats.faster')}
          icon={Clock}
          iconColor="text-accent"
        />
        <StatCard
          title={t('myAnalyses.secondOpinions')}
          value={secondOpinionCount}
          icon={Target}
          iconColor="text-warning"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('myAnalyses.listTab')}
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('myAnalyses.statsTab')}
          </TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('myAnalyses.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterPathology} onValueChange={setFilterPathology}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder={t('filter.pathology')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('filter.allPathologies')}</SelectItem>
                    <SelectItem value="breast">{t('pathology.breast')}</SelectItem>
                    <SelectItem value="cervical">{t('pathology.cervical')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDiagnosis} onValueChange={setFilterDiagnosis}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder={t('myAnalyses.filterDiagnosis')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('myAnalyses.allDiagnoses')}</SelectItem>
                    <SelectItem value="normal">{t('diagnosis.normal')}</SelectItem>
                    <SelectItem value="benign">{t('diagnosis.benign')}</SelectItem>
                    <SelectItem value="atypical">{t('diagnosis.atypical')}</SelectItem>
                    <SelectItem value="suspicious">{t('diagnosis.suspicious')}</SelectItem>
                    <SelectItem value="malignant">{t('diagnosis.malignant')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('myAnalyses.filterPeriod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('myAnalyses.allPeriods')}</SelectItem>
                    <SelectItem value="today">{t('myCases.today')}</SelectItem>
                    <SelectItem value="week">{t('myCases.thisWeek')}</SelectItem>
                    <SelectItem value="month">{t('myCases.thisMonth')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Analyses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-primary" />
                {t('myAnalyses.analysesHistory')} ({filteredAnalyses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.caseId')}</TableHead>
                      <TableHead>{t('table.patient')}</TableHead>
                      <TableHead>{t('table.pathology')}</TableHead>
                      <TableHead>{t('myAnalyses.diagnosis')}</TableHead>
                      <TableHead>{t('table.center')}</TableHead>
                      <TableHead>{t('myAnalyses.analyzedAt')}</TableHead>
                      <TableHead>{t('myAnalyses.duration')}</TableHead>
                      <TableHead>{t('myAnalyses.tools')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : filteredAnalyses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                          Aucune analyse trouvée.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAnalyses.map((analysis) => (
                        <TableRow key={analysis.id}>
                          <TableCell className="font-mono font-medium">{analysis.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{analysis.patientName}</p>
                              <p className="text-xs text-muted-foreground">{analysis.patientId}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getPathologyBadge(analysis.pathology)}</TableCell>
                          <TableCell>{getDiagnosisBadge(analysis.diagnosis)}</TableCell>
                          <TableCell className="text-sm">{analysis.center}</TableCell>
                          <TableCell className="text-sm">{analysis.analyzedAt}</TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{analysis.analysisTime}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {analysis.aiAssisted && (
                                <Badge variant="outline" className="text-xs">IA</Badge>
                              )}
                              {analysis.hasSecondOpinion && (
                                <Badge variant="outline" className="text-xs border-warning text-warning">2nd</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAnalysis(analysis)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t('myAnalyses.evolutionChart')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="analyses" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name={t('myAnalyses.analysesCount')}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="avgTime" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      name={t('myAnalyses.avgTimeMin')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Diagnosis Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  {t('myAnalyses.diagnosisDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={diagnosisDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {diagnosisDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-success" />
                  {t('myAnalyses.weeklyActivity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="breast" fill="hsl(var(--accent))" name={t('pathology.breast')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cervical" fill="hsl(var(--primary))" name={t('pathology.cervical')} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-warning" />
                {t('myAnalyses.performanceSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-primary">72</p>
                  <p className="text-sm text-muted-foreground">{t('myAnalyses.thisMonthTotal')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-success">20min</p>
                  <p className="text-sm text-muted-foreground">{t('myAnalyses.avgAnalysisTime')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-accent">94%</p>
                  <p className="text-sm text-muted-foreground">{t('myAnalyses.aiAgreementRate')}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-warning">8</p>
                  <p className="text-sm text-muted-foreground">{t('myAnalyses.secondOpinionsGiven')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Details Dialog */}
      <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('myAnalyses.analysisDetails')} - {selectedAnalysis?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('table.patient')}</p>
                  <p className="font-medium">{selectedAnalysis.patientName}</p>
                  <p className="text-sm text-muted-foreground">{selectedAnalysis.patientId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('table.pathology')}</p>
                  {getPathologyBadge(selectedAnalysis.pathology)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('myAnalyses.diagnosis')}</p>
                  {getDiagnosisBadge(selectedAnalysis.diagnosis)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('table.center')}</p>
                  <p className="font-medium">{selectedAnalysis.center}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('myAnalyses.analyzedAt')}</p>
                  <p className="font-medium">{selectedAnalysis.analyzedAt}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('myAnalyses.duration')}</p>
                  <p className="font-medium">{selectedAnalysis.analysisTime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('table.submittedBy')}</p>
                  <p className="font-medium">{selectedAnalysis.submittedBy}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('myAnalyses.tools')}</p>
                  <div className="flex gap-2">
                    {selectedAnalysis.aiAssisted && <Badge variant="outline">IA</Badge>}
                    {selectedAnalysis.hasSecondOpinion && <Badge variant="outline" className="border-warning text-warning">Second avis</Badge>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('myAnalyses.notes')}</p>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{selectedAnalysis.notes}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('myAnalyses.downloadReport')}
                </Button>
                <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
                  {t('action.close')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAnalysesPage;