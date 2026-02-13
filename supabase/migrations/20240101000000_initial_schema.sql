-- ============================================================================
-- SiteCraft AI - Initial Database Schema Migration
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- profiles: extends auth.users with application-specific fields
-- --------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
    generation_credits INTEGER NOT NULL DEFAULT 5,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- projects: each website generation project belonging to a user
-- --------------------------------------------------------------------------
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    site_type TEXT NOT NULL CHECK (site_type IN ('landing-page', 'business', 'ecommerce', 'saas')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'generated', 'deployed', 'error')),
    generation_config JSONB NOT NULL DEFAULT '{}',
    design_system JSONB,
    blueprint JSONB,
    vercel_project_id TEXT,
    vercel_deployment_url TEXT,
    custom_domain TEXT,
    thumbnail_url TEXT,
    last_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, slug)
);

-- --------------------------------------------------------------------------
-- generation_versions: tracks each generation attempt for a project
-- --------------------------------------------------------------------------
CREATE TABLE public.generation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'complete', 'error')),
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('initial', 'full-regenerate', 'section-edit', 'style-change')),
    trigger_details JSONB,
    total_tokens_used INTEGER DEFAULT 0,
    generation_time_ms INTEGER,
    model_used TEXT,
    error_message TEXT,
    error_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------------
-- generated_files: individual files produced by a generation version
-- --------------------------------------------------------------------------
CREATE TABLE public.generated_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES public.generation_versions(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    file_type TEXT NOT NULL,
    section_type TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(version_id, file_path)
);

-- --------------------------------------------------------------------------
-- assets: uploaded/generated media assets for a project
-- --------------------------------------------------------------------------
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    size_bytes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- user_preferences: per-user default settings for generation
-- --------------------------------------------------------------------------
CREATE TABLE public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    default_style TEXT DEFAULT 'minimal',
    default_fonts JSONB DEFAULT '{"heading": "Inter", "body": "Inter"}',
    default_colors JSONB,
    saved_palettes JSONB DEFAULT '[]',
    preferred_model TEXT DEFAULT 'claude-sonnet-4-20250514',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- profiles
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX idx_profiles_plan ON public.profiles(plan);

-- projects
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX idx_projects_user_id_status ON public.projects(user_id, status);

-- generation_versions
CREATE INDEX idx_generation_versions_project_id ON public.generation_versions(project_id);
CREATE INDEX idx_generation_versions_status ON public.generation_versions(status);
CREATE INDEX idx_generation_versions_project_id_version ON public.generation_versions(project_id, version_number DESC);

-- generated_files
CREATE INDEX idx_generated_files_project_id ON public.generated_files(project_id);
CREATE INDEX idx_generated_files_version_id ON public.generated_files(version_id);
CREATE INDEX idx_generated_files_file_type ON public.generated_files(file_type);

-- assets
CREATE INDEX idx_assets_project_id ON public.assets(project_id);


-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- --------------------------------------------------------------------------
-- profiles policies
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Insert is handled by the trigger; users should not insert profiles directly.
-- Allow the trigger (which runs as SECURITY DEFINER) to insert.
CREATE POLICY "Service role can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------------------------
-- projects policies
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view their own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- generation_versions policies
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view their own generation versions"
    ON public.generation_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generation_versions.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create generation versions for their projects"
    ON public.generation_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generation_versions.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own generation versions"
    ON public.generation_versions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generation_versions.project_id
              AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generation_versions.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own generation versions"
    ON public.generation_versions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generation_versions.project_id
              AND projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- generated_files policies
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view their own generated files"
    ON public.generated_files FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generated_files.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create generated files for their projects"
    ON public.generated_files FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generated_files.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own generated files"
    ON public.generated_files FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generated_files.project_id
              AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generated_files.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own generated files"
    ON public.generated_files FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = generated_files.project_id
              AND projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- assets policies
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view their own assets"
    ON public.assets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = assets.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create assets for their projects"
    ON public.assets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = assets.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own assets"
    ON public.assets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = assets.project_id
              AND projects.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = assets.project_id
              AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own assets"
    ON public.assets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = assets.project_id
              AND projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- user_preferences policies
-- --------------------------------------------------------------------------
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================================

-- --------------------------------------------------------------------------
-- Auto-update updated_at timestamp on row modification
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------------------------
-- Auto-create profile and user_preferences when a new auth user signs up
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        NEW.raw_user_meta_data ->> 'avatar_url'
    );

    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
