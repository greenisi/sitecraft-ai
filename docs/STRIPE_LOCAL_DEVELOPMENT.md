# Sitecraft Stripe development workflow

This workflow is intentionally limited to the new **Sitecraft Stripe account in
test mode**. It does not modify production environment variables, create live
charges, or store Stripe API keys in this repository.

## What is configured

- Stripe CLI 1.44.0 or newer.
- A dedicated CLI profile name: `sitecraft-test`.
- Secret-free Stripe MCP configuration in `.vscode/mcp.json`.
- A local runner that starts Stripe webhook forwarding and Sitecraft together
  without printing or persisting the temporary webhook signing secret.
- The existing `default` Stripe CLI profile remains untouched.

## 1. Authenticate the Sitecraft CLI profile

Run:

```bash
npm run stripe:login:test
```

Stripe opens its normal browser authorization flow. Select the newly created
Sitecraft account and approve the CLI connection. Do not use
`stripe login --interactive`, paste an API key, or select live mode.

Confirm the profile afterward:

```bash
npm run stripe:whoami:test
npm run stripe:connect:preflight:test
```

The output must identify the Sitecraft account and say that a test-mode key is
available. The preflight additionally refuses profiles with live-mode access,
confirms a real API response reports `livemode: false`, and verifies that the
Connect account-list API is reachable without creating a connected account.
Stripe only confirms full platform enrollment when the first test connected
account is created. The CLI stores its restricted credentials in the user-level
Stripe configuration outside this repository.

## 2. Configure local application access

The Stripe CLI session authenticates CLI commands, but the Next.js server still
needs its own **test-mode** `STRIPE_SECRET_KEY` at runtime. Make it available
through the existing local secrets workflow or the ignored `.env.local` file.

Rules:

- The value must be a test key, never a live key.
- Never place it in source, documentation, terminal history, screenshots, or
  committed files.
- Do not replace any Vercel or production environment variable while doing
  local testing.
- Keep `.env.local` ignored by Git.

The app also requires its existing Supabase variables for a complete local
checkout or Connect test.

## 3. Start Sitecraft with local webhooks

Run:

```bash
npm run stripe:dev:test
```

The runner:

1. Refuses `--live`.
2. Requires the `sitecraft-test` profile.
3. Verifies that the authenticated account name contains `Sitecraft`.
4. Starts Stripe CLI in its default test mode.
5. Forwards platform events to `http://localhost:3000/api/stripe/webhook`.
6. Forwards connected-account lifecycle events to
   `http://localhost:3000/api/stripe/connect/webhook`.
7. Passes the temporary webhook signing secret directly to the local Next.js
   process without printing or saving it.

Stop both processes with `Ctrl+C`.

For documentation from the terminal:

```bash
npm run stripe:docs -- /connect/testing
npm run stripe:docs -- search "Express account onboarding"
```

## 4. Enable Stripe’s AI assistant connection

The workspace contains the official secret-free remote MCP configuration:

```json
{
  "servers": {
    "stripe": {
      "type": "http",
      "url": "https://mcp.stripe.com"
    }
  }
}
```

In VS Code, start or enable the `stripe` MCP server when prompted. Stripe opens
an OAuth consent screen. Authorize only the Sitecraft test environment.

If Stripe reports that MCP is disabled, a Stripe administrator must enable MCP
access for the sandbox/test environment in Dashboard settings. Sandbox and live
MCP access are separate; leave live access disabled for this workflow.

Recommended AI guardrails:

- Read and search actions can run normally.
- Require human confirmation for every Stripe write tool.
- Never authorize live mode for the Sitecraft development session.
- Never ask an AI agent to display, copy, or store credentials.
- Use Stripe test tokens and test payment methods only.

## Safe verification checklist

After CLI and MCP OAuth authorization:

1. `npm run stripe:whoami:test` identifies Sitecraft.
2. `npm run stripe:connect:preflight:test` passes without creating resources.
3. `npm run stripe:docs -- /connect/testing` succeeds.
4. `npm run stripe:dev:test` starts without exposing a signing secret.
5. Open Sitecraft locally and test onboarding with Stripe test data only.
6. Confirm test events arrive in the local terminal and test-mode Workbench.

Do not run `stripe trigger`, create a connected account, or complete a checkout
until the account owner confirms the intended test scenario. Those commands
create external test resources even though they do not move real money.

## Remaining account-owner steps

- Approve `npm run stripe:login:test` in the browser while the Sitecraft account
  is selected.
- Approve the Stripe MCP OAuth session for the Sitecraft test environment.
- If prompted, enable MCP for test/sandbox mode as a Stripe administrator.
- Finish any Stripe Connect platform profile or business-verification fields
  that Stripe requires. Test-mode development can proceed without live charges,
  but live connected accounts and payouts remain blocked until Stripe approves
  the platform.

## Minimal end-to-end Connect verification

Run the preflight first. Passing it does not prove that Stripe Connect platform
enrollment is complete. Only after it passes and the account owner explicitly
approves a test resource:

1. Start Sitecraft locally with test-only Stripe and Supabase configuration.
2. Sign in as a dedicated local test user.
3. Click **Connect with Stripe** once.
4. Confirm Stripe creates one Express test account and returns a hosted
   `account_onboarding` link.
5. Complete hosted onboarding with Stripe test data.
6. Confirm the return URL reports onboarding status and the Stripe dashboard
   handoff opens the connected account's test Express dashboard.

Do not create a Checkout Session or charge for this onboarding test.
