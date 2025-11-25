import { build } from 'vite';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = Number(process.env.PORT) || 4173;
const ADOTX_API_URL = process.env.ADOTX_API_URL || process.env.VITE_ADOTX_API_URL || 'https://guest-api.sktax.chat/v1/chat/completions';
const ADOTX_API_KEY = process.env.ADOTX_API_KEY || process.env.VITE_ADOTX_API_KEY || 'sktax-XyeKFrq67ZjS4EpsDlrHHXV8it';
const ADOTX_MODEL = process.env.ADOTX_MODEL || process.env.VITE_ADOTX_MODEL || 'ax4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

if (!process.env.SKIP_BUILD) {
  console.log('[build] creating production bundle...');
  await build();
  console.log('[build] complete.');
}

const app = express();
app.use(express.json({ limit: '1mb' }));

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
};

app.options('/api/chat', (req, res) => {
  setCors(res);
  res.status(204).end();
});

app.post('/api/chat', async (req, res) => {
  setCors(res);
  try {
    const upstream = await fetch(ADOTX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADOTX_API_KEY}`,
      },
      body: JSON.stringify({
        model: req.body?.model || ADOTX_MODEL,
        messages: req.body?.messages || [],
      }),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    console.error('[proxy] ADOTX call failed', error);
    res.status(500).json({ error: 'ADOTX proxy failed', message: error?.message || String(error) });
  }
});

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`[server] listening on http://0.0.0.0:${PORT}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
