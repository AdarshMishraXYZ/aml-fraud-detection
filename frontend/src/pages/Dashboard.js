import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const API = 'https://aml-fraud-detection-1.onrender.com';
const COLORS = ['#f85149', '#e3b341', '#3fb950', '#58a6ff'];

// FIX: Poll every 15 seconds so the dashboard stays up-to-date after
//      a simulation even if the WebSocket message is missed
const POLL_INTERVAL_MS = 15000;

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');
  const [lastUpdated, setLastUpdated] = useState(null);
  const ws = useRef(null);
  const pollTimer = useRef(null);

  // FIX: Wrap fetchData in useCallback so it can safely be used in effects
  const fetchData = useCallback(() => {
    fetch(`${API}/api/transactions`)
      .then(res => res.json())
      .then(data => {
        setTransactions(Array.isArray(data) ? data : []);
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(err => console.log('Transactions error:', err));

    fetch(`${API}/api/alerts`)
      .then(res => res.json())
      .then(data => setAlerts(Array.isArray(data) ? data : []))
      .catch(err => console.log('Alerts error:', err));
  }, []);

  useEffect(() => {
    // Initial load
    fetchData();

    // Health check
    fetch(`${API}/health`)
      .then(res => res.json())
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));

    // FIX: Start polling — covers cases where WebSocket fails (Render free tier)
    pollTimer.current = setInterval(fetchData, POLL_INTERVAL_MS);

    // WebSocket for instant live alerts
    try {
      ws.current = new WebSocket('wss://aml-fraud-detection-1.onrender.com/ws');
      ws.current.onopen = () => console.log('[WS] Connected');
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'alert') {
            setLiveAlerts(prev => [data, ...prev].slice(0, 5));
            // FIX: Immediately re-fetch data when a new alert arrives
            fetchData();
          }
        } catch (e) {
          console.log('[WS] Parse error', e);
        }
      };
      ws.current.onerror = () => console.log('[WS] Not available — using polling');
    } catch (e) {
      console.log('[WS] Not supported — using polling');
    }

    return () => {
      if (ws.current) ws.current.close();
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const flagged    = transactions.filter(t => t.status === 'flagged').length;
  const suspicious = transactions.filter(t => t.status === 'suspicious').length;
  const clean      = transactions.filter(t => t.status === 'clean').length;
  const review     = transactions.filter(t => t.status === 'review').length;

  const pieData = [
    { name: 'Flagged',    value: flagged },
    { name: 'Suspicious', value: suspicious },
    { name: 'Clean',      value: clean },
    { name: 'Review',     value: review },
  ].filter(d => d.value > 0); // FIX: hide zero slices so chart isn't misleading

  const barData = transactions.slice(-10).map(t => ({
    id: `T${t.id}`,
    amount: t.amount,
    risk: t.ml_fraud_probability || 0
  }));

  const riskData = [
    { range: '0–20',   count: transactions.filter(t => (t.ml_fraud_probability || 0) <= 20).length },
    { range: '21–40',  count: transactions.filter(t => (t.ml_fraud_probability || 0) > 20  && (t.ml_fraud_probability || 0) <= 40).length },
    { range: '41–60',  count: transactions.filter(t => (t.ml_fraud_probability || 0) > 40  && (t.ml_fraud_probability || 0) <= 60).length },
    { range: '61–80',  count: transactions.filter(t => (t.ml_fraud_probability || 0) > 60  && (t.ml_fraud_probability || 0) <= 80).length },
    { range: '81–100', count: transactions.filter(t => (t.ml_fraud_probability || 0) > 80).length },
  ];

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Dashboard Overview</h1>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '5px 12px', borderRadius: '20px', fontSize: '12px',
          background: apiStatus === 'online' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)',
          color: apiStatus === 'online' ? '#3fb950' : '#f85149',
          border: `1px solid ${apiStatus === 'online' ? '#3fb950' : '#f85149'}`
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: apiStatus === 'online' ? '#3fb950' : '#f85149' }}></span>
          API {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
        </div>

        <button onClick={fetchData} style={{
          padding: '6px 12px', background: '#21262d', color: 'white',
          border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
        }}>
          🔄 Refresh
        </button>

        {/* FIX: Show last-updated time so users know data is live */}
        {lastUpdated && (
          <span style={{ color: '#666', fontSize: '12px' }}>
            Last updated: {lastUpdated} (auto-refreshes every 15s)
          </span>
        )}
      </div>

      {/* ── Live Alerts Banner ── */}
      {liveAlerts.length > 0 && (
        <div className="live-alerts">
          <h3>🚨 Live Alerts</h3>
          {liveAlerts.map((alert, i) => (
            <div key={i} className={`live-alert ${alert.severity}`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="cards">
        <div className="card">
          <h3>Total Transactions</h3>
          <p>{transactions.length}</p>
        </div>
        <div className="card red">
          <h3>Flagged</h3>
          <p>{flagged}</p>
        </div>
        <div className="card yellow">
          <h3>Suspicious</h3>
          <p>{suspicious}</p>
        </div>
        <div className="card green">
          <h3>Clean</h3>
          <p>{clean}</p>
        </div>
        <div className="card blue">
          <h3>Total Alerts</h3>
          <p>{alerts.length}</p>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="charts">
        <div className="chart-box">
          <h2>Transaction Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Recent Transaction Amounts</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="id" stroke="#8b949e" />
              <YAxis stroke="#8b949e" />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#e94560" name="Amount (₹)" />
              <Bar dataKey="risk" fill="#e3b341" name="ML Risk %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h2>Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riskData}>
              <XAxis dataKey="range" stroke="#8b949e" />
              <YAxis stroke="#8b949e" />
              <Tooltip />
              <Bar dataKey="count" fill="#58a6ff" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Tables ── */}
      <div className="recent-section">
        <h2>Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p style={{ color: '#666' }}>No transactions yet. Run the Simulator to generate data.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Sender</th><th>Receiver</th>
                <th>Amount</th><th>Status</th><th>ML Risk %</th>
              </tr>
            </thead>
            <tbody>
              {[...transactions].reverse().slice(0, 10).map(t => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.sender}</td>
                  <td>{t.receiver}</td>
                  <td>₹{t.amount?.toLocaleString()}</td>
                  <td className={t.status}>{t.status}</td>
                  <td>{t.ml_fraud_probability != null ? t.ml_fraud_probability + '%' : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2>Recent Alerts</h2>
        {alerts.length === 0 ? (
          <p style={{ color: '#666' }}>No alerts yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Transaction ID</th><th>Reason</th>
                <th>Severity</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...alerts].reverse().slice(0, 10).map(a => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.transaction_id}</td>
                  <td>{a.reason}</td>
                  <td>{a.severity}</td>
                  <td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;