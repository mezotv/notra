# Schedule Name Launch Plan

## Goal
Add a required `name` field for automation schedules without breaking existing clients or production writes.

## What changed
1. Database schema adds `content_triggers.name` as `NOT NULL` with default `'Untitled Schedule'`.
2. API accepts optional `name` for schedule create/update and safely falls back when omitted.
3. UI adds a schedule name field in Add/Edit Schedule.

## Production rollout steps
1. **Merge and deploy migration first**
   - Ensure migration `packages/db/migrations/0005_thankful_wendell_vaughn.sql` is included.
   - Run migrations in production before app deploy:
   - `bun run db:migrate`

2. **Verify migration state**
   - Confirm column exists and is non-null with default:
   - `SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'content_triggers' AND column_name = 'name';`
   - Confirm existing rows are populated:
   - `SELECT COUNT(*) FROM content_triggers WHERE name IS NULL OR name = '';`

3. **Deploy application code**
   - Deploy dashboard/api changes after migration succeeds.
   - Old clients remain compatible because API fallback and DB default both handle missing `name`.

4. **Post-deploy validation**
   - Create a new schedule from UI and confirm custom name is saved.
   - Toggle pause/resume on an existing schedule and confirm name is preserved.
   - Edit an old schedule and confirm it loads with a fallback name.

## Optional cleanup (later)
1. Make `name` required at API validation level once all clients are updated.
2. Remove DB default if you want strict writer enforcement.
