---
name: workos-integrations
description: Set up identity provider integrations with WorkOS. Covers SSO, SCIM, and OAuth for 40+ providers.
---

<!-- generated:sha256:cd3ef709325d -->

# WorkOS Integrations

## Step 1: Identify the Provider

Ask the user which identity provider they need to integrate. Then find it in the table below.

## Provider Lookup

| Provider               | Type       | Doc URL                                                  |
| ---------------------- | ---------- | -------------------------------------------------------- |
| Access People HR       | General    | workos.com/docs/integrations/access-people-hr            |
| ADP                    | OIDC       | workos.com/docs/integrations/adp-oidc                    |
| Apple                  | General    | workos.com/docs/integrations/apple                       |
| Auth0                  | SAML       | workos.com/docs/integrations/auth0-saml                  |
| Auth0                  | Enterprise | workos.com/docs/integrations/auth0-enterprise-connection |
| Auth0                  | Directory  | workos.com/docs/integrations/auth0-directory-sync        |
| AWS Cognito            | General    | workos.com/docs/integrations/aws-cognito                 |
| Bamboohr               | General    | workos.com/docs/integrations/bamboohr                    |
| Breathe HR             | General    | workos.com/docs/integrations/breathe-hr                  |
| Bubble                 | General    | workos.com/docs/integrations/bubble                      |
| CAS                    | SAML       | workos.com/docs/integrations/cas-saml                    |
| Cezanne HR             | General    | workos.com/docs/integrations/cezanne                     |
| Classlink              | SAML       | workos.com/docs/integrations/classlink-saml              |
| Clever                 | OIDC       | workos.com/docs/integrations/clever-oidc                 |
| Cloudflare             | SAML       | workos.com/docs/integrations/cloudflare-saml             |
| Cyberark               | SCIM       | workos.com/docs/integrations/cyberark-scim               |
| Cyberark               | SAML       | workos.com/docs/integrations/cyberark-saml               |
| Duo                    | SAML       | workos.com/docs/integrations/duo-saml                    |
| Entra ID (Azure AD)    | SCIM       | workos.com/docs/integrations/entra-id-scim               |
| Entra ID (Azure AD)    | SAML       | workos.com/docs/integrations/entra-id-saml               |
| Entra ID (Azure AD)    | OIDC       | workos.com/docs/integrations/entra-id-oidc               |
| Firebase               | General    | workos.com/docs/integrations/firebase                    |
| Fourth                 | General    | workos.com/docs/integrations/fourth                      |
| Github                 | OAuth      | workos.com/docs/integrations/github-oauth                |
| Gitlab                 | OAuth      | workos.com/docs/integrations/gitlab-oauth                |
| Google Workspace       | SAML       | workos.com/docs/integrations/google-saml                 |
| Google Workspace       | OIDC       | workos.com/docs/integrations/google-oidc                 |
| Google Workspace       | OAuth      | workos.com/docs/integrations/google-oauth                |
| Google Workspace       | Directory  | workos.com/docs/integrations/google-directory-sync       |
| Hibob                  | General    | workos.com/docs/integrations/hibob                       |
| Intuit                 | OAuth      | workos.com/docs/integrations/intuit-oauth                |
| Jumpcloud              | SCIM       | workos.com/docs/integrations/jumpcloud-scim              |
| Jumpcloud              | SAML       | workos.com/docs/integrations/jumpcloud-saml              |
| Keycloak               | SAML       | workos.com/docs/integrations/keycloak-saml               |
| Lastpass               | SAML       | workos.com/docs/integrations/lastpass-saml               |
| Linkedin               | OAuth      | workos.com/docs/integrations/linkedin-oauth              |
| Login.gov              | OIDC       | workos.com/docs/integrations/login-gov-oidc              |
| Microsoft              | OAuth      | workos.com/docs/integrations/microsoft-oauth             |
| Microsoft AD FS        | SAML       | workos.com/docs/integrations/microsoft-ad-fs-saml        |
| Miniorange             | SAML       | workos.com/docs/integrations/miniorange-saml             |
| NetIQ                  | SAML       | workos.com/docs/integrations/net-iq-saml                 |
| NextAuth.js            | General    | workos.com/docs/integrations/next-auth                   |
| Oidc                   | General    | workos.com/docs/integrations/oidc                        |
| Okta                   | SCIM       | workos.com/docs/integrations/okta-scim                   |
| Okta                   | SAML       | workos.com/docs/integrations/okta-saml                   |
| Okta                   | OIDC       | workos.com/docs/integrations/okta-oidc                   |
| Onelogin               | SCIM       | workos.com/docs/integrations/onelogin-scim               |
| Onelogin               | SAML       | workos.com/docs/integrations/onelogin-saml               |
| Oracle                 | SAML       | workos.com/docs/integrations/oracle-saml                 |
| Pingfederate           | SCIM       | workos.com/docs/integrations/pingfederate-scim           |
| Pingfederate           | SAML       | workos.com/docs/integrations/pingfederate-saml           |
| Pingone                | SAML       | workos.com/docs/integrations/pingone-saml                |
| React Native Expo      | General    | workos.com/docs/integrations/react-native-expo           |
| Rippling               | SCIM       | workos.com/docs/integrations/rippling-scim               |
| Rippling               | SAML       | workos.com/docs/integrations/rippling-saml               |
| Sailpoint              | SCIM       | workos.com/docs/integrations/sailpoint-scim              |
| Salesforce             | SAML       | workos.com/docs/integrations/salesforce-saml             |
| Salesforce             | OAuth      | workos.com/docs/integrations/salesforce-oauth            |
| Saml                   | General    | workos.com/docs/integrations/saml                        |
| Scim                   | General    | workos.com/docs/integrations/scim                        |
| Sftp                   | General    | workos.com/docs/integrations/sftp                        |
| Shibboleth Generic     | SAML       | workos.com/docs/integrations/shibboleth-generic-saml     |
| Shibboleth Unsolicited | SAML       | workos.com/docs/integrations/shibboleth-unsolicited-saml |
| SimpleSAMLphp          | General    | workos.com/docs/integrations/simple-saml-php             |
| Slack                  | OAuth      | workos.com/docs/integrations/slack-oauth                 |
| Supabase + AuthKit     | General    | workos.com/docs/integrations/supabase-authkit            |
| Supabase + WorkOS SSO  | General    | workos.com/docs/integrations/supabase-sso                |
| Vercel                 | OAuth      | workos.com/docs/integrations/vercel-oauth                |
| Vmware                 | SAML       | workos.com/docs/integrations/vmware-saml                 |
| Workday                | General    | workos.com/docs/integrations/workday                     |
| Xero                   | OAuth      | workos.com/docs/integrations/xero-oauth                  |

