# WorkOS AuthKit for Python

## Step 1: Fetch SDK Documentation (BLOCKING)

**STOP. Do not proceed until complete.**

WebFetch: `https://raw.githubusercontent.com/workos/workos-python/main/README.md`

Also fetch the AuthKit quickstart for reference:
WebFetch: `https://workos.com/docs/authkit/vanilla/python`

The README is the source of truth for SDK API usage. If this skill conflicts with README, follow README.

## Step 2: Detect Framework

Examine the project to determine which Python web framework is in use:

```
manage.py exists?                        → Django
  settings.py has django imports?        → Confirmed Django

Gemfile/requirements has 'fastapi'?      → FastAPI
  main.py has FastAPI() instance?        → Confirmed FastAPI

requirements has 'flask'?               → Flask
  server.py/app.py has Flask() instance? → Confirmed Flask

None of the above?                       → Vanilla Python (use Flask quickstart pattern)
```

**Adapt all subsequent steps to the detected framework.** Do not force one framework onto another.

## Step 2b: Partial Install Recovery

Before creating new files, check if a previous AuthKit attempt exists:

1. Check if `workos` is already in `requirements.txt` or `pyproject.toml`
2. Check for incomplete auth files — files that import `workos` but have non-functional routes (TODO comments, commented-out code, empty handlers)
3. If partial install detected:
   - Do NOT reinstall the SDK (it's already there)
   - Read existing auth files to understand what's done vs missing
   - Complete the integration by filling gaps rather than starting fresh
   - Preserve any working code — only fix what's broken
   - Check for a missing `/callback` route (most common gap)

## Step 2c: Existing Auth System Detection

Check for existing authentication before integrating:

```
requirements.txt has 'flask-login'?         → Flask-Login auth
requirements.txt has 'authlib'?             → OAuth/OIDC auth (e.g., Auth0)
requirements.txt has 'django-allauth'?      → Django allauth
manage.py exists + 'django.contrib.auth'?   → Django built-in auth
*.py files have 'flask_login'?              → Flask-Login in use
```

If existing auth detected:

- Do NOT remove or disable it
- Add WorkOS AuthKit alongside the existing system
- If `flask-login` is present, use Flask-Login's session infrastructure (`login_user()`) for WorkOS auth too, rather than raw session management
- Create separate route paths for WorkOS auth (e.g., `/auth/workos/login` if `/login` is taken)
- Ensure existing auth routes continue to work unchanged
- Document in code comments how to migrate fully to WorkOS later

## Step 3: Pre-Flight Validation

### Package Manager Detection

```
uv.lock exists?                          → uv add
pyproject.toml has [tool.poetry]?        → poetry add
Pipfile exists?                          → pipenv install
requirements.txt exists?                 → pip install (+ append to requirements.txt)
else                                     → pip install
```

### Environment Variables

Check `.env` for:

- `WORKOS_API_KEY` - starts with `sk_`
- `WORKOS_CLIENT_ID` - starts with `client_`

## Step 4: Install SDK

Install using the detected package manager:

```bash
# uv
uv add workos python-dotenv

# poetry
poetry add workos python-dotenv

# pip
pip install workos python-dotenv
```

If using `requirements.txt`, also append `workos` and `python-dotenv` to it.

**Verify:** `python -c "import workos; print('OK')"`

## Step 5: Integrate Authentication

### If Django

1. **Configure settings.py** — add `import os` + `from dotenv import load_dotenv` + `load_dotenv()` at top. Add `WORKOS_API_KEY` and `WORKOS_CLIENT_ID` from `os.environ.get()`.
2. **Create auth views** — create `auth_views.py` (or add to existing views):
   - `login_view`: call SDK's `get_authorization_url()` with `provider='authkit'`, redirect
   - `callback_view`: call `authenticate_with_code()` with the code param, store user in `request.session`
   - `logout_view`: flush session, redirect
3. **Add URL patterns** — add `auth/login/`, `auth/callback/`, `auth/logout/` to `urls.py`
4. **Update templates** — add login/logout links using `{% url %}` tags

### If Flask

Follow the quickstart pattern exactly:

1. **Initialize WorkOS client** in `server.py` / `app.py`:
   ```python
   from workos import WorkOSClient
   workos = WorkOSClient(api_key=os.getenv("WORKOS_API_KEY"), client_id=os.getenv("WORKOS_CLIENT_ID"))
   ```
2. **Create `/login` route** — call `workos.user_management.get_authorization_url(provider="authkit", redirect_uri="...")`, redirect
3. **Create `/callback` route** — call `workos.user_management.authenticate_with_code(code=code)`, set session cookie
4. **Create `/logout` route** — clear session, redirect
5. **Update home route** — show user info if session exists

### If FastAPI

1. **Initialize WorkOS client** in main app file
2. **Create `/login` endpoint** — generate auth URL, return `RedirectResponse`
3. **Create `/callback` endpoint** — exchange code, store in session/cookie
4. **Create `/logout` endpoint** — clear session
5. Use `Depends()` for auth middleware on protected routes

### If Vanilla Python (no framework detected)

Install Flask and follow the Flask pattern above. This matches the official quickstart.

## Step 6: Environment Setup

Create/update `.env` with WorkOS credentials. Do NOT overwrite existing values.

```
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
```

## Step 7: Verification Checklist

```bash
# 1. SDK importable
python -c "import workos; print('OK')"

# 2. Credentials configured
python -c "
from dotenv import load_dotenv; import os; load_dotenv()
assert os.environ.get('WORKOS_API_KEY','').startswith('sk_'), 'Missing WORKOS_API_KEY'
assert os.environ.get('WORKOS_CLIENT_ID','').startswith('client_'), 'Missing WORKOS_CLIENT_ID'
print('Credentials OK')
"

# 3. Framework-specific check
# Django: python manage.py check
# Flask: python -m py_compile server.py
# FastAPI: python -m py_compile main.py
```

## Error Recovery

### "ModuleNotFoundError: No module named 'workos'"

Re-run the install command for the detected package manager.

### Django: "CSRF verification failed"

Auth callback receives GET requests from WorkOS. Ensure callback view uses GET, not POST. Or add `@csrf_exempt`.

### Flask: Session not persisting

Ensure `app.secret_key` is set (required for Flask sessions).

### Virtual environment not active

Check for `.venv/`, `venv/`, or poetry-managed environments. Activate before running install.
