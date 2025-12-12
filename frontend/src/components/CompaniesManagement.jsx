// CompaniesManagement.jsx
import { useState, useEffect } from 'react';
import { 
  FontAwesomeIcon 
} from '@fortawesome/react-fontawesome';
import { 
  faBuilding, 
  faPlus, 
  faTrash, 
  faEdit, 
  faEye, 
  faRefresh,
  faExclamationTriangle,
  faChartLine,
  faDollarSign,
  faIndustry
} from '@fortawesome/free-solid-svg-icons';
import './CompaniesManagement.css'; // You'll create this CSS file

const CompaniesManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    company_name: '',
    sector_id: '',
    market_cap: '',
    pe_ratio: '',
    revenue: ''
  });
  const [sectors, setSectors] = useState([]);

  const API_BASE = 'http://127.0.0.1:8000/companies';
  
  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Fetch all companies
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(API_BASE, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sectors (assuming you have a sectors endpoint)
  const fetchSectors = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://127.0.0.1:8000/sectors', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSectors(data);
      }
    } catch (error) {
      console.error('Failed to fetch sectors:', error);
    }
  };

  // Create new company
  const handleCreateCompany = async () => {
    try {
      const token = getToken();
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create company');
      }
      
      const newCompany = await response.json();
      setCompanies([...companies, newCompany]);
      setShowCreateModal(false);
      resetForm();
      alert('Company created successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Update company
  const handleUpdateCompany = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to update company');
      
      // Update in local state
      setCompanies(companies.map(company => 
        company.id === selectedCompany.id ? { ...company, ...formData } : company
      ));
      
      setShowEditModal(false);
      resetForm();
      alert('Company updated successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Delete company
  const handleDeleteCompany = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/${selectedCompany.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete company');
      
      // Remove from local state
      setCompanies(companies.filter(company => company.id !== selectedCompany.id));
      
      setShowDeleteModal(false);
      setSelectedCompany(null);
      alert('Company deleted successfully!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      symbol: '',
      company_name: '',
      sector_id: '',
      market_cap: '',
      pe_ratio: '',
      revenue: ''
    });
    setSelectedCompany(null);
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (company) => {
    setSelectedCompany(company);
    setFormData({
      symbol: company.symbol,
      company_name: company.company_name,
      sector_id: company.sector_id || '',
      market_cap: company.market_cap || '',
      pe_ratio: company.pe_ratio || '',
      revenue: company.revenue || ''
    });
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (company) => {
    setSelectedCompany(company);
    setShowViewModal(true);
  };

  // Open delete modal
  const openDeleteModal = (company) => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load companies and sectors on component mount
  useEffect(() => {
    fetchCompanies();
    fetchSectors();
  }, []);

  return (
    <div className="companies-management">
      <div className="companies-header">
        <h1><FontAwesomeIcon icon={faBuilding} /> Company Management</h1>
        <div className="stats">
          <span>Total Companies: {companies.length}</span>
          <span>Total Market Cap: {formatCurrency(
            companies.reduce((sum, company) => sum + (company.market_cap || 0), 0)
          )}</span>
        </div>
      </div>

      <div className="companies-content">
        <div className="section-header">
          <h3><FontAwesomeIcon icon={faBuilding} /> All Companies</h3>
          <div className="header-actions">
            <button onClick={fetchCompanies} className="refresh-btn" disabled={loading}>
              <FontAwesomeIcon icon={faRefresh} /> {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={openCreateModal} className="create-btn">
              <FontAwesomeIcon icon={faPlus} /> Add Company
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading companies...</div>
        ) : (
          <div className="companies-table-container">
            <table className="companies-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th>Sector</th>
                  <th>Market Cap</th>
                  <th>P/E Ratio</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id}>
                    <td>{company.id}</td>
                    <td className="symbol-cell">
                      <span className="symbol">{company.symbol}</span>
                    </td>
                    <td className="name-cell">
                      <strong>{company.company_name}</strong>
                    </td>
                    <td>
                      <span className="sector-badge">
                        <FontAwesomeIcon icon={faIndustry} /> {company.sector?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="market-cap">
                      <FontAwesomeIcon icon={faDollarSign} className="icon" />
                      {formatCurrency(company.market_cap)}
                    </td>
                    <td className="pe-ratio">
                      <FontAwesomeIcon icon={faChartLine} className="icon" />
                      {company.pe_ratio ? company.pe_ratio.toFixed(2) : 'N/A'}
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => openViewModal(company)}
                        className="action-btn view"
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button
                        onClick={() => openEditModal(company)}
                        className="action-btn edit"
                        title="Edit Company"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(company)}
                        className="action-btn delete"
                        title="Delete Company"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {companies.length === 0 && (
              <div className="no-companies">
                <FontAwesomeIcon icon={faBuilding} size="3x" />
                <p>No companies found. Add your first company!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faPlus} />
              <h3>Add New Company</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Stock Symbol *</label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="AAPL"
                  required
                />
              </div>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="Apple Inc."
                  required
                />
              </div>
              <div className="form-group">
                <label>Sector</label>
                <select
                  name="sector_id"
                  value={formData.sector_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select Sector</option>
                  {sectors.map(sector => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Market Cap ($)</label>
                  <input
                    type="number"
                    name="market_cap"
                    value={formData.market_cap}
                    onChange={handleInputChange}
                    placeholder="2500000000000"
                  />
                </div>
                <div className="form-group">
                  <label>P/E Ratio</label>
                  <input
                    type="number"
                    step="0.01"
                    name="pe_ratio"
                    value={formData.pe_ratio}
                    onChange={handleInputChange}
                    placeholder="28.5"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Revenue ($)</label>
                <input
                  type="number"
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleInputChange}
                  placeholder="394328000000"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleCreateCompany} className="confirm-btn" disabled={!formData.symbol || !formData.company_name}>
                Create Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && selectedCompany && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faEdit} />
              <h3>Edit Company</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Stock Symbol *</label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sector</label>
                <select
                  name="sector_id"
                  value={formData.sector_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select Sector</option>
                  {sectors.map(sector => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Market Cap ($)</label>
                  <input
                    type="number"
                    name="market_cap"
                    value={formData.market_cap}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>P/E Ratio</label>
                  <input
                    type="number"
                    step="0.01"
                    name="pe_ratio"
                    value={formData.pe_ratio}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Revenue ($)</label>
                <input
                  type="number"
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleUpdateCompany} className="confirm-btn" disabled={!formData.symbol || !formData.company_name}>
                Update Company
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Company Modal */}
      {showViewModal && selectedCompany && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faBuilding} />
              <h3>{selectedCompany.company_name} ({selectedCompany.symbol})</h3>
            </div>
            <div className="modal-body">
              <div className="company-details">
                <div className="detail-row">
                  <span className="label">Company ID:</span>
                  <span className="value">{selectedCompany.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Stock Symbol:</span>
                  <span className="value symbol-badge">{selectedCompany.symbol}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Sector:</span>
                  <span className="value">{selectedCompany.sector?.name || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Market Cap:</span>
                  <span className="value highlight">{formatCurrency(selectedCompany.market_cap)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">P/E Ratio:</span>
                  <span className="value">{selectedCompany.pe_ratio ? selectedCompany.pe_ratio.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Revenue:</span>
                  <span className="value">{formatCurrency(selectedCompany.revenue)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowViewModal(false); setSelectedCompany(null); }} className="cancel-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCompany && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
              <h3>Delete Company</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedCompany.company_name} ({selectedCompany.symbol})</strong>?</p>
              <p className="warning-text">This action cannot be undone!</p>
              <div className="company-info">
                <p>Market Cap: {formatCurrency(selectedCompany.market_cap)}</p>
                <p>P/E Ratio: {selectedCompany.pe_ratio || 'N/A'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowDeleteModal(false); setSelectedCompany(null); }} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleDeleteCompany} className="confirm-delete-btn">
                Delete Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesManagement;