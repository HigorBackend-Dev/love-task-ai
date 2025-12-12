import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, Shield, Bot } from 'lucide-react';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Love Task AI
          </h1>
          <Button onClick={() => navigate('/auth')} variant="default">
            Entrar / Cadastrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent">
            Gerencie suas tarefas com Inteligência Artificial
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Uma aplicação moderna que combina gerenciamento de tarefas com um assistente de IA para ajudá-lo a ser mais produtivo.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg"
          >
            Começar Agora - É Grátis
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 hover:border-purple-300 transition-all">
            <CardHeader>
              <Bot className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Assistente IA</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat inteligente que melhora seus títulos e ajuda a gerenciar tarefas naturalmente
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition-all">
            <CardHeader>
              <Zap className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Rápido e Simples</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Interface intuitiva para criar, editar e organizar suas tarefas em segundos
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-pink-300 transition-all">
            <CardHeader>
              <Shield className="h-10 w-10 text-pink-600 mb-2" />
              <CardTitle>Seguro</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Autenticação profissional com Supabase e seus dados protegidos com RLS
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-300 transition-all">
            <CardHeader>
              <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Organizado</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Acompanhe o progresso de suas tarefas e mantenha tudo sob controle
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
          <CardContent className="py-12 text-center">
            <h3 className="text-3xl font-bold mb-4">
              Pronto para ser mais produtivo?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Crie sua conta gratuitamente e comece a organizar suas tarefas com IA
            </p>
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Criar Conta Grátis
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>Love Task AI - Sistema de gerenciamento de tarefas com inteligência artificial</p>
        <p className="text-sm mt-2">Desenvolvido com ❤️ usando React, Supabase e IA</p>
      </footer>
    </div>
  );
}
