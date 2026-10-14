const express = require('express');
const pool    = require('../db/pool');
const router  = express.Router();

// GET /api/alerts?shipment_id=1
router.get('/', async (req, res) => {
  const { shipment_id } = req.query;
  const result = await pool.query(
    `SELECT i.*, da.doc_type AS doc_a_type, db2.doc_type AS doc_b_type
     FROM inconsistencies i
     JOIN documents da ON da.id = i.doc_a_id
     JOIN documents db2 ON db2.id = i.doc_b_id
     WHERE i.shipment_id = $1
     ORDER BY
       CASE i.severity WHEN 'critical' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       i.detected_at DESC`,
    [shipment_id]
  );
  res.json(result.rows);
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req, res) => {
  await pool.query(
    `UPDATE inconsistencies SET resolved=TRUE WHERE id=$1`, [req.params.id]
  );
  res.json({ success: true });
});

module.exports = router;