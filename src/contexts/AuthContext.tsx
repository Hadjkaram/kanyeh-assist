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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

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
      console.error('Erreur lors de la récupération du profil:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    let mounted = true;

    // 🛡️ TOLÉRANCE AUGMENTÉE : On donne 7 secondes à Supabase pour répondre (utile si le réseau est lent)
    const fallbackTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        setIsLoading(false);
      }
    }, 7000);

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
        console.error("Erreur d'initialisation de session", error);
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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Connexion réussie');
    } catch (error: any) {
      toast.error('Identifiants incorrects');
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, role: UserRole | 'patient', center?: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;

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
      toast.success('Inscription réussie ! Vous pouvez vous connecter.');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      toast.error('Erreur lors de la déconnexion');
      setIsLoading(false);
    }
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