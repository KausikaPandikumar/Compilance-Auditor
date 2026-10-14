const express = require('express');
const multer  = require('multer');
const pool    = require('../db/pool');
const parser  = require('../services/parser');
const router  = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  const { shipment_id, doc_type } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  if (!shipment_id) return res.status(400).json({ error: 'shipment_id is required' });
  if (!doc_type) return res.status(400).json({ error: 'doc_type is required' });

  try {
    // 1. Save document record
    const docResult = await pool.query(
      `INSERT INTO documents (shipment_id, doc_type, file_name, file_path)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [shipment_id, doc_type, file.originalname, file.path]
    );
    const doc_id = docResult.rows[0].id;

    // 2. Extract fields via Gemini
    const fields = await parser.extractFields(file.path, doc_type);

    let fieldsExtractedCount = 0;
    if (fields && typeof fields === 'object') {
      const insertPromises = [];
      
      for (const [field_name, field_value] of Object.entries(fields)) {
        if (field_value !== null && field_value !== undefined && field_value !== '') {
          insertPromises.push(
            pool.query(
              `INSERT INTO extracted_fields (document_id, shipment_id, field_name, field_value)
               VALUES ($1,$2,$3,$4)`,
              [doc_id, shipment_id, field_name, String(field_value)]
            )
          );
        }
      }
      await Promise.all(insertPromises);
      fieldsExtractedCount = insertPromises.length;

      // 3. DBMS CONCEPT: THE TRIGGER
      // Now that the data is saved, cross-reference it against existing documents
      await runCrossCheckTrigger(shipment_id, doc_id, fields);
    }

    // 4. Mark document parsed
    // Make sure your `documents` table has a `parse_status` column, or remove this query.
    await pool.query(
      `UPDATE documents SET parse_status='parsed' WHERE id=$1`, [doc_id]
    );

    res.json({ success: true, doc_id, fields_extracted: fieldsExtractedCount });
  } catch (err) {
    console.error("Upload Route Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// The core comparison engine
async function runCrossCheckTrigger(shipmentId, newDocId, newFields) {
  // Get all fields from OTHER documents in this same shipment
  const existing = await pool.query(
    `SELECT ef.document_id, d.doc_type, ef.field_name, ef.field_value
     FROM extracted_fields ef
     JOIN documents d ON d.id = ef.document_id
     WHERE ef.shipment_id = $1 AND ef.document_id != $2`,
    [shipmentId, newDocId]
  );

  for (const row of existing.rows) {
    const newValue = newFields[row.field_name];
    
    // If the new document has the exact same field name as an older document
    if (newValue !== undefined && newValue !== null) {
      
      // Compare them. If they mismatch, create an alert!
      if (String(newValue).trim() !== String(row.field_value).trim()) {
        
        // Prevent duplicate alerts for the exact same mismatch
        const dupCheck = await pool.query(
          `SELECT id FROM inconsistencies
           WHERE shipment_id=$1 AND field_name=$2 AND doc_a_value=$3 AND doc_b_value=$4 AND resolved=FALSE`,
          [shipmentId, row.field_name, String(newValue), String(row.field_value)]
        );

        if (dupCheck.rowCount === 0) {
          await pool.query(
            `INSERT INTO inconsistencies (shipment_id, doc_a_id, doc_b_id, field_name, doc_a_value, doc_b_value, severity)
             VALUES ($1, $2, $3, $4, $5, $6, 'critical')`,
            [shipmentId, newDocId, row.document_id, row.field_name, String(newValue), String(row.field_value)]
          );
        }
      }
    }
  }
}

module.exports = router;