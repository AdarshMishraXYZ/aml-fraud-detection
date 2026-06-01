import React, { useState } from "react";

const API = "https://aml-fraud-detection.onrender.com";

function Simulator() {
  const [total, setTotal] = useState(100);
  const [fraudRatio, setFraudRatio] = useState(0.3);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const role = localStorage.getItem("role");

  if (role !== "admin") {
    return (
      <div className="page">
        <h1>Access Denied</h1>
        <p style={{color:"#aaa"}}>Only admins can access the simulator.</p>
      </div>
    );
  }

  const runSimulation = () => {
    setRunning(true); setResults(null); setError(null);
    fetch(API + "/api/simulator/run?total=" + total + "&fraud_ratio=" + fraudRatio, { method: "POST" })
      .then(res => { if (!res.ok) throw new Error("Server error: " + res.status); return res.json(); })
      .then(data => { setResults(data.results); setRunning(false); })
      .catch(err => { setError("Simulation failed: " + err.message); setRunning(false); });
  };

  const fraudPercent = (parseFloat(fraudRatio) * 100).toFixed(0);

  return (
    <div className="page">
      <h1 style={{color:"#e94560"}}>Transaction Simulator</h1>
      <p style={{color:"#aaa",marginBottom:"20px"}}>Generate realistic fraud patterns to test detection system</p>

      <div className="form">
        <h2>Simulation Settings</h2>
        <div style={{marginBottom:"15px"}}>
          <label style={{color:"#aaa",display:"block",marginBottom:"5px"}}>
            Total Transactions: <strong style={{color:"white"}}>{total}</strong>
          </label>
          <input type="range" min="10" max="1000" step="10" value={total}
            onChange={e => setTotal(parseInt(e.target.value))}
            style={{width:"300px"}} />
          <span style={{color:"#58a6ff",marginLeft:"10px",fontSize:"12px"}}>Max: 1000</span>
        </div>
        <div style={{marginBottom:"15px"}}>
          <label style={{color:"#aaa",display:"block",marginBottom:"5px"}}>
            Fraud Ratio: <strong style={{color:"white"}}>{fraudPercent}%</strong>
          </label>
          <input type="range" min="0.1" max="0.5" step="0.05" value={fraudRatio}
            onChange={e => setFraudRatio(parseFloat(e.target.value))}
            style={{width:"300px"}} />
        </div>

        <div style={{background:"rgba(88,166,255,0.1)",border:"1px solid #58a6ff",borderRadius:"8px",padding:"12px",marginBottom:"15px"}}>
          <p style={{color:"#58a6ff",margin:0,fontSize:"13px"}}>
            <strong>Auto-generates fraud patterns:</strong> Circular rings, Mule deposits, Layering chains built-in to every simulation
          </p>
        </div>

        <button onClick={runSimulation} disabled={running}
          style={{opacity: running ? 0.7 : 1}}>
          {running ? "Running Simulation... (may take 1-2 min for 1000 transactions)" : "Run Simulation"}
        </button>
      </div>

      {error && (
        <div style={{marginTop:"20px",background:"rgba(248,81,73,0.1)",border:"1px solid #f85149",borderRadius:"8px",padding:"15px"}}>
          <p style={{color:"#f85149",margin:0}}>{error}</p>
        </div>
      )}

      {results && (
        <>
          <div className="cards" style={{marginTop:"20px"}}>
            <div className="card"><h3>TOTAL</h3><p>{results.total}</p></div>
            <div className="card green"><h3>CLEAN</h3><p>{results.clean}</p></div>
            <div className="card red"><h3>FRAUD</h3><p>{results.fraud}</p></div>
            <div className="card yellow"><h3>ERRORS</h3><p>{results.errors}</p></div>
          </div>

          <div style={{marginTop:"15px",display:"flex",gap:"15px",flexWrap:"wrap"}}>
            <div style={{background:"rgba(248,81,73,0.1)",border:"1px solid #f85149",borderRadius:"8px",padding:"15px",flex:1,minWidth:"150px",textAlign:"center"}}>
              <p style={{color:"#f85149",margin:0,fontSize:"28px",fontWeight:"bold"}}>{results.circular_rings || 0}</p>
              <p style={{color:"#aaa",margin:0,fontSize:"12px"}}>Circular Rings Generated</p>
            </div>
            <div style={{background:"rgba(227,179,65,0.1)",border:"1px solid #e3b341",borderRadius:"8px",padding:"15px",flex:1,minWidth:"150px",textAlign:"center"}}>
              <p style={{color:"#e3b341",margin:0,fontSize:"28px",fontWeight:"bold"}}>{results.mule_patterns || 0}</p>
              <p style={{color:"#aaa",margin:0,fontSize:"12px"}}>Mule Patterns Generated</p>
            </div>
            <div style={{background:"rgba(88,166,255,0.1)",border:"1px solid #58a6ff",borderRadius:"8px",padding:"15px",flex:1,minWidth:"150px",textAlign:"center"}}>
              <p style={{color:"#58a6ff",margin:0,fontSize:"28px",fontWeight:"bold"}}>{results.layering_chains || 0}</p>
              <p style={{color:"#aaa",margin:0,fontSize:"12px"}}>Layering Chains Generated</p>
            </div>
          </div>

          <div style={{marginTop:"15px",background:"#16213e",padding:"20px",borderRadius:"8px",borderLeft:"4px solid #27ae60"}}>
            <h2 style={{color:"#27ae60",marginTop:0}}>Simulation Complete!</h2>
            <p style={{color:"#aaa",margin:0}}>
              Generated {results.total} transactions including {results.circular_rings || 0} circular rings, {results.mule_patterns || 0} mule patterns, and {results.layering_chains || 0} layering chains.
              Check Fraud Report to see detected patterns.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Simulator;