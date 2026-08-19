# Framework: Go

## Scope

Use this guide for Go services that issue widget tokens and support widget API integration.

## Guidance

- Use the official WorkOS Go SDK.
- Keep API key in environment configuration.
- Place token generation in existing handler/service layers.
- Reuse existing auth/session middleware to derive organization/user identifiers.

## Token Pattern

```go
import (
  "context"
  "os"

  "github.com/workos/workos-go/v4/pkg/widgets"
)

widgets.SetAPIKey(os.Getenv("WORKOS_API_KEY"))

token, err := widgets.GetToken(
  context.Background(),
  widgets.GetTokenOpts{
    OrganizationID: organizationID,
    UserID:         userID,
    Scopes:         []widgets.WidgetScope{widgets.UsersTableManage},
  },
)
```
