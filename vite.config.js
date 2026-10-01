// Static multi-page site: Vite is used only as a fast dev server / preview server.
// Every .html file in this folder is served as-is (index.html, services.html, ...).
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, host: true },
  preview: { port: 4173, host: true },
});
