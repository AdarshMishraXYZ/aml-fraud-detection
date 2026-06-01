import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "https://aml-fraud-detection.onrender.com";

function SuspectProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [network, setNetwork] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(API + "/api/transactions").then(r => r.json()),
      fetch(API + "/api/graph/network/" + encodeURIComponent(name)).then(r => r.json()),
      fetch(API + "/api/graph/full-report").then(r => r.json())
    ]).then(([allTx, net, rep]) => {
      const personTx = Array.isArray(allTx) ? allTx.filter(t => t.sender === name || t.receiver === name) : [];
      setTransactions(personTx);
      setNetwork(net.transactions || []);
      setReport(rep);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [name]);

  if (loading) return <div className="page"><h2 style={{color:"#aaa"}}>Loading suspect profile...</h2></div>;

  const sent = transactions.filter(t => t.sender === name);
  const received = transactions.filter(t => t.receiver === name);
  const totalSent = sent.reduce((s, t) => s + t.amount, 0);
  const totalReceived = received.reduce((s, t) => s + t.amount, 0);
  const flaggedTx = transactions.filter(t => t.status === "flagged" || t.status === "suspicious");
  const riskScore = transactions.length > 0 ? Math.round((flaggedTx.length / transactions.length) * 100) : 0;
  const riskLevel = riskScore >= 60 ? "CRITICAL" : riskScore >= 30 ? "HIGH" : riskScore >= 10 ? "MEDIUM" : "LOW";
  const riskColor = riskScore >= 60 ? "#f85149" : riskScore >= 30 ? "#e94560" : riskScore >= 10 ? "#e3b341" : "#3fb950";

  const circular = (report && report.circular_transactions || []).filter(c => c.person1 === name || c.person2 === name || c.person3 === name);
  const mules = (report && report.mule_accounts || []).filter(m => m.mule_account === name);
  const layering = (report && report.layering_detected || []).filter(l => l.origin === name || l.destination === name || l.hop1 === name || l.hop2 === name || l.hop3 === name);

  const statusColor = s => ({flagged:"#f85149",suspicious:"#e3b341",review:"#58a6ff",clean:"#3fb950"}[s] || "#aaa");

  return (
    <div className="page">
      <button onClick={() => navigate(-1)} style={{background:"#21262d",color:"white",border:"1px solid #30363d",borderRadius:"6px",padding:"8px 16px",cursor:"pointer",marginBottom:"20px",fontSize:"14px"}}>
        Back
      </button>

      <div style={{display:"flex",alignItems:"center",gap:"15px",marginBottom:"20px"}}>
        <div style={{width:"60px",height:"60px",borderRadius:"50%",background:riskColor+"33",border:"2px solid "+riskColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px"}}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{margin:0,color:"white"}}>{name}</h1>
          <span style={{background:riskColor+"22",color:riskColor,padding:"3px 10px",borderRadius:"12px",fontSize:"12px",fontWeight:"bold"}}>{riskLevel} RISK</span>
        </div>
      </div>

      <div className="cards">
        <div className="card"><h3>TOTAL TX</h3><p>{transactions.length}</p></div>
        <div className="card red"><h3>FLAGGED</h3><p>{flaggedTx.length}</p></div>
        <div className="card green"><h3>TOTAL SENT</h3><p style={{fontSize:"16px"}}>Rs{totalSent.toLocaleString()}</p></div>
        <div className="card blue"><h3>TOTAL RECEIVED</h3><p style={{fontSize:"16px"}}>Rs{totalReceived.toLocaleString()}</p></div>
      </div>

      {(circular.length > 0 || mules.length > 0 || layering.length > 0) && (
        <div style={{marginTop:"20px",background:"rgba(248,81,73,0.1)",border:"1px solid #f85149",borderRadius:"8px",padding:"16px"}}>
          <h2 style={{color:"#f85149",marginTop:0}}>Fraud Patterns Detected</h2>
          {circular.map((c,i) => (
            <div key={i} style={{marginBottom:"8px",color:"#ccc",fontSize:"13px"}}>
              <span style={{color:"#f85149",fontWeight:"bold"}}>Circular Ring: </span>
              {c.person1} Rs{Number(c.amount1).toLocaleString()} {c.person2} Rs{Number(c.amount2).toLocaleString()} {c.person3} Rs{Number(c.amount3).toLocaleString()} {c.person1}
            </div>
          ))}
          {mules.map((m,i) => (
            <div key={i} style={{marginBottom:"8px",color:"#ccc",fontSize:"13px"}}>
              <span style={{color:"#e3b341",fontWeight:"bold"}}>Mule Account: </span>
              Received from {m.number_of_senders} senders, total Rs{Number(m.total_amount).toLocaleString()}
            </div>
          ))}
          {layering.map((l,i) => (
            <div key={i} style={{marginBottom:"8px",color:"#ccc",fontSize:"13px"}}>
              <span style={{color:"#58a6ff",fontWeight:"bold"}}>Layering Chain: </span>
              {l.origin} {l.hop1} {l.hop2} {l.hop3} {l.destination}
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:"20px"}}>
        <h2 style={{borderLeft:"4px solid #e94560",paddingLeft:"12px"}}>Transaction History</h2>
        <table>
          <thead>
            <tr><th>ID</th><th>TYPE</th><th>COUNTERPARTY</th><th>AMOUNT</th><th>STATUS</th><th>ML RISK</th></tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan="6" style={{color:"#666",textAlign:"center"}}>No transactions found</td></tr>
            ) : [...transactions].reverse().map((t,i) => (
              <tr key={i}>
                <td>{t.id}</td>
                <td><span style={{color: t.sender===name ? "#f85149":"#3fb950",fontWeight:"bold"}}>{t.sender===name ? "SENT":"RECEIVED"}</span></td>
                <td style={{color:"#58a6ff",cursor:"pointer"}} onClick={() => navigate("/suspect/" + (t.sender===name ? t.receiver : t.sender))}>
                  {t.sender===name ? t.receiver : t.sender}
                </td>
                <td>Rs{Number(t.amount).toLocaleString()}</td>
                <td><span style={{color:statusColor(t.status)}}>{t.status}</span></td>
                <td>{t.ml_fraud_probability != null ? t.ml_fraud_probability+"%" : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SuspectProfile;