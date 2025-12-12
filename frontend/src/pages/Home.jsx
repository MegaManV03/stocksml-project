import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';

const API_URL = 'http://localhost:8000';

export default function Home() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSectors: 0,
    totalCompanies: 0,
    featuredSectors: []
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sectors
        const sectorsResponse = await axios.get(`${API_URL}/sectors/`);
        setSectors(sectorsResponse.data);
        
        // Calculate stats
        const totalSectors = sectorsResponse.data.length;
        
        // Get companies count (you might need to adjust this based on your API)
        let totalCompanies = 0;
        try {
          const companiesResponse = await axios.get(`${API_URL}/companies/`);
          totalCompanies = companiesResponse.data.length;
        } catch (e) {
          // If companies endpoint doesn't exist, estimate
          totalCompanies = totalSectors * 10; // Assuming ~10 companies per sector
        }
        
        // Get featured sectors (first 3)
        const featuredSectors = sectorsResponse.data.slice(0, 3);
        
        setStats({
          totalSectors,
          totalCompanies,
          featuredSectors
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>Loading sectors data...</p>
    </div>
  );
  
  return (
    <div className="home-container">
      
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Stock Market Analysis Platform</h1>
        <p className="hero-subtitle">
          Explore comprehensive financial analyses across multiple sectors. 
          Get real-time insights, predictions, and trading signals for informed investment decisions.
        </p>
        
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.totalSectors}</span>
            <span className="stat-label">Sectors</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.totalCompanies}</span>
            <span className="stat-label">Companies</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Real-time Data</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">AI</span>
            <span className="stat-label">Powered Analytics</span>
          </div>
        </div>
      </div>
      
      {/* Search Bar (Optional) */}
      {/* <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search sectors or companies..."
        />
      </div> */}
      
      {/* Sectors Grid */}
      <div className="sectors-section">
        <h2 className="section-title">
          <span className="section-icon">🏢</span>
          Market Sectors
        </h2>
        <p className="section-subtitle">
          Click on any sector to explore companies and view detailed financial analyses.
          Each sector contains multiple publicly traded companies with real-time data.
        </p>
        
        {sectors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3 className="empty-title">No Sectors Available</h3>
            <p className="empty-text">Sectors data is currently being loaded. Please check back later.</p>
          </div>
        ) : (
          <div className="sectors-grid">
            {sectors.map(sector => (
              <div key={sector.id} className="sector-card">
                <div className="sector-header">
                  <h3 className="sector-name">
                    <Link to={`/sectors/${sector.id}/companies`}>
                      {sector.name}
                    </Link>
                  </h3>
                </div>
                
                <p className="sector-description">
                  {sector.description || 'Explore companies in this market sector for detailed financial analysis and investment insights.'}
                </p>
                
                <div className="sector-footer">
                  <Link 
                    to={`/sectors/${sector.id}/companies`} 
                    className="explore-btn"
                  >
                    <span>Explore Companies</span>
                    <span>→</span>
                  </Link>
          
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      
    </div>
  );
}