## Step 2: Set Up the Connection

**WebFetch** the provider-specific doc URL from the table above, then follow the protocol for the connection type.

### SAML SSO Setup

1. In WorkOS Dashboard, navigate to **Organizations > [Org] > Authentication**
2. Click **Add Connection** and select SAML
3. Copy these values from the connection detail page:
   - **ACS URL** (Assertion Consumer Service) — paste into IdP's SSO config
   - **SP Entity ID** — paste into IdP's audience/entity field
4. In the IdP admin console, create a new SAML application:
   a. Set the ACS URL and SP Entity ID from step 3
   b. Configure attribute mapping: `id` → NameID, `email` → email, `firstName` → first name, `lastName` → last name
   c. Download or copy the **IdP Metadata URL** (or download the metadata XML file)
5. Back in WorkOS Dashboard, upload the IdP metadata (URL or XML file)
6. Connection state transitions: **Draft → Validating → Active**
   - If it stays in Draft, see Troubleshooting below

### SCIM Directory Sync Setup

1. In WorkOS Dashboard, navigate to **Organizations > [Org] > Directory Sync**
2. Click **Add Directory** and select the provider
3. Copy these values from the directory detail page:
   - **SCIM Endpoint URL** (e.g., `https://api.workos.com/directories/<DIR_ID>/scim/v2`)
   - **SCIM Bearer Token** — treat as a secret, never log or commit
