const express = require('express');
const pool    = require('../db/pool');
const router  = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM v_shipment_summary ORDER BY id DESC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { shipment_no, origin, destination } = req.body;
  const result = await pool.query(
    `INSERT INTO shipments (shipment_no, origin, destination) VALUES ($1,$2,$3) RETURNING *`,
    [shipment_no, origin, destination]
  );
  res.json(result.rows[0]);
});

// Cross-reference matrix for one shipment
router.get('/:id/matrix', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM v_field_matrix WHERE shipment_id=$1`, [req.params.id]
  );
  res.json(result.rows);
});

module.exports = router;