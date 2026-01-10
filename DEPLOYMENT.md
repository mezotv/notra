# Deployment Checklist - Convex Migration

## Pre-Deployment

### 1. Environment Variables
Ensure these are set in your production environment:
- [ ] `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- [ ] `CONVEX_DEPLOY_KEY` - For CI/CD deployments
- [ ] `SITE_URL` - Your production URL (e.g., https://app.usenotra.com)
- [ ] `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - OAuth
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth

### 2. Convex Setup
- [ ] Create production Convex project at https://dashboard.convex.dev
- [ ] Set environment variables in Convex dashboard (Settings > Environment Variables):
  - `SITE_URL`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

### 3. Deploy Convex Functions
```bash
# Deploy to production
npx convex deploy --prod
```

### 4. Database Migration
Since this is a fresh start with Convex (no existing data to migrate):
- [ ] Verify schema is deployed correctly
- [ ] Test auth flow works (signup/login)
- [ ] Create test organization

If migrating existing data from PostgreSQL:
- [ ] Export data from PostgreSQL
- [ ] Write migration script to import into Convex
- [ ] Run migration in staging first
- [ ] Verify data integrity

### 5. Deploy Next.js App
```bash
# Build and deploy
bun run build
# Deploy to your hosting (Vercel, etc.)
```

## Post-Deployment Verification

### Auth Flow
- [ ] Sign up new user
- [ ] Login with email/password
- [ ] Login with GitHub OAuth
- [ ] Login with Google OAuth
- [ ] Logout
- [ ] Organization creation on first login

### Organization Management
- [ ] Create new organization
- [ ] Switch between organizations
- [ ] Organization settings update

### GitHub Integrations
- [ ] Add new integration (public repo)
- [ ] Add new integration (private repo with token)
- [ ] Toggle integration enabled/disabled
- [ ] Delete integration
- [ ] Add repository to integration
- [ ] Toggle repository enabled/disabled
- [ ] Delete repository
- [ ] Toggle output types

### Brand Settings
- [ ] Save brand settings
- [ ] Run brand analysis
- [ ] View brand analysis progress

### Content/Posts
- [ ] View posts list
- [ ] Pagination works
- [ ] View individual post
- [ ] Edit post

### Webhook Logs
- [ ] View logs page
- [ ] Pagination works

## Rollback Plan

If issues occur:

1. **Convex Issues**:
   - Rollback to previous Convex deployment via dashboard
   - Or redeploy previous function version

2. **Next.js Issues**:
   - Rollback deployment in Vercel/hosting provider

3. **Data Issues**:
   - Convex has automatic backups
   - Contact Convex support for point-in-time recovery

## Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor Convex dashboard for function errors
- [ ] Set up uptime monitoring

## DNS/Domain (if applicable)

- [ ] Update DNS if changing domains
- [ ] Verify SSL certificates
- [ ] Update trusted origins in Better Auth config
