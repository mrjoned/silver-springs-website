# Astro migration handoff

## Architecture

- Astro **7.4.1**, pinned in `package.json` and locked by `package-lock.json`.
- Node **24** selected by `.node-version`; Astro requires Node >=22.22.0.
- Static Astro output, trailing-slash routes, directory output in `dist`.
- Cloudflare Pages Git deployment: `npm run build`, output `dist`, framework Astro, repository root.
- No Astro SSR adapter. The root `functions/api/` directory supplies the live enchantments and calendar APIs separately.
- `public/_routes.json` is copied into `dist` and restricts function invocation to `/api/enchantments`, `/api/calendar`, and their trailing-slash variants.

## Preserved routes and components

Main routes: `/`, `/about-us/`, `/staffoverview/`, `/content-overview/`, `/runecrafting-hub/`, `/gallery/`, `/calendar/`, `/changelog-and-faq/`, `/map/`. All 49 imported announcement paths are also preserved. Astro generates `/404.html`.

The shared header/footer render through `SiteLayout.astro` on every main/article page. Header links and active-page labels are defined in one place. There are no client-side page transitions, so the retained client scripts initialize on normal page loads as before.

The longer authored pages are retained as checked-in HTML fragments under `src/content/pages/` and imported at build time through their Astro routes. `set:html` preserves the existing guide markup, embedded shopping planner, and its inline data. These fragments are repository-controlled content, not arbitrary HTML fetched from visitors.

The five Hub tools and their own shell remain unchanged as static documents under `public/runecrafting-hub/tools/`. Their wrapper is an Astro page. This preserves their calculations, gem planning, incompatibility handling, and automatic height messaging.

`site.css` styles the homepage/community/archive pages; `chrome.css` styles the guide/Hub/map shells. The content guides retain their separately scoped stylesheet. This avoids homepage card and hero styles changing the tools.

## Publishing content

See [PUBLISHING.md](PUBLISHING.md). `.pages.yml` supplies the Announcements and Gallery editor forms. Each announcement now lives in one JSON file under `src/content/announcements/`; gallery entries live under `src/content/photos/`. New media uploads go to `public/assets/uploads/`.

`src/lib/publishing.js` excludes drafts, validates published entries, derives URLs from stable filenames, and sorts posts/photos. `src/lib/posts.js` and `src/lib/photos.js` load those entries at build time. `LatestNews.astro` uses the same published-post list as the archive, so the first two homepage cards update automatically. The Gallery page and `/gallery/photos.json` are also generated together, avoiding manual grid edits.

All 49 imported post bodies and original URLs, and all 45 images in their original collection order, are retained. The old split post-metadata/body files and fixed gallery JSON have been replaced by the editor-backed entries. Normal page text remains under `src/content/pages/`; the homepage is split into `home-before-news.html` and `home-after-news.html`, with the generated news component between them.

## Live data and remaining boundaries

The Hub's `/api/enchantments` adapter reuses:

`https://glistening-conkies-9b85d8.netlify.app/.netlify/functions/enchantments`

The function validates the response, uses a ten-second timeout, and allows a short cache. The client loader at `public/assets/hub-data.js` falls back to `public/runecrafting-hub/tools/enchantments.json` on failure. The snapshot contains 172 enchantment records. Keep the original Netlify function/project running; Airtable credentials stay there. Relocating that integration entirely into Cloudflare is a separate step.

The styled Month and Agenda calendar views load `/api/calendar?month=YYYY-MM`. `functions/api/calendar.js` reads the public Google Calendar through the Calendar API using the encrypted `GOOGLE_CALENDAR_API_KEY` binding. The calendar ID matches the existing embed: `silverspringsmrjoned@gmail.com`. Public event details must be enabled in Google Calendar. No OAuth or Google hosting service is needed.

Google expands recurring events, including changed instances; cancelled events are excluded. The endpoint follows pagination, includes adjacent grid days, and caches successful responses for five minutes at the Cloudflare edge. It never returns raw upstream errors or key-bearing URLs. The client refreshes every five minutes while visible and checks again when a stale tab becomes visible. Changes can take roughly ten minutes to appear depending on cache/refresh timing. Timed events use America/Chicago; all-day end dates remain exclusive. Calendar descriptions are rendered as text with HTTP/HTTPS links.

Failures retain a clearly marked previously loaded month or switch to the embedded Live calendar when no current month is available. The old `public/calendar/events.json` is retained as historical source data and is no longer loaded by the styled calendar. Astro preview does not run Pages Functions; verify the live endpoint after deploying to Cloudflare. For preview deployments, add the secret to Cloudflare's Preview environment separately.

The live map remains embedded from `https://map.sssminecraft.com/`. Atkinson Hyperlegible uses Google Fonts. Four imported article videos use YouTube embeds. Discord links remain external. All displayed website images and the gallery viewer's open-image links use local assets; original gallery source URLs are retained only as provenance metadata.

## Migration from the earlier plain-HTML ZIP

Replace the old `public` folder entirely. Old `public/index.html`, `public/404.html`, and full page/article HTML must not remain: Astro generates those routes from `src`. The prebuild check reports conflicting public HTML. The only allowed public HTML documents are the six Hub documents under `public/runecrafting-hub/tools/`.

Do not upload `node_modules`, `.astro`, or `dist`. The lockfile and Node version file are included. If the Cloudflare dashboard already defines `NODE_VERSION`, set it to `24`. Do not leave the earlier `exit 0` / `public` build settings in place.

## Checks and deployment state

`npm run build` runs the stale-page check and Astro production build. `npm test` runs live-data/fallback, publishing, and calendar checks without credentials or external calls. A separate output audit confirmed 65 HTML documents, all 49 original article bodies, identical retained tool files/assets, complete local navigation, and a valid generated archive search index.

The package does not include Git metadata, preview project IDs, credentials, or the preview host's configuration. No GitHub push, Cloudflare deployment, custom-domain change, DNS change, or Squarespace change has been performed. The existing visual preview remains unchanged; review the new Astro build on Cloudflare after upload.
