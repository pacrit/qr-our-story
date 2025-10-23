-- Permitir que o primeiro usuário se torne admin automaticamente
CREATE POLICY "Allow first user to become admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
);

-- Adicionar role de admin para o usuário existente
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'patrick.carneiro13@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;