import { useState } from 'react';
import { uploadDoc } from '../api';

const DOC_TYPES = ['invoice','packing_list','bill_of_lading','certificate_of_origin','customs_declaration'];

export default function Upload({ shipmentId = 1 }) {
  const [file, setFile]       = useState(null);
  const [docType, setDocType] = useState('invoice');
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('shipment_id', shipmentId);
    fd.append('doc_type', docType);
    try {
      const res = await uploadDoc(fd);
      setStatus(`✓ Uploaded! ${res.data.fields_extracted} fields extracted. Trigger ran.`);
      setFile(null);
    } catch (err) {
      setStatus('✗ Upload failed: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '24px' }}>Upload Document</h2>
      <select value={docType} onChange={e => setDocType(e.target.value)}
        style={{ width:'100%', padding:'10px', marginBottom:'12px', borderRadius:'6px', border:'1px solid #e2e6ef' }}>
        {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
      </select>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
        style={{ border:'2px dashed #c8cedd', borderRadius:'8px', padding:'40px', textAlign:'center', cursor:'pointer', background:'#f7f8fa', marginBottom:'16px' }}
        onClick={() => document.getElementById('file-in').click()}
      >
        {file ? <span style={{color:'#1a56db',fontWeight:600}}>{file.name}</span> : <span style={{color:'#8a91a0'}}>Drop PDF here or click to browse</span>}
      </div>
      <input id="file-in" type="file" accept=".pdf,.xlsx,.png,.jpg" hidden onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={loading || !file}
        style={{ width:'100%', padding:'12px', background:'#1a56db', color:'#fff', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>
        {loading ? 'Processing...' : 'Upload & Extract Fields'}
      </button>
      {status && <div style={{ marginTop:'12px', padding:'12px', background:'#f0fdf4', borderRadius:'6px', fontSize:'13px', color:'#16a34a' }}>{status}</div>}
    </div>
  );
}