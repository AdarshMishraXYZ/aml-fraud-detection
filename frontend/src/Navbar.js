import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [txCount, setTxCount] = useState(0);

  useEffect(() => {
    fetch('   https://aml-fraud-detection-1.onrender.com/api/transactions')
      .then(res => res.json())
      .then(data => setTxCount(data.length))
      .catch(() => {});
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        🔍 AML Detection System
      </div>
      <div className="navbar-links">
        <Link className={location.pathname === '/' ? 'active' : ''} to="/">Dashboard</Link>
        <Link className={location.pathname === '/transactions' ? 'active' : ''} to="/transactions">
          Transactions {txCount > 0 && (
            <span style={{background:'#e94560', color:'white', borderRadius:'10px', padding:'1px 6px', fontSize:'11px', marginLeft:'4px'}}>
              {txCount}
            </span>
          )}
        </Link>
        <Link className={location.pathname === '/alerts' ? 'active' : ''} to="/alerts">Alerts</Link>
        <Link className={location.pathname === '/report' ? 'active' : ''} to="/report">Fraud Report</Link>
        {user?.role === 'admin' && (
          <>
            <Link className={location.pathname === '/simulator' ? 'active' : ''} to="/simulator">Simulator</Link>
            <Link className={location.pathname === '/users' ? 'active' : ''} to="/users">Users</Link>
          </>
        )}
      </div>
      <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
        <span style={{color:'#aaa', fontSize:'14px'}}>
          👤 {user?.username} ({user?.role})
        </span>
        <button onClick={onLogout}
          style={{padding:'6px 12px', background:'#e94560', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;