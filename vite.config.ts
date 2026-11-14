import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ROBOFLOW_MODEL_ID = 'pcb-llhbp/2';

function experimentalDenominationProxy(apiKey: string) {
  return {
    name: 'peso-scan-experimental-denomination-proxy',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost');
        if (url.pathname === '/api/experimental-denomination/status' && request.method === 'GET') {
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ configured: Boolean(apiKey), model: ROBOFLOW_MODEL_ID }));
          return;
        }
        if (url.pathname !== '/api/experimental-denomination' || request.method !== 'POST') {
          next();
          return;
        }
        if (!apiKey) {
          response.statusCode = 503;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: 'Roboflow is not configured. Add ROBOFLOW_API_KEY to .env.local and restart the dev server.' }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of request) {
            const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            size += data.byteLength;
            if (size > MAX_IMAGE_BYTES * 2) {
              response.statusCode = 413;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify({ error: 'Captured image exceeds the 4 MB limit.' }));
              return;
            }
            chunks.push(data);
          }
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { image?: unknown };
          if (typeof body.image !== 'string') throw new Error('Request must contain a captured image.');
          const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(body.image);
          if (!match) throw new Error('Only captured JPEG, PNG, or WebP images are supported.');
          const imageBytes = Buffer.from(match[1], 'base64');
          if (!imageBytes.byteLength || imageBytes.byteLength > MAX_IMAGE_BYTES) {
            response.statusCode = 413;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({ error: 'Captured image exceeds the 4 MB limit.' }));
            return;
          }

          const endpoint = new URL(`https://serverless.roboflow.com/${ROBOFLOW_MODEL_ID}`);
          endpoint.searchParams.set('api_key', apiKey);
          const upstream = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: imageBytes.toString('base64'),
            signal: AbortSignal.timeout(30_000),
          });
          const result = await upstream.text();
          response.statusCode = upstream.ok ? 200 : upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status;
          response.setHeader('Content-Type', 'application/json');
          if (upstream.ok) response.end(result);
          else response.end(JSON.stringify({ error: upstream.status === 401 || upstream.status === 403
            ? 'Roboflow rejected the API key or model access.'
            : 'Roboflow could not analyze this image. Try again later.' }));
        } catch (error) {
          response.statusCode = error instanceof Error && error.name === 'TimeoutError' ? 504 : 400;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to analyze this image.' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [react(), experimentalDenominationProxy(env.ROBOFLOW_API_KEY ?? '')] };
});
