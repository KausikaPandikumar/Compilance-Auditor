const express  = require('express');
const cors     = require('cors');
const pool     = require('./db/pool');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/upload',    require('./routes/upload'));
app.use('/api/alerts',    require('./routes/alerts'));

// ─── pg LISTEN for real-time trigger notifications ───
const { Client } = require('pg');
const listener = new Client({
  host: process.env.DB_HOST, port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER, password: process.env.DB_PASS,
});
listener.connect();
listener.query('LISTEN new_inconsistency');
listener.on('notification', (msg) => {
  console.log('[TRIGGER FIRED]', msg.payload);
  // WebSocket broadcast could go here
});

app.listen(process.env.PORT, () =>
  console.log(`Backend running on http://localhost:${process.env.PORT}`)
);