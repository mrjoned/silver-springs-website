# Publishing with Pages CMS

After this change is merged to `main` and Cloudflare completes its deployment, open [Pages CMS](https://app.pagescms.org/), select **mrjoned / silver-springs-website**, and use the **main** branch.

The repository root now contains `.pages.yml`, so Pages CMS will show **Announcements** and **Gallery**. Do not paste the documentation's sample configuration over it.

## Publish an announcement

1. Open **Announcements → New**.
2. Enter the title, publication date/time, author, topics, and announcement text. The editor supports formatted text and inserted images.
3. Add an optional **Summary** for the cards, or leave it blank to use the opening text.
4. Leave **Draft (hide from website)** checked while preparing it. Uncheck it when ready to publish, then save.
5. Wait for Cloudflare's Git deployment to finish, then refresh the website.

The newest published posts automatically appear in the homepage's first two news cards. The announcements page's **Latest announcement** card, archive, search index, category filters, and post navigation update from the same content. Publication date controls the order. A future date is not a scheduled publishing service; publish when ready and leave it as a draft until then.

On creation, Pages CMS suggests a filename from the title. Use a short lowercase name with hyphens, such as `autumn-build-contest.json`. That filename defines the post URL. Existing filenames are kept stable when you edit a title, preserving links to all imported posts.

The imported posts retain their original HTML. When editing an older post with video embeds or special formatting, use the editor's **Source** mode to retain that markup; the formatted editor may simplify HTML it does not support.

## Add a Gallery photo

1. Open **Gallery → New**.
2. Enter a caption and select **Photo** to upload an image or choose one already uploaded.
3. Add a brief **Image description** for visitors using screen readers. Set the photo date if known.
4. Leave **Display order** at `0` for new photos to appear before the imported collection. Lower numbers appear first; entries sharing a number are ordered by photo date, newest first.
5. Uncheck **Draft (hide from website)** and save when ready.
6. Wait for the Cloudflare deployment, then open the Gallery.

The Gallery grid, count, year choices, and larger viewer are generated automatically. Uploading a file to the media library alone does not display it in the Gallery: save a Gallery entry that selects that file. This avoids publishing unfinished uploads by accident.

## Where the content lives

- Announcements: one JSON entry per post in `src/content/announcements/`, including title, date, topics, summary, and formatted HTML body.
- Gallery: one JSON entry per photo in `src/content/photos/`.
- New uploads: `public/assets/uploads/`, served as `/assets/uploads/...`.
- Imported photos remain in `public/assets/gallery/`.
- `.pages.yml` defines the forms and media location.

The original 49 announcement URLs, article text, and 45 gallery images have been retained. No API tokens or login credentials are stored in the config. Pages CMS uses your existing GitHub app installation.

Saving in Pages CMS commits content to GitHub. Cloudflare then rebuilds the website; the save is not an instant update to an already-open browser tab. Drafts are excluded from public routes and search. Published entries with missing required content cause a clear build error, leaving the prior successful Cloudflare deployment available.

## Checks

Run `npm test` for the publishing and existing live-data checks, `npm run test:publishing` to test temporary CMS entries through a clean production build, and `npm run build` for Astro's production output. The integration check removes its temporary entries and rebuilds the original content afterward. First-use testing in the connected Pages CMS editor remains necessary after merge. A safe first check is to save an entry as a **draft** and confirm it stays off the website before publishing real content.
