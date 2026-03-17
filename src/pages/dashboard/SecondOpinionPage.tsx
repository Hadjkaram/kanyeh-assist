import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatCard from '@/components/dashboard/StatCard';
import {
  Search,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  FileText,
  ArrowRight,
  ArrowLeft,
  Microscope,
  Brain,
  Calendar,
  User,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SecondOpinionRequest {
  id: string;
  caseId: string;
  patientName: string;
  patientId: string;
  pathology: 'breast' | 'cervical';
  requestedBy: string;
  requestedByCenter: string;
  requestedAt: string;
  status: 'pending' | 'in_review' | 'completed';
  urgency: 'normal' | 'urgent';
  initialDiagnosis: string;
  reason: string;
  myDiagnosis?: string;
  myOpinion?: string;
  respondedAt?: string;
}

interface SentRequest {
  id: string;
  caseId: string;
  patientName: string;
  patientId: string;
  pathology: 'breast' | 'cervical';
  requestedTo: string;
  requestedToCenter: string;
  requestedAt: string;
  status: 'pending' | 'in_review' | 'completed';
  urgency: 'normal' | 'urgent';
  myDiagnosis: string;
  reason: string;
  response?: string;
  responseDiagnosis?: string;
  respondedAt?: string;
}

// DONNÉES DE FALLBACK POUR LA DÉMO AU CAS OÙ LA TABLE SUPABASE MANQUE
const mockReceivedRequests: SecondOpinionRequest[] = [
  {
    id: 'SO-001',
    caseId: 'KA-2026-015',
    patientName: 'Aminata Koné',
    patientId: 'CMU-001234',
    pathology: 'breast',
    requestedBy: 'Dr. Konan',
    requestedByCenter: 'CHU Bouaké',
    requestedAt: '2026-03-19 09:30',
    status: 'pending',
    urgency: 'urgent',
    initialDiagnosis: 'Suspect - Zone atypique identifiée',
    reason: 'Zone difficile à interpréter, besoin d\'expertise supplémentaire sur le grading.',
  },
  {
    id: 'SO-002',
    caseId: 'KA-2026-012',
    patientName: 'Fatou Diallo',
    patientId: 'CMU-005678',
    pathology: 'cervical',
    requestedBy: 'Dr. Bamba',
    requestedByCenter: 'CS San-Pedro',
    requestedAt: '2026-03-18 14:15',
    status: 'in_review',
    urgency: 'normal',
    initialDiagnosis: 'Atypique - ASCUS',
    reason: 'Incertitude sur la classification, cellules difficiles à caractériser.',
  },
];

const mockSentRequests: SentRequest[] = [
  {
    id: 'SO-004',
    caseId: 'KA-2026-016',
    patientName: 'Adjoua Koffi',
    patientId: 'CMU-003456',
    pathology: 'cervical',
    requestedTo: 'Dr. Traoré',
    requestedToCenter: 'CHU Cocody',
    requestedAt: '2026-03-19 08:00',
    status: 'pending',
    urgency: 'normal',
    myDiagnosis: 'Suspect - HSIL possible',
    reason: 'Besoin de confirmation sur les caractéristiques cytologiques.',
  },
];

const SecondOpinionPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('received');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<SecondOpinionRequest | null>(null);
  const [selectedSentRequest, setSelectedSentRequest] = useState<SentRequest | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseDiagnosis, setResponseDiagnosis] = useState('');

  // ETATS SUPABASE
  const [receivedRequests, setReceivedRequests] = useState<SecondOpinionRequest[]>(mockReceivedRequests);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>(mockSentRequests);
  const [isLoading, setIsLoading] = useState(false); // Mis à false pour la démo immédiate

  // Dans une vraie application avec une table `second_opinions`, la requête ressemblerait à ceci :
  /*
  useEffect(() => {
    const fetchOpinions = async () => {
      setIsLoading(true);
      // Récupération des demandes reçues
      const { data: receivedData } = await supabase.from('second_opinions').select('*').eq('requested_to', user?.id);
      // Récupération des demandes envoyées
      const { data: sentData } = await supabase.from('second_opinions').select('*').eq('requested_by', user?.id);
      setIsLoading(false);
    };
    fetchOpinions();
  }, [user]);
  */

  const pendingReceived = receivedRequests.filter(r => r.status === 'pending').length;
  const inReviewReceived = receivedRequests.filter(r => r.status === 'in_review').length;
  const completedReceived = receivedRequests.filter(r => r.status === 'completed').length;
  const pendingSent = sentRequests.filter(r => r.status === 'pending').length;

  const filteredReceived = receivedRequests.filter((req) => {
    const matchesSearch =
      req.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredSent = sentRequests.filter((req) => {
    const matchesSearch =
      req.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-warning text-warning">{t('secondOpinion.statusPending')}</Badge>;
      case 'in_review':
        return <Badge className="bg-primary text-primary-foreground">{t('secondOpinion.statusInReview')}</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground">{t('secondOpinion.statusCompleted')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    return urgency === 'urgent' ? (
      <Badge variant="destructive">{t('priority.urgent')}</Badge>
    ) : null;
  };

  const getPathologyBadge = (pathology: string) => {
    return pathology === 'breast' ? (
      <Badge variant="outline" className="border-accent text-accent">{t('pathology.breast')}</Badge>
    ) : (
      <Badge variant="outline" className="border-primary text-primary">{t('pathology.cervical')}</Badge>
    );
  };

  const handleStartReview = (request: SecondOpinionRequest) => {
    setSelectedRequest(request);
    setIsResponding(true);
    setResponseText('');
    setResponseDiagnosis('');
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    // Simulation de l'enregistrement en base de données pour la démo
    try {
      /* const { error } = await supabase.from('second_opinions').update({
        status: 'completed',
        my_diagnosis: responseDiagnosis,
        my_opinion: responseText,
        responded_at: new Date().toISOString()
      }).eq('id', selectedRequest.id);
      */

      // Mise à jour locale pour que ça marche immédiatement dans l'interface
      setReceivedRequests(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { 
              ...req, 
              status: 'completed', 
              myDiagnosis: responseDiagnosis, 
              myOpinion: responseText, 
              respondedAt: new Date().toLocaleString('fr-FR') 
            } 
          : req
      ));

      toast.success("Votre second avis a été envoyé avec succès");
      setIsResponding(false);
      setSelectedRequest(null);
      setResponseText('');
      setResponseDiagnosis('');
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {t('secondOpinion.title')}
          </h1>
          <p className="text-muted-foreground">{t('secondOpinion.subtitle')}</p>
        </div>
        {pendingReceived > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {pendingReceived} {t('secondOpinion.pendingRequests')}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('secondOpinion.receivedPending')}
          value={pendingReceived}
          icon={MessageSquare}
          iconColor="text-warning"
        />
        <StatCard
          title={t('secondOpinion.inReview')}
          value={inReviewReceived}
          icon={Microscope}
          iconColor="text-primary"
        />
        <StatCard
          title={t('secondOpinion.completed')}
          value={completedReceived}
          icon={CheckCircle}
          iconColor="text-success"
        />
        <StatCard
          title={t('secondOpinion.sentPending')}
          value={pendingSent}
          icon={Send}
          iconColor="text-accent"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="received" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('secondOpinion.receivedTab')}
            {pendingReceived > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingReceived}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            {t('secondOpinion.sentTab')}
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('secondOpinion.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('secondOpinion.filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('secondOpinion.allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('secondOpinion.statusPending')}</SelectItem>
                  <SelectItem value="in_review">{t('secondOpinion.statusInReview')}</SelectItem>
                  <SelectItem value="completed">{t('secondOpinion.statusCompleted')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Received Requests Tab */}
        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {t('secondOpinion.receivedRequests')} ({filteredReceived.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredReceived.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t('secondOpinion.noRequests')}</p>
                </div>
              ) : (
                filteredReceived.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      request.status === 'pending' 
                        ? 'bg-warning/5 border-warning/30' 
                        : request.status === 'in_review'
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-medium">{request.caseId}</span>
                          {getStatusBadge(request.status)}
                          {getUrgencyBadge(request.urgency)}
                          {getPathologyBadge(request.pathology)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{request.patientName}</span>
                            <span className="text-muted-foreground">({request.patientId})</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{request.requestedAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10">
                              {request.requestedBy.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{request.requestedBy}</span>
                          <span className="text-sm text-muted-foreground">• {request.requestedByCenter}</span>
                        </div>

                        <div className="p-3 bg-background rounded border">
                          <p className="text-xs text-muted-foreground mb-1">{t('secondOpinion.initialDiagnosis')}</p>
                          <p className="text-sm font-medium">{request.initialDiagnosis}</p>
                          <p className="text-xs text-muted-foreground mt-2 mb-1">{t('secondOpinion.reason')}</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>

                        {request.status === 'completed' && request.myOpinion && (
                          <div className="p-3 bg-success/10 rounded border border-success/30">
                            <p className="text-xs text-success mb-1">{t('secondOpinion.yourResponse')}</p>
                            <p className="text-sm font-medium">{request.myDiagnosis}</p>
                            <p className="text-sm mt-1">{request.myOpinion}</p>
                            <p className="text-xs text-muted-foreground mt-2">{t('secondOpinion.respondedAt')}: {request.respondedAt}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          {t('action.view')}
                        </Button>
                        {request.status !== 'completed' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStartReview(request)}
                            className="gap-1"
                          >
                            <Brain className="h-4 w-4" />
                            {request.status === 'pending' ? t('secondOpinion.startReview') : t('secondOpinion.continueReview')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-accent" />
                {t('secondOpinion.sentRequests')} ({filteredSent.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredSent.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t('secondOpinion.noSentRequests')}</p>
                </div>
              ) : (
                filteredSent.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      request.status === 'completed' 
                        ? 'bg-success/5 border-success/30' 
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-medium">{request.caseId}</span>
                          {getStatusBadge(request.status)}
                          {getUrgencyBadge(request.urgency)}
                          {getPathologyBadge(request.pathology)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{request.patientName}</span>
                            <span className="text-muted-foreground">({request.patientId})</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{request.requestedAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{t('secondOpinion.sentTo')}:</span>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-accent/10">
                              {request.requestedTo.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{request.requestedTo}</span>
                          <span className="text-sm text-muted-foreground">• {request.requestedToCenter}</span>
                        </div>

                        <div className="p-3 bg-background rounded border">
                          <p className="text-xs text-muted-foreground mb-1">{t('secondOpinion.yourDiagnosis')}</p>
                          <p className="text-sm font-medium">{request.myDiagnosis}</p>
                          <p className="text-xs text-muted-foreground mt-2 mb-1">{t('secondOpinion.reason')}</p>
                          <p className="text-sm">{request.reason}</p>
                        </div>

                        {request.status === 'completed' && request.response && (
                          <div className="p-3 bg-success/10 rounded border border-success/30">
                            <p className="text-xs text-success mb-1">{t('secondOpinion.responseReceived')}</p>
                            <p className="text-sm font-medium">{request.responseDiagnosis}</p>
                            <p className="text-sm mt-1">{request.response}</p>
                            <p className="text-xs text-muted-foreground mt-2">{t('secondOpinion.respondedAt')}: {request.respondedAt}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedSentRequest(request)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          {t('action.view')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={isResponding} onOpenChange={setIsResponding}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('secondOpinion.provideOpinion')} - {selectedRequest?.caseId}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('secondOpinion.requestedBy')}:</span>
                  <span className="font-medium">{selectedRequest.requestedBy}</span>
                  <span className="text-muted-foreground">• {selectedRequest.requestedByCenter}</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('secondOpinion.initialDiagnosis')}:</p>
                  <p className="font-medium">{selectedRequest.initialDiagnosis}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('secondOpinion.reason')}:</p>
                  <p>{selectedRequest.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('secondOpinion.yourDiagnosisLabel')}</label>
                <Select value={responseDiagnosis} onValueChange={setResponseDiagnosis}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('secondOpinion.selectDiagnosis')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirm">{t('secondOpinion.confirmDiagnosis')}</SelectItem>
                    <SelectItem value="modify">{t('secondOpinion.modifyDiagnosis')}</SelectItem>
                    <SelectItem value="disagree">{t('secondOpinion.disagreeDiagnosis')}</SelectItem>
                    <SelectItem value="inconclusive">{t('secondOpinion.inconclusiveDiagnosis')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('secondOpinion.detailedOpinion')}</label>
                <Textarea
                  placeholder={t('secondOpinion.opinionPlaceholder')}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={5}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResponding(false)}>
                  {t('action.cancel')}
                </Button>
                <Button 
                  onClick={handleSubmitResponse}
                  disabled={!responseDiagnosis || !responseText.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {t('secondOpinion.submitOpinion')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Request Details Dialog */}
      <Dialog open={!!selectedRequest && !isResponding} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('secondOpinion.requestDetails')} - {selectedRequest?.caseId}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.patient')}</p>
                  <p className="font-medium">{selectedRequest.patientName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.pathology')}</p>
                  {getPathologyBadge(selectedRequest.pathology)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('secondOpinion.requestedBy')}</p>
                  <p className="font-medium">{selectedRequest.requestedBy}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.requestedByCenter}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.status')}</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{t('secondOpinion.initialDiagnosis')}</p>
                <p className="font-medium">{selectedRequest.initialDiagnosis}</p>
                <p className="text-sm text-muted-foreground mt-2 mb-1">{t('secondOpinion.reason')}</p>
                <p>{selectedRequest.reason}</p>
              </div>
              {selectedRequest.status === 'completed' && (
                <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                  <p className="text-sm text-success mb-1">{t('secondOpinion.yourResponse')}</p>
                  <p className="font-medium">{selectedRequest.myDiagnosis}</p>
                  <p className="mt-1">{selectedRequest.myOpinion}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  {t('action.close')}
                </Button>
                {selectedRequest.status !== 'completed' && (
                  <Button onClick={() => handleStartReview(selectedRequest)} className="gap-2">
                    <Brain className="h-4 w-4" />
                    {t('secondOpinion.provideOpinion')}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Sent Request Details Dialog */}
      <Dialog open={!!selectedSentRequest} onOpenChange={() => setSelectedSentRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('secondOpinion.requestDetails')} - {selectedSentRequest?.caseId}
            </DialogTitle>
          </DialogHeader>
          {selectedSentRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.patient')}</p>
                  <p className="font-medium">{selectedSentRequest.patientName}</p>
                  <p className="text-sm text-muted-foreground">{selectedSentRequest.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.pathology')}</p>
                  {getPathologyBadge(selectedSentRequest.pathology)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('secondOpinion.sentTo')}</p>
                  <p className="font-medium">{selectedSentRequest.requestedTo}</p>
                  <p className="text-sm text-muted-foreground">{selectedSentRequest.requestedToCenter}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('table.status')}</p>
                  {getStatusBadge(selectedSentRequest.status)}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{t('secondOpinion.yourDiagnosis')}</p>
                <p className="font-medium">{selectedSentRequest.myDiagnosis}</p>
                <p className="text-sm text-muted-foreground mt-2 mb-1">{t('secondOpinion.reason')}</p>
                <p>{selectedSentRequest.reason}</p>
              </div>
              {selectedSentRequest.status === 'completed' && selectedSentRequest.response && (
                <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                  <p className="text-sm text-success mb-1">{t('secondOpinion.responseReceived')}</p>
                  <p className="font-medium">{selectedSentRequest.responseDiagnosis}</p>
                  <p className="mt-1">{selectedSentRequest.response}</p>
                  <p className="text-xs text-muted-foreground mt-2">{selectedSentRequest.respondedAt}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedSentRequest(null)}>
                  {t('action.close')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecondOpinionPage;