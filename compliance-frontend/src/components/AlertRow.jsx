import React from 'react';

export default function AlertRow({ alert, handleResolve, fieldMap }) {
  // Try to find the document numbers for context from the fieldMap (matrix data)
  const invoiceNo = fieldMap['invoice_number']?.['invoice'] || 'Unknown Inv';
  const bolNo = fieldMap['bill_of_lading']?.['bill_of_lading'] || 'Unknown B/L';

  // Determine colors based on severity
  const severityColors = {
    critical: '#dc2626',
    medium: '#d97706',
    low: '#16a34a'
  };
  const color = severityColors[alert.severity] || '#8a91a0';

  return (
    <div style={{ background:'#fff', border:'1px solid #e2e6ef', borderRadius:'8px', padding:'12px 16px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'12px' }}>
      <span style={{ color: color, fontWeight:700, fontSize:'11px', textTransform:'uppercase', minWidth: '70px' }}>
        {alert.severity}
      </span>
      
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:'14px', color:'#111827'}}>
          Mismatch in {alert.field_name.replace(/_/g,' ').toUpperCase()}
        </div>
        <div style={{fontSize:'12px',color:'#4b5563', marginTop: '4px'}}>
          <span style={{fontWeight: 600}}>{alert.doc_a_type.replace(/_/g,' ')}</span> ({alert.doc_a_type === 'invoice' ? invoiceNo : bolNo}) reported 
          <span style={{color: '#dc2626', fontWeight: 600, marginLeft: '4px'}}>{alert.doc_a_value}</span>
        </div>
        <div style={{fontSize:'12px',color:'#4b5563', marginTop: '2px'}}>
          <span style={{fontWeight: 600}}>{alert.doc_b_type.replace(/_/g,' ')}</span> ({alert.doc_b_type === 'invoice' ? invoiceNo : bolNo}) reported 
          <span style={{color: '#dc2626', fontWeight: 600, marginLeft: '4px'}}>{alert.doc_b_value}</span>
        </div>
      </div>

      <button 
        onClick={() => handleResolve(alert.id)} 
        style={{padding:'6px 14px', borderRadius:'6px', border:'1px solid #e2e6ef', background: '#f9fafb', cursor:'pointer', fontSize:'12px', fontWeight: 600, color: '#374151'}}
      >
        Resolve
      </button>
    </div>
  );
}