import React, { useState, useEffect, useCallback } from 'react';

const API = 'https://aml-fraud-detection-1.onrender.com';

function UserManagement() {
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('analyst');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/auth/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users from server.');
        setLoading(false);
      });
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  if (role !== 'admin') {
    return (<div className="page"><h1>Access Denied</h1><p>Only admins can manage users.</p></div>);
  }

  const addUser = () => {
    if (!newUsername || !newPassword) { setError('Username and password are required.'); return; }
    setError(null); setSuccess(null);
    fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
    })
      .then(res => { if (!res.ok) return res.json().then(e => { throw new Error(e.detail || 'Failed'); }); return res.json(); })
      .then(() => { setSuccess(`User created successfully!`); setNewUsername(''); setNewPassword(''); setNewRole('analyst'); fetchUsers(); setTimeout(() => setSuccess(null), 3000); })
      .catch(err => setError(err.message));
  };

  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    fetch(`${API}/api/auth/users/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    }).then(res => { if (!res.ok) throw new Error('Failed'); return res.json(); }).then(() => fetchUsers()).catch(() => setError('Failed to update.'));
  };

  return (
    <div className="page">
      <h1 style={{ color: '#e94560' }}>User Management</h1>
      <div className="form">
        <h2>Add New User</h2>
        {error && <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid #f85149', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}><p style={{ color: '#f85149', margin: 0 }}>{error}</p></div>}
        {success && <div style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid #3fb950', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}><p style={{ color: '#3fb950', margin: 0 }}>{success}</p></div>}
        <input placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ padding: '10px', background: '#0d1117', border: '1px solid #30363d', color: 'white', borderRadius: '6px', margin: '6px' }}>
          <option value="analyst">Analyst</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={addUser}>Add User</button>
      </div>
      <h2 style={{ marginTop: '30px' }}>All Users</h2>
      {loading ? <p style={{ color: '#aaa' }}>Loading users...</p> : (
        <table>
          <thead><tr><th>ID</th><th>USERNAME</th><th>ROLE</th><th>STATUS</th><th>ACTION</th></tr></thead>
          <tbody>
            {users.length === 0 ? <tr><td colSpan="5" style={{ color: '#666', textAlign: 'center' }}>No users found</td></tr>
            : users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td><td>{u.username}</td>
                <td><span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '12px', background: u.role === 'admin' ? 'rgba(248,81,73,0.2)' : 'rgba(88,166,255,0.2)', color: u.role === 'admin' ? '#f85149' : '#58a6ff' }}>{u.role}</span></td>
                <td><span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '12px', background: u.status === 'active' ? 'rgba(63,185,80,0.2)' : 'rgba(139,148,158,0.2)', color: u.status === 'active' ? '#3fb950' : '#8b949e' }}>{u.status}</span></td>
                <td><button onClick={() => toggleStatus(u.id, u.status)} style={{ padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', background: u.status === 'active' ? 'rgba(248,81,73,0.2)' : 'rgba(63,185,80,0.2)', color: u.status === 'active' ? '#f85149' : '#3fb950', border: 'none', fontSize: '12px' }}>{u.status === 'active' ? 'Deactivate' : 'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserManagement;