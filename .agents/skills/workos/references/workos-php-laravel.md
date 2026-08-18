# WorkOS AuthKit for Laravel

## Step 1: Fetch SDK Documentation (BLOCKING)

**STOP. Do not proceed until complete.**

WebFetch: `https://raw.githubusercontent.com/workos/workos-php-laravel/main/README.md`

The README is the source of truth. If this skill conflicts with README, follow README.

## Step 2: Pre-Flight Validation

### Project Structure

- Confirm `artisan` file exists at project root
- Confirm `composer.json` contains `laravel/framework` dependency
- Confirm `app/` and `routes/` directories exist

### Environment Variables

Check `.env` for:

- `WORKOS_API_KEY` - starts with `sk_`
- `WORKOS_CLIENT_ID` - starts with `client_`
- `WORKOS_REDIRECT_URI` - valid callback URL (e.g., `http://localhost:8000/auth/callback`)

If `.env` exists but is missing these variables, append them. If `.env` doesn't exist, copy `.env.example` and add them.

## Step 2b: Partial Install Recovery

Before creating new files, check if a previous AuthKit attempt exists:

1. Check if `workos/workos-php-laravel` is already in `composer.json`
2. Check if `config/workos.php` exists but no auth controller or routes are wired
3. If partial install detected:
   - Do NOT reinstall the SDK (it's already there)
   - Do NOT re-publish config if `config/workos.php` already exists
   - Read existing files to understand what's done vs missing
   - Complete the integration by filling gaps (controller, routes, middleware)
   - Preserve any working code — only fix what's broken
   - Check for missing auth controller or routes (most common gap)

## Step 2c: Existing Auth System Detection

Check for existing authentication before integrating:

```
composer.json has 'laravel/breeze'?               → Breeze auth scaffolding
composer.json has 'laravel/jetstream'?            → Jetstream auth
composer.json has 'laravel/fortify'?              → Fortify auth backend
app/Http/Controllers/Auth/ exists?                → Auth controllers present
routes/auth.php exists?                           → Auth routes file
```

If existing auth detected:

- Do NOT remove or disable it
- Add WorkOS AuthKit alongside the existing system
- If Laravel session is already configured, reuse it for WorkOS
- Create separate route paths for WorkOS auth (e.g., `/auth/workos/login` if `/login` is taken)
- Ensure existing auth routes continue to work unchanged
- Document in code comments how to migrate fully to WorkOS later

## Step 3: Install SDK

```bash
composer require workos/workos-php-laravel
```

**Verify:** Check `composer.json` contains `workos/workos-php-laravel` in require section before continuing.

## Step 4: Publish Configuration

```bash
php artisan vendor:publish --provider="WorkOS\Laravel\WorkOSServiceProvider"
```

This creates `config/workos.php`. Verify the file exists after publishing.

If the artisan command fails, check README for the correct provider class name — it may differ.

## Step 5: Configure Environment

Ensure `.env` contains:

```
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=http://localhost:8000/auth/callback
```

Also ensure `config/workos.php` reads these env vars correctly. Check README for exact config structure.

## Step 6: Create Auth Controller

Create `app/Http/Controllers/AuthController.php` with methods for:

- `login()` — Redirect to WorkOS AuthKit authorization URL
- `callback()` — Handle OAuth callback, exchange code for user profile
- `logout()` — Clear session and redirect

Use SDK methods from README. Do NOT construct OAuth URLs manually.

## Step 7: Add Routes

Add to `routes/web.php`:

```php
use App\Http\Controllers\AuthController;

Route::get('/login', [AuthController::class, 'login'])->name('login');
Route::get('/auth/callback', [AuthController::class, 'callback']);
Route::get('/logout', [AuthController::class, 'logout'])->name('logout');
```

Ensure the callback route path matches `WORKOS_REDIRECT_URI`.

## Step 8: Add Middleware (if applicable)

Check README for any authentication middleware the SDK provides. If available:

1. Register middleware in `app/Http/Kernel.php` or `bootstrap/app.php` (Laravel 11+)
2. Apply to routes that require authentication

For Laravel 11+, middleware is registered in `bootstrap/app.php` instead of `Kernel.php`.

## Step 9: Add UI Integration

Update the home page or dashboard view to show:

- Sign in link when user is not authenticated
- User info and sign out link when authenticated

Use Blade directives or SDK helpers from README.

## Verification Checklist (ALL MUST PASS)

```bash
# 1. Config file exists
ls config/workos.php

# 2. Controller exists
ls app/Http/Controllers/AuthController.php

# 3. Routes registered
php artisan route:list | grep -E "login|callback|logout"

# 4. SDK installed
composer show workos/workos-php-laravel

# 5. Lint check
php -l app/Http/Controllers/AuthController.php
```

## Error Recovery

### "Class WorkOS\Laravel\WorkOSServiceProvider not found"

- Verify `composer require` completed successfully
- Run `composer dump-autoload`
- Check `vendor/workos/` directory exists

### "Route not defined"

- Verify routes are in `routes/web.php`
- Run `php artisan route:clear && php artisan route:cache`

### Config not loading

- Verify `config/workos.php` exists
- Run `php artisan config:clear`
- Check `.env` variables match config keys

### Middleware issues (Laravel 11+)

- Laravel 11 removed `Kernel.php` — register middleware in `bootstrap/app.php`
- Check README for Laravel version-specific instructions
