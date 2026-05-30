import React, { useState, useEffect } from 'react';

const API = 'https://aml-fraud-detection.onrender.com';

function ReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/graph/full-report`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="page">
      <h2 style={{ color: '#aaa' }}>⏳ Loading Fraud Report...</h2>
    </div>
  );

  if (error) return (
    <div className="page">
      <h2 style={{ color: '#f85149' }}>⚠️ Failed to load report</h2>
      <p style={{ color: '#aaa' }}>{error}</p>
      <button onClick={() => window.location.reload()}
        style={{ padding: '10px 20px', background: '#e94560', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  );

  const circular = report.circular_transactions || [];
  const mules = report.mule_accounts || [];
  const layering = report.layering_detected || [];
  const summary = report.summary || { circular_rings: 0, mule_accounts: 0, layering_chains: 0, total_patterns: 0 };

  const neo4jOffline = summary.total_patterns === 0 && !report.neo4j_connected;

  return (
    <div className="page">
      <h1 style={{ color: '#e94560' }}>🔍 Fraud Analysis Report</h1>

      {/* Neo4j offline warning */}
      {neo4jOffline && (
        <div style={{
          background: 'rgba(227,179,65,0.1)', border: '1px solid #e3b341',
          borderRadius: '8px', padding: '15px', marginBottom: '20px'
        }}>
          <p style={{ color: '#e3b341', margin: 0 }}>
            ⚠️ <strong>Graph database (Neo4j) is not connected.</strong> Run the simulator to generate
            transactions — circular rings, mule accounts and layering chains will appear here
            once enough flagged transactions exist. Neo4j requires a paid plan on Render.
            <br /><br />
            <strong>To enable:</strong> Set <code>NEO4J_URI</code>, <code>NEO4J_USERNAME</code>,
            <code>NEO4J_PASSWORD</code> in your Render environment variables pointing to a
            Neo4j Aura free instance (<a href="https://neo4j.com/cloud/aura-free/" target="_blank"
            rel="noreferrer" style={{ color: '#58a6ff' }}>neo4j.com/cloud/aura-free</a>).
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="cards">
        <div className="card red">
          <h3>CIRCULAR RINGS</h3>
          <p>{summary.circular_rings}</p>
        </div>
        <div className="card yellow">
          <h3>MULE ACCOUNTS</h3>
          <p>{summary.mule_accounts}</p>
        </div>
        <div className="card blue">
          <h3>LAYERING CHAINS</h3>
          <p>{summary.layering_chains}</p>
        </div>
        <div className="card">
          <h3>TOTAL PATTERNS</h3>
          <p>{summary.total_patterns}</p>
        </div>
      </div>

      {/* Circular Fraud Rings */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ borderLeft: '4px solid #f85149', paddingLeft: '12px' }}>
          🔴 Circular Fraud Rings
        </h2>
        <table>
          <thead>
            <tr>
              <th>PERSON 1</th><th>PERSON 2</th><th>PERSON 3</th>
              <th>AMOUNT 1</th><th>AMOUNT 2</th><th>AMOUNT 3</th>
            </tr>
          </thead>
          <tbody>
            {circular.length === 0 ? (
              <tr><td colSpan="6" style={{ color: '#666', textAlign: 'center' }}>
                No circular rings detected yet
              </td></tr>
            ) : circular.map((c, i) => (
              <tr key={i}>
                <td className="flagged">{c.person1}</td>
                <td className="flagged">{c.person2}</td>
                <td className="flagged">{c.person3}</td>
                <td>₹{Number(c.amount1).toLocaleString()}</td>
                <td>₹{Number(c.amount2).toLocaleString()}</td>
                <td>₹{Number(c.amount3).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mule Accounts */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ borderLeft: '4px solid #e3b341', paddingLeft: '12px' }}>
          🟡 Mule Accounts
        </h2>
        <table>
          <thead>
            <tr>
              <th>ACCOUNT</th><th>NUMBER OF SENDERS</th><th>TOTAL RECEIVED</th>
            </tr>
          </thead>
          <tbody>
            {mules.length === 0 ? (
              <tr><td colSpan="3" style={{ color: '#666', textAlign: 'center' }}>
                No mule accounts detected yet
              </td></tr>
            ) : mules.map((m, i) => (
              <tr key={i}>
                <td className="suspicious">{m.mule_account}</td>
                <td>{m.number_of_senders}</td>
                <td>₹{Number(m.total_amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Layering Chains */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ borderLeft: '4px solid #58a6ff', paddingLeft: '12px' }}>
          🔵 Layering Chains
        </h2>
        <table>
          <thead>
            <tr>
              <th>ORIGIN</th><th>HOP 1</th><th>HOP 2</th><th>HOP 3</th><th>DESTINATION</th>
            </tr>
          </thead>
          <tbody>
            {layering.length === 0 ? (
              <tr><td colSpan="5" style={{ color: '#666', textAlign: 'center' }}>
                No layering chains detected yet
              </td></tr>
            ) : layering.map((l, i) => (
              <tr key={i}>
                <td className="flagged">{l.origin}</td>
                <td>{l.hop1}</td>
                <td>{l.hop2}</td>
                <td>{l.hop3}</td>
                <td className="flagged">{l.destination}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <br />
      <button onClick={() => window.location.href = '/'}
        style={{ padding: '10px 20px', background: '#e94560', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default ReportPage;