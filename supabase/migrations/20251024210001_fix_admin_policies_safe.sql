-- ========================================
-- CORREÇÃO DAS POLÍTICAS RLS - ADMIN ÚNICO (VERSÃO IDEMPOTENTE)
-- ========================================
-- Este arquivo corrige as políticas de forma segura, mesmo se já executado

-- 1. Remover todas as políticas existentes da tabela user_roles
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', policy_record.policyname);
    END LOOP;
END $$;

-- 2. Criar função para verificar se já existe admin
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;

-- 3. Criar função para verificar se é o primeiro usuário
CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles
  )
$$;

-- 4. Limpar tabela user_roles se necessário (CUIDADO: isso remove todos os roles!)
-- Descomente a linha abaixo apenas se quiser resetar completamente:
-- DELETE FROM public.user_roles;

-- 5. Criar todas as políticas do zero
-- Qualquer usuário autenticado pode ver roles (necessário para verificações)
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Permitir que usuários se registrem como 'user' (não admin)
CREATE POLICY "Users can register as regular users"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'user'
);

-- Permitir que o primeiro usuário se torne admin automaticamente
CREATE POLICY "First user becomes admin automatically"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'admin'
  AND public.is_first_user()
);

-- Apenas admins podem atualizar roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem deletar roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Criar trigger para auto-registro do primeiro usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se for o primeiro usuário, torna-se admin automaticamente
  IF public.is_first_user() THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Usuários subsequentes se tornam 'user' por padrão
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Função para promover usuário a admin (caso necessário)
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem promover outros usuários
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem promover usuários';
  END IF;
  
  -- Não permitir mais de um admin
  IF public.admin_exists() AND NOT public.has_role(target_user_id, 'admin') THEN
    RAISE EXCEPTION 'Já existe um administrador. Apenas um admin é permitido.';
  END IF;
  
  -- Promover usuário
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- 9. Função para verificar status do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- 10. View para listar usuários e seus roles (apenas para admins)
DROP VIEW IF EXISTS public.users_with_roles;
CREATE VIEW public.users_with_roles AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  COALESCE(ur.role::TEXT, 'user') as role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE public.has_role(auth.uid(), 'admin'); -- Apenas admins podem ver

-- 11. Verificar estado atual do sistema
DO $$
BEGIN
  RAISE NOTICE 'Estado atual do sistema:';
  RAISE NOTICE 'Total de usuários: %', (SELECT COUNT(*) FROM auth.users);
  RAISE NOTICE 'Total de roles: %', (SELECT COUNT(*) FROM public.user_roles);
  RAISE NOTICE 'Admins existentes: %', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin');
  RAISE NOTICE 'Primeiro usuário? %', public.is_first_user();
END $$;

-- 12. Comentários para documentação
COMMENT ON FUNCTION public.admin_exists() IS 'Verifica se já existe um administrador no sistema';
COMMENT ON FUNCTION public.is_first_user() IS 'Verifica se é o primeiro usuário a se registrar';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger que define automaticamente o role do usuário';
COMMENT ON FUNCTION public.promote_to_admin(UUID) IS 'Promove um usuário a administrador (apenas admins)';
COMMENT ON FUNCTION public.get_user_role() IS 'Retorna o role do usuário atual';