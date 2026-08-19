# WorkOS Email Delivery

## Docs

- https://workos.com/docs/email
  If this file conflicts with fetched docs, follow the docs.

## Gotchas

- WorkOS sends auth emails automatically (Magic Auth, invitations, password resets). This feature is about configuring the sender domain, not writing email-sending code.
- Do NOT manually configure SPF/DKIM TXT records. WorkOS uses SendGrid's automated security via CNAMEs. Adding custom SPF/DKIM records will break authentication.
- You must set up actual inboxes for `welcome@<your-domain>` and `access@<your-domain>`. Email providers check if sender addresses are real — no inbox means higher spam score.
- Spam trigger words in your team name or organization names (e.g., "FREE", "WINNER", "URGENT") damage deliverability even with perfect DNS config.
- Only send invitations when a user explicitly requests access. Bulk inviting from marketing lists violates anti-spam laws and destroys domain reputation.
- DNS propagation for CNAME records can take 24-48 hours. Do not assume failure before that window.
- "Domain already in use" error means the domain is configured in another WorkOS account — must remove from old account first.
