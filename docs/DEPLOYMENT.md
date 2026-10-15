# Distribution and static deployment

## Offline demonstration
Send `preview.html` to a colleague and open it in a modern browser. It embeds the JavaScript, styles and synthetic data, needs no server and makes no runtime API requests. Regenerate it after every build:

```sh
npm ci
npm test
npm run build
node scripts/create-preview.mjs
```

The packager fails if multiple JavaScript chunks or relative module dependencies appear; it never silently emits an incomplete single-file demo.

## Static hosting
Use the curated portfolio package, not the full local workspace. Upload the **contents of dist/** to a static hosting service. For automated builds use `npm ci`, build command `npm run build`, output directory `dist`. The app has one page, no server routes and no backend. The default Vite base targets a domain root; a subdirectory deployment requires setting `base` in `vite.config.ts` and rebuilding.

Publishing is a separate user-authorized action and has not been performed. A localhost URL identifies the visitor's own computer; it is not a shareable public project link.

## Release checks still required
Open the final build in an actual browser. Check the viewport sizes and states listed in README, inspect console errors, export CSV, and capture real screenshots. Execute the supplied DAX queries in Power BI if engine-level parity is required. Local HTTP response and automated tests do not prove visual acceptance.
