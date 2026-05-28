import React, { useState } from 'react';

const API = 'https://aml-fraud-detection-1.onrender.com';

const INITIAL_USERS = [
  { id: 1, username: 'admin', role: 'admin', status: 'active' },
  { id: 2, username: 'analyst', role: 'analyst', status: 'active' },
];

function UserManagement() {
  const role = localStorage.getItem('role');
  const [users, setUsers] = useState(INITIAL_USERS);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('analyst');
  const [newPassword, setNewPassword] = useState('');

  if (role !== 'admin') {
    return (
      <div className="page">
        <h1>Access Denied</h1>
        <p style={{color:'#8b949e'}}>Only admins can manage users.</p>
      </div>
    );
  }

  const addUser = () => {
    if (!newUsername || !newPassword) return;
    const newUser = {
      id: users.length + 1,
      username: newUsername,
      role: newRole,
      status: 'active'
    };
    setUsers([...users, newUser]);
    setNewUsername('');
    setNewPassword('');
  };

  const toggleStatus = (id) => {
    setUsers(users.map(u =>
      u.id === id ? {...u, status: u.status === 'active' ? 'inactive' : 'active'} : u
    ));
  };

  return (
    <div className="page">
      <h1>👥 User Management</h1>

      <div className="form">
        <h2>Add New User</h2>
        <input placeholder="Username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <select value={newRole} onChange={e => setNewRole(e.target.value)}
          style={{padding:'10px', background:'#0d1117', border:'1px solid #30363d', color:'white', borderRadius:'6px', margin:'6px'}}>
          <option value="analyst">Analyst</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={addUser}>Add User</button>
      </div>

      <h2>All Users</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>
                <span style={{padding:'3px 8px', borderRadius:'4px', fontSize:'12px',
                  background: u.role === 'admin' ? 'rgba(248,81,73,0.2)' : 'rgba(88,166,255,0.2)',
                  color: u.role === 'admin' ? '#f85149' : '#58a6ff'}}>
                  {u.role}
                </span>
              </td>
              <td>
                <span style={{padding:'3px 8px', borderRadius:'4px', fontSize:'12px',
                  background: u.status === 'active' ? 'rgba(63,185,80,0.2)' : 'rgba(139,148,158,0.2)',
                  color: u.status === 'active' ? '#3fb950' : '#8b949e'}}>
                  {u.status}
                </span>
              </td>
              <td>
                <button onClick={() => toggleStatus(u.id)}
                  style={{padding:'5px 10px', borderRadius:'4px', cursor:'pointer',
                    background: u.status === 'active' ? 'rgba(248,81,73,0.2)' : 'rgba(63,185,80,0.2)',
                    color: u.status === 'active' ? '#f85149' : '#3fb950',
                    border:'none', fontSize:'12px'}}>
                  {u.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;