Project stack: TypeScript + React 18 (functional components, hooks), Vite, Tailwind-style utility classes, lucide-react icons, Zustand stores, contexts for tabs/theme/projects, and Tauri integration via api/apiAdapter (web-mode fallback). Routing uses hash router with custom in-app navigation for projects.

Conventions:
- Use functional components with hooks for state/effects; prefer context hooks (`useTabContext`, `useProjectsNavigation`, `useProjects`, etc.) over ad-hoc props when available.
- Keep project data in the shared ProjectsContext to avoid stale state; prefer provided navigation helpers for project/workspace flows.
- Styling via utility classNames (`className` strings) and `cn` helper; minimal bespoke CSS. Icons from lucide-react.
- Lazy-load heavy views with React.lazy + Suspense fallbacks; respect existing loading/error handling patterns.
- API calls go through `api` wrapper (tauri invoke + REST fallback); avoid direct fetch/invoke.
- Keep code comments concise and only where logic isn’t obvious; default to ASCII.