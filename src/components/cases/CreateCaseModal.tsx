import React, { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PathologyType, CasePriority, CaseImage } from '@/types/case';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  User,
  Calendar,
  Phone,
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Microscope,
  Send,
  Save,
  ArrowLeft,
  ArrowRight,
  Camera,
  Loader2 
} from 'lucide-react';
import { z } from 'zod';

import { supabase } from '@/lib/supabase'; 
import MicroscopeLiveView from '@/components/ai/MicroscopeLiveView';

interface CreateCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (caseId: string) => void;
}

// Validation schema
const patientSchema = z.object({
  firstName: z.string().trim().min(2, 'Minimum 2 caractères').max(50, 'Maximum 50 caractères'),
  lastName: z.string().trim().min(2, 'Minimum 2 caractères').max(50, 'Maximum 50 caractères'),
  dateOfBirth: z.string().min(1, 'Date requise'),
  gender: z.enum(['male', 'female']),
  phone: z.string().optional(),
  cmuNumber: z.string().optional(),
});

const caseSchema = z.object({
  pathology: z.enum(['breast', 'cervical']),
  priority: z.enum(['normal', 'high', 'urgent']),
  sampleType: z.string().min(1, 'Type d\'échantillon requis'),
  collectionDate: z.string().min(1, 'Date requise'),
  clinicalNotes: z.string().max(1000, 'Maximum 1000 caractères').optional(),
});

type Step = 'patient' | 'case' | 'images' | 'review';

