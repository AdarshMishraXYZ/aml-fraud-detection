import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function TransactionDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`   https://aml-fraud-detection-1.onrender.com/api/transactions/${id}/detail`)
      .then(res => res.json())
      .then(data => {
        setDetail(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="page">
      <div style={{textAlign:'center', padding:'50px', color:'#8b949e'}}>
        ⏳ Loading investigation...
      </div>
    </div>
  );

  if (detail.error) return (
    <div className="page">
      <h2>Transaction not found</h2>
    </div>
  );

  const t = detail.transaction;
  const shap = detail.shap_explanation;
  const anomaly = detail.anomaly_detection;
  const network = detail.sender_network;

  const statusColor = {
    flagged: '#f85149',
    suspicious: '#e3b341',
    clean: '#3fb950',
    review: '#58a6ff'
  };

  return (
    <div className="page">
      <button onClick={() => window.history.back()}
        style={{background:'#21262d', color:'#e6edf3', border:'1px solid #30363d', padding:'8px 16px', borderRadius:'6px', cursor:'pointer', marginBottom:'20px', fontSize:'14px'}}>
        ← Back to Transactions
      </button>

      <h1>🔍 Transaction #{t.id} Investigation</h1>

      <div className="cards">
        <div className="card" style={{borderTopColor: statusColor[t.status] || '#58a6ff'}}>
          <h3>Status</h3>
          <p style={{fontSize:'18px', color: statusColor[t.status]}}>{t.status?.toUpperCase()}</p>
        </div>
        <div className="card">
          <h3>Amount</h3>
          <p style={{fontSize:'18px'}}>₹{t.amount?.toLocaleString()}</p>
        </div>
        <div className="card red">
          <h3>ML Risk</h3>
          <p style={{fontSize:'18px'}}>{t.ml_fraud_probability ? t.ml_fraud_probability + '%' : 'N/A'}</p>
        </div>
        <div className={`card ${anomaly.is_anomaly ? 'red' : 'green'}`}>
          <h3>Anomaly</h3>
          <p style={{fontSize:'18px'}}>{anomaly.is_anomaly ? '⚠️ YES' : '✅ NO'}</p>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginTop:'20px'}}>
        
        <div style={{background:'#161b22', padding:'20px', borderRadius:'10px', border:'1px solid #21262d'}}>
          <h2 style={{background:'none', border:'none', padding:'0', marginBottom:'15px', color:'#58a6ff', fontSize:'15px'}}>
            📋 Transaction Details
          </h2>
          <table style={{marginBottom:'0'}}>
            <tbody>
              <tr><td style={{color:'#8b949e', width:'40%'}}>Sender</td><td style={{fontWeight:'600'}}>{t.sender}</td></tr>
              <tr><td style={{color:'#8b949e'}}>Receiver</td><td style={{fontWeight:'600'}}>{t.receiver}</td></tr>
              <tr><td style={{color:'#8b949e'}}>Amount</td><td style={{fontWeight:'600'}}>₹{t.amount?.toLocaleString()}</td></tr>
              <tr><td style={{color:'#8b949e'}}>Status</td><td className={t.status}>{t.status}</td></tr>
              <tr><td style={{color:'#8b949e'}}>Date</td><td>{t.created_at}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{background:'#161b22', padding:'20px', borderRadius:'10px', border:'1px solid #21262d'}}>
          <h2 style={{background:'none', border:'none', padding:'0', marginBottom:'15px', color:'#58a6ff', fontSize:'15px'}}>
            🧠 SHAP Explanation
          </h2>
          <p style={{color:'#8b949e', marginBottom:'15px', fontSize:'13px'}}>{shap.interpretation}</p>
          {Object.entries(shap.shap_values || {}).map(([key, value]) => (
            <div key={key} style={{marginBottom:'12px'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                <span style={{fontSize:'13px', color:'#c9d1d9'}}>{key.replace(/_/g, ' ')}</span>
                <span style={{fontSize:'13px', fontWeight:'600', color: value > 0 ? '#f85149' : '#3fb950'}}>
                  {value > 0 ? '+' : ''}{value}
                </span>
              </div>
              <div style={{background:'#21262d', borderRadius:'4px', height:'6px'}}>
                <div style={{
                  background: value > 0 ? '#f85149' : '#3fb950',
                  width: `${Math.min(Math.abs(value) * 300, 100)}%`,
                  height:'6px', borderRadius:'4px',
                  transition: 'width 0.5s'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:'#161b22', padding:'20px', borderRadius:'10px', marginTop:'20px', border:'1px solid #21262d'}}>
        <h2 style={{background:'none', border:'none', padding:'0', marginBottom:'15px', color:'#58a6ff', fontSize:'15px'}}>
          🔗 Sender Network ({network.length} connections)
        </h2>
        {network.length === 0 ? (
          <p style={{color:'#8b949e'}}>No network connections found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {network.map((n, i) => (
                <tr key={i}>
                  <td>{n.sender}</td>
                  <td>{n.receiver}</td>
                  <td>₹{n.amount?.toLocaleString()}</td>
                  <td className={n.status}>{n.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TransactionDetail;