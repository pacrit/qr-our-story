-- ========================================
-- SISTEMA ULTRA SIMPLES - SEM TRIGGERS
-- ========================================
-- Sistema permite 1 conta, sem complexidade

-- 1. REMOVER TUDO
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.is_first_admin() CASCADE;
DROP FUNCTION IF EXISTS public.create_first_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_any_user() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_multiple_users() CASCADE;
DROP TRIGGER IF EXISTS prevent_multiple_users_trigger ON auth.users;

-- 2. LIMPAR POLÍTICAS DA TABELA PHOTOS
DROP POLICY IF EXISTS "Users can view all photos" ON public.photos;
DROP POLICY IF EXISTS "Users can insert photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON public.photos;
DROP POLICY IF EXISTS "authenticated_full_access" ON public.photos;

-- 3. CRIAR POLÍTICA SUPER SIMPLES PARA PHOTOS
CREATE POLICY "anyone_authenticated_can_do_anything"
ON public.photos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. CRIAR FUNÇÃO SIMPLES PARA VERIFICAR SE HÁ USUÁRIOS
CREATE OR REPLACE FUNCTION public.count_users()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER FROM auth.users;
$$;

-- 5. VERIFICAR ESTADO
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SISTEMA SUPER SIMPLES ATIVO!';
    RAISE NOTICE 'Total usuários: %', public.count_users();
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COMO USAR:';
    RAISE NOTICE '1. Primeira pessoa pode se registrar normalmente';
    RAISE NOTICE '2. Apenas 1 conta será permitida (controlado no frontend)';
    RAISE NOTICE '3. Quem está logado tem acesso total';
    RAISE NOTICE '========================================';
END $$;