const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ open, onOpenChange, onSuccess }) => {
  const { t } = useLanguage();
  const { user } = useAuth(); 
  
  const [currentStep, setCurrentStep] = useState<Step>('patient');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [imageMode, setImageMode] = useState<'camera' | 'upload'>('camera');

  // NOUVEAU : Référence pour forcer l'ouverture du sélecteur de fichiers
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'female' as 'male' | 'female',
    phone: '',
    cmuNumber: '',
  });

  const [caseData, setCaseData] = useState({
    pathology: 'breast' as PathologyType,
    priority: 'normal' as CasePriority,
    sampleType: '',
    collectionDate: new Date().toISOString().split('T')[0],
    clinicalNotes: '',
  });

  const [images, setImages] = useState<CaseImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: 'patient', label: t('case.stepPatient'), icon: <User className="h-4 w-4" /> },
    { key: 'case', label: t('case.stepCase'), icon: <FileText className="h-4 w-4" /> },
    { key: 'images', label: t('case.stepImages'), icon: <Camera className="h-4 w-4" /> },
    { key: 'review', label: t('case.stepReview'), icon: <CheckCircle className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const validatePatient = () => {
    try {
      patientSchema.parse(patientData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const validateCase = () => {
    try {
      caseSchema.parse(caseData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'patient') {
      if (validatePatient()) setCurrentStep('case');
    } else if (currentStep === 'case') {
      if (validateCase()) setCurrentStep('images');
    } else if (currentStep === 'images') {
      setCurrentStep('review');
    }
  };

  const handlePrevious = () => {
    const idx = currentStepIndex;
    if (idx > 0) setCurrentStep(steps[idx - 1].key);
  };

  const handleLiveImageCapture = useCallback((imageUrl: string) => {
    const newImage: CaseImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl,
      name: `Capture-${new Date().toLocaleTimeString().replace(/:/g, '-')}.jpg`,
      size: Math.round(imageUrl.length * 0.75),
      uploadedAt: new Date().toISOString(),
      qualityScore: Math.floor(Math.random() * 20) + 80,
    };
    setImages(prev => [...prev, newImage]);
    toast.success("Image capturée avec succès");
  }, []);

  // CORRECTION : Lecture du fichier en Base64 pour qu'il soit bien stocké dans le state (et envoyé à Supabase)
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newImage: CaseImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: base64String, // URL Base64 réelle
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          qualityScore: Math.floor(Math.random() * 20) + 80,
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        toast.success(t('case.imagesUploaded'));
      }
    }, 200);

    e.target.value = '';
  }, [t]);

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const saveCaseToSupabase = async (status: 'pending' | 'draft') => {
    setIsSubmitting(true);
    
    try {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const caseReference = `KA-${year}-${randomNum}`;
      const fullName = `${patientData.firstName} ${patientData.lastName}`;

      // NOUVEAU : On récupère la première image pour la lier au dossier
      const imageUrlToSave = images.length > 0 ? images[0].url : null;

      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert([
          {
            case_reference: caseReference,
            patient_name: fullName,
            pathology: caseData.pathology,
            priority: caseData.priority,
            center: user?.centerName || 'Centre KANYEH',
            status: status,
            images_count: images.length,
            analysis_notes: caseData.clinicalNotes,
            created_by: user?.id,
            image_url: imageUrlToSave // L'image est envoyée ici !
          }
        ])
        .select()
        .single();

      if (caseError) throw caseError;

      if (newCase) {
        await supabase.from('activities').insert([
          {
            case_id: newCase.id,
            user_id: user?.id,
            action_type: status === 'pending' ? 'case_submitted' : 'case_created',
            description: status === 'pending' 
              ? `Le dossier ${caseReference} a été soumis pour analyse par ${user?.firstName}.` 
              : `Le dossier ${caseReference} a été sauvegardé en brouillon.`,
          }
        ]);
      }

      toast.success(`Dossier ${caseReference} enregistré avec succès !`);
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess(caseReference);

    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de la création du dossier médical.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('patient');
    setPatientData({ firstName: '', lastName: '', dateOfBirth: '', gender: 'female', phone: '', cmuNumber: '' });
    setCaseData({ pathology: 'breast', priority: 'normal', sampleType: '', collectionDate: new Date().toISOString().split('T')[0], clinicalNotes: '' });
    setImages([]);
    setErrors({});
  };

  const sampleTypes = caseData.pathology === 'breast'
    ? ['Biopsie', 'Cytoponction', 'Exérèse', 'Mastectomie']
    : ['Frottis cervical', 'Biopsie cervicale', 'Conisation', 'Curetage'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Microscope className="h-5 w-5 text-primary" />
            {t('case.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className={`flex items-center gap-2 ${index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStepIndex ? 'bg-primary text-primary-foreground' : index === currentStepIndex ? 'bg-primary/20 border-2 border-primary' : 'bg-muted'
                }`}>
                  {index < currentStepIndex ? <CheckCircle className="h-4 w-4" /> : step.icon}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.label}</span>
              </div>
              {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-4">
          {currentStep === 'patient' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('case.lastName')} *</Label>
                  <Input id="lastName" value={patientData.lastName} onChange={e => setPatientData(prev => ({ ...prev, lastName: e.target.value }))} placeholder="Koné" className={errors.lastName ? 'border-destructive' : ''} />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('case.firstName')} *</Label>
                  <Input id="firstName" value={patientData.firstName} onChange={e => setPatientData(prev => ({ ...prev, firstName: e.target.value }))} placeholder="Aminata" className={errors.firstName ? 'border-destructive' : ''} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">{t('case.dateOfBirth')} *</Label>
                  <Input id="dateOfBirth" type="date" value={patientData.dateOfBirth} onChange={e => setPatientData(prev => ({ ...prev, dateOfBirth: e.target.value }))} className={errors.dateOfBirth ? 'border-destructive' : ''} />
                  {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('case.gender')} *</Label>
                  <RadioGroup value={patientData.gender} onValueChange={v => setPatientData(prev => ({ ...prev, gender: v as 'male' | 'female' }))} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="female" /><Label htmlFor="female">{t('case.female')}</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">{t('case.male')}</Label></div>
                  </RadioGroup>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('case.phone')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" value={patientData.phone} onChange={e => setPatientData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+225 07 00 00 00" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cmuNumber">{t('case.cmuNumber')}</Label>
                  <Input id="cmuNumber" value={patientData.cmuNumber} onChange={e => setPatientData(prev => ({ ...prev, cmuNumber: e.target.value }))} placeholder="CMU-000000" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 'case' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('case.pathology')} *</Label>
                <RadioGroup value={caseData.pathology} onValueChange={v => setCaseData(prev => ({ ...prev, pathology: v as PathologyType, sampleType: '' }))} className="grid grid-cols-2 gap-4">
                  <Card className={`cursor-pointer transition-all ${caseData.pathology === 'breast' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <RadioGroupItem value="breast" id="breast" />
                      <div><Label htmlFor="breast" className="cursor-pointer font-medium">{t('pathology.breast')}</Label><p className="text-xs text-muted-foreground">{t('pathology.breast.desc')}</p></div>
                    </CardContent>
                  </Card>
                  <Card className={`cursor-pointer transition-all ${caseData.pathology === 'cervical' ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <RadioGroupItem value="cervical" id="cervical" />
                      <div><Label htmlFor="cervical" className="cursor-pointer font-medium">{t('pathology.cervical')}</Label><p className="text-xs text-muted-foreground">{t('pathology.cervical.desc')}</p></div>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('case.sampleType')} *</Label>
                  <Select value={caseData.sampleType} onValueChange={v => setCaseData(prev => ({ ...prev, sampleType: v }))}>
                    <SelectTrigger className={errors.sampleType ? 'border-destructive' : ''}><SelectValue placeholder={t('case.selectSampleType')} /></SelectTrigger>
                    <SelectContent>{sampleTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.sampleType && <p className="text-xs text-destructive">{errors.sampleType}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collectionDate">{t('case.collectionDate')} *</Label>
                  <Input id="collectionDate" type="date" value={caseData.collectionDate} onChange={e => setCaseData(prev => ({ ...prev, collectionDate: e.target.value }))} className={errors.collectionDate ? 'border-destructive' : ''} />
                  {errors.collectionDate && <p className="text-xs text-destructive">{errors.collectionDate}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('case.priority')}</Label>
                <RadioGroup value={caseData.priority} onValueChange={v => setCaseData(prev => ({ ...prev, priority: v as CasePriority }))} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="normal" id="normal" /><Label htmlFor="normal">{t('case.priorityNormal')}</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="high" id="high" /><Label htmlFor="high" className="text-warning">{t('case.priorityHigh')}</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="urgent" id="urgent" /><Label htmlFor="urgent" className="text-destructive">{t('case.priorityUrgent')}</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicalNotes">{t('case.clinicalNotes')}</Label>
                <Textarea id="clinicalNotes" value={caseData.clinicalNotes} onChange={e => setCaseData(prev => ({ ...prev, clinicalNotes: e.target.value }))} placeholder={t('case.clinicalNotesPlaceholder')} rows={4} maxLength={1000} />
                <p className="text-xs text-muted-foreground text-right">{caseData.clinicalNotes?.length || 0}/1000</p>
              </div>
            </div>
          )}

          {currentStep === 'images' && (
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                <Button type="button" variant={imageMode === 'camera' ? 'default' : 'outline'} onClick={() => setImageMode('camera')} className="gap-2"><Camera className="h-4 w-4" /> Capture (Microscope)</Button>
                <Button type="button" variant={imageMode === 'upload' ? 'default' : 'outline'} onClick={() => setImageMode('upload')} className="gap-2"><Upload className="h-4 w-4" /> Importer (Fichiers)</Button>
              </div>
              {imageMode === 'camera' ? (
                <div className="border border-border rounded-xl p-2 bg-muted/20"><MicroscopeLiveView onImageCaptured={handleLiveImageCapture} /></div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-card">
                  {/* CORRECTION : Liaison de l'input caché avec ref */}
                 <Input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">{t('case.dragDropImages')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('case.supportedFormats')}</p>
                  
                  {/* CORRECTION : Ce bouton ouvre maintenant l'explorateur ! */}
                  <Button variant="outline" className="mt-4" type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    {t('case.selectFiles')}
                  </Button>
                </div>
              )}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>{t('case.uploading')}...</span><span>{uploadProgress}%</span></div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              {images.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between"><p className="text-sm font-medium">{t('case.uploadedImages')} ({images.length})</p></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {images.map(image => (
                      <div key={image.id} className="relative group rounded-lg overflow-hidden border">
                        <img src={image.url} alt={image.name} className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="destructive" size="icon" onClick={() => removeImage(image.id)} type="button"><X className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">{t('case.patientInfo')}</h4>
                    <p className="font-medium">{patientData.lastName} {patientData.firstName}</p>
                    <p className="text-sm text-muted-foreground">{t('case.born')} {patientData.dateOfBirth} · {patientData.gender === 'female' ? t('case.female') : t('case.male')}</p>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground">{t('case.caseInfo')}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={caseData.pathology === 'breast' ? 'bg-accent' : 'bg-primary'}>{caseData.pathology === 'breast' ? t('pathology.breast') : t('pathology.cervical')}</Badge>
                      {caseData.priority !== 'normal' && <Badge variant={caseData.priority === 'urgent' ? 'destructive' : 'outline'}>{caseData.priority === 'urgent' ? t('case.priorityUrgent') : t('case.priorityHigh')}</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t mt-4">
          <Button variant="outline" onClick={currentStep === 'patient' ? () => onOpenChange(false) : handlePrevious} disabled={isSubmitting} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 'patient' ? t('action.cancel') : t('action.previous')}
          </Button>

          <div className="flex gap-2">
            {currentStep === 'review' ? (
              <>
                <Button variant="outline" onClick={() => saveCaseToSupabase('draft')} disabled={isSubmitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {t('action.saveDraft')}
                </Button>
                <Button onClick={() => saveCaseToSupabase('pending')} disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t('action.submitForAnalysis')}
                </Button>
              </>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                {t('action.next')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCaseModal;