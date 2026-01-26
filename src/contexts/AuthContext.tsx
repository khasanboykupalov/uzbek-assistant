import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'owner' | 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  isBlocked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role as AppRole | null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const checkIfBlocked = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_status')
        .select('is_blocked')
        .eq('admin_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking block status:', error);
        return false;
      }

      return data?.is_blocked || false;
    } catch (error) {
      console.error('Error checking block status:', error);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setTimeout(async () => {
            const userRole = await fetchUserRole(session.user.id);
            setRole(userRole);

            if (userRole === 'admin') {
              const blocked = await checkIfBlocked(session.user.id);
              setIsBlocked(blocked);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setRole(null);
          setIsBlocked(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);

          if (userRole === 'admin') {
            const blocked = await checkIfBlocked(session.user.id);
            setIsBlocked(blocked);
          }
          setIsLoading(false);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Check if admin is blocked
      if (data.user) {
        const userRole = await fetchUserRole(data.user.id);
        if (userRole === 'admin') {
          const blocked = await checkIfBlocked(data.user.id);
          if (blocked) {
            await supabase.auth.signOut();
            return { error: new Error('Sizning hisobingiz bloklangan') };
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setIsBlocked(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      isLoading, 
      isBlocked,
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
