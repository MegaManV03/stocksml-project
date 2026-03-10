import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './SectorCompanies.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function SectorCompanies() {
  const { sectorId } = useParams();
  const navigate = useNavigate();
  const [sector, setSector] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [stats, setStats] = useState({ totalCompanies: 0, totalMarketCap: 0, avgPERatio: 0 });
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    const fetchData = async () => {
      try {
        // Get sector info
        const sectorResponse = await axios.get(`${API_URL}/sectors/${sectorId}`);
        setSector(sectorResponse.data);
        
        // Get companies in this sector
        const companiesResponse = await axios.get(`${API_URL}/sectors/${sectorId}/companies`);
        setCompanies(companiesResponse.data);
        
        // Calculate statistics
        if (companiesResponse.data.length > 0) {
          const totalMarketCap = companiesResponse.data.reduce((sum, company) => 
            sum + (company.market_cap || 0), 0
          );
          const validPERatios = companiesResponse.data.filter(c => c.pe_ratio).map(c => c.pe_ratio);
          const avgPERatio = validPERatios.length > 0 
            ? (validPERatios.reduce((a, b) => a + b, 0) / validPERatios.length).toFixed(2)
            : 'N/A';
          
          setStats({
            totalCompanies: companiesResponse.data.length,
            totalMarketCap,
            avgPERatio
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [sectorId]);
  
  const formatMarketCap = (value) => {
    if (!value) return '$0';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };
  
  const handleViewAnalyses = (companyId) => {
    navigate(`/sectors/${sectorId}/companies/${companyId}/analyses`);
  };
  
  const handleLoginClick = () => {
    navigate('/login');
  };
  
  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading companies...</p>
    </div>
  );
  
  return (
    <div className="sector-companies-container">
      
      {/* Header Section */}
      <div className="sector-header">
        <Link to="/" className="back-link">
          ← Back to All Sectors
        </Link>
        
        <h1 className="sector-title">
          <span className="sector-icon">🏢</span>
          {sector?.name}
        </h1>
        
        <p className="sector-description">
          {sector?.description || 'Explore companies in this sector'}
        </p>
        
        {/* Statistics Bar */}
        {companies.length > 0 && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.totalCompanies}</span>
              <span className="stat-label">Companies</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatMarketCap(stats.totalMarketCap)}</span>
              <span className="stat-label">Total Market Cap</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.avgPERatio}</span>
              <span className="stat-label">Avg P/E Ratio</span>
            </div>
          </div>
        )}
      </div>
      
      
      
      {/* Companies Section */}
      <div className="companies-section">
        <h2 style={{ margin: '0 0 1rem 0', color: '#1a237e' }}>
          Companies ({companies.length})
        </h2>
        
        {companies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <p className="empty-text">No companies found in this sector</p>
          </div>
        ) : (
          <div className="companies-grid">
            {companies.map(company => (
              <div key={company.id} className="company-card">
                <span className="sector-badge">ID: {sectorId}</span>
                
                <div className="company-header">
                  <div>
                    <h3 className="company-symbol">
                      {company.symbol}
                      <span className="sector-indicator">{sector?.name?.substring(0, 3)}</span>
                    </h3>
                    <p className="company-name">{company.company_name}</p>
                  </div>
                </div>
                
                <div className="company-info">
                  <div className="info-item">
                    <span className="info-label">Market Cap</span>
                    <span className="info-value market-cap">
                      {formatMarketCap(company.market_cap)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">P/E Ratio</span>
                    <span className="info-value">
                      {company.pe_ratio ? company.pe_ratio.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Revenue</span>
                    <span className="info-value">
                      {company.revenue ? formatMarketCap(company.revenue) : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Sector</span>
                    <span className="info-value">{sector?.name}</span>
                  </div>
                </div>
                
                {isLoggedIn ? (
                  <button 
                    className="analysis-button"
                    onClick={() => handleViewAnalyses(company.id)}
                  >
                    📊 View Detailed Analyses
                  </button>
                ) : (
                  <div className="login-required">
                    <span className="lock-icon">🔒</span>
                    Login to view analyses
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}