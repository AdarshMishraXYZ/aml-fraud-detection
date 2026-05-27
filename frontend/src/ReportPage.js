import React, { useState, useEffect } from 'react';

function ReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('   https://aml-fraud-detection-1.onrender.com/api/graph/full-report')
      .then(res => res.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="App"><h2>Loading Report...</h2></div>;

  return (
    <div className="App">
      <h1>🔍 Fraud Analysis Report</h1>

      <div className="cards">
        <div className="card red">
          <h3>Circular Rings</h3>
          <p>{report.summary.circular_rings}</p>
        </div>
        <div className="card yellow">
          <h3>Mule Accounts</h3>
          <p>{report.summary.mule_accounts}</p>
        </div>
        <div className="card blue">
          <h3>Layering Chains</h3>
          <p>{report.summary.layering_chains}</p>
        </div>
        <div className="card">
          <h3>Total Patterns</h3>
          <p>{report.summary.total_patterns}</p>
        </div>
      </div>

      <h2>🔴 Circular Fraud Rings</h2>
      <table>
        <thead>
          <tr>
            <th>Person 1</th>
            <th>Person 2</th>
            <th>Person 3</th>
            <th>Amount 1</th>
            <th>Amount 2</th>
            <th>Amount 3</th>
          </tr>
        </thead>
        <tbody>
          {report.circular_transactions.map((c, i) => (
            <tr key={i}>
              <td className="flagged">{c.person1}</td>
              <td className="flagged">{c.person2}</td>
              <td className="flagged">{c.person3}</td>
              <td>{c.amount1}</td>
              <td>{c.amount2}</td>
              <td>{c.amount3}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>🟡 Mule Accounts</h2>
      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Number of Senders</th>
            <th>Total Received</th>
          </tr>
        </thead>
        <tbody>
          {report.mule_accounts.map((m, i) => (
            <tr key={i}>
              <td className="suspicious">{m.mule_account}</td>
              <td>{m.number_of_senders}</td>
              <td>{m.total_amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>🔵 Layering Chains</h2>
      <table>
        <thead>
          <tr>
            <th>Origin</th>
            <th>Hop 1</th>
            <th>Hop 2</th>
            <th>Hop 3</th>
            <th>Destination</th>
          </tr>
        </thead>
        <tbody>
          {report.layering_detected.map((l, i) => (
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

      <br/>
      <button onClick={() => window.location.href='/'} 
        style={{padding:'10px 20px', background:'#e94560', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'16px'}}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default ReportPage;