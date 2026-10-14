import { useState, useEffect } from 'react';
import { getAlerts, getMatrix, resolveAlert } from '../api';
import AlertRow from '../components/AlertRow';
// import MatrixTable from '../components/MatrixTable'; // You can extract the table to this file next!

export default function Dashboard({ shipmentId = 1 }) {
  const [alerts, setAlerts]  = useState([]);
  const [matrix, setMatrix]  = useState([]);

  const fetchData = async () => {
    const [alertsRes, matrixRes] = await Promise.all([
      getAlerts(shipmentId),
      getMatrix(shipmentId)
    ]);
    setAlerts(alertsRes.data);
    setMatrix(matrixRes.data);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [shipmentId]);

  const handleResolve = async (alertId) => {
    await resolveAlert(alertId);
    fetchData();
  };

  // Group matrix by field_name 
  const fieldMap = matrix.reduce((acc, row) => {
    if (!acc[row.field_name]) acc[row.field_name] = {};
    acc[row.field_name][row.doc_type] = row.field_value;
    return acc;
  }, {});

  const criticals = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e6ef'}}>
          <div style={{fontSize: '12px', color: '#6b7280', fontWeight: 600}}>CRITICAL MISMATCHES</div>
          <div style={{color:'#dc2626', fontSize: '24px', fontWeight: 700}}>{criticals}</div>
        </div>
        <div style={{background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e6ef'}}>
          <div style={{fontSize: '12px', color: '#6b7280', fontWeight: 600}}>TOTAL ALERTS</div>
          <div style={{color:'#111827', fontSize: '24px', fontWeight: 700}}>{alerts.length}</div>
        </div>
      </div>

      {/* Alerts Section */}
      <h3 style={{marginBottom:'12px', color: '#111827'}}>Document Inconsistencies</h3>
      {alerts.filter(a => !a.resolved).length === 0 ? (
        <div style={{padding: '24px', background: '#f0fdf4', borderRadius: '8px', color: '#16a34a', border: '1px solid #bbf7d0'}}>
          ✓ No active inconsistencies detected.
        </div>
      ) : (
        alerts.filter(a => !a.resolved).map(alert => (
          <AlertRow 
            key={alert.id} 
            alert={alert} 
            handleResolve={handleResolve} 
            fieldMap={fieldMap} 
          />
        ))
      )}

      {/* Matrix Table Section */}
      <h3 style={{ marginTop: '32px', marginBottom: '12px', color: '#111827' }}>Cross-Reference Matrix</h3>
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e6ef', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e2e6ef' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>Field Name</th>
              <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>Invoice</th>
              <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>Packing List</th>
              <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>Bill of Lading</th>
              <th style={{ padding: '12px 16px', color: '#6b7280', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(fieldMap).length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                  No fields extracted yet. Upload documents to generate matrix.
                </td>
              </tr>
            ) : (
              Object.entries(fieldMap).map(([field, docs]) => {
                const inv = docs['invoice'] || '—';
                const pl = docs['packing_list'] || '—';
                const bol = docs['bill_of_lading'] || '—';
                
                // Determine if there's a mismatch
                const values = [inv, pl, bol].filter(v => v !== '—');
                const isMatch = values.every(v => v === values[0]);

                return (
                  <tr key={field} style={{ borderBottom: '1px solid #e2e6ef', background: isMatch ? '#fff' : '#fef2f2' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                      {field.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td style={{ padding: '12px 16px', color: inv === '—' ? '#9ca3af' : '#111827' }}>{inv}</td>
                    <td style={{ padding: '12px 16px', color: pl === '—' ? '#9ca3af' : '#111827' }}>{pl}</td>
                    <td style={{ padding: '12px 16px', color: bol === '—' ? '#9ca3af' : '#111827' }}>{bol}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: isMatch ? '#dcfce7' : '#fee2e2',
                        color: isMatch ? '#166534' : '#991b1b'
                      }}>
                        {isMatch ? 'Match' : 'Mismatch'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}