import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import kanyehLogo from '@/assets/kanyeh-logo.jpg';
import { ArrowLeft, Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const { login, register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('lab_technician');
  const [center, setCenter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const loginTask = login(email, password);
      const timeoutTask = new Promise((_, reject) => setTimeout(() => reject(new Error("Délai d'attente dépassé (Réseau lent)")), 8000));
      
      await Promise.race([loginTask, timeoutTask]);
      toast.success("Connexion réussie !");
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Identifiants incorrects.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const registerTask = register(email, password, fullName, role as UserRole | 'patient', center);
      const timeoutTask = new Promise((_, reject) => setTimeout(() => reject(new Error("Délai d'attente dépassé. Vérifiez votre réseau.")), 8000));
      
      await Promise.race([registerTask, timeoutTask]);
      toast.success("Inscription validée !");
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Impossible de créer le compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <LanguageSwitcher />
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={kanyehLogo} alt="KANYEH" className="h-16 w-16 rounded-xl shadow-md" />
          </div>
          <div>
            <CardTitle className="text-2xl text-primary">KANYEH ASSIST</CardTitle>
            <CardDescription className="mt-2">Portail Médical Sécurisé</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login"><LogIn className="h-4 w-4 mr-2" /> Connexion</TabsTrigger>
              <TabsTrigger value="register"><UserPlus className="h-4 w-4 mr-2" /> S'inscrire</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Adresse Email</Label>
                  <Input type="email" placeholder="docteur@hopital.ci" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input type="text" placeholder="Ex: Dr. Konaté" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Adresse Email</Label>
                  <Input type="email" placeholder="email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Votre profil</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="border-primary"><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lab_technician">👨‍🔬 Technicien Labo</SelectItem>
                        <SelectItem value="clinician">🩺 Clinicien</SelectItem>
                        <SelectItem value="pathologist">🔬 Pathologiste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Centre (Optionnel)</Label>
                    <Input type="text" placeholder="Ex: CHU Cocody" value={center} onChange={(e) => setCenter(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Créer un mot de passe</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full mt-6 bg-success text-white" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Créer mon compte"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;