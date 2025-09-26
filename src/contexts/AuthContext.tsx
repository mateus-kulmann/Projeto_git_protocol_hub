import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id?: string;
  tenant_id: string;
  department_id?: string;
  department_name?: string;
  tenant_name: string;
  tenant_config: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Get user details from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, tenant_id, nome, email, funcao, department_id, role_id, ativo, created_at, auth_user_id, telefone')
          .eq('auth_user_id', session.user.id)
          .single();

        if (userError || !userData || !userData.ativo) {
          // If user is explicitly deactivated, sign out
          if (userData && !userData.ativo) {
            console.log('User is deactivated or not found, signing out...');
            await supabase.auth.signOut();
            setUser(null);
            setIsLoading(false);
            return;
          }
          
          // If user doesn't exist yet, wait for trigger to create it
          console.warn('User not found in users table, will be created automatically');
          setIsLoading(false);
          
          // Try again after a delay to allow user creation
          setTimeout(() => {
            console.log('Retrying auth check for user creation...');
            checkAuth();
          }, 2000);
          return;
        }

        // Get department name separately if department_id exists
        let departmentName = null;
        if (userData.department_id) {
          const { data: deptData } = await supabase
            .from('departments')
            .select('nome')
            .eq('id', userData.department_id)
            .single();
          departmentName = deptData?.nome;
        }

        // Get tenant info separately
        let tenantName = null;
        let tenantConfig = null;
        if (userData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('nome, configuracao')
            .eq('id', userData.tenant_id)
            .single();
          tenantName = tenantData?.nome;
          tenantConfig = tenantData?.configuracao;
        }

        const user = {
          id: userData.id,
          name: userData.nome,
          email: userData.email,
          role: userData.funcao,
          role_id: userData.role_id,
          tenant_id: userData.tenant_id,
          department_id: userData.department_id,
          department_name: departmentName,
          tenant_name: tenantName,
          tenant_config: tenantConfig
        };

        setUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          checkAuth();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error('Credenciais inválidas');
      }

      if (!authData.user) {
        throw new Error('Erro na autenticação');
      }

      // User data will be set by the auth state change listener

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
