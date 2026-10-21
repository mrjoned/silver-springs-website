# Silver Springs Survival Website

Official website for the Silver Springs Survival Minecraft server.

## Publishing

Use Pages CMS to publish announcements and add Gallery photos. See [PUBLISHING.md](PUBLISHING.md) for setup and the publishing workflow. Homepage news cards update from the newest published announcements after each Cloudflare deployment.

## Development

Run `npm ci`, then `npm run dev`. Use `npm test` for the publishing and live-data checks, `npm run test:publishing` to test new CMS entries through a clean production build, and `npm run build` to generate the website in `dist/`.

## Game catalogs

Manage Valor Shop and Runecrafting entries in Pages CMS. See [CATALOGS.md](CATALOGS.md) for the shared data model, price/recipe rules, cart migration, and tests.
