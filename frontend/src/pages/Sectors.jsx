// src/pages/Sectors.jsx - su hierarchy
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Sectors = () => {
  const [sectors, setSectors] = useState([]);
  const [expandedSector, setExpandedSector] = useState(null);
  const [sectorCompanies, setSectorCompanies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/sectors/`)
      .then(response => {
        setSectors(response.data);
      })
      .catch(error => console.error('Error:', error))
      .finally(() => setLoading(false));
  }, []);

  const fetchCompanies = async (sectorId) => {
    if (sectorCompanies[sectorId]) {
      // Already loaded
      setExpandedSector(expandedSector === sectorId ? null : sectorId);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/sectors/${sectorId}/companies`);
      setSectorCompanies(prev => ({
        ...prev,
        [sectorId]: response.data
      }));
      setExpandedSector(sectorId);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  if (loading) {
    return <p>Loading sectors...</p>;
  }

  return (
    <div>
      <h1>Sectors</h1>
      <p>Total: {sectors.length} sectors</p>
      
      <div>
        {sectors.map(sector => (
          <div key={sector.id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{sector.name}</h3>
              <button onClick={() => fetchCompanies(sector.id)}>
                {expandedSector === sector.id ? 'Hide' : 'Show'} Companies
              </button>
            </div>
            
            <p>{sector.description || 'No description'}</p>
            <p>Sector ID: {sector.id}</p>
            
            <Link to={`/sectors/${sector.id}/companies`}>
              View all companies in this sector →
            </Link>

            {expandedSector === sector.id && sectorCompanies[sector.id] && (
              <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5' }}>
                <h4>Companies in {sector.name}:</h4>
                {sectorCompanies[sector.id].length === 0 ? (
                  <p>No companies in this sector</p>
                ) : (
                  <ul>
                    {sectorCompanies[sector.id].map(company => (
                      <li key={company.id}>
                        <strong>{company.symbol}</strong> - {company.company_name}
                        <br />
                        Market Cap: ${company.market_cap} | P/E: {company.pe_ratio}
                        <Link to={`/companies/${company.id}`} style={{ marginLeft: '10px' }}>
                          Details
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sectors;