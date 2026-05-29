import React, { useState, useEffect } from 'react';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 10;

  useEffect(() => {
    fetch('   https://aml-fraud-detection-1.onrender.com/api/transactions')
      .then(res => res.json())
      .then(data => {
        setTransactions(data.reverse());
        setFiltered(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = transactions;
    if (search) {
      result = result.filter(t =>
        t.sender.toLowerCase().includes(search.toLowerCase()) ||
        t.receiver.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter !== 'all') {
      result = result.filter(t => t.status === filter);
    }
    setFiltered(result);
    setPage(1);
  }, [search, filter, transactions]);

  const submitTransaction = () => {
    fetch('   https://aml-fraud-detection-1.onrender.com/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: sender,
        receiver: receiver,
        amount: parseFloat(amount)
      })
    })
    .then(res => res.json())
    .then(() => {
      fetch('   https://aml-fraud-detection-1.onrender.com/api/transactions')
        .then(res => res.json())
        .then(data => {
          setTransactions(data.reverse());
          setFiltered(data);
        });
      setSender('');
      setReceiver('');
      setAmount('');
    });
  };

  const paginated = filtered.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  if (loading) return (
    <div className="page" style={{textAlign:'center', paddingTop:'100px'}}>
      <div style={{color:'#58a6ff', fontSize:'18px'}}>⏳ Loading transactions...</div>
    </div>
  );

  return (
    <div className="page">
      <h1>Transactions</h1>
      <a href="   https://aml-fraud-detection-1.onrender.com/api/transactions/export/csv"
        style={{padding:'8px 15px', background:'#3fb950', color:'white', borderRadius:'6px', textDecoration:'none', marginBottom:'20px', display:'inline-block', fontSize:'14px'}}>
        📥 Export CSV
      </a>

      <div className="form">
        <h2>New Transaction</h2>
        <input placeholder="Sender" value={sender} onChange={e => setSender(e.target.value)} />
        <input placeholder="Receiver" value={receiver} onChange={e => setReceiver(e.target.value)} />
        <input placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
        <button onClick={submitTransaction}>Submit Transaction</button>
      </div>

      <div className="filters">
        <input
          placeholder="🔍 Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="flagged">Flagged</option>
          <option value="suspicious">Suspicious</option>
          <option value="review">Review</option>
          <option value="clean">Clean</option>
        </select>
      </div>

      <p style={{color:'#8b949e', marginBottom:'10px', fontSize:'14px'}}>
        Showing {filtered.length} transactions
      </p>

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
          {paginated.map(t => (
            <tr key={t.id} onClick={() => window.location.href=`/transactions/${t.id}`} style={{cursor:'pointer'}}>
              <td>{t.id}</td>
              <td>{t.sender}</td>
              <td>{t.receiver}</td>
              <td>₹{t.amount?.toLocaleString()}</td>
              <td className={t.status}>{t.status}</td>
              <td>{t.ml_fraud_probability ? t.ml_fraud_probability + '%' : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next →</button>
      </div>
    </div>
  );
}

export default Transactions;