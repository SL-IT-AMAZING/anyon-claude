import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    react({
      // Enable Fast Refresh for instant component updates
      fastRefresh: true,
      // Include .tsx and .jsx files
      include: "**/*.{jsx,tsx}",
    }),
    tailwindcss(),
  ],

  // Path resolution
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : {
          // Enable HMR for local development
          overlay: true,
        },
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
      // Enable aggressive file watching
      usePolling: false, // Use native file system events (faster)
      interval: 100, // Check for changes every 100ms
    },
    // Force cache clearing on startup in development
    force: true,
  },

  // Aggressive cache busting for development
  cacheDir: "node_modules/.vite",
  optimizeDeps: {
    // Force re-optimization on every restart in dev mode
    force: true,
    // Include dependencies that should be optimized
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tauri-apps/api",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },

  // Development-specific settings
  esbuild: {
    // Preserve JSX for faster rebuilds in dev
    jsx: "automatic",
    // Faster builds
    logLevel: "error",
  },

  // Build configuration for code splitting
  build: {
    // Increase chunk size warning limit to 2000 KB
    chunkSizeWarningLimit: 2000,
    // Add unique hash to filenames for better cache busting
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-tooltip', '@radix-ui/react-switch', '@radix-ui/react-popover'],
          'editor-vendor': ['@uiw/react-md-editor'],
          'syntax-vendor': ['react-syntax-highlighter'],
          // Tauri and other utilities
          'tauri': ['@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-shell'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
        // Add hash to chunk names for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
}));
