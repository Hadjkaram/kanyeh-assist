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

const Login: React.FC = () => {
  const { t } = useLanguage();
  const { login, register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456'); // Rempli par défaut pour aller vite
  const [fullName, setFullName] = useState('Testeur Démo');
  const [role, setRole] = useState<string>('lab_technician');
  const [center, setCenter] = useState('CHU Test');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Écouteur magique : dès que le faux profil est créé, on propulse vers le dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(email || 'test@test.com', password);
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // On passe directement le rôle sélectionné au faux backend
    await register(email || 'test@test.com', password, fullName, role as UserRole | 'patient', center);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            <CardTitle className="text-2xl text-primary">MODE DÉMO ACTIF</CardTitle>
            <CardDescription className="mt-2 text-orange-500 font-bold">Connexion base de données ignorée.</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login"><LogIn className="h-4 w-4 mr-2" /> Rapide</TabsTrigger>
              <TabsTrigger value="register"><UserPlus className="h-4 w-4 mr-2" /> Choisir Rôle</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Entrer direct (Clinicien)"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>Quel rôle voulez-vous tester ?</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="border-primary">
                      <SelectValue placeholder="Choisir un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lab_technician">👨‍🔬 Technicien Labo</SelectItem>
                      <SelectItem value="clinician">🩺 Clinicien</SelectItem>
                      <SelectItem value="pathologist">🔬 Pathologiste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full mt-6 bg-success text-white" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Accéder au tableau de bord"}
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