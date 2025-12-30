import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/lib/error-messages';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; message?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { full_name?: string; email?: string; avatar_url?: string }) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);

      // Validation
      if (!email || !password) {
        const errorMsg = !email ? 'Email is required' : 'Password is required';
        setError(getErrorMessage(errorMsg));
        return { error: null, message: errorMsg };
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        const errorMessage = getErrorMessage(authError.message);
        setError(errorMessage);
        return { error: authError, message: errorMessage };
      }

      // If email confirmation is disabled, user is immediately logged in
      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
      }

      return { error: null };
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { error: err as AuthError, message: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);

      // Validation
      if (!email || !password) {
        const errorMsg = !email ? 'Email is required' : 'Password is required';
        setError(getErrorMessage(errorMsg));
        return { error: null, message: errorMsg };
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const errorMessage = getErrorMessage(authError.message);
        setError(errorMessage);
        return { error: authError, message: errorMessage };
      }

      setUser(data.user);
      setSession(data.session);

      return { error: null };
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { error: err as AuthError, message: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      navigate('/auth');
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Error signing out:', err);
    }
  };

  const updateProfile = (data: { full_name?: string; email?: string; avatar_url?: string }) => {
    if (!user) return;
    
    // Update local user state
    const updatedUser = {
      ...user,
      user_metadata: {
        ...user.user_metadata,
        ...data,
      },
      email: data.email || user.email,
    };
    
    setUser(updatedUser);
  };

  const clearError = () => {
    setError(null);
  };


  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
