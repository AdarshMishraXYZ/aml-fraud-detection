import React, { useState, useEffect } from 'react';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 10;

  useEffect(() => {
    fetch('   https://aml-fraud-detection-1.onrender.com/api/alerts')
      .then(res => res.json())
      .then(data => {
        setAlerts(data.reverse());
        setFiltered(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = alerts;
    if (filter !== 'all') {
      result = result.filter(a => a.severity === filter);
    }
    setFiltered(result);
    setPage(1);
  }, [filter, alerts]);

  const paginated = filtered.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  if (loading) return (
    <div className="page" style={{textAlign:'center', paddingTop:'100px'}}>
      <div style={{color:'#58a6ff', fontSize:'18px'}}>⏳ Loading alerts...</div>
    </div>
  );

  return (
    <div className="page">
      <h1>🚨 Alerts</h1>

      <div className="filters">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Severity</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
      </div>

      <p style={{color:'#8b949e', marginBottom:'10px', fontSize:'14px'}}>
        Showing {filtered.length} alerts
      </p>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Transaction ID</th>
            <th>Reason</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map(a => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.transaction_id}</td>
              <td>{a.reason}</td>
              <td className={a.severity === 'high' ? 'flagged' : 'suspicious'}>
                {a.severity}
              </td>
              <td>{a.status}</td>
              <td>{a.created_at ? new Date(a.created_at).toLocaleString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next →</button>
      </div>
    </div>
  );
}

export default Alerts;