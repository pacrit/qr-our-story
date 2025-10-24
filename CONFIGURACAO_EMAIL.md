# Configuração para desabilitar confirmação de email no Supabase

## No seu projeto Supabase (https://oqrylzipqcggitqvxbhy.supabase.co):

1. Vá para **Authentication > Settings**
2. Procure por **Email Confirmation**
3. **Desmarque** a opção "Enable email confirmations"
4. Salve as alterações

## Execute esta query no SQL Editor do Supabase para confirmar o usuário existente:

```sql
-- PASSO 1: Verificar o status do usuário (execute primeiro para ver o que está acontecendo)
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'patrick.carneiro13@gmail.com';

-- PASSO 2: Forçar confirmação do usuário (execute depois de ver o resultado acima)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'patrick.carneiro13@gmail.com';

-- PASSO 3: Verificar se funcionou (execute para confirmar)
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'patrick.carneiro13@gmail.com';
```

## Para desabilitar confirmação de email para novos usuários:
**IMPORTANTE**: Isso só pode ser feito pelo Dashboard, não por SQL.

## Configuração alternativa via Dashboard:
Authentication > Settings > Email auth > Enable email confirmations = OFF