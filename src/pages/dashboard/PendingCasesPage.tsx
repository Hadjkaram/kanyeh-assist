import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { CaseStatus } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Search,
  Clock,
  Send,
  Microscope,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  FileImage,
  Timer,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const PendingCasesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // SUPABASE STATE
  const [dbCases, setDbCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingCases = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .in('status', ['pending', 'analyzing'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      // On formate les données de Supabase pour coller EXACTEMENT à ton interface attendue
      const formatted = data.map(d => {
        const nameParts = d.patient_name ? d.patient_name.split(' ') : ['Utilisateur', ''];
        return {
          id: d.case_reference || d.id,
          patientInfo: {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ') || '',
            id: d.patient_id || 'N/A'
          },
          pathology: d.pathology,
          status: d.status,
          priority: d.priority,
          centerId: d.center,
          createdBy: d.created_by,
          createdAt: d.created_at,
          sampleType: d.sample_type || 'Biopsie', // Fallback si non précisé dans la DB
          images: Array.from({ length: d.images_count || 0 }).map((_, i) => ({ id: String(i), url: '' })) // Pour le compteur
        };
      });
      setDbCases(formatted);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPendingCases();
  }, [user]);

  // Filter cases for pending/analyzing status
  const pendingCases = useMemo(() => {
    let result = dbCases.filter(c => 
      (c.status === 'pending' || c.status === 'analyzing') &&
      (c.createdBy === user?.id || c.centerId === user?.centerName)
    );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.id.toLowerCase().includes(query) ||
        c.patientInfo.firstName.toLowerCase().includes(query) ||
        c.patientInfo.lastName.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Sort by priority (urgent first) then by date
    result.sort((a, b) => {
      const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
      const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return result;
  }, [dbCases, user, searchQuery, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    pending: dbCases.filter(c => c.status === 'pending' && (c.createdBy === user?.id || c.centerId === user?.centerName)).length,
    analyzing: dbCases.filter(c => c.status === 'analyzing' && (c.createdBy === user?.id || c.centerId === user?.centerName)).length,
    urgent: dbCases.filter(c => (c.status === 'pending' || c.status === 'analyzing') && c.priority === 'urgent' && (c.createdBy === user?.id || c.centerId === user?.centerName)).length,
  }), [dbCases, user]);

  // Simulate progress and wait time
  const getCaseProgress = (caseItem: any): number => {
    if (caseItem.status === 'pending') {
      // Simulate progress based on time since creation
      const hoursWaiting = (Date.now() - new Date(caseItem.createdAt).getTime()) / (1000 * 60 * 60);
      return Math.min(Math.floor(hoursWaiting * 10), 30); // Max 30% for pending
    }
    if (caseItem.status === 'analyzing') {
      // Simulate progress 30-90%
      return 30 + Math.floor(Math.random() * 60);
    }
    return 100;
  };

  const getEstimatedTime = (caseItem: any): string => {
    if (caseItem.priority === 'urgent') return '< 2h';
    if (caseItem.priority === 'high') return '2-4h';
    if (caseItem.status === 'analyzing') return '1-2h';
    return '4-6h';
  };

  const getWaitingTime = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h ${diffMins}min`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j ${diffHours % 24}h`;
  };

  const getStatusInfo = (status: CaseStatus | string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-5 w-5" />,
          label: t('pending.waitingForAssignment'),
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        };
      case 'analyzing':
        return {
          icon: <Microscope className="h-5 w-5" />,
          label: t('pending.beingAnalyzed'),
          color: 'text-accent',
          bgColor: 'bg-accent/10',
        };
      default:
        return {
          icon: <Clock className="h-5 w-5" />,
          label: status,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
    }
  };

  const handleViewCase = (caseItem: any) => {
    setSelectedCase(caseItem);
    setDetailDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Timeline steps for case progress
  const getTimelineSteps = (caseItem: any) => {
    const steps = [
      { key: 'created', label: t('pending.stepCreated'), completed: true, time: caseItem.createdAt },
      { key: 'submitted', label: t('pending.stepSubmitted'), completed: true, time: caseItem.createdAt },
      { key: 'assigned', label: t('pending.stepAssigned'), completed: caseItem.status === 'analyzing', time: caseItem.status === 'analyzing' ? new Date().toISOString() : null },
      { key: 'analyzing', label: t('pending.stepAnalyzing'), completed: false, time: null },
      { key: 'validated', label: t('pending.stepValidated'), completed: false, time: null },
    ];
    return steps;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            {t('pending.title')}
          </h1>
          <p className="text-muted-foreground">{t('pending.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={fetchPendingCases} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('myCases.refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`} onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('pending.waitingAssignment')}</p>
                <p className="text-3xl font-bold text-primary">{stats.pending}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Send className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all ${statusFilter === 'analyzing' ? 'ring-2 ring-accent' : 'hover:shadow-md'}`} onClick={() => setStatusFilter(statusFilter === 'analyzing' ? 'all' : 'analyzing')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('pending.inAnalysis')}</p>
                <p className="text-3xl font-bold text-accent">{stats.analyzing}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <Microscope className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('pending.urgentCases')}</p>
                <p className="text-3xl font-bold text-destructive">{stats.urgent}</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('myCases.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('myCases.filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('pending.allPending')}</SelectItem>
                <SelectItem value="pending">{t('pending.waitingAssignment')}</SelectItem>
                <SelectItem value="analyzing">{t('pending.inAnalysis')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : pendingCases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('pending.noPendingCases')}</h3>
            <p className="text-muted-foreground mb-4">{t('pending.noPendingDescription')}</p>
            <Button onClick={() => navigate('/dashboard/new-case')} className="gap-2">
              <FileImage className="h-4 w-4" />
              {t('action.createNewCase')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingCases.map(caseItem => {
            const statusInfo = getStatusInfo(caseItem.status);
            const progress = getCaseProgress(caseItem);

            return (
              <Card 
                key={caseItem.id} 
                className={`hover:shadow-md transition-all cursor-pointer ${
                  caseItem.priority === 'urgent' ? 'border-l-4 border-l-destructive' : 
                  caseItem.priority === 'high' ? 'border-l-4 border-l-warning' : ''
                }`}
                onClick={() => handleViewCase(caseItem)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Status Icon */}
                    <div className={`p-3 rounded-full ${statusInfo.bgColor} ${statusInfo.color} shrink-0`}>
                      {statusInfo.icon}
                    </div>

                    {/* Case Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono font-medium">{caseItem.id}</span>
                        {caseItem.priority === 'urgent' && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {t('case.priorityUrgent')}
                          </Badge>
                        )}
                        {caseItem.priority === 'high' && (
                          <Badge variant="outline" className="text-warning border-warning gap-1">
                            {t('case.priorityHigh')}
                          </Badge>
                        )}
                        <Badge variant="outline" className={caseItem.pathology === 'breast' ? 'border-accent text-accent' : 'border-primary text-primary'}>
                          {caseItem.pathology === 'breast' ? t('pathology.breast') : t('pathology.cervical')}
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {caseItem.patientInfo.lastName} {caseItem.patientInfo.firstName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.sampleType} · {t('pending.submittedOn')} {formatDate(caseItem.createdAt)}
                      </p>
                    </div>

                    {/* Progress & Time */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                      {/* Wait Time */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Timer className="h-4 w-4" />
                          <span className="text-xs">{t('pending.waitTime')}</span>
                        </div>
                        <p className="font-semibold">{getWaitingTime(caseItem.createdAt)}</p>
                      </div>

                      {/* Estimated Time */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs">{t('pending.estimated')}</span>
                        </div>
                        <p className="font-semibold text-primary">{getEstimatedTime(caseItem)}</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{t('pending.progress')}</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* View Button */}
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewCase(caseItem); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className={`mt-3 pt-3 border-t flex items-center gap-2 ${statusInfo.color}`}>
                    <Activity className="h-4 w-4" />
                    <span className="text-sm">{statusInfo.label}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Case Detail Dialog with Timeline */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t('pending.trackingCase')} - {selectedCase?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6">
              {/* Case Summary */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={selectedCase.status === 'pending' ? 'bg-primary' : 'bg-accent'}>
                  {selectedCase.status === 'pending' ? t('status.pending') : t('status.analyzing')}
                </Badge>
                <Badge variant="outline" className={selectedCase.pathology === 'breast' ? 'border-accent text-accent' : 'border-primary text-primary'}>
                  {selectedCase.pathology === 'breast' ? t('pathology.breast') : t('pathology.cervical')}
                </Badge>
                {selectedCase.priority !== 'normal' && (
                  <Badge variant={selectedCase.priority === 'urgent' ? 'destructive' : 'outline'} className={selectedCase.priority === 'high' ? 'text-warning border-warning' : ''}>
                    {selectedCase.priority === 'urgent' ? t('case.priorityUrgent') : t('case.priorityHigh')}
                  </Badge>
                )}
              </div>

              {/* Patient Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold">{selectedCase.patientInfo.lastName} {selectedCase.patientInfo.firstName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCase.sampleType} · {selectedCase.images.length} image(s)
                </p>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('pending.timeline')}
                </h4>
                <div className="relative">
                  {getTimelineSteps(selectedCase).map((step, index, arr) => (
                    <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                      {/* Line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          step.completed ? 'bg-success text-white' : 'bg-muted border-2 border-muted-foreground/30'
                        }`}>
                          {step.completed ? <CheckCircle className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
                        </div>
                        {index < arr.length - 1 && (
                          <div className={`w-0.5 flex-1 mt-2 ${step.completed ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <p className={`font-medium ${step.completed ? '' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(step.time)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Timer className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{getWaitingTime(selectedCase.createdAt)}</p>
                  <p className="text-xs text-muted-foreground">{t('pending.waitTime')}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-primary">{getEstimatedTime(selectedCase)}</p>
                  <p className="text-xs text-muted-foreground">{t('pending.estimatedRemaining')}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              {t('action.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingCasesPage;