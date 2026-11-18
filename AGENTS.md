<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Keep public marketing and authentication routes outside the client-only authenticated layout; session storage cannot authorize SSR.
- Read restaurant data through authenticated server functions and owner-scoped RLS; never trust a browser-supplied owner ID.
- Create profiles and the initial restaurant transactionally in the signup trigger; confirmed users must always have an account workspace.
- Keep shared visual tokens in the global stylesheet and reusable MenuVision controls under components; future features must retain one consistent identity.
- Store dishes and categories with owner and restaurant keys, validate mutations in authenticated server functions, and enforce category membership in PostgreSQL; this prevents cross-restaurant assignments.
- Store dish photos in a private owner-folder bucket and issue short-lived signed URLs through authenticated reads; no photo is anonymously accessible.

- Load public pricing from the database through a narrow anonymous read-only server function; catalog changes must not require component edits.
- Keep billing writes service-only and subscriptions pending until a signature-verified, provider-verified webhook is processed; a plan selection must never grant access or simulate payment.
- Route Mercado Pago calls through the linked connector from server handlers; create checkouts from persisted prices and authenticated restaurant ownership to prevent price or tenant tampering.
- Apply verified billing events atomically under a subscription row lock with idempotent event keys; require both installation and weekly payments before activation to prevent duplicate or premature access.
- Generate dish models through authenticated Tripo connector calls and persist owner-scoped jobs and private GLBs; never expose provider credentials or accept a client-supplied source URL.
- Calibrate food models from measured width in centimeters and use model-viewer WebXR/Quick Look with fixed AR scale; omit Scene Viewer because it does not retain the runtime scale transformation.
- Publish menus only by owner opt-in through narrow public RPC projections; keep existing dish photos private so publishing never leaks protected assets.
- Create guest orders atomically through a restricted database function with persisted dish prices, item snapshots and idempotent random tracking capabilities; only owner-authorized status transitions may modify orders, and public tracking must omit customer identity and internal ownership.
