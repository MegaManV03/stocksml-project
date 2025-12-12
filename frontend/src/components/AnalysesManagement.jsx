import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faTrash, faEdit, faPlus, faRefresh, 
  faExclamationTriangle, faEye, faFilter 
} from '@fortawesome/free-solid-svg-icons';
import './AnalysesManagement.css';

const AnalysesManagement = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    date: '',
    open_price: '',
    close_price: '',
    high_price: '',
    low_price: '',
    volume: '',
    predicted_high: '',
    predicted_low: '',
    predicted_open: '',
    predicted_close: '',
    signal: 'buy',
    confidence_score: ''
  });

  // Get token
  const getToken = () => localStorage.getItem('token');

  // Fetch all analyses
  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/analyses', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch analyses');
      const data = await response.json();
      setAnalyses(data);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create new analysis
  const handleCreateAnalysis = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/analyses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to create analysis');
      
      setShowCreateModal(false);
      resetFormData();
      fetchAnalyses();
    } catch (error) {
      alert(error.message);
    }
  };

  // Update analysis
  const handleUpdateAnalysis = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://127.0.0.1:8000/analyses/${selectedAnalysis.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          close_price: formData.close_price,
          predicted_close: formData.predicted_close,
          signal: formData.signal,
          confidence_score: formData.confidence_score
        })
      });
      
      if (!response.ok) throw new Error('Failed to update analysis');
      
      setShowEditModal(false);
      setSelectedAnalysis(null);
      resetFormData();
      fetchAnalyses();
    } catch (error) {
      alert(error.message);
    }
  };

  // Delete analysis
  const handleDeleteAnalysis = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/analyses/${selectedAnalysis.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete analysis');
      
      setShowDeleteModal(false);
      setSelectedAnalysis(null);
      fetchAnalyses();
    } catch (error) {
      alert(error.message);
    }
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      company_id: '',
      date: '',
      open_price: '',
      close_price: '',
      high_price: '',
      low_price: '',
      volume: '',
      predicted_high: '',
      predicted_low: '',
      predicted_open: '',
      predicted_close: '',
      signal: 'buy',
      confidence_score: ''
    });
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get signal color class
  const getSignalClass = (signal) => {
    switch(signal.toLowerCase()) {
      case 'buy': return 'signal-buy';
      case 'sell': return 'signal-sell';
      case 'hold': return 'signal-hold';
      default: return '';
    }
  };

  // Open modals
  const openCreateModal = () => {
    resetFormData();
    setFormData({
      ...formData,
      date: new Date().toISOString().split('T')[0] // Today's date
    });
    setShowCreateModal(true);
  };

  const openEditModal = (analysis) => {
    setSelectedAnalysis(analysis);
    setFormData({
      company_id: analysis.company_id,
      date: analysis.date.split('T')[0],
      open_price: analysis.open_price,
      close_price: analysis.close_price,
      high_price: analysis.high_price,
      low_price: analysis.low_price,
      volume: analysis.volume,
      predicted_high: analysis.predicted_high,
      predicted_low: analysis.predicted_low,
      predicted_open: analysis.predicted_open,
      predicted_close: analysis.predicted_close,
      signal: analysis.signal,
      confidence_score: analysis.confidence_score
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (analysis) => {
    setSelectedAnalysis(analysis);
    setShowDeleteModal(true);
  };

  // Load analyses
  useEffect(() => {
    fetchAnalyses();
  }, []);

  return (
    <div className="analyses-management">
      <div className="analyses-header">
        <h1><FontAwesomeIcon icon={faChartLine} /> Analysis Management</h1>
        <div className="header-actions">
          <button onClick={openCreateModal} className="create-btn">
            <FontAwesomeIcon icon={faPlus} /> Create Analysis
          </button>
          <button onClick={fetchAnalyses} className="refresh-btn" disabled={loading}>
            <FontAwesomeIcon icon={faRefresh} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="analyses-content">
        {loading ? (
          <div className="loading">Loading analyses...</div>
        ) : (
          <div className="analyses-table-container">
            <table className="analyses-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Company ID</th>
                  <th>Date</th>
                  <th>Close Price</th>
                  <th>Predicted Close</th>
                  <th>Signal</th>
                  <th>Confidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map(analysis => (
                  <tr key={analysis.id}>
                    <td>{analysis.id}</td>
                    <td>{analysis.company_id}</td>
                    <td>{formatDate(analysis.date)}</td>
                    <td>${parseFloat(analysis.close_price).toFixed(2)}</td>
                    <td>${parseFloat(analysis.predicted_close).toFixed(2)}</td>
                    <td>
                      <span className={`signal-badge ${getSignalClass(analysis.signal)}`}>
                        {analysis.signal}
                      </span>
                    </td>
                    <td>{parseFloat(analysis.confidence_score).toFixed(1)}%</td>
                    <td className="actions">
                      <button
                        onClick={() => openEditModal(analysis)}
                        className="action-btn edit"
                        title="Edit Analysis"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(analysis)}
                        className="action-btn delete"
                        title="Delete Analysis"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {analyses.length === 0 && (
              <div className="no-analyses">No analyses found</div>
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
              <h3>Create New Analysis</h3>
            </div>
            <form onSubmit={handleCreateAnalysis}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Company ID *</label>
                    <input
                      type="number"
                      value={formData.company_id}
                      onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                      required
                      placeholder="Company ID"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Open Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.open_price}
                      onChange={(e) => setFormData({...formData, open_price: e.target.value})}
                      placeholder="Open price"
                    />
                  </div>
                  <div className="form-group">
                    <label>Close Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.close_price}
                      onChange={(e) => setFormData({...formData, close_price: e.target.value})}
                      required
                      placeholder="Close price"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Predicted Close *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.predicted_close}
                      onChange={(e) => setFormData({...formData, predicted_close: e.target.value})}
                      required
                      placeholder="Predicted close"
                    />
                  </div>
                  <div className="form-group">
                    <label>Signal *</label>
                    <select
                      value={formData.signal}
                      onChange={(e) => setFormData({...formData, signal: e.target.value})}
                      required
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                      <option value="hold">Hold</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Confidence Score *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.confidence_score}
                      onChange={(e) => setFormData({...formData, confidence_score: e.target.value})}
                      required
                      placeholder="Confidence %"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Create Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAnalysis && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faEdit} />
              <h3>Edit Analysis</h3>
            </div>
            <form onSubmit={handleUpdateAnalysis}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Close Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.close_price}
                      onChange={(e) => setFormData({...formData, close_price: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Predicted Close *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.predicted_close}
                      onChange={(e) => setFormData({...formData, predicted_close: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Signal *</label>
                    <select
                      value={formData.signal}
                      onChange={(e) => setFormData({...formData, signal: e.target.value})}
                      required
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                      <option value="hold">Hold</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Confidence Score *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.confidence_score}
                      onChange={(e) => setFormData({...formData, confidence_score: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowEditModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="confirm-btn">
                  Update Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAnalysis && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
              <h3>Delete Analysis</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete analysis <strong>#{selectedAnalysis.id}</strong>?</p>
              <p>Company: {selectedAnalysis.company_id} | Date: {formatDate(selectedAnalysis.date)}</p>
              <p className="warning-text">This action cannot be undone!</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleDeleteAnalysis} className="confirm-delete-btn">
                Delete Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysesManagement;