-- AI Visual Studio foundation.
-- Additive only: existing Media Studio assets and generation routes remain intact.

CREATE TABLE IF NOT EXISTS public.visual_studio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled edit',
  status TEXT NOT NULL DEFAULT 'collecting'
    CHECK (status IN (
      'collecting', 'analyzing', 'briefing', 'plan_ready',
      'approved', 'rendering_unavailable', 'complete', 'error'
    )),
  brief JSONB NOT NULL DEFAULT '{}',
  assumptions JSONB NOT NULL DEFAULT '[]',
  current_plan_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visual_studio_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.visual_studio_sessions(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT,
  duration_ms INTEGER,
  width INTEGER,
  height INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  analysis JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, asset_id)
);

CREATE TABLE IF NOT EXISTS public.visual_studio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.visual_studio_sessions(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('footage_analysis', 'plan', 'preview', 'render')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'complete', 'error', 'canceled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  stage TEXT,
  input JSONB NOT NULL DEFAULT '{}',
  result JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.visual_studio_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.visual_studio_sessions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  parent_version_id UUID REFERENCES public.visual_studio_plan_versions(id) ON DELETE SET NULL,
  instruction TEXT,
  brief JSONB NOT NULL DEFAULT '{}',
  checklist JSONB NOT NULL DEFAULT '[]',
  plan JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'ai' CHECK (created_by IN ('ai', 'user', 'system')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.visual_studio_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.visual_studio_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visual_studio_sessions_project
  ON public.visual_studio_sessions(project_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_visual_studio_clips_session
  ON public.visual_studio_clips(session_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_visual_studio_jobs_session
  ON public.visual_studio_jobs(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visual_studio_plan_versions_session
  ON public.visual_studio_plan_versions(session_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_visual_studio_messages_session
  ON public.visual_studio_messages(session_id, created_at);

ALTER TABLE public.visual_studio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_studio_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_studio_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_studio_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_studio_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their visual studio sessions"
  ON public.visual_studio_sessions;
CREATE POLICY "Users manage their visual studio sessions"
  ON public.visual_studio_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users manage clips in their visual studio sessions"
  ON public.visual_studio_clips;
CREATE POLICY "Users manage clips in their visual studio sessions"
  ON public.visual_studio_clips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.visual_studio_sessions
      WHERE visual_studio_sessions.id = session_id
        AND visual_studio_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visual_studio_sessions
      WHERE visual_studio_sessions.id = session_id
        AND visual_studio_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users manage jobs in their visual studio sessions"
  ON public.visual_studio_jobs;
CREATE POLICY "Users manage jobs in their visual studio sessions"
  ON public.visual_studio_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.visual_studio_sessions
      WHERE visual_studio_sessions.id = session_id
        AND visual_studio_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visual_studio_sessions
      WHERE visual_studio_sessions.id = session_id
        AND visual_studio_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users manage plans in their visual studio sessions"
  ON public.visual_studio_plan_versions;
CREATE POLICY "Users manage plans in their visual studio sessions"
  ON public.visual_studio_plan_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.visual_studio_sessions
      WHERE visual_studio_sessions.id = session_id
        AND visual_studio_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visual_studio_sessions
      WHERE visual_studio_sessions.id = session_id
        AND visual_studio_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users manage messages in their visual studio sessions"
  ON public.visual_studio_messages;
CREATE POLICY "Users manage messages in their visual studio sessions"
  ON public.visual_studio_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.visual_studio_sessions
      WHERE visual_studio_sessions.id = session_id
        AND visual_studio_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visual_studio_sessions
      WHERE visual_studio_sessions.id = session_id
        AND visual_studio_sessions.user_id = auth.uid()
    )
  );
