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
import { Progress } from '@/components/ui/progress';
import StatCard from '@/components/dashboard/StatCard';
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel';
import MicroscopeLiveView from '@/components/ai/MicroscopeLiveView';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Microscope,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Brain,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Move,
  Lock,
  Radio,
  Loader2
} from 'lucide-react';

interface CaseToAnalyze {
  id: string;
  caseReference?: string;
  patientId: string;
  patientName: string;
  pathology: 'breast' | 'cervical';
  priority: 'urgent' | 'high' | 'normal';
  center: string;
  submittedAt: string;
  submittedBy: string;
  imagesCount: number;
  waitTime: string;
  status: 'pending' | 'analyzing';
}

const ToAnalyzePage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPathology, setFilterPathology] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<CaseToAnalyze | null>(null);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  
  const [viewMode, setViewMode] = useState<'static' | 'live'>('static');

  const [realCases, setRealCases] = useState<CaseToAnalyze[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erreur de récupération Supabase:", error);
      } else if (data) {
        const formattedData = data.map((d: any) => ({
          id: d.id,
          caseReference: d.case_reference,
          patientId: d.patient_id || 'N/A',
          patientName: d.patient_name || 'Inconnu',
          pathology: d.pathology,
          priority: d.priority || 'normal',
          center: d.center || 'Centre inconnu',
          submittedAt: new Date(d.created_at).toLocaleString('fr-FR'),
          submittedBy: d.submitted_by || 'Technicien',
          imagesCount: d.images_count || 0,
          waitTime: 'En attente', 
          status: d.status
        })) as CaseToAnalyze[];
        
        setRealCases(formattedData);
      }
      setIsLoading(false);
    };

    fetchCases();
  }, []);

  const filteredCases = realCases.filter((caseItem) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' ||
      (caseItem.caseReference || '').toLowerCase().includes(searchLower) ||
      (caseItem.patientName || '').toLowerCase().includes(searchLower) ||
      (caseItem.patientId || '').toLowerCase().includes(searchLower);
      
    const matchesPathology = filterPathology === 'all' || caseItem.pathology === filterPathology;
    const matchesPriority = filterPriority === 'all' || caseItem.priority === filterPriority;
    
    return matchesSearch && matchesPathology && matchesPriority;
  });

  const urgentCount = realCases.filter(c => c.priority === 'urgent').length;
  const highPriorityCount = realCases.filter(c => c.priority === 'high').length;
  const analyzingCount = realCases.filter(c => c.status === 'analyzing').length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">{t('priority.urgent')}</Badge>;
      case 'high': return <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">{t('priority.high')}</Badge>;
      default: return <Badge variant="secondary">{t('priority.normal')}</Badge>;
    }
  };

  const getPathologyBadge = (pathology: string) => {
    return pathology === 'breast' ? (
      <Badge variant="outline" className="border-accent text-accent">{t('pathology.breast')}</Badge>
    ) : (
      <Badge variant="outline" className="border-primary text-primary">{t('pathology.cervical')}</Badge>
    );
  };

  const startAnalysis = (caseItem: CaseToAnalyze) => {
    setSelectedCase(caseItem);
    setIsAnalysisMode(true);
    setCurrentImageIndex(0);
    setZoomLevel(100);
    setAnalysisNotes('');
    setDiagnosis('');
    setViewMode('static');
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const submitAnalysis = async () => {
    if (!selectedCase) return;
    
    try {
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'validated',
          diagnosis: diagnosis,
          analysis_notes: analysisNotes,
          validated_at: new Date().toISOString()
        })
        .eq('id', selectedCase.id);

      if (updateError) throw updateError;

      await supabase.from('activities').insert([
        {
          case_id: selectedCase.id,
          user_id: user?.id, 
          action_type: 'analysis_completed',
          description: `Diagnostic rendu pour le dossier ${selectedCase.caseReference || selectedCase.id}. Conclusion : ${diagnosis}`,
        }
      ]);

      toast.success('Le diagnostic a été enregistré et transmis au clinicien avec succès !');
      
      setIsAnalysisMode(false);
      setSelectedCase(null);
      setRealCases(prev => prev.filter(c => c.id !== selectedCase.id));

    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement du diagnostic.");
    }
  };

  const isHumanDiagnosisComplete = analysisNotes.trim().length > 10 || diagnosis !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('dashboard.toAnalyze.title')}
          </h1>
          <p className="text-muted-foreground">{t('dashboard.toAnalyze.subtitle')}</p>
        </div>
        {urgentCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {urgentCount} {t('dashboard.toAnalyze.urgentCases')}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('dashboard.toAnalyze.totalPending')} value={realCases.length} icon={Microscope} iconColor="text-primary" />
        <StatCard title={t('dashboard.toAnalyze.urgentPriority')} value={urgentCount + highPriorityCount} icon={AlertTriangle} iconColor="text-destructive" />
        <StatCard title={t('dashboard.toAnalyze.inProgress')} value={analyzingCount} icon={Clock} iconColor="text-accent" />
        <StatCard title={t('dashboard.toAnalyze.avgWaitTime')} value="Temps Réel" icon={Clock} iconColor="text-muted-foreground" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('dashboard.toAnalyze.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterPathology} onValueChange={setFilterPathology}>
              <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder={t('filter.pathology')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.allPathologies')}</SelectItem>
                <SelectItem value="breast">{t('pathology.breast')}</SelectItem>
                <SelectItem value="cervical">{t('pathology.cervical')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder={t('filter.priority')} /></SelectTrigger>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Microscope className="h-5 w-5 text-primary" />
            {t('dashboard.toAnalyze.casesList')} ({filteredCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Chargement des données depuis Supabase...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.caseId')}</TableHead>
                    <TableHead>{t('table.patient')}</TableHead>
                    <TableHead>{t('table.pathology')}</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>{t('table.center')}</TableHead>
                    <TableHead>{t('table.submittedBy')}</TableHead>
                    <TableHead>{t('table.waitTime')}</TableHead>
                    <TableHead>{t('table.images')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id} className={caseItem.priority === 'urgent' ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-mono font-medium">{caseItem.caseReference || caseItem.id.substring(0,8)}</TableCell>
                      <TableCell><div><p className="font-medium">{caseItem.patientName}</p><p className="text-xs text-muted-foreground">{caseItem.patientId}</p></div></TableCell>
                      <TableCell>{getPathologyBadge(caseItem.pathology)}</TableCell>
                      <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                      <TableCell className="text-sm">{caseItem.center}</TableCell>
                      <TableCell className="text-sm">{caseItem.submittedBy}</TableCell>
                      <TableCell><span className={caseItem.priority === 'urgent' ? 'text-destructive font-medium' : 'text-muted-foreground'}>{caseItem.waitTime}</span></TableCell>
                      <TableCell className="text-center">{caseItem.imagesCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCase(caseItem)}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" onClick={() => startAnalysis(caseItem)} className="gap-1"><Play className="h-4 w-4" />{t('action.analyze')}</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center p-8 text-muted-foreground">
                        Aucun cas trouvé dans la base de données.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCase && !isAnalysisMode} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('dashboard.toAnalyze.caseDetails')} - {selectedCase?.caseReference}
            </DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><p className="text-sm text-muted-foreground">{t('table.patient')}</p><p className="font-medium">{selectedCase.patientName}</p><p className="text-sm text-muted-foreground">{selectedCase.patientId}</p></div>
                <div className="space-y-2"><p className="text-sm text-muted-foreground">{t('table.pathology')}</p>{getPathologyBadge(selectedCase.pathology)}</div>
                <div className="space-y-2"><p className="text-sm text-muted-foreground">{t('table.center')}</p><p className="font-medium">{selectedCase.center}</p></div>
                <div className="space-y-2"><p className="text-sm text-muted-foreground">Priorité</p>{getPriorityBadge(selectedCase.priority)}</div>
                <div className="space-y-2"><p className="text-sm text-muted-foreground">{t('table.submittedBy')}</p><p className="font-medium">{selectedCase.submittedBy}</p></div>
                <div className="space-y-2"><p className="text-sm text-muted-foreground">{t('table.submittedAt')}</p><p className="font-medium">{selectedCase.submittedAt}</p></div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedCase(null)}>{t('action.close')}</Button>
                <Button onClick={() => startAnalysis(selectedCase)} className="gap-2"><Play className="h-4 w-4" />{t('action.startAnalysis')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAnalysisMode} onOpenChange={() => setIsAnalysisMode(false)}>
        <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Microscope className="h-5 w-5" />
                {t('dashboard.toAnalyze.analysisMode')} - {selectedCase?.caseReference}
                {selectedCase && getPriorityBadge(selectedCase.priority)}
              </div>
              <div className="flex items-center gap-2 text-sm font-normal">
                <span className="text-muted-foreground">{selectedCase?.patientName}</span>
                {selectedCase && getPathologyBadge(selectedCase.pathology)}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
            <div className="lg:col-span-3 flex flex-col space-y-3">
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                
                <div className="flex bg-background rounded-md p-1 border">
                  <Button 
                    variant={viewMode === 'static' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('static')}
                  >
                    Images Capturées
                  </Button>
                  <Button 
                    variant={viewMode === 'live' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    onClick={() => setViewMode('live')} 
                    className="gap-2"
                  >
                    <Radio className={`h-4 w-4 ${viewMode === 'live' ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} /> 
                    Direct {selectedCase?.center}
                  </Button>
                </div>

                {viewMode === 'static' && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))} disabled={currentImageIndex === 0}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm">{t('dashboard.toAnalyze.image')} {currentImageIndex + 1} / {selectedCase?.imagesCount || 0}</span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentImageIndex(prev => Math.min((selectedCase?.imagesCount || 1) - 1, prev + 1))} disabled={currentImageIndex === (selectedCase?.imagesCount || 1) - 1}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                  <span className="text-sm w-12 text-center">{zoomLevel}%</span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={handleResetZoom}><RotateCw className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Move className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Maximize2 className="h-4 w-4" /></Button>
                </div>
              </div>
              
              <div className="flex-1 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-auto p-4">
                
                {viewMode === 'live' ? (
                  <div className="w-full h-full max-w-4xl max-h-[600px]">
                  {/* CORRECTION : L'erreur rouge est partie, on l'appelle proprement */}
                  <MicroscopeLiveView />
                  </div>
                ) : (
                  <div className="transition-transform duration-200" style={{ transform: `scale(${zoomLevel / 100})` }}>
                    <div className="w-[600px] h-[400px] bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Microscope className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">{t('dashboard.toAnalyze.imagePlaceholder')}</p>
                        <p className="text-sm text-muted-foreground/70">{t('dashboard.toAnalyze.slideImage')} #{currentImageIndex + 1}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
              
              {viewMode === 'static' && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: selectedCase?.imagesCount || 0 }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`shrink-0 w-16 h-12 rounded border-2 transition-colors ${currentImageIndex === idx ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'} bg-muted flex items-center justify-center`}
                    >
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto">
              <Tabs defaultValue="diagnosis" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="diagnosis" className="gap-1"><FileText className="h-3 w-3" />{t('dashboard.toAnalyze.diagnosis')}</TabsTrigger>
                  <TabsTrigger value="ai" className="gap-1 relative group">
                    <Brain className="h-3 w-3" /> IA
                    {!isHumanDiagnosisComplete && <Lock className="h-3 w-3 ml-1 text-muted-foreground" />}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="diagnosis" className="mt-4 space-y-4">
                  {!isHumanDiagnosisComplete && (
                    <div className="p-3 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-200">
                      Veuillez rédiger vos notes ou choisir un diagnostic pour déverrouiller l'assistance IA.
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('dashboard.toAnalyze.classification')}</label>
                    <Select value={diagnosis} onValueChange={setDiagnosis}>
                      <SelectTrigger><SelectValue placeholder={t('dashboard.toAnalyze.selectDiagnosis')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">{t('diagnosis.normal')}</SelectItem>
                        <SelectItem value="benign">{t('diagnosis.benign')}</SelectItem>
                        <SelectItem value="atypical">{t('diagnosis.atypical')}</SelectItem>
                        <SelectItem value="suspicious">{t('diagnosis.suspicious')}</SelectItem>
                        <SelectItem value="malignant">{t('diagnosis.malignant')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('dashboard.toAnalyze.analysisNotes')}</label>
                    <textarea
                      className="w-full min-h-[150px] p-3 rounded-md border bg-background resize-none"
                      placeholder={t('dashboard.toAnalyze.notesPlaceholder')}
                      value={analysisNotes}
                      onChange={(e) => setAnalysisNotes(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full gap-2">
                      <Users className="h-4 w-4" />{t('action.requestSecondOpinion')}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="ai" className="mt-4">
                  {!isHumanDiagnosisComplete ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-muted rounded-lg space-y-4 bg-muted/10">
                      <div className="p-3 bg-muted rounded-full"><Lock className="h-8 w-8 text-muted-foreground" /></div>
                      <p className="text-sm text-muted-foreground font-medium">Intelligence Artificielle verrouillée</p>
                      <p className="text-xs text-muted-foreground">Saisissez d'abord votre diagnostic pour obtenir l'avis de l'IA.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-2 bg-success/10 text-success text-xs rounded-md border border-success/20 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" /> L'IA a accès à votre diagnostic pour affiner son analyse.
                      </div>
                      <AIAnalysisPanel />
                    </div>
                  )}
                </TabsContent>

              </Tabs>
              
              <div className="pt-4 border-t space-y-2">
                <Button className="w-full gap-2" onClick={submitAnalysis} disabled={!isHumanDiagnosisComplete}>
                  <CheckCircle className="h-4 w-4" /> {t('action.submitAnalysis')}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsAnalysisMode(false)}>
                  {t('action.saveAndClose')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToAnalyzePage;