# WorkOS AuthKit for .NET (ASP.NET Core)

## Step 1: Fetch SDK Documentation (BLOCKING)

**STOP. Do not proceed until complete.**

WebFetch: `https://raw.githubusercontent.com/workos/workos-dotnet/main/README.md`

The README is the source of truth for SDK API usage. If this skill conflicts with README, follow README.

## Step 2: Pre-Flight Validation

### Project Structure

- Confirm a `*.csproj` file exists in the project root
- Detect project style:
  - **Minimal API** (modern): `Program.cs` with `WebApplication.CreateBuilder()` — .NET 6+
  - **Startup pattern** (older): `Startup.cs` with `ConfigureServices()` / `Configure()` — .NET 5 and earlier

This detection determines WHERE to register WorkOS services and middleware.

### Environment Variables

Check `appsettings.Development.json` for:

- `WORKOS_API_KEY` — starts with `sk_`
- `WORKOS_CLIENT_ID` — starts with `client_`

## Step 3: Install SDK

```bash
dotnet add package WorkOS.net
```

**Verify:** Check the `*.csproj` file contains a `<PackageReference Include="WorkOS.net"` entry.

If `dotnet` CLI is not available, stop and inform the user to install the .NET SDK.

## Step 4: Configure WorkOS Client

### Minimal API Pattern (Program.cs)

Add WorkOS configuration to `Program.cs`:

1. Read WorkOS settings from `IConfiguration`
2. Register the WorkOS client in the DI container
3. The WorkOS client needs API key for initialization

```csharp
// In Program.cs, after builder creation:
var workosApiKey = builder.Configuration["WorkOS:ApiKey"];
var workosClientId = builder.Configuration["WorkOS:ClientId"];
```

### Startup Pattern (Startup.cs)

Add to `ConfigureServices()`:

1. Read WorkOS settings from `IConfiguration`
2. Register services

Choose the pattern that matches the detected project structure.

## Step 5: Create Authentication Endpoints

Create auth endpoints following the WorkOS AuthKit pattern. Use minimal API `app.MapGet()` for minimal API projects, or a Controller for Startup-pattern projects.

### Required Endpoints

**GET /auth/login** — Redirect to WorkOS AuthKit:

- Use the WorkOS SDK to generate an authorization URL
- Include `clientId`, `redirectUri`, and `provider: "authkit"` parameters
- Redirect the user to the authorization URL

**GET /auth/callback** — Handle OAuth callback:

- Extract `code` from query parameters
- Exchange authorization code for user profile using the WorkOS SDK
- Store user info in session or cookie
- Redirect to home page

**GET /auth/logout** — Clear session:

- Clear the authentication session/cookie
- Redirect to home page

### Session Management

Use ASP.NET Core's built-in session or cookie authentication:

```csharp
// Enable session middleware in Program.cs
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession();
// ...
app.UseSession();
```

## Step 6: Environment Setup

Configure `appsettings.Development.json` with WorkOS credentials:

```json
{
  "WorkOS": {
    "ApiKey": "<WORKOS_API_KEY value>",
    "ClientId": "<WORKOS_CLIENT_ID value>",
    "RedirectUri": "http://localhost:5000/auth/callback"
  }
}
```

Use the actual credential values provided in the environment context.

**Important:** Do NOT put secrets in `appsettings.json` (committed to git). Use `appsettings.Development.json` (gitignored) or `dotnet user-secrets`.

## Step 7: Verification

Run these checks — **do not mark complete until all pass:**

```bash
# 1. Check WorkOS.net is in csproj
grep -i "WorkOS" *.csproj

# 2. Check auth endpoints exist
grep -r "auth/login\|auth/callback\|auth/logout" *.cs

# 3. Build succeeds
dotnet build
```

**If build fails:** Read the error output carefully. Common issues:

- Missing `using` statements for WorkOS namespaces
- Incorrect DI registration order
- Missing session/cookie middleware registration

## Error Recovery

### "dotnet: command not found"

- .NET SDK is not installed. Inform the user to install from https://dotnet.microsoft.com/download

### NuGet restore failures

- Check internet connectivity
- Try `dotnet restore` explicitly before `dotnet build`

### "No project file found"

- Ensure you're in the correct directory with a `*.csproj` file

### Build errors after integration

- Check that all `using` statements are correct
- Verify DI registration order (services before middleware)
- Ensure `app.UseSession()` is called before mapping auth endpoints
