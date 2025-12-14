Key commands for the anyon/opcode project (React + Tauri desktop/web app).

- Dev (desktop, preferred): `npm run tauri dev` (starts Tauri and Vite automatically). Faster alternative: `npm run tauri:bun` or `bun run tauri:bun`.
- Dev (frontend/server only): `npm run dev` (Vite + server concurrently) or `npm run dev:frontend` / `npm run dev:backend` individually.
- Cleanup: `npm run clean:cache` to clear Vite caches; `npm run dev:clean` to clean then start dev; `npm run kill:servers` to stop stray dev processes.
- Build: `npm run build` (tsc + Vite); `npm run build:bun` for Bun; `npm run preview` to serve a built bundle.
- Checks: `npm run check` (tsc --noEmit + Cargo check in src-tauri).
- Installers (Windows): run `./download-portable-deps.ps1` then `./build-installer.ps1` per QUICK_START.md when needed.