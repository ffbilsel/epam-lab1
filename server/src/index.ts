import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { authRouter } from './auth.routes';
import { fail } from './http';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: false,
  })
);
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => res.json({ success: true, data: { ok: true } }));
app.use('/api/auth', authRouter);

// 404
app.use((req, res) => fail(res, 404, 'NOT_FOUND', `Route not found: ${req.method} ${req.path}`));

// Final safety net.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('[server] unhandled', err);
  fail(res, 500, 'SERVER_ERROR', 'Something went wrong. Please try again.');
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${config.port}`);
});