4. In the IdP admin console, configure SCIM provisioning:
   a. Set the SCIM Base URL to the endpoint from step 3
   b. Set Authentication to **Bearer Token** and paste the token
   c. Enable provisioning actions: Create Users, Update User Attributes, Deactivate Users
   d. Map user attributes: `userName` → email, `name.givenName` → first name, `name.familyName` → last name
5. Run a test push/sync from the IdP to verify users appear in WorkOS
6. Directory state transitions: **Inactive → Validating → Linked**

### OAuth Social Login Setup

1. In the OAuth provider's developer console, create a new OAuth application
2. Set the **Redirect URI** to the value from WorkOS Dashboard:
   - Format: `https://auth.workos.com/sso/oauth/callback/<CONNECTION_ID>`
3. Copy the **Client ID** and **Client Secret** from the provider
4. In WorkOS Dashboard, navigate to **Authentication > Social Login**
5. Select the provider and paste the Client ID and Client Secret
6. Configure scopes (typically: `openid`, `profile`, `email`)
7. Test by initiating a login flow through your application

## Step 3: Verify the Integration

```bash
# Check connection status via WorkOS API
curl -s -H "Authorization: Bearer $WORKOS_API_KEY" \
  https://api.workos.com/connections | jq '.data[] | {id, name, state}'

# Verify SSO connection is active
curl -s -H "Authorization: Bearer $WORKOS_API_KEY" \
  https://api.workos.com/connections | jq '.data[] | select(.state == "active") | .name'

# Check directory sync connections
curl -s -H "Authorization: Bearer $WORKOS_API_KEY" \
  https://api.workos.com/directories | jq '.data[] | {id, name, state}'
```

Checklist:

- [ ] Connection appears in WorkOS Dashboard with "Active" (SSO) or "Linked" (directory) state
- [ ] Test SSO login succeeds with a test user
- [ ] User profile attributes map correctly (email, first name, last name, groups)
- [ ] (If SCIM) Directory sync shows users from provider
- [ ] (If OAuth) Social login redirects correctly and returns user profile

## Integration Type Decision Tree

```
What type of integration?
  |
  +-- SSO (user login)
  |     |
  |     +-- Provider supports SAML? → Use SAML connection (preferred for enterprise)
  |     +-- Provider supports OIDC only? → Use OIDC connection
  |     +-- Provider supports both? → Prefer SAML (wider enterprise support, more attributes)
  |
  +-- Directory Sync (user provisioning)
  |     |
  |     +-- Provider supports SCIM? → Use SCIM connection
  |     +-- No SCIM but has API? → Check if WorkOS has a native directory for this provider
  |     +-- No directory support? → Consider SFTP-based import or manual sync
  |
  +-- OAuth (social login)
        |
        +-- Find provider in OAuth section of table above
        +-- Follow OAuth setup steps in Step 2
```

## Troubleshooting Decision Tree

