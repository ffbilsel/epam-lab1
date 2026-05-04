'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { initDb } = require('./db');
const authRouter = require('./routes/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

initDb();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}`);
});
