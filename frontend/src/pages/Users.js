import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { userService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [newUser, setNewUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'student',
    faculty: 'ICT'
  });

  // 🔥 FIXED: Add active field to editUser state
  const [editUser, setEditUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    faculty: '',
    active: true
  });

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Error loading users' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.create(newUser);
      setMessage({ type: 'success', text: 'User created successfully!' });
      setShowCreateForm(false);
      setNewUser({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'student',
        faculty: 'ICT'
      });
      fetchUsers();
    } catch (error) {
      console.error('Create user error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error creating user: ' + (error.response?.data?.message || error.message) 
      });
    }
  };

  // 🔥 FIXED: Better error handling for update
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      console.log('🔄 Updating user:', editingUser.id, editUser);
      
      const response = await userService.update(editingUser.id, editUser);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'User updated successfully!' });
        setEditingUser(null);
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Update failed' });
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      console.error('❌ Error response:', error.response);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      
      setMessage({ 
        type: 'error', 
        text: `Error updating user: ${errorMessage}` 
      });
    }
  };

  // 🔥 FIXED: Include active field when starting edit
  const startEditUser = (userItem) => {
    setEditingUser(userItem);
    setEditUser({
      first_name: userItem.first_name,
      last_name: userItem.last_name,
      email: userItem.email,
      role: userItem.role,
      faculty: userItem.faculty || 'ICT',
      active: userItem.active !== undefined ? userItem.active : true
    });
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user: ${userName}?`)) {
      try {
        await userService.delete(userId);
        setMessage({ type: 'success', text: 'User deleted successfully!' });
        fetchUsers();
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: 'Error deleting user: ' + (error.response?.data?.message || error.message) 
        });
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      program_leader: 'bg-primary',
      principal_lecturer: 'bg-info',
      lecturer: 'bg-success',
      student: 'bg-secondary'
    };
    return colors[role] || 'bg-secondary';
  };

  const getFacultyBadgeColor = (faculty) => {
    const colors = {
      'ICT': 'bg-purple',
      'Business': 'bg-warning',
      'Engineering': 'bg-danger'
    };
    return colors[faculty] || 'bg-secondary';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Users Management</h1>
        {user.role === 'program_leader' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Add New User'}
          </button>
        )}
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && user.role === 'program_leader' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'white' }}>Create New User</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="principal_lecturer">Principal Lecturer</option>
                    <option value="program_leader">Program Leader</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select
                    className="form-select"
                    value={newUser.faculty}
                    onChange={(e) => setNewUser({...newUser, faculty: e.target.value})}
                    required
                  >
                    <option value="ICT">ICT</option>
                    <option value="Business">Business</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-success">Create User</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Form */}
      {editingUser && user.role === 'program_leader' && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid #007bff' }}>
          <div className="card-header" style={{ background: '#007bff' }}>
            <h3 style={{ margin: 0, color: 'white' }}>Edit User</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleEditUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUser.first_name}
                    onChange={(e) => setEditUser({...editUser, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUser.last_name}
                    onChange={(e) => setEditUser({...editUser, last_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editUser.email}
                    onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={editUser.role}
                    onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="principal_lecturer">Principal Lecturer</option>
                    <option value="program_leader">Program Leader</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select
                    className="form-select"
                    value={editUser.faculty}
                    onChange={(e) => setEditUser({...editUser, faculty: e.target.value})}
                    required
                  >
                    <option value="ICT">ICT</option>
                    <option value="Business">Business</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                {/* 🔥 NEW: Active status checkbox */}
                <div className="form-group form-check" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={editUser.active}
                    onChange={(e) => setEditUser({...editUser, active: e.target.checked})}
                    id="activeCheck"
                  />
                  <label className="form-check-label" htmlFor="activeCheck">
                    Active User
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-success">Update User</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List - Updated with Status column */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'white' }}>System Users ({users.length})</h3>
        </div>
        <div className="card-body">
          {users.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Faculty</th>
                    <th>Status</th> {/* 🔥 NEW: Status column */}
                    <th>Joined</th>
                    {user.role === 'program_leader' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem.id}>
                      <td>
                        <strong>{userItem.first_name} {userItem.last_name}</strong>
                      </td>
                      <td>{userItem.email}</td>
                      <td>
                        <span className={`badge ${getRoleBadgeColor(userItem.role)}`}>
                          {userItem.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {userItem.faculty && (
                          <span className={`badge ${getFacultyBadgeColor(userItem.faculty)}`}>
                            {userItem.faculty}
                          </span>
                        )}
                      </td>
                      {/* 🔥 NEW: Status badge */}
                      <td>
                        <span className={`badge ${userItem.active ? 'bg-success' : 'bg-danger'}`}>
                          {userItem.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {new Date(userItem.created_at).toLocaleDateString()}
                      </td>
                      {user.role === 'program_leader' && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-sm btn-info"
                              onClick={() => startEditUser(userItem)}
                              title="Edit User"
                            >
                              Edit
                            </button>
                            {userItem.id !== user.id && ( // Cannot delete yourself
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteUser(userItem.id, `${userItem.first_name} ${userItem.last_name}`)}
                                title="Delete User"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
              No users found.
            </p>
          )}
        </div>
      </div>

      {/* Statistics */}
      {user.role === 'program_leader' && (
        <div className="card" style={{ marginTop: '2rem', background: '#f8f9fa' }}>
          <div className="card-body">
            <h4>User Statistics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div className="text-center">
                <div className="stat-number" style={{ color: '#007bff' }}>
                  {users.filter(u => u.role === 'program_leader').length}
                </div>
                <div className="stat-label">Program Leaders</div>
              </div>
              <div className="text-center">
                <div className="stat-number" style={{ color: '#17a2b8' }}>
                  {users.filter(u => u.role === 'principal_lecturer').length}
                </div>
                <div className="stat-label">Principal Lecturers</div>
              </div>
              <div className="text-center">
                <div className="stat-number" style={{ color: '#28a745' }}>
                  {users.filter(u => u.role === 'lecturer').length}
                </div>
                <div className="stat-label">Lecturers</div>
              </div>
              <div className="text-center">
                <div className="stat-number" style={{ color: '#6c757d' }}>
                  {users.filter(u => u.role === 'student').length}
                </div>
                <div className="stat-label">Students</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;