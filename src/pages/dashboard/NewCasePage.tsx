import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PathologyType, CasePriority, CaseImage } from '@/types/case';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase'; // <-- NOTRE CONNEXION À LA BASE DE DONNÉES
import {
  User,
  Phone,
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
  FileImage,
  Loader2
} from 'lucide-react';

const NewCasePage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<'patient' | 'clinical' | 'images' | 'review'>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Données du formulaire
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'female',
    contact: '',
    nationalId: '',
  });

  const [clinicalData, setClinicalData] = useState({
    pathology: '' as PathologyType,
    priority: 'normal' as CasePriority,
    clinicalNotes: '',
    medicalHistory: '',
  });

  const [images, setImages] = useState<CaseImage[]>([]);

  // Simulation d'ajout d'image (en production, on utiliserait Supabase Storage)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: CaseImage[] = Array.from(e.target.files).map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleNext = () => {
    if (currentStep === 'patient') {
      if (!patientData.firstName || !patientData.lastName) {
        toast.error('Veuillez remplir le nom et prénom du patient');
        return;
      }
      setCurrentStep('clinical');
    } else if (currentStep === 'clinical') {
      if (!clinicalData.pathology) {
        toast.error('Veuillez sélectionner une pathologie');
        return;
      }
      setCurrentStep('images');
    } else if (currentStep === 'images') {
      setCurrentStep('review');
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'review') setCurrentStep('images');
    else if (currentStep === 'images') setCurrentStep('clinical');
    else if (currentStep === 'clinical') setCurrentStep('patient');
  };

  // LA VRAIE FONCTION D'ENREGISTREMENT SUR SUPABASE
  const handleSubmit = async (status: 'pending' | 'draft' = 'pending') => {
    setIsSubmitting(true);
    
    try {
      // 1. Génération d'un numéro de dossier professionnel (ex: KA-2026-042)
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const caseReference = `KA-${year}-${randomNum}`;
      const fullName = `${patientData.firstName} ${patientData.lastName}`;

      // 2. Insertion dans la table `cases`
      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert([
          {
            case_reference: caseReference,
            patient_name: fullName,
            pathology: clinicalData.pathology,
            priority: clinicalData.priority,
            center: user?.centerName || 'Centre KANYEH',
            status: status,
            images_count: images.length,
            analysis_notes: clinicalData.clinicalNotes,
            created_by: user?.id,
          }
        ])
        .select()
        .single();

      if (caseError) throw caseError;

      // 3. Traçabilité : Enregistrement de l'action dans la table `activities`
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
      
      // 4. Redirection vers la liste d'attente
      navigate('/dashboard/pending');

    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de la création du dossier médical.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Nouveau Dossier Médical
        </h1>
        <p className="text-muted-foreground">Créer un nouveau cas d'analyse pathologique</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className={currentStep === 'patient' ? 'text-primary' : 'text-muted-foreground'}>Patient</span>
          <span className={currentStep === 'clinical' ? 'text-primary' : 'text-muted-foreground'}>Clinique</span>
          <span className={currentStep === 'images' ? 'text-primary' : 'text-muted-foreground'}>Images</span>
          <span className={currentStep === 'review' ? 'text-primary' : 'text-muted-foreground'}>Vérification</span>
        </div>
        <Progress 
          value={currentStep === 'patient' ? 25 : currentStep === 'clinical' ? 50 : currentStep === 'images' ? 75 : 100} 
          className="h-2"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* STEP 1: PATIENT */}
          {currentStep === 'patient' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Informations du Patient</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom <span className="text-destructive">*</span></Label>
                  <Input 
                    value={patientData.firstName} 
                    onChange={e => setPatientData({...patientData, firstName: e.target.value})} 
                    placeholder="Ex: Aminata" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom <span className="text-destructive">*</span></Label>
                  <Input 
                    value={patientData.lastName} 
                    onChange={e => setPatientData({...patientData, lastName: e.target.value})} 
                    placeholder="Ex: Koné" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numéro CMU (Optionnel)</Label>
                  <Input 
                    value={patientData.nationalId} 
                    onChange={e => setPatientData({...patientData, nationalId: e.target.value})} 
                    placeholder="CMU-XXXXXX" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact</Label>
                  <Input 
                    value={patientData.contact} 
                    onChange={e => setPatientData({...patientData, contact: e.target.value})} 
                    placeholder="+225 0102030405" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CLINICAL */}
          {currentStep === 'clinical' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Détails Cliniques</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Type de Pathologie <span className="text-destructive">*</span></Label>
                  <Select value={clinicalData.pathology} onValueChange={(val: PathologyType) => setClinicalData({...clinicalData, pathology: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breast">Cancer du Sein</SelectItem>
                      <SelectItem value="cervical">Cancer du Col de l'Utérus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select value={clinicalData.priority} onValueChange={(val: CasePriority) => setClinicalData({...clinicalData, priority: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes cliniques pour le pathologiste</Label>
                  <Textarea 
                    value={clinicalData.clinicalNotes} 
                    onChange={e => setClinicalData({...clinicalData, clinicalNotes: e.target.value})} 
                    placeholder="Symptômes, observations macroscopiques..." 
                    className="h-24"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: IMAGES */}
          {currentStep === 'images' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <Microscope className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Captures du Microscope</h2>
              </div>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                <Input
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleImageUpload}
                />
                <Camera className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium">Cliquez pour importer des images ou filmez en direct</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG jusqu'à 10MB</p>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                  {images.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border">
                      <img src={img.url} alt={img.name} className="w-full h-32 object-cover" />
                      <Button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {currentStep === 'review' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <CheckCircle className="h-5 w-5 text-success" />
                <h2 className="text-lg font-semibold">Vérification Finale</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Patient</h3>
                    <p className="font-medium text-lg">{patientData.firstName} {patientData.lastName}</p>
                    <p className="text-sm">{patientData.nationalId || 'Pas de CMU'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Pathologie & Priorité</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline">{clinicalData.pathology === 'breast' ? 'Cancer du Sein' : 'Col de l\'utérus'}</Badge>
                      <Badge variant={clinicalData.priority === 'urgent' ? 'destructive' : clinicalData.priority === 'high' ? 'default' : 'secondary'}>
                        {clinicalData.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Images ({images.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {images.slice(0, 3).map(img => (
                      <img key={img.id} src={img.url} className="w-16 h-16 object-cover rounded border" alt="Aperçu" />
                    ))}
                    {images.length > 3 && (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-sm font-medium">
                        +{images.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={currentStep === 'patient' ? () => navigate('/dashboard') : handlePrevious} disabled={isSubmitting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 'patient' ? 'Annuler' : 'Précédent'}
        </Button>

        <div className="flex gap-3">
          {currentStep === 'review' ? (
            <>
              <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                Brouillon
              </Button>
              <Button onClick={() => handleSubmit('pending')} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Soumettre au Médecin
              </Button>
            </>
          ) : (
            <Button onClick={handleNext}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewCasePage;