# GitHub synchronization

Repository: https://github.com/atzilul/partyprint
Branch: main

The complete project source and public assets are stored in this repository.
The root AGENTS.md instructs future editing sessions to reconcile and publish
each completed update to this branch after validation. This is a workflow
performed during editing sessions, not an unattended background mirror of Sites.

Hostinger can watch this branch after the repository is connected in hPanel.
The existing application is built for Cloudflare Workers, D1, R2, and Sites
authentication. Its current start script is a local Wrangler development server;
it is not a production Hostinger Node.js startup command. Adapt persistence,
file storage, authentication, and production startup before deploying there.

Keep order data and secrets outside Git. Environment variable examples are
placeholders only. Source updates must not reset production order data.
