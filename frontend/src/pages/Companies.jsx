// src/pages/Companies.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import CompanyForm from '../components/CompanyForm';
import ResponsiveTable from '../components/ResponsiveTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSync, faBuilding } from '@fortawesome/free-solid-svg-icons';
import './Companies.css';

const API_URL = 'http://localhost:8000';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Gauti duomenis iš API
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Gauti companies
      const companiesResponse = await axios.get(`${API_URL}/companies/`, { headers });
      setCompanies(companiesResponse.data);

      // Gauti sectors (dropdown)
      const sectorsResponse = await axios.get(`${API_URL}/sectors/`, { headers });
      setSectors(sectorsResponse.data);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load data');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sukurti naują company
  const handleCreateCompany = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.post(`${API_URL}/companies/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Pridėti naują company į sąrašą
      setCompanies([...companies, response.data]);
      setShowForm(false);
      alert(`Company ${response.data.company_name} created successfully!`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create company');
    }
  };

  // Ištrinti company
  const handleDeleteCompany = async (company) => {
    if (!window.confirm(`Delete ${company.company_name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/companies/${company.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Pašalinti iš sąrašo
      setCompanies(companies.filter(c => c.id !== company.id));
      alert('Company deleted');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete company');
    }
  };

  // Pirmą kartą užkraunam duomenis
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Table stulpeliai
  const columns = [
    { 
      key: 'symbol', 
      title: 'Symbol', 
      sortable: true,
      render: (value) => <span className="symbol-badge">{value}</span>
    },
    { 
      key: 'company_name', 
      title: 'Company Name', 
      sortable: true,
      render: (value, item) => (
        <div className="company-name-cell">
          <FontAwesomeIcon icon={faBuilding} className="company-icon" />
          <span>{value}</span>
          {item.sector && (
            <span className="sector-tag">{item.sector.name}</span>
          )}
        </div>
      )
    },
    { 
      key: 'market_cap', 
      title: 'Market Cap', 
      sortable: true,
      render: (value) => value ? `$${Number(value).toLocaleString()}B` : 'N/A'
    },
    { 
      key: 'pe_ratio', 
      title: 'P/E Ratio', 
      sortable: true,
      render: (value) => value || 'N/A'
    },
    { 
      key: 'revenue', 
      title: 'Revenue', 
      sortable: true,
      render: (value) => value ? `$${Number(value).toLocaleString()}B` : 'N/A'
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading companies from backend...</p>
      </div>
    );
  }

  return (
    <div className="companies-page">
      <div className="page-header">
        <div className="header-left">
          <h1>
            <FontAwesomeIcon icon={faBuilding} /> Companies
          </h1>
          <p className="page-subtitle">
            Total: {companies.length} companies | Connected to FastAPI backend
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-refresh"
            onClick={fetchCompanies}
            title="Refresh data"
          >
            <FontAwesomeIcon icon={faSync} /> Refresh
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <FontAwesomeIcon icon={faPlus} /> 
            {showForm ? 'Cancel' : 'Add Company'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <p>{error}</p>
          <button onClick={fetchCompanies}>Retry</button>
        </div>
      )}

      {showForm && (
        <div className="form-section">
          <CompanyForm 
            onSubmit={handleCreateCompany}
            onCancel={() => setShowForm(false)}
            sectors={sectors}
          />
        </div>
      )}

      <div className="table-section">
        <div className="section-header">
          <h2>Companies List</h2>
          <span className="data-source">
            Data from: {API_URL}/companies/
          </span>
        </div>
        
        {companies.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faBuilding} size="3x" />
            <h3>No Companies Found</h3>
            <p>Add your first company using the "Add Company" button</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <FontAwesomeIcon icon={faPlus} /> Create First Company
            </button>
          </div>
        ) : (
          <ResponsiveTable 
            data={companies}
            columns={columns}
            onView={(item) => {
              window.location.href = `/companies/${item.id}`;
            }}
            onEdit={(item) => {
              alert(`Edit ${item.company_name} - TODO: Implement edit`);
            }}
            onDelete={handleDeleteCompany}
          />
        )}
      </div>

      <div className="api-info">
        <h3>Backend API Endpoints Used:</h3>
        <ul>
          <li><code>GET {API_URL}/companies/</code> - Get all companies</li>
          <li><code>GET {API_URL}/sectors/</code> - Get sectors for dropdown</li>
          <li><code>POST {API_URL}/companies/</code> - Create new company</li>
          <li><code>DELETE {API_URL}/companies/{'{id}'}</code> - Delete company</li>
        </ul>
        <p className="hint">
          💡 Login with <strong>kri / kri</strong> to access all features
        </p>
      </div>
    </div>
  );
};

export default Companies;