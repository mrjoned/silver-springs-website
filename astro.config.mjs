import { defineConfig } from 'astro/config';

// Static Astro output works with Cloudflare Pages. The existing /functions
// directory supplies the live calendar API independently of Astro rendering.
export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false }
});
