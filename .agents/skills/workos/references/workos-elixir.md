# WorkOS AuthKit for Elixir (Phoenix)

## Step 1: Fetch SDK Documentation (BLOCKING)

**STOP. Do not proceed until complete.**

WebFetch: `https://raw.githubusercontent.com/workos/workos-elixir/main/README.md`

The README is the source of truth for SDK API usage. If this skill conflicts with README, follow README.

## Step 2: Pre-Flight Validation

### Project Structure

- Confirm `mix.exs` exists
- Read `mix.exs` to extract the app name (look for `app: :my_app` in `project/0`)
- Confirm `lib/{app}_web/router.ex` exists (Phoenix project marker)
- Confirm `config/runtime.exs` exists

### Determine App Name

The app name from `mix.exs` determines all file paths. For example, if `app: :my_app`:

- Web module: `lib/my_app_web/`
- Router: `lib/my_app_web/router.ex`
- Controllers: `lib/my_app_web/controllers/`

### Environment Variables

Check `.env.local` for:

- `WORKOS_API_KEY` - starts with `sk_`
- `WORKOS_CLIENT_ID` - starts with `client_`

## Step 2b: Partial Install Recovery

Before creating new files, check if a previous AuthKit attempt exists:

1. Check if `:workos` is already in `mix.exs` dependencies
2. Check for incomplete auth code — AuthController exists but has TODO stubs, 501 responses, or missing callback/sign_out functions
3. If partial install detected:
   - Do NOT re-add the SDK dependency (it's already there)
   - Do NOT re-run `mix deps.get` if deps are already fetched
   - Read existing auth files to understand what's done vs missing
   - Complete the integration by filling gaps (controller methods, routes)
   - Preserve any working code — only fix what's broken
   - Check for missing `/auth/callback` route (most common gap)

## Step 2c: Existing Auth System Detection

Check for existing authentication before integrating:

```
mix.exs has ':ueberauth'?                          → Ueberauth auth
mix.exs has ':pow'?                                → Pow auth
mix.exs has ':guardian'?                           → Guardian JWT auth
mix.exs has ':phx_gen_auth'?                       → Phoenix generated auth
config/*.exs has 'Ueberauth' config?               → Ueberauth configured
router.ex has '/:provider' wildcard auth routes?   → Ueberauth routes
```

If existing auth detected:

- Do NOT remove or disable it
- Add WorkOS AuthKit alongside the existing system
- If Ueberauth is configured, be careful of `/:provider` wildcard routes — use a specific scope like `/auth/workos` to avoid conflicts
- Reuse existing session infrastructure if compatible
- Create separate route paths for WorkOS auth
- Ensure existing auth routes continue to work unchanged
- Document in code comments how to migrate fully to WorkOS later

## Step 3: Install SDK

Add the `workos` package to `mix.exs` dependencies:

```elixir
defp deps do
  [
    # ... existing deps
    {:workos, "~> 1.0"}
  ]
end
```

Then run:

```bash
mix deps.get
```

**Verify:** Check that `mix deps.get` completed successfully (exit code 0).

## Step 4: Configure WorkOS

Add WorkOS configuration to `config/runtime.exs`:

```elixir
config :workos,
  api_key: System.get_env("WORKOS_API_KEY"),
  client_id: System.get_env("WORKOS_CLIENT_ID")
```

This ensures credentials are loaded from environment variables at runtime, not compiled into the release.

## Step 5: Create Auth Controller

### Prerequisite: Verify `{AppName}Web` module exists

The controller uses `use {AppName}Web, :controller`. Confirm `lib/{app}_web.ex` exists and defines the `:controller` macro. If it doesn't exist (minimal Phoenix projects may lack it), create it:

```elixir
defmodule {AppName}Web do
  def controller do
    quote do
      use Phoenix.Controller, formats: [:html, :json]
      import Plug.Conn
    end
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
```

### Create controller

Create `lib/{app}_web/controllers/auth_controller.ex`:

```elixir
defmodule {AppName}Web.AuthController do
  use {AppName}Web, :controller

  def sign_in(conn, _params) do
    client_id = Application.get_env(:workos, :client_id)
    redirect_uri = "http://localhost:4000/auth/callback"

    authorization_url = WorkOS.UserManagement.get_authorization_url(%{
      provider: "authkit",
      client_id: client_id,
      redirect_uri: redirect_uri
    })

    case authorization_url do
      {:ok, url} -> redirect(conn, external: url)
      {:error, reason} -> conn |> put_status(500) |> text("Auth error: #{inspect(reason)}")
    end
  end

  def callback(conn, %{"code" => code}) do
    client_id = Application.get_env(:workos, :client_id)

    case WorkOS.UserManagement.authenticate_with_code(%{
      code: code,
      client_id: client_id
    }) do
      {:ok, auth_response} ->
        conn
        |> put_session(:user, auth_response.user)
        |> redirect(to: "/")

      {:error, reason} ->
        conn |> put_status(401) |> text("Authentication failed: #{inspect(reason)}")
    end
  end

  def sign_out(conn, _params) do
    conn
    |> clear_session()
    |> redirect(to: "/")
  end
end
```

**IMPORTANT:** Adapt the module name and API calls based on the README. The WorkOS Elixir SDK API may differ from the pseudocode above. Always follow the README for exact function names, parameter shapes, and return types.

## Step 6: Add Routes

Add auth routes to `lib/{app}_web/router.ex`. Add these routes inside or outside the existing pipeline scope as appropriate:

```elixir
scope "/auth", {AppName}Web do
  pipe_through :browser

  get "/sign-in", AuthController, :sign_in
  get "/callback", AuthController, :callback
  post "/sign-out", AuthController, :sign_out
end
```

## Step 7: Verification

Run the following to confirm the integration compiles:

```bash
mix compile
```

**If compilation fails:**

1. Read the error message carefully
2. Check that the WorkOS SDK module names match what's in the README
3. Verify the app name is consistent across all files
4. Fix the issue and re-run `mix compile`

## Error Recovery

### "could not compile dependency :workos"

- Check Elixir version compatibility (1.15+ recommended)
- Try `mix deps.clean workos && mix deps.get`

### "module WorkOS.UserManagement is not available"

- The SDK API may use different module paths — re-read the README
- Check if the SDK uses `WorkOS.SSO` or another module instead

### "undefined function" in controller

- Verify `use {AppName}Web, :controller` is correct
- Check that the SDK functions match the README exactly

### Route conflicts

- Check existing routes in router.ex for `/auth` prefix conflicts
- Adjust the scope path if needed (e.g., `/workos-auth`)
