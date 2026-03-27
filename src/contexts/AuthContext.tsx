import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/user';
import { toast } from 'sonner';
// On n'importe même plus supabase ici pour être sûr à 100% que rien ne bloque !

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

  useEffect(() => {
    // On simule un micro-chargement de 0.5s pour faire naturel, puis on ouvre les portes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string) => {
    // BYPASS CONNEXION : Accepte tout et connecte en tant que Clinicien par défaut
    const mockUser: User = {
      id: 'mock-id-123',
      firstName: 'Dr. Démo',
      lastName: '(Clinicien)',
      role: 'clinician',
      email: email,
      centerId: 'C001',
      centerName: 'CHU KANYEH (Mode Démo)',
      createdAt: new Date().toISOString(),
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    toast.success('Connexion forcée (Mode Démo)');
  };

  const register = async (email: string, password: string, fullName: string, role: UserRole | 'patient', center?: string) => {
    // BYPASS INSCRIPTION : Prend le rôle que tu as sélectionné dans la liste et te connecte avec !
    const mockUser: User = {
      id: 'mock-id-456',
      firstName: fullName || 'Utilisateur',
      lastName: '(Mode Démo)',
      role: role as UserRole,
      email: email,
      centerId: 'C001',
      centerName: center || 'Centre de Test',
      createdAt: new Date().toISOString(),
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    toast.success(`Connecté avec le rôle : ${role}`);
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Déconnecté');
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