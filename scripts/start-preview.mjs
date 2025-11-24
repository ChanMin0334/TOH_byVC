import { preview } from 'vite';

const port = Number(process.env.PORT) || 4173;

const server = await preview({
  preview: {
    port,
    host: '0.0.0.0',
  },
});

const logUrl = server.resolvedUrls?.network?.[0] ?? `http://0.0.0.0:${port}`;
console.log(`[vite] preview server listening on ${logUrl}`);

const shutdown = () => {
  if (server.httpServer) {
    server.httpServer.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
