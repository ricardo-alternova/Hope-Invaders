import { defineConfig, type Plugin } from 'vitest/config';

function hopeSlugs(): Plugin {
  const rewrite = (url?: string) => {
    const path = url?.split('?')[0];
    if (path === '/art' || path === '/art/') return '/art.html';
    if (path === '/mechanics' || path === '/mechanics/') return '/mechanics.html';
    return url;
  };
  const middleware = (req: { url?: string }, _res: unknown, next: () => void) => {
    req.url = rewrite(req.url);
    next();
  };
  return {
    name: 'hope-slugs',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  base: './',
  appType: 'mpa',
  plugins: [hopeSlugs()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        art: 'art.html',
        mechanics: 'mechanics.html',
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
