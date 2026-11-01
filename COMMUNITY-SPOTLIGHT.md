# Community Spotlight setup

The Community Spotlight page is managed through the **Community Streamers** collection in Pages CMS. Each published entry needs a display name, Twitch channel login, profile image, short bio, and an order number. Leave **Draft** enabled until the profile is ready to show.

The page checks Twitch for live status and only adds a player when a channel is live. The embedded player does not autoplay. Live status is cached for about a minute so the page stays light on Twitch API requests.

To enable live status on Cloudflare Pages, create a Twitch developer application and add these as Pages project secrets under **Settings → Environment variables**:

- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`

The page still works without those secrets: profiles and channel links remain visible, but live status is unavailable. Twitch is the supported live platform in this first version; another platform can be added later if the community needs it.
