Before handing off work:
- Run `npm run check` for TS + Rust checks when touching TypeScript/Rust; run `npm run build` (or `npm run build:bun`) if build-related changes were made.
- For UI/flow changes, manually verify project selection → workspace navigation (list → selector → mvp/maintenance) because many screens rely on shared project state and lazy loading.
- If dev servers act up, use `npm run kill:servers` then restart with `npm run tauri dev`; clear caches via `npm run clean:cache` if HMR seems stale.
- Avoid running duplicate Vite/Tauri processes (don’t run `npm run dev` alongside `npm run tauri dev`).