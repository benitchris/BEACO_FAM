import React, { useState, useEffect } from 'react';
import { Settings, User, Shield, Lock, Plus, Trash2, Edit3, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser, updatePassword } from '../wasm/db';

export default function SettingsPage({ currentUser, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'users'
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin User CRUD Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states for Add/Edit User
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Sales');

  const isAdmin = currentUser?.role === 'Admin';

  const loadUsers = () => {
    if (isAdmin) {
      try {
        const uList = getAllUsers();
        setUsers(uList);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const handleChangeMyPassword = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      updatePassword(currentUser.id, newPassword);
      setMessage('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to update password.');
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      createUser(formFullName, formUsername, formPassword, formRole);
      setShowAddModal(false);
      setFormFullName('');
      setFormUsername('');
      setFormPassword('');
      setFormRole('Sales');
      loadUsers();
      setMessage(`User "${formUsername}" created successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormFullName(user.full_name);
    setFormRole(user.role);
    setFormPassword('');
    setShowEditModal(true);
  };

  const handleUpdateUserSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setMessage('');
    setError('');

    try {
      updateUser(selectedUser.id, formFullName, formRole, formPassword);
      setShowEditModal(false);
      loadUsers();
      setMessage(`User "${selectedUser.username}" updated successfully!`);

      // If updating current user's profile
      if (selectedUser.id === currentUser.id) {
        onUserUpdated({ ...currentUser, full_name: formFullName, role: formRole });
      }
    } catch (err) {
      setError('Failed to update user.');
    }
  };

  const handleDeleteUserClick = (user) => {
    if (user.id === currentUser.id) {
      alert("You cannot delete your own logged-in account!");
      return;
    }
    if (window.confirm(`Are you sure you want to delete user "${user.username}" (${user.full_name})?`)) {
      try {
        deleteUser(user.id);
        loadUsers();
        setMessage(`User "${user.username}" deleted.`);
      } catch (err) {
        setError('Failed to delete user.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings color="var(--accent-emerald)" /> User Profile & Security Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Manage your account credentials, view security permissions, and manage system user access.
        </p>
      </div>

      {message && (
        <div style={{ padding: '0.875rem 1.25rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.875rem 1.25rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.25rem', borderRadius: '8px',
            border: 'none', background: activeTab === 'profile' ? 'var(--accent-emerald)' : 'transparent',
            color: activeTab === 'profile' ? '#fff' : 'var(--text-muted)',
            fontWeight: activeTab === 'profile' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease'
          }}
        >
          <User size={16} /> My Account Profile
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.25rem', borderRadius: '8px',
              border: 'none', background: activeTab === 'users' ? 'var(--accent-emerald)' : 'transparent',
              color: activeTab === 'users' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'users' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            <Shield size={16} /> User Access Management (Admin)
          </button>
        )}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--accent-emerald)" /> Account Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>Full Name</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{currentUser?.full_name}</div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>Username</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>@{currentUser?.username}</div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>Assigned System Role</div>
                <div style={{ marginTop: '0.375rem' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.85rem', padding: '0.375rem 0.75rem' }}>
                    👑 {currentUser?.role} Role
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="var(--accent-amber)" /> Change Password
            </h3>
            <form onSubmit={handleChangeMyPassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                <Key size={16} /> Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: User Access Management (Admin Only) */}
      {activeTab === 'users' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--accent-emerald)" /> System User Directory ({users.length})
            </h3>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add New User
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td style={{ fontWeight: 700 }}>{u.full_name}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-sky)' }}>@{u.username}</td>
                    <td>
                      <span className={`badge ${u.role === 'Admin' ? 'badge-emerald' : u.role === 'Sales' ? 'badge-sky' : 'badge-amber'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.created_at || 'Default Seed'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEdit(u)} className="btn btn-secondary btn-sm" title="Edit User">
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUserClick(u)} 
                          className="btn btn-danger btn-sm" 
                          title="Delete User"
                          disabled={u.id === currentUser.id}
                          style={{ opacity: u.id === currentUser.id ? 0.4 : 1 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={20} color="var(--accent-emerald)" /> Register New System User
            </h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" placeholder="e.g. Marie Claire Uwimana" value={formFullName} onChange={e => setFormFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" className="form-control" placeholder="e.g. marie" value={formUsername} onChange={e => setFormUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password (Default: username@123)</label>
                <input type="text" className="form-control" placeholder="e.g. marie@123" value={formPassword} onChange={e => setFormPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Role</label>
                <select className="form-control" value={formRole} onChange={e => setFormRole(e.target.value)}>
                  <option value="Admin">Admin (Full Access & User CRUD)</option>
                  <option value="Sales">Sales (Sales Revenue, Eggs, Customers)</option>
                  <option value="Construction">Construction (Workers, Expenses, Feed, Mortality)</option>
                  <option value="Employee">Employee (Standard View Access)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit3 size={20} color="var(--accent-sky)" /> Edit User: @{selectedUser.username}
            </h2>
            <form onSubmit={handleUpdateUserSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={formFullName} onChange={e => setFormFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">System Role</label>
                <select className="form-control" value={formRole} onChange={e => setFormRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="Sales">Sales</option>
                  <option value="Construction">Construction</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reset Password (Leave blank to keep unchanged)</label>
                <input type="text" className="form-control" placeholder="New password..." value={formPassword} onChange={e => setFormPassword(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
