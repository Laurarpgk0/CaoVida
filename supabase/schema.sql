
BEGIN;

-- 1. Criar controle de sessões
CREATE TABLE IF NOT EXISTS public.app_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_session_id text NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    UNIQUE(user_id, auth_session_id)
);

-- 2. Verificar a tabela profiles existente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'id'
          AND data_type = 'uuid'
    ) THEN
        RAISE EXCEPTION
        'A tabela profiles precisa possuir uma coluna id do tipo UUID. Verifique sua estrutura antes de continuar.';
    END IF;
END $$;

-- 3. Adicionar campos que estiverem faltando em profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name text DEFAULT 'Aluno';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'aluno';

UPDATE public.profiles
SET name = 'Aluno'
WHERE name IS NULL;

UPDATE public.profiles
SET role = 'aluno'
WHERE role IS NULL;

ALTER TABLE public.profiles
ALTER COLUMN name SET DEFAULT 'Aluno';

ALTER TABLE public.profiles
ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'aluno';

ALTER TABLE public.profiles
ALTER COLUMN role SET NOT NULL;

-- 4. Criar salas
CREATE TABLE IF NOT EXISTS public.rooms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL
);

-- 5. Criar participantes das salas
CREATE TABLE IF NOT EXISTS public.room_members (
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    PRIMARY KEY(room_id, user_id)
);

-- 6. Criar mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES auth.users(id),
    body text NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 1000),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Criar tokens de notificações
CREATE TABLE IF NOT EXISTS public.push_tokens (
    token text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 8. Função para verificar sessão ativa
CREATE OR REPLACE FUNCTION public.has_app_session()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.app_sessions s
        WHERE s.user_id = auth.uid()
        AND s.auth_session_id = auth.jwt()->>'session_id'
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
    );
$$;

-- 9. Iniciar sessão
CREATE OR REPLACE FUNCTION public.begin_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result uuid;
BEGIN
    IF auth.uid() IS NULL
       OR auth.jwt()->>'session_id' IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.app_sessions
        WHERE auth_session_id = auth.jwt()->>'session_id'
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Faça novo login';
    END IF;

    INSERT INTO public.app_sessions (
        user_id,
        auth_session_id,
        expires_at
    )
    VALUES (
        auth.uid(),
        auth.jwt()->>'session_id',
        now() + interval '2 minutes'
    )
    RETURNING id INTO result;

    RETURN result;
END;
$$;

-- 10. Renovar sessão
CREATE OR REPLACE FUNCTION public.touch_session(
    p_id uuid,
    p_activity timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_activity > now() + interval '10 seconds' THEN
        RETURN false;
    END IF;

    UPDATE public.app_sessions
    SET expires_at = GREATEST(
        expires_at,
        LEAST(p_activity, now()) + interval '2 minutes'
    )
    WHERE id = p_id
      AND user_id = auth.uid()
      AND auth_session_id = auth.jwt()->>'session_id'
      AND revoked_at IS NULL
      AND expires_at > now();

    RETURN FOUND;
END;
$$;

-- 11. Encerrar sessão
CREATE OR REPLACE FUNCTION public.end_session(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    UPDATE public.app_sessions
    SET revoked_at = now()
    WHERE id = p_id
      AND user_id = auth.uid()
      AND auth_session_id = auth.jwt()->>'session_id';
$$;

-- 12. Verificar participação em sala
CREATE OR REPLACE FUNCTION public.is_room_member(p_room uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.room_members
        WHERE room_id = p_room
        AND user_id = auth.uid()
    );
$$;

-- 13. Ativar RLS em todas as tabelas
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- 14. Revogar privilégios anteriores
REVOKE ALL ON public.app_sessions FROM anon, authenticated;

REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.rooms FROM anon, authenticated;
REVOKE ALL ON public.room_members FROM anon, authenticated;
REVOKE ALL ON public.messages FROM anon, authenticated;
REVOKE ALL ON public.push_tokens FROM anon, authenticated;

-- 15. Conceder permissões necessárias
GRANT SELECT ON public.profiles,
    public.rooms,
    public.room_members,
    public.messages TO authenticated;

GRANT UPDATE (name) ON public.profiles TO authenticated;

GRANT INSERT (room_id, author_id, body)
ON public.messages TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.push_tokens TO authenticated;

-- 16. Remover políticas antigas desta atividade
DROP POLICY IF EXISTS profile_read ON public.profiles;
DROP POLICY IF EXISTS profile_update ON public.profiles;
DROP POLICY IF EXISTS room_read ON public.rooms;
DROP POLICY IF EXISTS member_read ON public.room_members;
DROP POLICY IF EXISTS message_read ON public.messages;
DROP POLICY IF EXISTS message_insert ON public.messages;
DROP POLICY IF EXISTS token_own ON public.push_tokens;

-- 17. Política de leitura do próprio perfil
CREATE POLICY profile_read
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    AND public.has_app_session()
);

-- 18. Política de atualização do próprio perfil
CREATE POLICY profile_update
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
    AND public.has_app_session()
)
WITH CHECK (
    id = auth.uid()
    AND public.has_app_session()
);

-- 19. Política de leitura das salas
CREATE POLICY room_read
ON public.rooms
FOR SELECT
TO authenticated
USING (
    public.has_app_session()
    AND public.is_room_member(id)
);

-- 20. Política de participantes
CREATE POLICY member_read
ON public.room_members
FOR SELECT
TO authenticated
USING (
    public.has_app_session()
    AND user_id = auth.uid()
);

-- 21. Política de leitura das mensagens
CREATE POLICY message_read
ON public.messages
FOR SELECT
TO authenticated
USING (
    public.has_app_session()
    AND public.is_room_member(room_id)
);

-- 22. Política de envio de mensagens
CREATE POLICY message_insert
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_app_session()
    AND public.is_room_member(room_id)
    AND author_id = auth.uid()
);

-- 23. Política dos tokens de notificação
CREATE POLICY token_own
ON public.push_tokens
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
    AND public.has_app_session()
)
WITH CHECK (
    user_id = auth.uid()
    AND public.has_app_session()
);

-- 24. Permissões das funções
REVOKE EXECUTE ON FUNCTION public.has_app_session()
FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid)
FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.begin_session()
FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.touch_session(uuid, timestamptz)
FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.end_session(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_app_session()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_room_member(uuid)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.begin_session()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.touch_session(uuid, timestamptz)
TO authenticated;

GRANT EXECUTE ON FUNCTION public.end_session(uuid)
TO authenticated;

-- 25. Habilitar mensagens no Supabase Realtime
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.messages;
    END IF;
END $$;

COMMIT;