```
Connection not working?
  |
  +-- Connection stuck in "Draft"
  |     |
  |     +-- Did you upload IdP metadata? → Upload XML or enter metadata URL in Dashboard
  |     +-- Metadata uploaded but still Draft? → Check metadata is valid XML, not HTML login page
  |     +-- Using metadata URL? → Verify URL is publicly reachable (not behind firewall)
  |
  +-- Connection stuck in "Validating"
  |     |
  |     +-- IdP metadata certificate expired? → Upload new cert or fresh metadata
  |     +-- ACS URL contains typo? → Re-copy from Dashboard, paste exactly
  |     +-- SP Entity ID mismatch? → Ensure IdP audience matches WorkOS SP Entity ID exactly
  |
  +-- SAML assertion errors
  |     |
  |     +-- "Recipient mismatch" → ACS URL in IdP config does not match WorkOS; re-copy it
  |     +-- "Audience mismatch" → SP Entity ID in IdP does not match; re-copy it
  |     +-- "Signature invalid" → IdP metadata/certificate is stale; re-upload current metadata
  |     +-- "Response expired" → Clock skew between IdP and SP; verify NTP sync on IdP server
  |     +-- "NameID missing" → IdP not sending NameID; add NameID mapping in IdP attribute config
  |
  +-- SCIM sync failing
  |     |
  |     +-- 401 Unauthorized → Bearer token is wrong or expired; regenerate in Dashboard
  |     +-- 404 Not Found → SCIM endpoint URL is wrong; re-copy from Dashboard
  |     +-- Users sync but no attributes → Check attribute mapping in IdP; must map userName, name.*
  |     +-- Users created but not updated → Ensure "Update User Attributes" is enabled in IdP provisioning
  |     +-- Deactivated users still active → Enable "Deactivate Users" in IdP provisioning settings
  |
  +-- OAuth redirect errors
  |     |
  |     +-- "redirect_uri_mismatch" → Redirect URI in provider console doesn't match WorkOS; copy exact URI
  |     +-- "invalid_client" → Client ID or Secret is wrong; re-copy from provider console
  |     +-- "access_denied" → User denied consent, or OAuth app not approved; check provider app status
  |     +-- Scopes error → Remove unsupported scopes; start with openid, profile, email
  |
  +-- "Organization not found"
        |
        +-- No org exists → Create organization in Dashboard first
        +-- Org exists but connection not linked → Link connection to organization in Dashboard
        +-- Domain not verified → Verify domain under Organizations > Domains (required for SSO)
```

## Error Recovery Reference

| Problem                          | Root Cause                                      | Fix                                                                               |
| -------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Connection stuck in "Draft"      | IdP metadata not uploaded or invalid            | Upload valid IdP metadata XML or enter a reachable metadata URL in Dashboard      |
| Connection stuck in "Validating" | Certificate expired or ACS/Entity ID mismatch   | Re-upload fresh metadata; verify ACS URL and SP Entity ID match exactly           |
| SAML "Recipient mismatch"        | ACS URL in IdP does not match WorkOS value      | Copy the exact ACS URL from the connection's details in the WorkOS Dashboard      |
| SAML "Audience mismatch"         | SP Entity ID in IdP does not match WorkOS       | Copy exact SP Entity ID from Dashboard; paste into IdP audience/entity field      |
| SAML "Signature invalid"         | IdP certificate rotated but WorkOS has old cert | Re-download IdP metadata and re-upload to WorkOS Dashboard                        |
| SAML "Response expired"          | Clock skew between IdP server and WorkOS        | Sync IdP server time via NTP; most assertions allow 5-minute skew                 |
| SCIM 401 Unauthorized            | Bearer token is expired or was regenerated      | Copy the current bearer token from the directory's SCIM settings in the Dashboard |
| SCIM 404 Not Found               | Endpoint URL has wrong directory ID or path     | Re-copy full SCIM endpoint URL from Dashboard                                     |
| SCIM sync no attributes          | Attribute mapping missing in IdP                | Map userName, name.givenName, name.familyName in IdP SCIM config                  |
| SCIM users not deactivated       | Deprovisioning not enabled                      | Enable "Deactivate Users" in IdP provisioning settings                            |
| OAuth "redirect_uri_mismatch"    | Redirect URI in provider console is different   | Paste exact redirect URI from WorkOS Dashboard into provider OAuth app            |
| OAuth "invalid_client"           | Client ID or Secret is wrong                    | Re-copy Client ID and Secret from provider developer console                      |
| "Organization not found"         | Connection not linked to an organization        | Create org in Dashboard, then link the connection to it                           |
| "Domain not verified"            | SSO requires a verified domain                  | Add and verify the organization's domain in the Dashboard                         |

## Related Skills

- **workos-sso**: General SSO implementation and configuration
- **workos-directory-sync**: Directory Sync setup and management
- **workos-domain-verification**: Domain verification required for SSO
- **workos-admin-portal**: Let customers configure their own connections
