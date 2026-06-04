import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function TransactionDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://aml-fraud-detection.onrender.com/api/transactions/${id}/detail`)
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
  const graph = detail.graph_intelligence || {};
  const combinedRisk = Math.min(100, (t.ml_fraud_probability || 0) * 0.4 + (graph.graph_risk_score || 0));
  const riskLevel = combinedRisk >= 75 ? "CRITICAL" : combinedRisk >= 50 ? "HIGH" : combinedRisk >= 25 ? "MEDIUM" : "LOW";
  const riskColor = combinedRisk >= 75 ? "#f85149" : combinedRisk >= 50 ? "#e94560" : combinedRisk >= 25 ? "#e3b341" : "#3fb950";

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
        <div className="card" style={{borderTopColor: riskColor}}>
          <h3>COMBINED RISK</h3>
          <p style={{fontSize:"16px", color: riskColor}}>{Math.round(combinedRisk)}% {riskLevel}</p>
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


      <div style={{background: (graph.graph_risk_score||0) > 0 ? 'rgba(248,81,73,0.05)' : 'rgba(63,185,80,0.05)', padding:'20px', borderRadius:'10px', marginTop:'20px', border: (graph.graph_risk_score||0) > 0 ? '1px solid #f85149' : '1px solid #3fb950'}}>
        <h2 style={{margin:'0 0 15px 0', color: (graph.graph_risk_score||0) > 0 ? '#f85149' : '#3fb950', fontSize:'15px'}}>
          Graph Intelligence Score: {graph.graph_risk_score||0}/100
        </h2>
        <div style={{display:'flex',gap:'15px',marginBottom:'15px',flexWrap:'wrap'}}>
          <div style={{background:graph.sender_in_circular_ring?'rgba(248,81,73,0.2)':'rgba(63,185,80,0.1)',padding:'10px 15px',borderRadius:'8px',border:graph.sender_in_circular_ring?'1px solid #f85149':'1px solid #3fb950'}}>
            <p style={{margin:0,fontSize:'12px',color:'#aaa'}}>Circular Ring</p>
            <p style={{margin:0,fontWeight:'bold',color:graph.sender_in_circular_ring?'#f85149':'#3fb950'}}>{graph.sender_in_circular_ring?'YES':'NO'}</p>
          </div>
          <div style={{background:graph.receiver_is_mule?'rgba(248,81,73,0.2)':'rgba(63,185,80,0.1)',padding:'10px 15px',borderRadius:'8px',border:graph.receiver_is_mule?'1px solid #f85149':'1px solid #3fb950'}}>
            <p style={{margin:0,fontSize:'12px',color:'#aaa'}}>Mule Receiver</p>
            <p style={{margin:0,fontWeight:'bold',color:graph.receiver_is_mule?'#f85149':'#3fb950'}}>{graph.receiver_is_mule?'YES':'NO'}</p>
          </div>
          <div style={{background:graph.in_layering_chain?'rgba(248,81,73,0.2)':'rgba(63,185,80,0.1)',padding:'10px 15px',borderRadius:'8px',border:graph.in_layering_chain?'1px solid #f85149':'1px solid #3fb950'}}>
            <p style={{margin:0,fontSize:'12px',color:'#aaa'}}>Layering Chain</p>
            <p style={{margin:0,fontWeight:'bold',color:graph.in_layering_chain?'#f85149':'#3fb950'}}>{graph.in_layering_chain?'YES':'NO'}</p>
          </div>
        </div>
        {graph.graph_flags&&graph.graph_flags.length>0&&(
          <div style={{background:'rgba(248,81,73,0.1)',borderRadius:'6px',padding:'10px'}}>
            {graph.graph_flags.map((flag,i)=><p key={i} style={{margin:'4px 0',color:'#f85149',fontSize:'13px'}}>Warning: {flag}</p>)}
          </div>
        )}
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