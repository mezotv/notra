# Getting Started with Neon

Interactive guide for setting up a Neon project and connecting it to code.

See the [official getting started guide](https://neon.com/docs/get-started/signing-up.md) for complete details.

## Setup Flow

### 1. Select Organization and Project

- Check existing organizations and projects (via MCP server or CLI)
- **1 organization**: default to it
- **Multiple organizations**: list all and ask which to use
- **No projects**: ask if they want to create a new project
- **1 project**: ask "Would you like to use '{project_name}' or create a new one?"
- **Multiple projects (<6)**: list all and let them choose
- **Many projects (6+)**: list recent projects, offer to create new or specify by name/ID

### 2. Get Connection String

- Use MCP server or CLI to get the connection string
- Store it in `.env` as `DATABASE_URL`:

```
DATABASE_URL=postgresql://user:password@host/database
```

**Before modifying `.env`:**

1. Try to read the `.env` file first
2. If readable: use search/replace to update or append `DATABASE_URL`
3. If unreadable (permissions): use append command or show the line to add manually
4. Never overwrite an existing `.env` — always append or update in place

### 3. Install Driver

Choose based on deployment platform. For detailed guidance, see `connection-methods.md`.

| Environment              | Driver                     | Install                                |
| ------------------------ | -------------------------- | -------------------------------------- |
| Vercel (Edge/Serverless) | `@neondatabase/serverless` | `npm install @neondatabase/serverless` |
| Cloudflare Workers       | `@neondatabase/serverless` | `npm install @neondatabase/serverless` |
| AWS Lambda               | `@neondatabase/serverless` | `npm install @neondatabase/serverless` |
| Traditional Node.js      | `pg`                       | `npm install pg`                       |
| Long-running servers     | `pg` with pooling          | `npm install pg`                       |

For serverless driver patterns, see `neon-serverless.md`. For complex scenarios (multiple runtimes, hybrid architectures), see `connection-methods.md`.

### 4. Authentication (if needed)

Skip for CLI tools, scripts, or apps without user accounts.

If the app needs auth: use MCP server `provision_neon_auth` tool, then see `neon-auth.md` for setup. For auth + database queries, see `neon-js.md`.

### 5. ORM Setup (optional)

Check for existing ORM (Prisma, Drizzle, TypeORM). If none, ask if they want one. For Drizzle integration, see `neon-drizzle.md`.

### 6. Schema Setup

- Check for existing migration files or ORM schemas
- If none: offer to create an example schema or design one together

### 7. Developer Tools

```bash
npx neon init
```

Installs the VSCode extension and configures the MCP server. See `devtools.md` for details.

## What's Next

After setup is complete, offer to help with:

- Neon-specific features (branching, autoscaling, scale-to-zero) — see `features.md`
- Connection pooling for production
- Writing queries or building API endpoints
- Database migrations and schema changes
- Performance optimization

## Resume Support

If the user says "Continue with Neon setup", check what's already configured:

- MCP server connection
- `.env` file with `DATABASE_URL`
- Dependencies installed
- Schema created

Then resume from where they left off.

## Security Reminders

- Never commit connection strings to version control
- Use environment variables for all credentials
- Prefer SSL connections (default in Neon)
- Use least-privilege database roles
- Rotate API keys and passwords regularly

## Documentation

| Topic              | URL                                                   |
| ------------------ | ----------------------------------------------------- |
| Getting Started    | https://neon.com/docs/get-started/signing-up.md       |
| Connecting to Neon | https://neon.com/docs/connect/connect-intro.md        |
| Connection String  | https://neon.com/docs/connect/connect-from-any-app.md |
| Frameworks Guide   | https://neon.com/docs/get-started/frameworks.md       |
| ORMs Guide         | https://neon.com/docs/get-started/orms.md             |
| VSCode Extension   | https://neon.com/docs/local/vscode-extension.md       |
| MCP Server         | https://neon.com/docs/ai/neon-mcp-server.md           |
