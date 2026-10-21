# Editing the game catalogs

Pages CMS has **Valor Shop** and **Runecrafting** collections alongside Announcements and Gallery. GitHub is the source of truth for the website catalogs. Saving an entry commits the JSON; the next successful Cloudflare build updates the guide, shopping cart, and all five Hub tools together. This edits website documentation and planning data, not the Minecraft server's configuration.

## Runecrafting

Each enchantment is one file in `src/content/enchantments/`.

- Name, Source, Category, effect, equipment types, and max level control the tools.
- Five recipe slots preserve order and repeated runes. For a recipe containing two Aegis runes, select Aegis in two separate slots.
- **Rune cost calculation** explicitly selects recipe × level, one recipe for a fixed upgrade, or no rune cost. Fixed upgrades such as Unbreaking IV use one recipe. Vanilla, Curse, and Mythical entries use no rune cost. Projects retains its original Source classification; the rune calculator continues to exclude project entries as before.
- Keep the two incompatibility lists, including group labels such as Other Avatars. The existing compatibility logic combines them. Names should match the catalog or the existing group labels.
- Discovery credits, researchers, dates, original credits, and rune tags are preserved and editable. Rune tags are reference metadata; the five recipe slots determine the recipe.
- Imported record IDs are retained. Renaming a display name keeps the file identity, but name-based selections copied from older tools may need reselection after a rename. Existing tool URLs and gem behavior are retained.

New entries default to Draft. Finish required fields, then uncheck Draft to include the entry in the website and tools. Draft entries can be incomplete. Required fields and invalid recipes stop the build rather than publish broken calculations; check Cloudflare's deployment log if a save does not reach the site.

## Valor Shop

Each item is one file in `src/content/valor-items/`.

- Category groups the catalog; **Merchant / availability** controls shopping-list grouping and whether the item can be purchased.
- Use prices such as `5 Valor Badges`, `40,000 Silver`, or `1 Stick + 1 Dragon's Breath`. Separate multiple requirements with ` + `. A price of zero is valid. Armor may end in `(Per Piece)`; cart quantities count individual pieces.
- Keep separate Trial Point currencies, e.g. Greenhouse Trial Points and Crypt Trial Points.
- **Additional Charms must use Reference only**. Their costs, including Checkered Flag's Your Sanity and Corrupted Footage's conversion requirement, never enter shopping totals.
- Use How to obtain for loot, events, conversion, and other acquisition routes. Skill requirements and original descriptions are retained.
- Optional **Related enchantments** links select Runecrafting entries by stable file path. Publish referenced enchantments before publishing the item. The cart displays the related enchantment names.
- Display order controls catalog order. Existing saved carts use stable file identifiers; adding or reordering entries will not retarget saved quantities. The previous index-based cart is migrated automatically on first use. Deleted, draft, and reference-only entries are removed from active saved shopping lists.

Do not rename catalog filenames: Pages CMS disables that operation. Change the display name in the entry instead. Existing cart data remains on the visitor's browser and is never uploaded to a server.

## What updates automatically

- Valor catalog cards, cart prices, merchant subtotals, combined requirements, and copied shopping lists.
- Guide counts, Boardwalk/village prices, artifact exchanges, services, the Bonus Charm Slot card, and Additional Charm descriptions/acquisition details.
- Enchantment Encyclopedia, Equipment Guide, Comparison, Rune Calculator, and Build Planner, including their embedded initial data and JSON catalog.

Authored gameplay instructions, gem rules, and server mechanics outside these two databases remain normal website content. Changing a catalog does not change in-game prices or mechanics.

## Developer notes

`src/lib/game-catalogs.js` validates/transforms the catalogs. `src/lib/site-catalogs.js` imports entries/templates through Vite so content changes and deletions are build dependencies. `src/catalog-templates/` holds the retained tool/cart templates; Astro renders the five existing `.html` tool URLs and `/valor-shop/`.

`/api/enchantments` and `/runecrafting-hub/tools/enchantments.json` are static outputs of the same catalog. `/api/enchantments` no longer runs a Pages Function, and `_routes.json` preserves only the live Google Calendar function routes. The website no longer requests Airtable or the old Netlify enchantments endpoint. No Airtable credentials are needed. Other uses of the separate Netlify project are outside this change.

`public/assets/valor-cart-storage.js` migrates the browser's original v1 cart using the frozen `valor-legacy-ids.json` mapping. Do not regenerate that mapping when the catalog changes. Current v2 carts and checkmarks are stored by record/file ID.

## Validation

- `npm test`: catalog validation, real cart arithmetic, legacy cart/reorder handling, cost-rule helpers, safe embedding, existing publishing logic, and calendar checks.
- `npm run test:catalogs`: temporary catalog additions, edits, drafts, references, build outputs for all consumers, and removal checks. Reserved fixture names are cleaned up afterward.
- `npm run test:publishing`: existing announcement/gallery build integration.
- `npm run build`: production output.
- `npm run audit:catalog-import`: **one-time historical audit** against `catalog-import/source-export.json`. It verified every original field across 172 enchantments and 69 Valor items at migration time. Intentional future CMS edits are expected to differ from this historical export; do not use this audit as a permanent deployment gate.

The initial export contains 144 Runecrafted, 8 Mythical, 10 Curse, 9 Vanilla, and 1 Projects enchantment. Valor contains 19 relics, 6 armor sets, 19 purchasable charms, 12 Additional Charms, 7 services, and 6 artifacts. New entries and edits do not require changing fixed-count assertions.
