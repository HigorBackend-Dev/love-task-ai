import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ConfirmEmail() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Se o usuário já está confirmado, redireciona
    if (user?.confirmed_at) {
      setConfirmed(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  }, [user, navigate]);

  useEffect(() => {
    // Verifica se há um token de confirmação na URL
    const token = searchParams.get('token');
    if (token) {
      handleConfirmation(token);
    }

    // Tenta obter email do localStorage (salvo durante signup)
    const savedEmail = localStorage.getItem('pendingConfirmationEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [searchParams]);

  const handleConfirmation = async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // O link de confirmação já foi clicado no e-mail
      // Supabase processa automaticamente
      setMessage('Checking confirmation...');
      
      // Aguarda um momento para Supabase processar
      setTimeout(() => {
        if (user?.confirmed_at) {
          setConfirmed(true);
          setMessage('Email confirmed successfully! Redirecting...');
        } else {
          setError('Confirmation may have already been processed. Please try logging in.');
        }
      }, 1000);
    } catch (err) {
      setError('Error confirming email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email not found. Please sign up again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Aqui você chamaria um endpoint para reenviar o e-mail
      // Por enquanto, mostra uma mensagem
      setMessage('Confirmation email would be resent to ' + email);
      // TODO: Implementar reenvio de e-mail via Edge Function ou API
    } catch (err) {
      setError('Error resending email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {confirmed ? (
              <CheckCircle className="h-12 w-12 text-green-600" />
            ) : (
              <Mail className="h-12 w-12 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {confirmed ? 'Email Confirmed!' : 'Confirm Your Email'}
          </CardTitle>
          <CardDescription>
            {confirmed
              ? 'Your email has been confirmed. You can now use all features.'
              : 'We sent a confirmation link to your email address.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {email && !confirmed && (
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
              Confirmation email sent to: <strong>{email}</strong>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="border-blue-500 bg-blue-50">
              <AlertDescription className="text-blue-800">{message}</AlertDescription>
            </Alert>
          )}

          {confirmed && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}

          {!confirmed && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>1.</strong> Check your email inbox</p>
                <p><strong>2.</strong> Look for an email from Supabase</p>
                <p><strong>3.</strong> Click the confirmation link in the email</p>
                <p><strong>4.</strong> You'll be automatically logged in</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-3">Didn't receive the email?</p>
                <Button
                  onClick={handleResendEmail}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend Confirmation Email'
                  )}
                </Button>
              </div>

              <Button
                onClick={() => navigate('/auth')}
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
