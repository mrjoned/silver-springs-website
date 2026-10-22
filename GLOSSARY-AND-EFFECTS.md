# Runecrafting glossary and level effects

These features work in the Lexicon, Build Planner (including review), Comparison, and Equipment Guide. Hover, focus with Tab, or click/tap marked text to read its explanation. Escape, tapping outside, or scrolling dismisses the popup.

## Per-enchantment effects

In Pages CMS, edit an enchantment and add an item under **Level effects**:

- Effect key: `speed`
- Effect label: `Speed bonus`
- Values by level: level `1`, value `40%`; level `2`, value `80%`

Levels are entered as numbers and displayed as Roman numerals. Each level may have any text value, such as `5 seconds` or `2–4 damage`; no linear scaling is assumed. Keys must be unique within an enchantment, lowercase, and may contain digits and hyphens. Levels must not exceed the enchantment's maximum level.

Wrap the relevant words in the description:

```
[effect:speed]+40–80% speed[/effect]
```

Keep your current wording; only add the tags around the phrase you want explained. For Adrenaline Rush, use the actual level values confirmed in-game. Effects can be named for speed, damage, duration, or any other mechanic.

## Shared glossary

Open **Runecrafting Glossary** in Pages CMS. Add a term with a key (such as `freezing`), a display name, and its explanation. Keep Draft off when ready to publish. Write explanations as plain text; line breaks are supported.

Reference the term in any enchantment:

```
[term:freezing]freezing[/term]
```

The displayed words can differ from the key. Updating one glossary entry updates every reference after the website deploys. Terms are linked explicitly, rather than automatically marking every matching word.

## Colors and formatting

```
[effect:speed][gold]+40–80% speed[/gold][/effect]
[term:freezing][aqua]freezing[/aqua][/term]
```

You can use bold, italics, and underline within the marked text. Keep each pair of tags in one paragraph, outside code samples and links. Do not nest tooltip tags within other tooltip tags. Tags remain visible in Pages CMS; the published website shows the tooltip. Unknown keys or unfinished tags remain visible so missing references can be corrected.

No existing descriptions or gameplay values are changed by this update. The glossary starts empty. After installing, configure one effect, save, wait for Cloudflare's deployment, and verify it in the Lexicon before adding more.
