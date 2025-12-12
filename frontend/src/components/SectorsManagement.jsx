import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faTrash, faEdit, faPlus, faRefresh, faExclamationTriangle, faEye } from '@fortawesome/free-solid-svg-icons';
import './SectorsManagement.css';

const SectorsManagement = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Get token
  const getToken = () => localStorage.getItem('token');

  // Fetch all sectors
  const fetchSectors = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/sectors', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch sectors');
      const data = await response.json();
      setSectors(data);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new sector
  const handleCreateSector = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/sectors/sectors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to create sector');
      
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      fetchSectors();
    } catch (error) {
      alert(error.message);
    }
  };

  // Update sector
  const handleUpdateSector = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://127.0.0.1:8000/sectors/sectors/${selectedSector.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to update sector');
      
      setShowEditModal(false);
      setSelectedSector(null);
      setFormData({ name: '', description: '' });
      fetchSectors();
    } catch (error) {
      alert(error.message);
    }
  };

  // Delete sector
  const handleDeleteSector = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/sectors/sectors/${selectedSector.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete sector');
      
      setShowDeleteModal(false);
      setSelectedSector(null);
      fetchSectors();
    } catch (error) {
      alert(error.message);
    }
  };

  // Open modals
  const openCreateModal = () => {
    setFormData({ name: '', description: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (sector) => {
    setSelectedSector(sector);
    setFormData({ name: sector.name, description: sector.description || '' });
    setShowEditModal(true);
  };

  const openDeleteModal = (sector) => {
    setSelectedSector(sector);
    setShowDeleteModal(true);
  };

  // Load sectors
  useEffect(() => {
    fetchSectors();
  }, []);

  return (
    <div className="sectors-management">
      <div className="sectors-header">
        <h1><FontAwesomeIcon icon={faBuilding} /> Sector Management</h1>
        <div className="header-actions">
          <button onClick={openCreateModal} className="create-btn">
            <FontAwesomeIcon icon={faPlus} /> Create Sector
          </button>
          <button onClick={fetchSectors} className="refresh-btn" disabled={loading}>
            <FontAwesomeIcon icon={faRefresh} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="sectors-content">
        {loading ? (
          <div className="loading">Loading sectors...</div>
        ) : (
          <div className="sectors-table-container">
            <table className="sectors-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sectors.map(sector => (
                  <tr key={sector.id}>
                    <td>{sector.id}</td>
                    <td><strong>{sector.name}</strong></td>
                    <td>{sector.description || 'No description'}</td>
                    <td className="actions">
                      <button
                        onClick={() => openEditModal(sector)}
                        className="action-btn edit"
                        title="Edit Sector"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(sector)}
                        className="action-btn delete"
                        title="Delete Sector"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sectors.length === 0 && (
              <div className="no-sectors">No sectors found</div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faPlus} />
              <h3>Create New Sector</h3>
            </div>
            <form onSubmit={handleCreateSector}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Sector Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the sector"
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Create Sector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSector && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faEdit} />
              <h3>Edit Sector</h3>
            </div>
            <form onSubmit={handleUpdateSector}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Sector Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Update Sector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSector && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
              <h3>Delete Sector</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete sector <strong>{selectedSector.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone!</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleDeleteSector} className="confirm-delete-btn">
                Delete Sector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectorsManagement;