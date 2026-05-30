import React, { useState } from 'react';

const API = 'https://aml-fraud-detection.onrender.com';

function Simulator() {
  const [total, setTotal] = useState(50);
  const [fraudRatio, setFraudRatio] = useState(0.1);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const role = localStorage.getItem('role');

  if (role !== 'admin') {
    return (
      <div className="page">
        <h1>Access Denied</h1>
        <p style={{ color: '#aaa' }}>Only admins can access the simulator.</p>
      </div>
    );
  }

  const runSimulation = () => {
    setRunning(true);
    setResults(null);
    setError(null);
    fetch(`${API}/api/simulator/run?total=${total}&fraud_ratio=${fraudRatio}`, {
      method: 'POST'
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setResults(data.results);
        setRunning(false);
      })
      .catch(err => {
        setError(`Simulation failed: ${err.message}. Check if the backend is online.`);
        setRunning(false);
      });
  };

  const fraudPercent = (parseFloat(fraudRatio) * 100).toFixed(0);

  return (
    <div className="page">
      <h1 style={{ color: '#e94560' }}>Transaction Simulator</h1>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>
        Generate realistic transactions to test fraud detection system
      </p>
      <div className="form">
        <h2>Simulation Settings</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>
            Total Transactions: {total}
          </label>
          <input
            type="range" min="10" max="200" value={total}
            onChange={e => setTotal(parseInt(e.target.value))}
            style={{ width: '300px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#aaa', display: 'block', marginBottom: '5px' }}>
            Fraud Ratio: {fraudPercent}%
          </label>
          <input
            type="range" min="0.01" max="0.5" step="0.01" value={fraudRatio}
            onChange={e => setFraudRatio(parseFloat(e.target.value))}
            style={{ width: '300px' }}
          />
        </div>
        <button onClick={runSimulation} disabled={running}>
          {running ? '⏳ Running Simulation...' : '🚀 Run Simulation'}
        </button>
      </div>
      {error && (
        <div style={{ marginTop: '20px', background: 'rgba(248,81,73,0.1)', border: '1px solid #f85149', borderRadius: '8px', padding: '15px' }}>
          <p style={{ color: '#f85149', margin: 0 }}>⚠️ {error}</p>
        </div>
      )}
      {results && (
        <>
          <div className="cards" style={{ marginTop: '20px' }}>
            <div className="card"><h3>TOTAL GENERATED</h3><p>{results.total}</p></div>
            <div className="card green"><h3>CLEAN</h3><p>{results.clean}</p></div>
            <div className="card red"><h3>FRAUD</h3><p>{results.fraud}</p></div>
            <div className="card yellow"><h3>ERRORS</h3><p style={{ color: results.errors > 0 ? '#f85149' : 'inherit' }}>{results.errors}</p></div>
          </div>
          {results.errors > 0 && (
            <div style={{ marginTop: '10px', background: 'rgba(227,179,65,0.1)', border: '1px solid #e3b341', borderRadius: '8px', padding: '12px' }}>
              <p style={{ color: '#e3b341', margin: 0 }}>⚠️ {results.errors} transaction(s) failed. Backend may be cold-starting — try again in 30 seconds.</p>
            </div>
          )}
          <div style={{ marginTop: '20px', background: '#16213e', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #27ae60' }}>
            <h2 style={{ color: '#27ae60' }}>✅ Simulation Complete!</h2>
            <p style={{ color: '#aaa' }}>Generated {results.total} transactions with {fraudPercent}% fraud ratio. {results.errors === 0 ? 'Dashboard and Alerts updated!' : 'Some transactions missing due to errors above.'}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default Simulator;
