import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save, 
  Camera,
  Mail,
  Phone,
  Building2,
  Key,
  Lock,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase'; // <-- IMPORT SUPABASE

const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState({
    firstName: user?.firstName || 'Jean',
    lastName: user?.lastName || 'Dupont',
    email: user?.email || 'jean.dupont@hopital.ml',
    phone: '+223 76 12 34 56',
    center: user?.centerName || 'CHU Gabriel Touré',
    title: 'Dr.',
    specialty: 'Pathologie'
  });

  // RECUPERATION DES VRAIES DONNEES DU PROFIL DEPUIS SUPABASE
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const nameParts = data.full_name ? data.full_name.split(' ') : [profile.firstName, profile.lastName];
        setProfile(prev => ({
          ...prev,
          firstName: nameParts[0] || prev.firstName,
          lastName: nameParts.slice(1).join(' ') || prev.lastName,
          email: data.email || prev.email,
          center: data.center || prev.center,
        }));
      }
    };
    fetchProfile();
  }, [user]);
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNewCase: true,
    emailUrgent: true,
    emailResults: true,
    emailWeeklyReport: false,
    pushNewCase: true,
    pushUrgent: true,
    pushSecondOpinion: true,
    soundEnabled: true
  });
  
  // Appearance preferences
  const [appearance, setAppearance] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    compactMode: false,
    highContrast: false,
    fontSize: 'medium' as 'small' | 'medium' | 'large'
  });
  
  // Security state
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    showPassword: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // SAUVEGARDE REELLE DU PROFIL DANS SUPABASE
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde du profil");
    } else {
      toast.success(t('settings.profileSaved'));
    }
  };

  const handleSaveNotifications = () => {
    toast.success(t('settings.notificationsSaved'));
  };

  const handleSaveAppearance = () => {
    toast.success(t('settings.appearanceSaved'));
  };

  // SAUVEGARDE REELLE DU NOUVEAU MOT DE PASSE
  const handleChangePassword = async () => {
    if (security.newPassword !== security.confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }
    if (security.newPassword.length < 8) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: security.newPassword
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('settings.passwordChanged'));
      setSecurity({ ...security, currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleEnable2FA = () => {
    setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled });
    toast.success(security.twoFactorEnabled ? t('settings.2faDisabled') : t('settings.2faEnabled'));
  };

  const getRoleBadge = () => {
    const roleColors: Record<string, string> = {
      system_admin: 'bg-red-500/10 text-red-600 border-red-200',
      center_admin: 'bg-blue-500/10 text-blue-600 border-blue-200',
      lab_technician: 'bg-green-500/10 text-green-600 border-green-200',
      pathologist: 'bg-purple-500/10 text-purple-600 border-purple-200',
      clinician: 'bg-orange-500/10 text-orange-600 border-orange-200'
    };
    return roleColors[user?.role || 'clinician'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.profile')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.appearance')}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t('settings.security')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profileInfo')}</CardTitle>
              <CardDescription>{t('settings.profileInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{profile.title} {profile.firstName} {profile.lastName}</h3>
                  <p className="text-muted-foreground">{profile.specialty}</p>
                  <Badge variant="outline" className={`mt-2 ${getRoleBadge()}`}>
                    {t(`login.role.${user?.role}`)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('settings.titleField')}</Label>
                  <Select value={profile.title} onValueChange={(v) => setProfile({ ...profile, title: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Pr.">Pr.</SelectItem>
                      <SelectItem value="M.">M.</SelectItem>
                      <SelectItem value="Mme">Mme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">{t('settings.specialty')}</Label>
                  <Input 
                    id="specialty" 
                    value={profile.specialty}
                    onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('settings.firstName')}</Label>
                  <Input 
                    id="firstName" 
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('settings.lastName')}</Label>
                  <Input 
                    id="lastName" 
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('settings.email')}
                  </Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t('settings.phone')}
                  </Label>
                  <Input 
                    id="phone" 
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="center" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('settings.center')}
                  </Label>
                  <Input 
                    id="center" 
                    value={profile.center}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {t('settings.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.emailNotifications')}</CardTitle>
              <CardDescription>{t('settings.emailNotificationsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.newCaseNotif')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.newCaseNotifDesc')}</p>
                </div>
                <Switch 
                  checked={notifications.emailNewCase}
                  onCheckedChange={(c) => setNotifications({ ...notifications, emailNewCase: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.urgentNotif')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.urgentNotifDesc')}</p>
                </div>
                <Switch 
                  checked={notifications.emailUrgent}
                  onCheckedChange={(c) => setNotifications({ ...notifications, emailUrgent: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.resultsNotif')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.resultsNotifDesc')}</p>
                </div>
                <Switch 
                  checked={notifications.emailResults}
                  onCheckedChange={(c) => setNotifications({ ...notifications, emailResults: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.weeklyReport')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.weeklyReportDesc')}</p>
                </div>
                <Switch 
                  checked={notifications.emailWeeklyReport}
                  onCheckedChange={(c) => setNotifications({ ...notifications, emailWeeklyReport: c })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.pushNotifications')}</CardTitle>
              <CardDescription>{t('settings.pushNotificationsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.pushNewCase')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.pushNewCaseDesc')}</p>
                </div>
                <Switch 
                  checked={notifications.pushNewCase}
                  onCheckedChange={(c) => setNotifications({ ...notifications, pushNewCase: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.pushUrgent')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.pushUrgentDesc')}</p>
                </div>
                <Switch 
                  checked={notifications.pushUrgent}
                  onCheckedChange={(c) => setNotifications({ ...notifications, pushUrgent: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.pushSecondOpinion')}</Label>
                  <p className="text-sm text-muted-foreground">{t('settings.pushSecondOpinionDesc')}</p>
                </div>
                <Switch 
                  checked={notifications.pushSecondOpinion}
                  onCheckedChange={(c) => setNotifications({ ...notifications, pushSecondOpinion: c })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {notifications.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    {t('settings.sound')}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('settings.soundDesc')}</p>
                </div>
                <Switch 
                  checked={notifications.soundEnabled}
                  onCheckedChange={(c) => setNotifications({ ...notifications, soundEnabled: c })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t('settings.save')}
            </Button>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.themeSettings')}</CardTitle>
              <CardDescription>{t('settings.themeSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{t('settings.theme')}</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={appearance.theme === 'light' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                  >
                    <Sun className="h-5 w-5" />
                    <span>{t('settings.lightMode')}</span>
                  </Button>
                  <Button
                    variant={appearance.theme === 'dark' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                  >
                    <Moon className="h-5 w-5" />
                    <span>{t('settings.darkMode')}</span>
                  </Button>
                  <Button
                    variant={appearance.theme === 'system' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setAppearance({ ...appearance, theme: 'system' })}
                  >
                    <Monitor className="h-5 w-5" />
                    <span>{t('settings.systemMode')}</span>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>{t('settings.language')}</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Select value={language} onValueChange={(v: 'fr' | 'en') => setLanguage(v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>{t('settings.fontSize')}</Label>
                <Select 
                  value={appearance.fontSize} 
                  onValueChange={(v: 'small' | 'medium' | 'large') => setAppearance({ ...appearance, fontSize: v })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t('settings.fontSmall')}</SelectItem>
                    <SelectItem value="medium">{t('settings.fontMedium')}</SelectItem>
                    <SelectItem value="large">{t('settings.fontLarge')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.compactMode')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.compactModeDesc')}</p>
                  </div>
                  <Switch 
                    checked={appearance.compactMode}
                    onCheckedChange={(c) => setAppearance({ ...appearance, compactMode: c })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.highContrast')}</Label>
                    <p className="text-sm text-muted-foreground">{t('settings.highContrastDesc')}</p>
                  </div>
                  <Switch 
                    checked={appearance.highContrast}
                    onCheckedChange={(c) => setAppearance({ ...appearance, highContrast: c })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveAppearance} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t('settings.save')}
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t('settings.changePassword')}
              </CardTitle>
              <CardDescription>{t('settings.changePasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
                <div className="relative">
                  <Input 
                    id="currentPassword" 
                    type={security.showPassword ? 'text' : 'password'}
                    value={security.currentPassword}
                    onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setSecurity({ ...security, showPassword: !security.showPassword })}
                  >
                    {security.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={security.newPassword}
                    onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} variant="outline">
                  {t('settings.updatePassword')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('settings.twoFactor')}
              </CardTitle>
              <CardDescription>{t('settings.twoFactorDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${security.twoFactorEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                    <Lock className={`h-5 w-5 ${security.twoFactorEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">
                      {security.twoFactorEnabled ? t('settings.2faActive') : t('settings.2faInactive')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {security.twoFactorEnabled ? t('settings.2faActiveDesc') : t('settings.2faInactiveDesc')}
                    </p>
                  </div>
                </div>
                <Button 
                  variant={security.twoFactorEnabled ? 'destructive' : 'default'}
                  onClick={handleEnable2FA}
                >
                  {security.twoFactorEnabled ? t('settings.disable') : t('settings.enable')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.sessionSettings')}</CardTitle>
              <CardDescription>{t('settings.sessionSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.sessionTimeout')}</Label>
                <Select 
                  value={security.sessionTimeout} 
                  onValueChange={(v) => setSecurity({ ...security, sessionTimeout: v })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 {t('settings.minutes')}</SelectItem>
                    <SelectItem value="30">30 {t('settings.minutes')}</SelectItem>
                    <SelectItem value="60">1 {t('settings.hour')}</SelectItem>
                    <SelectItem value="120">2 {t('settings.hours')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">{t('settings.sessionTimeoutDesc')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">{t('settings.dangerZone')}</CardTitle>
              <CardDescription>{t('settings.dangerZoneDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" disabled>
                {t('settings.deleteAccount')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;