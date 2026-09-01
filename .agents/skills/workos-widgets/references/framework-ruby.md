# Framework: Ruby

## Scope

Use this guide for Ruby apps (for example Rails/Sinatra) that generate widget tokens and/or proxy widget API calls.

## Guidance

- Use the official WorkOS Ruby SDK.
- Keep API key in environment configuration.
- Place token generation in existing service/controller boundaries.
- Reuse existing session/auth context to resolve `organization_id` and `user_id`.

## Token Pattern

```rb
require "workos"

WorkOS.configure do |config|
  config.key = ENV.fetch("WORKOS_API_KEY")
end

token = WorkOS::Widgets.get_token(
  organization_id: organization_id,
  user_id: user_id,
  scopes: ["widgets:users-table:manage"]
)
```
