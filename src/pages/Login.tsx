import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase'; // Import direct de Supabase
import { UserRole } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import kanyehLogo from '@/assets/kanyeh-logo.jpg';
import { ArrowLeft, Loader2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('patient');
  const [center, setCenter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // MÉTHODE RADICALE DE CONNEXION (Bypass du contexte, attaque directe)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. On tue toute session fantôme corrompue en mémoire
      await supabase.auth.signOut();
      localStorage.clear();

      // 2. On connecte directement l'utilisateur
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      if (!data.user) throw new Error("Erreur inconnue de Supabase");

      toast.success("Connexion réussie !");
      
      // 3. Redirection ABSOLUE du navigateur (impossible à bloquer)
      window.location.href = '/dashboard';

    } catch (error: any) {
      console.error("Erreur de connexion :", error);
      toast.error(error.message || "Identifiants incorrects.");
      setIsSubmitting(false);
    }
  };

  // MÉTHODE RADICALE D'INSCRIPTION
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await supabase.auth.signOut();
      localStorage.clear();

      // 1. Création dans Authentication
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

      // 2. Création forcée dans la table Profiles
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: role,
            center: center || null,
          }
        ]);
        if (profileError) throw profileError;
      }

      toast.success("Inscription validée ! Ouverture de votre espace...");
      window.location.href = '/dashboard';

    } catch (error: any) {
      console.error("Erreur d'inscription :", error);
      toast.error(error.message || "Impossible de créer le compte.");
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
          <ArrowLeft className="h-4 w-4" />
          {t('nav.home')}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={kanyehLogo} alt="KANYEH ASSIST" className="h-16 w-16 rounded-xl shadow-md" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display text-primary">KANYEH ASSIST</CardTitle>
            <CardDescription className="mt-2">Portail Médical Sécurisé</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                Connexion
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                S'inscrire
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Adresse Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="docteur@hopital.ci"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <a href="#" className="text-xs text-primary hover:underline">Mot de passe oublié ?</a>
                  </div>
                  <Input 
                    id="login-password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nom complet</Label>
                  <Input 
                    id="reg-name" 
                    type="text" 
                    placeholder="Ex: Dr. Konaté"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Adresse Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Votre profil</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="lab_technician">Technicien Labo</SelectItem>
                        <SelectItem value="pathologist">Pathologiste</SelectItem>
                        <SelectItem value="clinician">Clinicien</SelectItem>
                        <SelectItem value="center_admin">Admin Centre</SelectItem>
                        <SelectItem value="system_admin">Admin Système</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-center">Centre (Optionnel)</Label>
                    <Input 
                      id="reg-center" 
                      type="text" 
                      placeholder="Ex: CHU Cocody"
                      value={center}
                      onChange={(e) => setCenter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Créer un mot de passe</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full mt-6 bg-success hover:bg-success/90 text-white" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte"}
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