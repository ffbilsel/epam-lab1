require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRouter = require('./src/auth');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Copy .env.example to .env and set a value.');
  process.exit(1);
}

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Auth server listening on http://localhost:${port}`);
});
