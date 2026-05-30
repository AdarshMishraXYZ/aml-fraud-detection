import React, { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch('https://aml-fraud-detection-1.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        onLogin(data);
      } else {
        setError('Invalid username or password!');
      }
    } catch (err) {
      setError('Connection error!');
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh',
      background: '#1a1a2e'
    }}>
      <div style={{
        background: '#16213e', padding: '40px',
        borderRadius: '8px', width: '350px',
        border: '1px solid #0f3460'
      }}>
        <h1 style={{color: '#e94560', textAlign: 'center', marginBottom: '10px'}}>
          🔍 AML System
        </h1>
        <p style={{color: '#aaa', textAlign: 'center', marginBottom: '30px'}}>
          Fraud Detection Platform
        </p>

        {error && (
          <div style={{background: '#e74c3c', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px'}}>
            {error}
          </div>
        )}

        <div style={{marginBottom: '15px'}}>
          <label style={{color: '#aaa', display: 'block', marginBottom: '5px'}}>Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px', boxSizing: 'border-box'}}
          />
        </div>

        <div style={{marginBottom: '20px'}}>
          <label style={{color: '#aaa', display: 'block', marginBottom: '5px'}}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            onKeyPress={e => e.key === 'Enter' && handleLogin()}
            style={{width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px', boxSizing: 'border-box'}}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{width: '100%', padding: '12px', background: '#e94560', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'}}
        >
        {loading ? '⏳ Waking up server... (30-60 sec)' : 'Login'}  
        </button>

        <div style={{marginTop: '20px', color: '#aaa', fontSize: '12px', textAlign: 'center'}}>
         
        </div>
      </div>
    </div>
  );
}

export default Login;