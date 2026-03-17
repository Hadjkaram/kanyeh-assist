import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { CaseStatus, PathologyType } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Trash2,
  FileImage,
  Clock,
  CheckCircle,
  AlertCircle,
  Microscope,
  Calendar,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase'; // <-- NOUVEAU IMPORT

const MyCasesPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pathologyFilter, setPathologyFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // SUPABASE STATE
  const [userCases, setUserCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyCases = async () => {
    if (!user) return;
    setIsLoading(true);
    
    // Récupérer uniquement les cas créés par l'utilisateur connecté
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserCases(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMyCases();
  }, [user]);

  // Apply filters
  const filteredCases = useMemo(() => {
    let result = [...userCases];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.case_reference?.toLowerCase().includes(query) || '') ||
        c.patient_name.toLowerCase().includes(query) ||
        (c.patient_id?.toLowerCase().includes(query) || '')
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Pathology filter
    if (pathologyFilter !== 'all') {
      result = result.filter(c => c.pathology === pathologyFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(c => {
        const caseDate = new Date(c.created_at);
        switch (dateFilter) {
          case 'today':
            return caseDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return caseDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return caseDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return result;
  }, [userCases, searchQuery, statusFilter, pathologyFilter, dateFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: userCases.length,
    draft: userCases.filter(c => c.status === 'draft').length,
    pending: userCases.filter(c => c.status === 'pending').length,
    analyzing: userCases.filter(c => c.status === 'analyzing').length,
    validated: userCases.filter(c => c.status === 'validated').length,
  }), [userCases]);

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{t('status.draft')}</Badge>;
      case 'pending':
        return <Badge className="bg-primary gap-1"><Send className="h-3 w-3" />{t('status.pending')}</Badge>;
      case 'analyzing':
        return <Badge className="bg-accent gap-1"><Microscope className="h-3 w-3" />{t('status.analyzing')}</Badge>;
      case 'validated':
        return <Badge className="bg-success gap-1"><CheckCircle className="h-3 w-3" />{t('status.validated')}</Badge>;
      case 'archived':
        return <Badge variant="secondary" className="gap-1">{t('status.archived')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPathologyBadge = (pathology: PathologyType) => {
    return pathology === 'breast' 
      ? <Badge variant="outline" className="border-accent text-accent">{t('pathology.breast')}</Badge>
      : <Badge variant="outline" className="border-primary text-primary">{t('pathology.cervical')}</Badge>;
  };

  const getPriorityIndicator = (priority: string) => {
    if (priority === 'urgent') {
      return <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" title={t('case.priorityUrgent')} />;
    }
    if (priority === 'high') {
      return <div className="w-2 h-2 rounded-full bg-warning" title={t('case.priorityHigh')} />;
    }
    return null;
  };

  const handleViewCase = (caseItem: any) => {
    setSelectedCase(caseItem);
    setDetailDialogOpen(true);
  };

  const handleEditCase = (caseItem: any) => {
    if (caseItem.status === 'draft') {
      toast.info('Fonctionnalité d\'édition bientôt disponible');
    } else {
      toast.error('Seuls les brouillons peuvent être modifiés');
    }
  };

  const handleSubmitCase = async (caseItem: any) => {
    if (caseItem.status === 'draft') {
      const { error } = await supabase
        .from('cases')
        .update({ status: 'pending', submitted_at: new Date().toISOString() })
        .eq('id', caseItem.id);

      if (!error) {
        toast.success(`Dossier ${caseItem.case_reference} envoyé pour analyse`);
        fetchMyCases(); // Refresh
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    }
  };

  const handleDeleteCase = (caseItem: any) => {
    if (caseItem.status === 'draft') {
      setSelectedCase(caseItem);
      setDeleteDialogOpen(true);
    } else {
      toast.error('Seuls les brouillons peuvent être supprimés');
    }
  };

  const confirmDelete = async () => {
    if (selectedCase) {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', selectedCase.id);

      if (!error) {
        toast.success(`Brouillon ${selectedCase.case_reference} supprimé`);
        fetchMyCases();
        setDeleteDialogOpen(false);
        setSelectedCase(null);
      } else {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPathologyFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || pathologyFilter !== 'all' || dateFilter !== 'all';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <FileImage className="h-6 w-6 text-primary" />
            {t('sidebar.myCases')}
          </h1>
          <p className="text-muted-foreground">{user?.centerName}</p>
        </div>
        <Button onClick={() => navigate('/dashboard/new-case')} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('action.createNewCase')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{t('myCases.total')}</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'draft' ? 'ring-2 ring-warning' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('draft')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{stats.draft}</p>
            <p className="text-xs text-muted-foreground">{t('status.draft')}</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('pending')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">{t('status.pending')}</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'analyzing' ? 'ring-2 ring-accent' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('analyzing')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stats.analyzing}</p>
            <p className="text-xs text-muted-foreground">{t('status.analyzing')}</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all ${statusFilter === 'validated' ? 'ring-2 ring-success' : 'hover:shadow-md'}`}
          onClick={() => setStatusFilter('validated')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.validated}</p>
            <p className="text-xs text-muted-foreground">{t('status.validated')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('myCases.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('myCases.filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('myCases.allStatus')}</SelectItem>
                  <SelectItem value="draft">{t('status.draft')}</SelectItem>
                  <SelectItem value="pending">{t('status.pending')}</SelectItem>
                  <SelectItem value="analyzing">{t('status.analyzing')}</SelectItem>
                  <SelectItem value="validated">{t('status.validated')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={pathologyFilter} onValueChange={setPathologyFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('myCases.filterPathology')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('myCases.allPathologies')}</SelectItem>
                  <SelectItem value="breast">{t('pathology.breast')}</SelectItem>
                  <SelectItem value="cervical">{t('pathology.cervical')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('myCases.filterDate')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('myCases.allDates')}</SelectItem>
                  <SelectItem value="today">{t('myCases.today')}</SelectItem>
                  <SelectItem value="week">{t('myCases.thisWeek')}</SelectItem>
                  <SelectItem value="month">{t('myCases.thisMonth')}</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title={t('myCases.clearFilters')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {filteredCases.length} {t('myCases.casesFound')}
            </span>
            <Button variant="ghost" size="sm" className="gap-2" onClick={fetchMyCases} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('myCases.refresh')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileImage className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">{t('myCases.noCases')}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('myCases.noCasesDescription')}</p>
              <Button onClick={() => navigate('/dashboard/new-case')} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('action.createNewCase')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>{t('table.caseId')}</TableHead>
                    <TableHead>{t('table.patient')}</TableHead>
                    <TableHead>{t('table.pathology')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.date')}</TableHead>
                    <TableHead className="text-right">{t('myCases.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map(caseItem => (
                    <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewCase(caseItem)}>
                      <TableCell>
                        {getPriorityIndicator(caseItem.priority)}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {caseItem.case_reference}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{caseItem.patient_name}</p>
                          <p className="text-xs text-muted-foreground">{caseItem.patient_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPathologyBadge(caseItem.pathology)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(caseItem.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(caseItem.created_at)}
                      </TableCell>
                      <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCase(caseItem)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('myCases.view')}
                            </DropdownMenuItem>
                            {caseItem.status === 'draft' && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditCase(caseItem)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('myCases.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSubmitCase(caseItem)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  {t('myCases.submit')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCase(caseItem)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('myCases.delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {t('myCases.confirmDelete')}
            </DialogTitle>
            <DialogDescription>
              {t('myCases.deleteWarning')} <strong>{selectedCase?.case_reference}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('myCases.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Case Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-primary" />
              {t('myCases.caseDetails')} - {selectedCase?.case_reference}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-4">
              {/* Status & Priority */}
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(selectedCase.status)}
                {getPathologyBadge(selectedCase.pathology)}
                {selectedCase.priority !== 'normal' && (
                  <Badge variant={selectedCase.priority === 'urgent' ? 'destructive' : 'outline'} className={selectedCase.priority === 'high' ? 'text-warning border-warning' : ''}>
                    {selectedCase.priority === 'urgent' ? t('case.priorityUrgent') : t('case.priorityHigh')}
                  </Badge>
                )}
              </div>

              {/* Patient Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('case.patientInfo')}</h4>
                <p className="font-semibold">{selectedCase.patient_name}</p>
                <p className="text-sm font-mono mt-1 text-muted-foreground">ID: {selectedCase.patient_id || 'Non renseigné'}</p>
              </div>

              {/* Case Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('case.caseInfo')}</h4>
                {selectedCase.analysis_notes && (
                  <div className="mt-3">
                    <p className="text-muted-foreground text-sm">{t('case.clinicalNotes')}</p>
                    <p className="text-sm italic">"{selectedCase.analysis_notes}"</p>
                  </div>
                )}
                {selectedCase.diagnosis && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-muted-foreground text-sm uppercase font-semibold mb-1">Diagnostic Final</p>
                    <p className="text-md font-bold text-primary">{selectedCase.diagnosis}</p>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('case.images')}</h4>
                <p className="text-sm">{selectedCase.images_count || 0} {t('case.imagesAttached')}</p>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>{t('myCases.createdAt')}: {formatDate(selectedCase.created_at)}</span>
                <span>{selectedCase.center}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              {t('action.close')}
            </Button>
            {selectedCase?.status === 'draft' && (
              <Button onClick={() => {
                handleSubmitCase(selectedCase);
                setDetailDialogOpen(false);
              }} className="gap-2">
                <Send className="h-4 w-4" />
                {t('myCases.submit')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCasesPage;