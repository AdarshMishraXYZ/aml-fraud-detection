import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [txCount, setTxCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef();
  const API = "https://aml-fraud-detection.onrender.com";

  useEffect(() => {
    fetch(API + "/api/transactions")
      .then(res => res.json())
      .then(data => setTxCount(data.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAlerts = () => {
      fetch(API + "/api/alerts")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const sorted = data.slice().reverse().slice(0, 10);
            setAlerts(sorted);
            const lastSeen = parseInt(localStorage.getItem("lastSeenAlertId") || "0");
            const unread = data.filter(a => a.id > lastSeen).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const severityColor = (sev) => {
    if (sev === "critical") return "#f85149";
    if (sev === "high") return "#e94560";
    if (sev === "medium") return "#e3b341";
    return "#58a6ff";
  };

  const markAllRead = () => {
    if (alerts.length > 0) {
      const maxId = Math.max(...alerts.map(a => a.id));
      localStorage.setItem("lastSeenAlertId", maxId.toString());
    }
    setUnreadCount(0);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">AML Detection System</div>
      <div className="navbar-links">
        <Link className={location.pathname === "/" ? "active" : ""} to="/">Dashboard</Link>
        <Link className={location.pathname === "/transactions" ? "active" : ""} to="/transactions">
          Transactions {txCount > 0 && <span style={{background:"#e94560",color:"white",borderRadius:"10px",padding:"1px 6px",fontSize:"11px",marginLeft:"4px"}}>{txCount}</span>}
        </Link>
        <Link className={location.pathname === "/alerts" ? "active" : ""} to="/alerts">Alerts</Link>
        <Link className={location.pathname === "/report" ? "active" : ""} to="/report">Fraud Report</Link>
        {user && user.role === "admin" && (
          <><Link className={location.pathname === "/simulator" ? "active" : ""} to="/simulator">Simulator</Link>
          <Link className={location.pathname === "/users" ? "active" : ""} to="/users">Users</Link></>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"15px"}}>
        <div ref={dropdownRef} style={{position:"relative"}}>
          <button onClick={() => { setShowNotifications(!showNotifications); if (alerts.length > 0) { const maxId = Math.max(...alerts.map(a => a.id)); localStorage.setItem("lastSeenAlertId", maxId.toString()); setUnreadCount(0); } }}
            style={{background:"none",border:"none",cursor:"pointer",position:"relative",padding:"6px",fontSize:"20px"}}>
            🔔
            {unreadCount > 0 && (
              <span style={{position:"absolute",top:"-2px",right:"-2px",background:"#e94560",color:"white",borderRadius:"50%",width:"18px",height:"18px",fontSize:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold"}}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div style={{position:"absolute",right:0,top:"40px",width:"340px",background:"#161b22",border:"1px solid #30363d",borderRadius:"8px",zIndex:1000,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #30363d"}}>
                <span style={{color:"white",fontWeight:"bold",fontSize:"14px"}}>
                  Notifications {unreadCount > 0 && <span style={{background:"#e94560",color:"white",borderRadius:"10px",padding:"1px 8px",fontSize:"11px",marginLeft:"6px"}}>{unreadCount} new</span>}
                </span>
                {unreadCount > 0 && <button onClick={markAllRead} style={{background:"none",border:"none",color:"#58a6ff",cursor:"pointer",fontSize:"12px"}}>Mark all read</button>}
              </div>
              <div style={{maxHeight:"320px",overflowY:"auto"}}>
                {alerts.length === 0 ? (
                  <div style={{padding:"20px",textAlign:"center",color:"#666"}}>No alerts yet</div>
                ) : alerts.map((alert, i) => (
                  <div key={i} style={{padding:"12px 16px",borderBottom:"1px solid #21262d",background:alert.status==="open"?"rgba(232,94,96,0.05)":"transparent",borderLeft:alert.status==="open"?"3px solid "+severityColor(alert.severity):"3px solid transparent"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                      <span style={{fontSize:"10px",fontWeight:"bold",textTransform:"uppercase",color:severityColor(alert.severity),background:severityColor(alert.severity)+"22",padding:"2px 6px",borderRadius:"4px"}}>{alert.severity||"medium"}</span>
                      <span style={{fontSize:"10px",color:"#666"}}>TX #{alert.transaction_id}</span>
                    </div>
                    <p style={{margin:0,color:"#ccc",fontSize:"12px",lineHeight:"1.4"}}>{alert.reason}</p>
                    {alert.status==="open" && <span style={{fontSize:"10px",color:"#e94560",marginTop:"4px",display:"block"}}>Unread</span>}
                  </div>
                ))}
              </div>
              <div style={{padding:"10px 16px",borderTop:"1px solid #30363d",textAlign:"center"}}>
                <Link to="/alerts" onClick={() => setShowNotifications(false)} style={{color:"#58a6ff",fontSize:"12px",textDecoration:"none"}}>View all alerts →</Link>
              </div>
            </div>
          )}
        </div>
        <span style={{color:"#aaa",fontSize:"14px"}}>👤 {user && user.username} ({user && user.role})</span>
        <button onClick={onLogout} style={{padding:"6px 12px",background:"#e94560",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;