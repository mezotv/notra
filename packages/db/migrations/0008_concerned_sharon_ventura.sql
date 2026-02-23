ALTER TABLE "repository_outputs" DROP CONSTRAINT IF EXISTS "repository_outputs_repository_id_github_repositories_id_fk";--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'repository_outputs_repository_id_github_integrations_id_fk'
  ) THEN
    ALTER TABLE "repository_outputs"
      ADD CONSTRAINT "repository_outputs_repository_id_github_integrations_id_fk"
      FOREIGN KEY ("repository_id")
      REFERENCES "public"."github_integrations"("id")
      ON DELETE cascade
      ON UPDATE no action;
  END IF;
END
$$;--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.github_repositories') IS NOT NULL THEN
    ALTER TABLE "github_repositories" DISABLE ROW LEVEL SECURITY;
  END IF;
END
$$;--> statement-breakpoint
DROP TABLE IF EXISTS "github_repositories";
