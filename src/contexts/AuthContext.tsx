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

  // Fonction pour récupérer les infos du profil (nom, rôle, hôpital)
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
        const firstName = nameParts[0] || 'Utilisateur';
        const lastName = nameParts.slice(1).join(' ') || '';

        setUser({
          id: data.id,
          firstName: firstName,
          lastName: lastName,
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // SOLUTION RAFRAÎCHISSEMENT : On attend intelligemment la session initiale
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur d'initialisation de session", error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // On écoute les changements (déconnexion en temps réel)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_IN' && session) {
        await fetchUserProfile(session.user.id);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // La vraie fonction de Connexion
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // SOLUTION DOUBLE CLIC : On attend de charger le profil ICI avant de valider la fonction !
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
      toast.success('Connexion réussie');
    } catch (error: any) {
      toast.error('Identifiants incorrects');
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, role: UserRole | 'patient', center?: string) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
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
      toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
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
    } finally {
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};