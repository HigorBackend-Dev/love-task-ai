import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user, signUp, signIn, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Show error toast if it exists
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const validateForm = (): boolean => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setLocalError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return false;
    }

    if (isSignUp) {
      if (!confirmPassword) {
        setLocalError('Please confirm your password');
        return false;
      }

      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      if (isSignUp) {
        const { error: signupError, message } = await signUp(email, password);
        
        if (signupError || message) {
          setLocalError(message || 'Sign up failed. Please try again.');
          toast({
            title: 'Sign Up Error',
            description: message || 'Could not create account',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account Created',
            description: 'Welcome! You can now access your dashboard.',
          });
          // Reset form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          // Switch to login mode after successful signup
          setIsSignUp(false);
        }
      } else {
        const { error: signinError, message } = await signIn(email, password);
        
        if (signinError || message) {
          setLocalError(message || 'Invalid login credentials');
          toast({
            title: 'Login Error',
            description: message || 'Could not sign in',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Logged In',
            description: 'Welcome back!',
          });
          // Navigation will happen automatically due to useEffect watching user
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setLocalError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/3 to-background relative overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Love Task AI</CardTitle>
            <CardDescription>
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Alert */}
            {localError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{localError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLocalError(null);
                  }}
                  disabled={isLoading}
                  className="border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError(null);
                  }}
                  disabled={isLoading}
                  className="border-primary/20"
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setLocalError(null);
                    }}
                    disabled={isLoading}
                    className="border-primary/20"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setLocalError(null);
                  }}
                  className="text-primary font-medium hover:underline"
                  disabled={isLoading}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
