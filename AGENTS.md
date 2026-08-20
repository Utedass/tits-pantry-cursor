# Tit's Pantry

Swedish client-side frontend for Grocy 4.5.0. Production has no Node API — the browser talks to Grocy with `GROCY-API-KEY`.

## Grocy API (local and cloud)

Both the desktop agent and Cursor Cloud agents test against the **public Grocy dev server**, not localhost.

| Variable | Local | Cloud |
| --- | --- | --- |
| `GROCY_URL` | `.env` | Secrets → Environment Variable |
| `GROCY_API_KEY` | `.env` | Secrets → Runtime Secret |

Never print `GROCY_API_KEY`, never pass it on the command line, and never commit `.env`. Use the helper so the key stays in the environment:

```sh
npm run grocy -- ping
npm run grocy -- get objects/products
npm run grocy -- get objects/locations
```

`npm test` includes live Grocy checks when those variables are set, and skips them otherwise.

This is a shared **dev** instance. Prefer GET. If you mutate stock or products, use a clearly named test product and reverse the change.

The Vite `/grocy-proxy` path is only for a browser on a developer machine talking to loopback HTTP Grocy. Cloud agents must use `GROCY_URL` (public HTTPS).

## Cursor Cloud specific instructions

1. Add `GROCY_URL` and `GROCY_API_KEY` under [Cloud Agents → Secrets](https://cursor.com/dashboard/cloud-agents). If network access is allowlisted, add the Grocy hostname too.
2. `npm ci` runs during the environment Build. After that: `npm test` and `npm run grocy -- ping`.
3. The shared `dev` terminal is Vite on port 5173. The SPA still stores URL + key in the browser; API checks from the agent go through `npm run grocy`, not through localStorage.
