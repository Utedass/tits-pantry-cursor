# Tit's Pantry

Swedish client-side frontend for Grocy 4.5.0. The browser talks to Grocy with `GROCY-API-KEY`; no Node server in production.

```sh
npm install
npm run dev
```

Build static files with `npm run build` (SPA fallback `200.html`).

## Grocy API for agents

Local and Cursor Cloud agents share the public Grocy **dev** server.

1. Copy `.env.example` to `.env` and set `GROCY_URL` plus `GROCY_API_KEY`.
2. For Cloud Agents, add the same names under [Cloud Agents → Secrets](https://cursor.com/dashboard/cloud-agents) (`GROCY_URL` as an environment variable, `GROCY_API_KEY` as a runtime secret).

```sh
npm run grocy -- ping
npm test
```
