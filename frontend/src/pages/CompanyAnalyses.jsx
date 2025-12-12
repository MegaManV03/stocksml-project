import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './CompanyAnalyses.css';
import api from '../services/auth'; 

const API_URL = 'http://localhost:8000';

export default function CompanyAnalyses() {
  const { sectorId, companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to view analyses');
          setLoading(false);
          return;
        }
        
        const [companyRes, analysesRes] = await Promise.all([
          api.get(`/companies/${companyId}`), 
          api.get(`/sectors/${sectorId}/companies/${companyId}/analyses`) 
        ]);
        
        setCompany(companyRes.data);
        setAnalyses(analysesRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [sectorId, companyId]);
  
  // Format for chart
  const chartData = analyses.map(a => ({
    date: new Date(a.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    actual: a.close_price,
    predicted: a.predicted_close,
    signal: a.signal,
    color: a.signal === 'BUY' ? '#10b981' : a.signal === 'SELL' ? '#ef4444' : '#f59e0b'
  }));
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1a237e' }}>
            {label}
          </p>
          <div style={{ display: 'grid', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Actual:</span>
              <span style={{ fontWeight: '600', color: '#0066cc' }}>
                ${data.actual?.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Predicted:</span>
              <span style={{ fontWeight: '600', color: '#ff6600' }}>
                ${data.predicted?.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#666' }}>Signal:</span>
              <span style={{
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'white',
                background: data.color
              }}>
                {data.signal}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  if (loading) return <div className="loading">Loading analyses...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="company-analyses-container">
      
      {/* Header */}
      <div className="header-section">
        <Link to={`/sectors/${sectorId}/companies`} className="back-link">
          ← Back to Companies
        </Link>
        <h1>{company?.symbol}</h1>
        <p className="company-name">{company?.company_name}</p>
      </div>
      
      {/* Chart */}
      {analyses.length > 0 && (
        <div className="chart-container">
          <h2>Price Analysis Chart</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tickFormatter={v => `$${v}`}
                  tick={{ fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#0066cc" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0066cc' }}
                  activeDot={{ r: 8, stroke: '#0066cc', strokeWidth: 2, fill: 'white' }}
                  name="Actual Price"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#ff6600" 
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#ff6600' }}
                  activeDot={{ r: 7, stroke: '#ff6600', strokeWidth: 2, fill: 'white' }}
                  name="Predicted Price"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Analyses List */}
      <div className="analyses-section">
        <h2>Analyses ({analyses.length})</h2>
        {analyses.length === 0 ? (
          <p className="no-analyses">No analyses available for this company yet</p>
        ) : (
          <div className="analyses-grid">
            {analyses.map((a, i) => (
              <div 
                key={i} 
                className={`analysis-card ${a.signal.toLowerCase()}`}
              >
                <div className="analysis-header">
                  <div>
                    <strong>
                      {new Date(a.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </strong>
                    <span className={`signal-badge ${a.signal.toLowerCase()}`}>
                      {a.signal}
                    </span>
                  </div>
                  <div className="confidence">
                    Confidence: <strong>{a.confidence_score}%</strong>
                  </div>
                </div>
                
                <div className="analysis-details">
                  <div className="detail-item">
                    <span>Open:</span>
                    <strong>${a.open_price?.toFixed(2)}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Close:</span>
                    <strong>${a.close_price?.toFixed(2)}</strong>
                  </div>
                  <div className="detail-item">
                    <span>High:</span>
                    <strong>${a.high_price?.toFixed(2)}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Low:</span>
                    <strong>${a.low_price?.toFixed(2)}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Predicted Close:</span>
                    <strong>${a.predicted_close?.toFixed(2)}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Volume:</span>
                    <strong>{(a.volume / 1000000).toFixed(1)}M</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}