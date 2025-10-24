import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserInfo {
  id: string;
  email: string;
  created_at: string;
}

export const authService = {
  // Verificar se usuário atual é admin (no sistema simples, se está autenticado, é admin)
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user; // Se está autenticado, é admin
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  },

  // Obter role do usuário atual (sempre admin se autenticado)
  async getCurrentUserRole(): Promise<'admin' | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user ? 'admin' : null;
    } catch (error) {
      console.error('Erro ao obter role:', error);
      return null;
    }
  },

  // Contar usuários no sistema
  async countUsers(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('count_users');

      if (error) {
        console.error('Erro ao contar usuários:', error);
        return 1; // Por segurança, assumir que existe pelo menos 1
      }
      
      return data || 0;
    } catch (error) {
      console.error('Erro ao contar usuários:', error);
      return 1;
    }
  },

  // Fazer login
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success('Login realizado com sucesso! (Administrador)');
      
      return { user: data.user, role: 'admin' as const };
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  },

  // Registrar novo usuário
  async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Mensagens específicas para o sistema simples
        if (error.message.includes('permite apenas uma conta') || 
            error.message.includes('administrador')) {
          throw new Error('Este sistema permite apenas uma conta de administrador. Se você é o proprietário, entre em contato com o suporte.');
        }
        throw error;
      }

      if (data.user) {
        toast.success('Conta criada com sucesso! Você tem acesso total ao sistema.');
        return { user: data.user, role: 'admin' as const };
      }

      throw new Error('Falha ao criar usuário');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    }
  },

  // Fazer logout
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
      throw error;
    }
  },

  // Obter informações do usuário atual
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }
};