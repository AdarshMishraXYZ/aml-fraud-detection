import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const ws = useRef(null);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    fetchData();
    fetch('http://127.0.0.1:8000/health')
  .then(res => res.json())
  .then(() => setApiStatus('online'))
  .catch(() => setApiStatus('offline'));
    ws.current = new WebSocket('ws://127.0.0.1:8000/ws');
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'alert') {
        setLiveAlerts(prev => [data, ...prev].slice(0, 5));
        fetchData();
      }
    };
    return () => ws.current.close();
  }, []);

  const fetchData = () => {
    fetch('http://127.0.0.1:8000/api/transactions')
      .then(res => res.json())
      .then(data => setTransactions(data));
    fetch('http://127.0.0.1:8000/api/alerts')
      .then(res => res.json())
      .then(data => setAlerts(data));
  };

  const flagged = transactions.filter(t => t.status === 'flagged').length;
  const suspicious = transactions.filter(t => t.status === 'suspicious').length;
  const clean = transactions.filter(t => t.status === 'clean').length;
  const review = transactions.filter(t => t.status === 'review').length;

  const pieData = [
    { name: 'Flagged', value: flagged },
    { name: 'Suspicious', value: suspicious },
    { name: 'Clean', value: clean },
    { name: 'Review', value: review },
  ];

  const barData = transactions.slice(-7).map(t => ({
    id: `T${t.id}`,
    amount: t.amount,
    risk: t.ml_fraud_probability || 0
  }));

  const riskData = [
    { range: '0-20', count: transactions.filter(t => (t.ml_fraud_probability || 0) <= 20).length },
    { range: '21-40', count: transactions.filter(t => (t.ml_fraud_probability || 0) > 20 && (t.ml_fraud_probability || 0) <= 40).length },
    { range: '41-60', count: transactions.filter(t => (t.ml_fraud_probability || 0) > 40 && (t.ml_fraud_probability || 0) <= 60).length },
    { range: '61-80', count: transactions.filter(t => (t.ml_fraud_probability || 0) > 60 && (t.ml_fraud_probability || 0) <= 80).length },
    { range: '81-100', count: transactions.filter(t => (t.ml_fraud_probability || 0) > 80).length },
  ];

  const COLORS = ['#f85149', '#e3b341', '#3fb950', '#58a6ff'];

  return (
    <div className="page">
      <h1><div style={{
  display:'inline-flex', alignItems:'center', gap:'8px',
  padding:'5px 12px', borderRadius:'20px', fontSize:'12px',
  background: apiStatus === 'online' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)',
  color: apiStatus === 'online' ? '#3fb950' : '#f85149',
  border: `1px solid ${apiStatus === 'online' ? '#3fb950' : '#f85149'}`,
  marginBottom:'20px'
}}>
  <span style={{width:'8px', height:'8px', borderRadius:'50%', background: apiStatus === 'online' ? '#3fb950' : '#f85149'}}></span>
  API {apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
</div>Dashboard Overview</h1>

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

      <div className="charts">
        <div className="chart-box">
          <h2>Transaction Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
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
              <Bar dataKey="amount" fill="#e94560" name="Amount" />
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

      <div className="recent-section">
        <h2>Recent Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Amount</th>
              <th>Status</th>
              <th>ML Risk %</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(-5).reverse().map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.sender}</td>
                <td>{t.receiver}</td>
                <td>{t.amount}</td>
                <td className={t.status}>{t.status}</td>
                <td>{t.ml_fraud_probability ? t.ml_fraud_probability + '%' : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Recent Alerts</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Transaction ID</th>
              <th>Reason</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {alerts.slice(-5).reverse().map(a => (
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
      </div>
    </div>
  );
}

export default Dashboard;