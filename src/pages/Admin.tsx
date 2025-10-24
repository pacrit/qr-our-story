import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, Lock } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // No sistema simples, se está autenticado, é admin
      navigate('/admin/dashboard');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Primeiro verificar se já existe usuário no sistema
        try {
          const { data: userCount, error: countError } = await supabase.rpc('count_users');
          
          if (countError) {
            console.error('Erro ao verificar usuários existentes:', countError);
            throw new Error('Erro ao verificar sistema. Tente novamente.');
          }
          
          if (userCount && userCount > 0) {
            throw new Error('Este sistema permite apenas uma conta de administrador. Já existe um usuário cadastrado. Use "Já tem conta? Faça login" se você é o proprietário.');
          }
        } catch (countError: any) {
          console.error('Erro na verificação de usuários:', countError);
          // Se houve erro na verificação OU já existe usuário, não continuar
          throw countError;
        }

        // Se chegou até aqui, pode tentar criar o usuário
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          // Mensagens de erro específicas
          if (error.code === 'user_already_exists') {
            throw new Error("Usuário já existe! Use o botão 'Já tem conta? Faça login' para entrar.");
          }
          throw error;
        }

        if (data.user) {
          toast.success('Conta de administrador criada com sucesso! Você tem acesso total ao sistema.');
          navigate('/admin/dashboard');
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          toast.success('Login realizado!');
          navigate('/admin/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-elegant">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Área dos Noivos</h1>
          <p className="text-muted-foreground">
            {isSignUp ? 'Crie sua conta de administrador' : 'Acesse o painel administrativo'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Já tem conta? Faça login' : 'Primeira vez? Crie sua conta'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => navigate('/')}
            className="text-muted-foreground"
          >
            Voltar para o álbum
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Admin;
