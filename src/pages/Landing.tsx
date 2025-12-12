import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Shield, Bot, Sparkles, ArrowRight, Star, Users, MessageSquare } from 'lucide-react';

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/3 to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl landing-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-primary/20 rounded-full blur-3xl landing-float" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Header */}
      <header className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg landing-pulse">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Love Task AI
            </h1>
          </div>
          <Button 
            onClick={() => navigate('/auth')} 
            variant="outline"
            className="border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 hover:scale-105 landing-focusable"
          >
            Entrar / Cadastrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
          <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20 animate-in slide-in-from-top-2 duration-500 delay-200">
            <Star className="h-3 w-3 mr-1" />
            Powered by AI
          </Badge>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent leading-tight">
            Manage your tasks with
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-primary bg-clip-text text-transparent">
              Artificial Intelligence
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            A modern application that combines task management with an AI assistant to 
            <span className="font-medium text-foreground">help you be more productive</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 text-primary-foreground px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group landing-focusable"
            >
              Get Started - It's Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Join 1000+ productive users</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="group border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Smart chat that improves your titles and helps manage tasks naturally
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group border border-border/50 bg-card/50 backdrop-blur-sm hover:border-blue-500/30 hover:bg-card/80 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-500">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Fast and Simple</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Intuitive interface to create, edit and organize your tasks in seconds
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group border border-border/50 bg-card/50 backdrop-blur-sm hover:border-green-500/30 hover:bg-card/80 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-700">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Professional authentication with Supabase and your data protected with RLS
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group border border-border/50 bg-card/50 backdrop-blur-sm hover:border-purple-500/30 hover:bg-card/80 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-900">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Organized</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Track the progress of your tasks and keep everything under control
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 border-0 text-primary-foreground shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-1000">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          
          <CardContent className="py-16 text-center relative z-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to be more productive?
            </h3>
            
            <p className="text-lg lg:text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
              Create your account for free and start organizing your tasks with AI
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                variant="secondary"
                onClick={() => navigate('/auth')}
                className="bg-background text-primary hover:bg-background/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-8 py-6 text-lg font-semibold group landing-focusable"
              >
                Create Free Account
                <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Button>
              
              <div className="flex items-center gap-2 text-sm opacity-75">
                <CheckCircle className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center relative z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <p className="font-medium text-foreground">Love Task AI</p>
          </div>
          <p className="text-muted-foreground mb-2">Task management system with artificial intelligence</p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Developed with 
            <span className="text-red-500 animate-pulse">❤️</span> 
            using React, Supabase and AI
          </p>
        </div>
      </footer>
    </div>
  );
}
