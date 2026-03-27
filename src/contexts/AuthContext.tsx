import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/user';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, fullName: string, role: UserRole | 'patient', center?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;

      if (data) {
        const nameParts = data.full_name ? data.full_name.split(' ') : ['Utilisateur', ''];
        setUser({
          id: data.id,
          firstName: nameParts[0] || 'Utilisateur',
          lastName: nameParts.slice(1).join(' ') || '',
          role: data.role as UserRole,
          email: data.email,
          centerId: 'C001',
          centerName: data.center || 'Plateforme KANYEH',
          createdAt: data.created_at || new Date().toISOString(),
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erreur profil:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // ARRÊT D'URGENCE : Si Supabase ne répond pas en 6s, on libère l'écran
    const fallbackTimeout = setTimeout(() => {
      if (mounted && isLoading) setIsLoading(false);
    }, 6000);

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session && mounted) {
          await fetchUserProfile(session.user.id);
        } else if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (_event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      } else if (session) {
        await fetchUserProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email: string, password: string, fullName: string, role: UserRole | 'patient', center?: string) => {
    // 1. Création du compte de connexion
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    // 2. Création du profil public
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: authData.user.id, email: email, full_name: fullName, role: role, center: center || null }
      ]);
      // Si la RLS bloque l'inscription, l'erreur remontera ici immédiatement
      if (profileError) {
        console.error("Erreur d'insertion:", profileError);
        throw new Error(`La base de données a bloqué le profil (Erreur: ${profileError.message})`);
      }
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};