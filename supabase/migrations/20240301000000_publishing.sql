-- ============================================================================
-- Publishing & Domain Management Migration
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Add publishing columns to projects
-- --------------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vercel_project_name TEXT;

-- --------------------------------------------------------------------------
-- 2. Update project status constraint to include 'published'
-- --------------------------------------------------------------------------
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('draft', 'generating', 'generated', 'deployed', 'published', 'error'));

-- --------------------------------------------------------------------------
-- 3. Create domains table
-- --------------------------------------------------------------------------
CREATE TABLE public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    domain_type TEXT NOT NULL CHECK (domain_type IN ('temporary', 'purchased', 'external')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'expired')),
    dns_configured BOOLEAN NOT NULL DEFAULT false,
    verification_token TEXT,
    namecom_order_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- 4. Indexes for domains
-- --------------------------------------------------------------------------
CREATE INDEX idx_domains_project_id ON public.domains(project_id);
CREATE INDEX idx_domains_user_id ON public.domains(user_id);
CREATE INDEX idx_domains_domain ON public.domains(domain);
CREATE UNIQUE INDEX idx_domains_unique_active ON public.domains(domain) WHERE status = 'active';

-- --------------------------------------------------------------------------
-- 5. Enable RLS on domains
-- --------------------------------------------------------------------------
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 6. RLS Policies for domains
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view their own domains"
    ON public.domains FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own domains"
    ON public.domains FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains"
    ON public.domains FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains"
    ON public.domains FOR DELETE
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- 7. Auto-update updated_at trigger for domains
-- --------------------------------------------------------------------------
CREATE TRIGGER set_domains_updated_at
    BEFORE UPDATE ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
