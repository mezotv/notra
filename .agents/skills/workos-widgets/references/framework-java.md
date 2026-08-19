# Framework: Java

## Scope

Use this guide for Java services/apps that issue widget tokens and support widget integrations.

## Guidance

- Use the official WorkOS Java SDK.
- Keep API key in environment configuration.
- Place token creation in existing service/controller boundaries.
- Reuse existing auth/session context for organization and user identifiers.

## Token Pattern

```java
import com.workos.WorkOS;
import com.workos.widgets.WidgetsApi.GetTokenOptions;
import com.workos.widgets.models.WidgetScope;
import com.workos.widgets.models.WidgetTokenResponse;

WorkOS workos = new WorkOS(System.getenv("WORKOS_API_KEY"));

GetTokenOptions options = GetTokenOptions.builder()
    .organizationID(organizationId)
    .userID(userId)
    .scopes(Arrays.asList(WidgetScope.WidgetsUsersTableManage))
    .build();

WidgetTokenResponse response = workos.widgets.getToken(options);
String token = response.token;
```
