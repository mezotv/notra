CREATE TABLE public.accounts (
    id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp without time zone,
    refresh_token_expires_at timestamp without time zone,
    scope text,
    password text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL
);
CREATE TABLE public.brand_settings (
    id text NOT NULL,
    organization_id text NOT NULL,
    company_name text,
    company_description text,
    tone_profile text,
    custom_tone text,
    audience text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    custom_instructions text
);
CREATE TABLE public.github_integrations (
    id text NOT NULL,
    organization_id text NOT NULL,
    created_by_user_id text NOT NULL,
    display_name text NOT NULL,
    encrypted_token text,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.github_repositories (
    id text NOT NULL,
    integration_id text NOT NULL,
    owner text NOT NULL,
    repo text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.invitations (
    id text NOT NULL,
    organization_id text NOT NULL,
    email text NOT NULL,
    role text,
    status text DEFAULT 'pending'::text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    inviter_id text NOT NULL
);
CREATE TABLE public.members (
    id text NOT NULL,
    organization_id text NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    created_at timestamp without time zone NOT NULL
);
CREATE TABLE public.organizations (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    created_at timestamp without time zone NOT NULL,
    metadata text,
    website_url text
);
CREATE TABLE public.posts (
    id text NOT NULL,
    organization_id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    markdown text NOT NULL,
    content_type text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.repository_outputs (
    id text NOT NULL,
    repository_id text NOT NULL,
    output_type text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    config jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.sessions (
    id text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL,
    active_organization_id text
);
CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.verifications (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.github_integrations
    ADD CONSTRAINT github_integrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.github_repositories
    ADD CONSTRAINT github_repositories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.repository_outputs
    ADD CONSTRAINT repository_outputs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_unique UNIQUE (token);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);
CREATE INDEX "accounts_userId_idx" ON public.accounts USING btree (user_id);
CREATE UNIQUE INDEX "brandSettings_organizationId_uidx" ON public.brand_settings USING btree (organization_id);
CREATE INDEX "githubIntegrations_createdByUserId_idx" ON public.github_integrations USING btree (created_by_user_id);
CREATE INDEX "githubIntegrations_organizationId_idx" ON public.github_integrations USING btree (organization_id);
CREATE INDEX "githubRepositories_integrationId_idx" ON public.github_repositories USING btree (integration_id);
CREATE UNIQUE INDEX "githubRepositories_integration_owner_repo_uidx" ON public.github_repositories USING btree (integration_id, owner, repo);
CREATE INDEX invitations_email_idx ON public.invitations USING btree (email);
CREATE INDEX "invitations_organizationId_idx" ON public.invitations USING btree (organization_id);
CREATE INDEX "members_organizationId_idx" ON public.members USING btree (organization_id);
CREATE INDEX "members_userId_idx" ON public.members USING btree (user_id);
CREATE UNIQUE INDEX organizations_slug_uidx ON public.organizations USING btree (slug);
CREATE INDEX "posts_org_createdAt_id_idx" ON public.posts USING btree (organization_id, created_at, id);
CREATE INDEX "repositoryOutputs_repositoryId_idx" ON public.repository_outputs USING btree (repository_id);
CREATE UNIQUE INDEX "repositoryOutputs_repository_outputType_uidx" ON public.repository_outputs USING btree (repository_id, output_type);
CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree (user_id);
CREATE INDEX verifications_identifier_idx ON public.verifications USING btree (identifier);
ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.brand_settings
    ADD CONSTRAINT brand_settings_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.github_integrations
    ADD CONSTRAINT github_integrations_created_by_user_id_users_id_fk FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.github_integrations
    ADD CONSTRAINT github_integrations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.github_repositories
    ADD CONSTRAINT github_repositories_integration_id_github_integrations_id_fk FOREIGN KEY (integration_id) REFERENCES public.github_integrations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_inviter_id_users_id_fk FOREIGN KEY (inviter_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_organization_id_organizations_id_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.repository_outputs
    ADD CONSTRAINT repository_outputs_repository_id_github_repositories_id_fk FOREIGN KEY (repository_id) REFERENCES public.github_repositories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
CREATE TABLE public.mcp_server_integrations (
    id text NOT NULL,
    organization_id text NOT NULL,
    created_by_user_id text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    description text,
    encrypted_headers jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.mcp_server_integrations
    ADD CONSTRAINT mcp_server_integrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.mcp_server_integrations
    ADD CONSTRAINT "mcp_server_integrations_organization_id_organizations_id_fk" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.mcp_server_integrations
    ADD CONSTRAINT "mcp_server_integrations_created_by_user_id_users_id_fk" FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
CREATE INDEX "mcpServerIntegrations_organizationId_idx" ON public.mcp_server_integrations USING btree (organization_id);
CREATE INDEX "mcpServerIntegrations_createdByUserId_idx" ON public.mcp_server_integrations USING btree (created_by_user_id);
CREATE UNIQUE INDEX "mcpServerIntegrations_org_name_uidx" ON public.mcp_server_integrations USING btree (organization_id, name);
