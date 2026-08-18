# Framework: PHP

## Scope

Use this guide for PHP apps (for example Laravel/Symfony) that create widget tokens and integrate widget APIs.

## Guidance

- Use the official WorkOS PHP SDK.
- Keep API key in environment configuration.
- Place token generation in existing controller/service boundaries.
- Reuse current auth/session context to resolve organization/user identifiers.

## Token Pattern

```php
<?php

use WorkOS\Resource\WidgetScope;

WorkOS\WorkOS::setApiKey($_ENV['WORKOS_API_KEY']);

$widgets = new WorkOS\Widgets();
$token_response = $widgets->getToken(
    organization_id: $organizationId,
    user_id: $userId,
    scopes: [WidgetScope::UsersTableManage]
);
```
