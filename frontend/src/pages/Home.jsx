import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';

const API_URL = 'http://localhost:8000';

export default function Home() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        // Fetch companies with IDs 1-5
        const companyIds = [1, 2, 3, 4, 5, 6];
        const companyPromises = companyIds.map(id => 
          axios.get(`${API_URL}/companies/${id}`)
        );
        
        const responses = await Promise.all(companyPromises);
        const companiesData = responses.map(res => res.data);
        setCompanies(companiesData);
        
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, []);
  
  if (loading) return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>Loading companies...</p>
    </div>
  );
  
  return (
    <>
      {/* Hero Section - OUTSIDE container */}
      <div className="hero-section">
        <h1 className="hero-title">AI-Powered Stock Prediction Engine</h1>
        <p className="hero-subtitle">
          Advanced transformer models analyzing market data to generate probabilistic long/short signals with automated daily predictions,<br />
          giving you data-driven insights for smarter investing.
        </p>
      </div>

      {/* Companies Grid - INSIDE container */}
      <div className="home-container">
        <div className="companies-section">
          <h2 className="section-title">
            Prediction-Ready Companies
          </h2>
          <p className="section-subtitle">
            Click on any company to view detailed financial analysis and AI-powered predictions.
          </p>
          
          <div className="companies-grid">
            {companies.map(company => (
              <Link 
                to={`/sectors/${company.sector_id}/companies/${company.id}/analyses`} 
                key={company.id} 
                className="company-card"
              >
                <h3 className="company-name">{company.company_name}</h3>
                <p className="company-symbol">{company.symbol}</p>
                <span className="view-link">View Analysis →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}