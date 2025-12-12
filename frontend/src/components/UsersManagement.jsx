import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faTrash, faUserShield, faRefresh, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import './UsersManagement.css';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');

  // Get token
  const getToken = () => localStorage.getItem('token');
  
  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch('http://127.0.0.1:8000/api/v1/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    try {
        const token = getToken();
        const response = await fetch(`http://127.0.0.1:8000/api/v1/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
        });
        
        if (!response.ok) throw new Error('Failed to update role');
        
        // Update local state
        setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, role: newRole } : user
        ));
        
        setShowRoleModal(false);
        setSelectedUser(null);
        setNewRole('');
    } catch (error) {
        alert(error.message);
    }
    };

  const handleDeleteUser = async () => {
    try {
        const token = getToken();
        const response = await fetch(`http://127.0.0.1:8000/api/v1/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
        }
        });
        
        if (!response.ok) throw new Error('Failed to delete user');
        
        // Remove from local state
        setUsers(users.filter(user => user.id !== selectedUser.id));
        
        setShowDeleteModal(false);
        setSelectedUser(null);
    } catch (error) {
        alert(error.message);
    }
    };

  // Open role change modal
  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="users-management">
      <div className="users-header">
        <h1><FontAwesomeIcon icon={faUsers} /> User Management</h1>
        <div className="stats">
          <span>Total: {users.length}</span>
          <span>Admins: {users.filter(u => u.role === 'admin').length}</span>
          <span>Members: {users.filter(u => u.role === 'member').length}</span>
        </div>
      </div>

      <div className="users-content">
        <div className="users-list-section">
          <div className="section-header">
            <h3><FontAwesomeIcon icon={faUsers} /> All Users</h3>
            <button onClick={fetchUsers} className="refresh-btn" disabled={loading}>
              <FontAwesomeIcon icon={faRefresh} /> {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>
                        <span className="username">{user.username}</span>
                        {user.role === 'admin' && <span className="admin-badge">Admin</span>}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          onClick={() => openRoleModal(user)}
                          className="action-btn change-role"
                          title="Change Role"
                        >
                          <FontAwesomeIcon icon={faUserShield} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="action-btn delete"
                          title="Delete User"
                          disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="no-users">No users found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
              <h3>Delete User</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete user <strong>{selectedUser.username}</strong>?</p>
              <p className="warning-text">This action cannot be undone!</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleDeleteUser} className="confirm-delete-btn">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faUserShield} />
              <h3>Change User Role</h3>
            </div>
            <div className="modal-body">
              <p>Change role for user: <strong>{selectedUser.username}</strong></p>
              <div className="role-selection">
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="member"
                    checked={newRole === 'member'}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                  Member
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={newRole === 'admin'}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                  Admin
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleRoleChange} className="confirm-btn" disabled={newRole === selectedUser.role}>
                Change Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;