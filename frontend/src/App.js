import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import ReportPage from './ReportPage';
import Simulator from './pages/Simulator';
import TransactionDetail from './pages/TransactionDetail';
import Login from './Login';
import './App.css';
import UserManagement from './pages/UserManagement';
import SuspectProfile from './pages/SuspectProfile';

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    return token ? { token, username, role } : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/suspect/:name" element={<SuspectProfile />} />
      </Routes>
    </Router>
  );
}

export default App;// updated
