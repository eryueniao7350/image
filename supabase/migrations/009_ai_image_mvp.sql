-- ═══════════════════════════════════════════════════════════════
-- Migration 009: AI Image MVP
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- 1. Core tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  style TEXT NOT NULL,
  scene TEXT NOT NULL,
  whitespace TEXT NOT NULL,
  subject_text TEXT NOT NULL,
  extra_requirements TEXT NOT NULL DEFAULT '',
  final_prompt TEXT,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  credit_cost INTEGER NOT NULL DEFAULT 1 CHECK (credit_cost > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('grant', 'consume')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL CHECK (reason IN ('signup_bonus', 'image_generation')),
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_generations_user_created_at
  ON public.generations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created_at
  ON public.credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_generation_id
  ON public.credit_transactions(generation_id);

-- 2. Helpers and triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 5)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, reason)
  SELECT NEW.id, 'grant', 5, 5, 'signup_bonus'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.credit_transactions
    WHERE user_id = NEW.id
      AND reason = 'signup_bonus'
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created_ai_image_mvp ON auth.users;
CREATE TRIGGER on_auth_user_created_ai_image_mvp
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, credits)
SELECT au.id, COALESCE(au.email, ''), 0
FROM auth.users au
LEFT JOIN public.profiles p
  ON p.id = au.id
WHERE p.id IS NULL;

WITH profiles_missing_signup_bonus AS (
  SELECT p.id
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.credit_transactions ct
    WHERE ct.user_id = p.id
      AND ct.reason = 'signup_bonus'
  )
),
applied_signup_bonus AS (
  UPDATE public.profiles p
  SET credits = p.credits + 5
  FROM profiles_missing_signup_bonus missing
  WHERE p.id = missing.id
  RETURNING p.id, p.credits
)
INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, reason)
SELECT a.id, 'grant', 5, a.credits, 'signup_bonus'
FROM applied_signup_bonus a;

CREATE OR REPLACE FUNCTION public.consume_credit_and_create_generation(
  p_user_id UUID,
  p_image_type TEXT,
  p_aspect_ratio TEXT,
  p_style TEXT,
  p_scene TEXT,
  p_whitespace TEXT,
  p_subject_text TEXT,
  p_extra_requirements TEXT,
  p_final_prompt TEXT
)
RETURNS TABLE (generation_id UUID, credits_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
  v_generation_id UUID;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT credits
  INTO v_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_credits IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND';
  END IF;

  IF v_credits < 1 THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  v_credits := v_credits - 1;

  UPDATE public.profiles
  SET credits = v_credits
  WHERE id = p_user_id;

  INSERT INTO public.generations (
    user_id,
    image_type,
    aspect_ratio,
    style,
    scene,
    whitespace,
    subject_text,
    extra_requirements,
    final_prompt,
    status,
    credit_cost
  ) VALUES (
    p_user_id,
    p_image_type,
    p_aspect_ratio,
    p_style,
    p_scene,
    p_whitespace,
    p_subject_text,
    COALESCE(p_extra_requirements, ''),
    p_final_prompt,
    'pending',
    1
  )
  RETURNING id INTO v_generation_id;

  INSERT INTO public.credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    reason,
    generation_id
  ) VALUES (
    p_user_id,
    'consume',
    -1,
    v_credits,
    'image_generation',
    v_generation_id
  );

  RETURN QUERY
  SELECT v_generation_id, v_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_credit_and_create_generation(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_credit_and_create_generation(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT
) TO authenticated;

-- 3. Row-level security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "generations_select_own" ON public.generations;
CREATE POLICY "generations_select_own"
ON public.generations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credit_transactions_select_own" ON public.credit_transactions;
CREATE POLICY "credit_transactions_select_own"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

COMMIT;
