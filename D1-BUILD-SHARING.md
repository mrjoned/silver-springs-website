# Build sharing setup

1. In Cloudflare, open Storage & databases > D1 SQL database and create `silver-springs-builds`.
2. In its Console, run the SQL from `migrations/0001_shared_builds.sql`.
3. Open Workers & Pages > your Pages project > Settings > Bindings. Add a D1 database binding named `BUILDS_DB` and select `silver-springs-builds` for Production.
4. For branch testing, create a separate preview database, run the same SQL, and bind it as `BUILDS_DB` in Preview.
5. Deploy this change after saving the bindings. Bindings require a new deployment.
6. Create a build, click Share Build, and open the copied /b/ link in another browser. Check all equipment, levels and gems. Confirm an old #build= link still loads.

Shared snapshots are public to anyone with their link. Browser saves stay local. Identical snapshots reuse their link. There is no automatic expiry. Deleting a database record breaks its shared link.

Requests are limited to 32 KiB and 30 pieces, with server-side validation. Consider a Cloudflare rate-limiting rule for POST /api/builds before broad promotion; the API's origin check is not bot protection. No database credentials are exposed to the browser.

Tests: `node tests/shared-builds.mjs` and `npm run build`. Local tests use a D1 stub; the deployment preview must verify the actual D1 binding and SQL table.
