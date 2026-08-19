# Token Strategies

## Objective

Provide `accessToken` to widget surfaces using the app's existing auth architecture.

## Guidance

- Prefer existing AuthKit/session flows when they are already established.
- If backend token creation already exists, follow that pattern.
- Keep token-related logic near current auth boundaries.
- Pass token values explicitly into widget entry surfaces.
- Send the widget token through the app's existing authenticated HTTP pattern when calling widget endpoints.
- Use environment variables for credentials/config instead of hardcoded keys.
- For endpoints that require elevated access, follow the elevation flow and handle elevated token usage separately from the regular widget token.

## Widget Scope Reference

Use the scope that matches the widget being implemented:

| Widget                             | Required Scope                       |
| ---------------------------------- | ------------------------------------ |
| `user-management`                  | `widgets:users-table:manage`         |
| `user-profile`                     | _(no permission scope required)_     |
| `admin-portal-sso-connection`      | `widgets:sso:manage`                 |
| `admin-portal-domain-verification` | `widgets:domain-verification:manage` |

## JS/TS Authorization Tokens

Widgets need an authorization token and JS/TS apps typically use one of two paths:

1. If the app uses `authkit-js` or `authkit-react`, use the existing access token flow.
2. If the app uses a backend WorkOS SDK, request a widget token with `workos.widgets.getToken(...)` and the scope for the selected widget (see Widget Scope Reference above).

Widget tokens expire after one hour.

```ts
const workos = new WorkOS(process.env.WORKOS_API_KEY, {
  clientId: process.env.WORKOS_CLIENT_ID,
  // Use WORKOS_BASE_API_URL if set (e.g. for staging/local); falls back to default
  ...(process.env.WORKOS_BASE_API_URL && { host: process.env.WORKOS_BASE_API_URL }),
});

const authToken = await workos.widgets.getToken({
  userId: user.id,
  organizationId,
  scopes: ['<scope-for-this-widget>'], // see Widget Scope Reference above
});
```

To generate a token successfully, the user needs a role with the required widget permissions. When token generation fails due to authorization, check role permissions in the WorkOS Dashboard roles configuration.

New WorkOS accounts typically start with an Admin role that already has widget permissions. Existing accounts may need explicit role permission updates. Reference: [Roles and Permissions guide](https://workos.com/docs/authkit/roles-and-permissions).

## Elevated Access Tokens

Some operations require elevated access in addition to the normal widget token. Check the endpoint table in `fetching-apis.md` for the ⚠️ elevated marker **before calling it** — not on failure. If marked elevated, acquire the elevated token first.

1. Use the `POST /_widgets/UserProfile/verify` endpoint to obtain an elevated access token.
2. Use the returned token (`elevatedAccessToken`) in request header `x-elevated-access-token`.
3. Treat elevated tokens as short-lived credentials (10 minutes) and scope usage to sensitive action paths only.

## Example Direction

When backend WorkOS SDK usage is present, use its existing token creation path and adapt it for the required widget scope.
