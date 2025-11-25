import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const ADOTX_API_URL = 'https://guest-api.sktax.chat/v1/chat/completions';
const ADOTX_MODEL = 'ax4';
const ADOTX_API_KEY = 'sktax-XyeKFrq67ZjS4EpsDlrHHXV8it';

const adotxProxy = (): Plugin => ({
  name: 'adotx-proxy',
  configureServer(server) {
    server.middlewares.use('/api/chat', (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method Not Allowed');
        return;
      }

      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const bodyStr = Buffer.concat(chunks).toString() || '{}';
          const payload = JSON.parse(bodyStr);
          const upstreamRes = await fetch(ADOTX_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${ADOTX_API_KEY}`
            },
            body: JSON.stringify({
              model: payload.model || ADOTX_MODEL,
              messages: payload.messages || []
            })
          });

          const text = await upstreamRes.text();
          res.statusCode = upstreamRes.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(text);
        } catch (error: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'ADOTX proxy failed', message: error?.message || String(error) }));
        }
      });
    });
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      preview: {
        host: '0.0.0.0',
        port: 4173,
        allowedHosts: true,
      },
      plugins: [react(), adotxProxy()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
