# Ontology authoring service (under construction)

This package currently exposes workspace reads, class search and two draft class commands over MCP Streamable HTTP. It is not yet the complete modelling studio or a publication service. Node 22.18 or newer is required.

From this directory, run `npm ci`, then create a workspace from the committed repository baseline with `npm start -- --create-workspace`. Record the returned workspace ID. The import reads `model/domain.schema` from Git at HEAD; uncommitted changes are not included. The default SQLite database is `workspaces.sqlite` in this directory; set `CHARGEWEAVE_WORKSPACE_DB` to change it and `CHARGEWEAVE_REPOSITORY` to select the local checkout.

Set `CHARGEWEAVE_DRAFT_TOKEN` to a long random secret of at least 32 bytes, then run `npm start`. The server listens only on `127.0.0.1:4317` (override the port with `CHARGEWEAVE_PORT`). MCP clients send the token in the `Authorization: Bearer` header. Do not commit or share the token. To permit a browser origin, explicitly set `CHARGEWEAVE_BROWSER_ORIGIN` to its exact origin; other origins are rejected. This initial single credential grants draft access to all workspaces in the local database and is not a reviewer or publisher credential.

The authenticated `GET /events?workspaceId=<id>&after=<sequence>` endpoint streams committed changes as server-sent events. Reconnect with the last event ID to replay later events. This feed is read-only; semantic changes still use MCP. Clients must deduplicate events by sequence and recover from a snapshot if they cannot apply a delta.

Run `npm test` to exercise the store and MCP transport. Workspace creation is currently a local command, not an MCP tool. Pairing, change-set lifecycle, comprehensive validation, browser integration, review and publication are not yet implemented.
