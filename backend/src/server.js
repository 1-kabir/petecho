import express from 'express';
import { db } from './db.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  db.get('SELECT COUNT(*) AS count FROM healthcheck', (_error, row) => {
    res.json({
      ok: true,
      database: 'sqlite',
      rows: row?.count ?? 0,
    });
  });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
