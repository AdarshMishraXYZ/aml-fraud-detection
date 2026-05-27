import React, { useState } from 'react';

function Simulator() {
  const [total, setTotal] = useState(50);
  const [fraudRatio, setFraudRatio] = useState(0.1);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  const role = localStorage.getItem('role');

if (role !== 'admin') {
  return (
    <div className="page">
      <h1>Access Denied</h1>
      <p style={{color:'#aaa'}}>Only admins can access the simulator.</p>
    </div>
  );
}

  const runSimulation = () => {
    setRunning(true);
    setResults(null);
    fetch(`   https://aml-fraud-detection-1.onrender.com/api/simulator/run?total=${total}&fraud_ratio=${fraudRatio}`, {
      method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
      setResults(data.results);
      setRunning(false);
    });
  };

  return (
    <div className="page">
      <h1>Transaction Simulator</h1>
      <p style={{color:'#aaa', marginBottom:'20px'}}>
        Generate realistic transactions to test fraud detection system
      </p>

      <div className="form">
        <h2>Simulation Settings</h2>
        <div style={{marginBottom:'15px'}}>
          <label style={{color:'#aaa', display:'block', marginBottom:'5px'}}>
            Total Transactions: {total}
          </label>
          <input
            type="range" min="10" max="200" value={total}
            onChange={e => setTotal(e.target.value)}
            style={{width:'300px'}}
          />
        </div>
        <div style={{marginBottom:'15px'}}>
          <label style={{color:'#aaa', display:'block', marginBottom:'5px'}}>
            Fraud Ratio: {(fraudRatio * 100).toFixed(0)}%
          </label>
          <input
            type="range" min="0.01" max="0.3" step="0.01" value={fraudRatio}
            onChange={e => setFraudRatio(e.target.value)}
            style={{width:'300px'}}
          />
        </div>
        <button onClick={runSimulation} disabled={running}>
          {running ? '⏳ Running Simulation...' : '🚀 Run Simulation'}
        </button>
      </div>

      {results && (
        <div className="cards" style={{marginTop:'20px'}}>
          <div className="card">
            <h3>Total Generated</h3>
            <p>{results.total}</p>
          </div>
          <div className="card green">
            <h3>Clean</h3>
            <p>{results.clean}</p>
          </div>
          <div className="card red">
            <h3>Fraud</h3>
            <p>{results.fraud}</p>
          </div>
          <div className="card yellow">
            <h3>Errors</h3>
            <p>{results.errors}</p>
          </div>
        </div>
      )}

      {results && (
        <div style={{marginTop:'20px', background:'#16213e', padding:'20px', borderRadius:'8px'}}>
          <h2 style={{color:'#27ae60'}}>✅ Simulation Complete!</h2>
          <p style={{color:'#aaa'}}>
            Generated {results.total} transactions with {(fraudRatio*100).toFixed(0)}% fraud ratio.
            Check Dashboard and Alerts for results!
          </p>
        </div>
      )}
    </div>
  );
}

export default Simulator;