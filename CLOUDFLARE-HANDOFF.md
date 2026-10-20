# Astro migration handoff

## Architecture

- Astro **7.4.1**, pinned in `package.json` and locked by `package-lock.json`.
- Node **24** selected by `.node-version`; Astro requires Node >=22.22.0.
- Static Astro output, trailing-slash routes, directory output in `dist`.
- Cloudflare Pages Git deployment: `npm run build`, output `dist`, framework Astro, repository root.
- No Astro SSR adapter. The existing root `functions/api/enchantments.js` supplies the live Pages API route separately.
- `public/_routes.json` is copied into `dist` and restricts function invocation to `/api/enchantments` and its trailing-slash variant.

## Preserved routes and components

Main routes: `/`, `/about-us/`, `/staffoverview/`, `/content-overview/`, `/runecrafting-hub/`, `/gallery/`, `/calendar/`, `/changelog-and-faq/`, `/map/`. All 49 imported announcement paths are also preserved. Astro generates `/404.html`.

The shared header/footer render through `SiteLayout.astro` on every main/article page. Header links and active-page labels are defined in one place. There are no client-side page transitions, so the retained client scripts initialize on normal page loads as before.

The longer authored pages are retained as checked-in HTML fragments under `src/content/pages/` and imported at build time through their Astro routes. `set:html` preserves the existing guide markup, embedded shopping planner, and its inline data. These fragments are repository-controlled content, not arbitrary HTML fetched from visitors.

The five Hub tools and their own shell remain unchanged as static documents under `public/runecrafting-hub/tools/`. Their wrapper is an Astro page. This preserves their calculations, gem planning, incompatibility handling, and automatic height messaging.

`site.css` styles the homepage/community/archive pages; `chrome.css` styles the guide/Hub/map shells. The content guides retain their separately scoped stylesheet. This avoids homepage card and hero styles changing the tools.

## Adding an announcement

1. Create `src/content/posts/your-post-slug.html`, containing the post body HTML. Use semantic paragraphs, headings, lists, and local image paths. This is only the article body, not a full HTML document.
2. Add one record to `src/data/posts.json`:

```json
{
  "id": "your-unique-post-id",
  "slug": "your-post-slug",
  "title": "Your announcement title",
  "published": 1792454400000,
  "author": "Your display name",
  "topics": ["gameplay"],
  "excerpt": "A short summary for the archive."
}
```

Set `published` to the post's actual Unix timestamp **in milliseconds**. The value above is illustrative; replace it. Slugs and IDs must be unique. Available topic IDs are `gameplay`, `runecrafting`, `valor-shop`, `event`, `build-contest`, `weekend-rush`, `faq`, and `miscellaneous`.

3. Commit and rebuild. `src/lib/posts.js` loads the body, derives search text and dates, sorts posts, and supplies the archive and `[slug].astro` routes. Topic links, the archive's highlighted latest post, search records, and older/newer links update together.

The homepage's two announcement summaries remain authored homepage content. Update `src/content/pages/home.html` when changing them.

## Live data and remaining boundaries

The Hub's `/api/enchantments` adapter reuses:

`https://glistening-conkies-9b85d8.netlify.app/.netlify/functions/enchantments`

The function validates the response, uses a ten-second timeout, and allows a short cache. The client loader at `public/assets/hub-data.js` falls back to `public/runecrafting-hub/tools/enchantments.json` on failure. The snapshot contains 172 enchantment records. Keep the original Netlify function/project running; Airtable credentials stay there. Relocating that integration entirely into Cloudflare is a separate step.

The styled calendar reads `public/calendar/events.json`, imported October 20, 2026. It covers October 2025–October 2027 and handles recurrence exceptions, exclusive all-day end dates, and Chicago daylight-saving offsets. It is **not an automatic Google Calendar sync**. The **Live calendar** tab embeds the original live calendar already.

For a future live calendar import, the existing public ICS feed is:

`https://calendar.google.com/calendar/ical/silverspringsmrjoned%40gmail.com/public/basic.ics`

The live map remains embedded from `https://map.sssminecraft.com/`. Atkinson Hyperlegible uses Google Fonts. Four imported article videos use YouTube embeds. Discord links remain external. All displayed website images and the gallery viewer's open-image links use local assets; original gallery source URLs are retained only as provenance metadata.

## Migration from the earlier plain-HTML ZIP

Replace the old `public` folder entirely. Old `public/index.html`, `public/404.html`, and full page/article HTML must not remain: Astro generates those routes from `src`. The prebuild check reports conflicting public HTML. The only allowed public HTML documents are the six Hub documents under `public/runecrafting-hub/tools/`.

Do not upload `node_modules`, `.astro`, or `dist`. The lockfile and Node version file are included. If the Cloudflare dashboard already defines `NODE_VERSION`, set it to `24`. Do not leave the earlier `exit 0` / `public` build settings in place.

## Checks and deployment state

`npm run build` runs the stale-page check and Astro production build. `npm test` runs eight live-data/fallback checks without credentials or external calls. A separate output audit confirmed 65 HTML documents, all 49 original article bodies, identical retained tool files/assets, complete local navigation, and a valid generated archive search index.

The package does not include Git metadata, preview project IDs, credentials, or the preview host's configuration. No GitHub push, Cloudflare deployment, custom-domain change, DNS change, or Squarespace change has been performed. The existing visual preview remains unchanged; review the new Astro build on Cloudflare after upload.
