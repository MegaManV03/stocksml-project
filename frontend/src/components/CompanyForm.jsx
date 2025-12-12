// CompanyForm.jsx - Pilna forma su visais input tipais (laboratorinio reikalavimas)
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import './CompanyForm.css';

const CompanyForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    company_name: '',
    sector_id: '',
    market_cap: '',
    pe_ratio: '',
    revenue: '',
    eps: '',
    profit_margin: '',
    debt_to_equity: '',
    next_earnings_date: '',
    earnings_estimate: '',
    dividend_yield: '',
    is_public: false,
    risk_level: 'medium'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="company-form-container fade-in">
      <h2>Add New Company</h2>
      <p className="form-description">Fill in all required fields with different input types</p>
      
      <form onSubmit={handleSubmit} className="company-form">
        {/* Teksto input - 1 */}
        <div className="form-row">
          <div className="form-group">
            <label>
              Symbol * <span className="hint">(e.g., AAPL, TSLA)</span>
            </label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              placeholder="AAPL"
              required
              maxLength="10"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="Apple Inc."
              required
              className="form-control"
            />
          </div>
        </div>

        {/* Dropdown (select) - 2 */}
        <div className="form-group">
          <label>Sector *</label>
          <select
            name="sector_id"
            value={formData.sector_id}
            onChange={handleChange}
            required
            className="form-control"
          >
            <option value="">Select a sector</option>
            <option value="1">Technology</option>
            <option value="2">Healthcare</option>
            <option value="3">Finance</option>
            <option value="4">Energy</option>
            <option value="5">Consumer Goods</option>
          </select>
        </div>

        {/* Number inputs - 3 */}
        <div className="form-row">
          <div className="form-group">
            <label>Market Cap ($ billions)</label>
            <input
              type="number"
              name="market_cap"
              value={formData.market_cap}
              onChange={handleChange}
              placeholder="2800"
              step="0.01"
              min="0"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>P/E Ratio</label>
            <input
              type="number"
              name="pe_ratio"
              value={formData.pe_ratio}
              onChange={handleChange}
              placeholder="28.5"
              step="0.01"
              min="0"
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Revenue ($ billions)</label>
            <input
              type="number"
              name="revenue"
              value={formData.revenue}
              onChange={handleChange}
              placeholder="383.3"
              step="0.01"
              min="0"
              className="form-control"
            />
          </div>
        </div>

        {/* Date input - 4 */}
        <div className="form-group">
          <label>Next Earnings Date</label>
          <input
            type="date"
            name="next_earnings_date"
            value={formData.next_earnings_date}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        {/* Range slider - 5 */}
        <div className="form-group">
          <label>
            Risk Level: <span className="risk-value">{formData.risk_level}</span>
          </label>
          <input
            type="range"
            name="risk_level"
            value={formData.risk_level === 'low' ? 1 : formData.risk_level === 'medium' ? 2 : 3}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setFormData(prev => ({
                ...prev,
                risk_level: val === 1 ? 'low' : val === 2 ? 'medium' : 'high'
              }));
            }}
            min="1"
            max="3"
            step="1"
            className="range-slider"
          />
          <div className="range-labels">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        {/* Checkbox - 6 */}
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              className="checkbox-input"
            />
            <span className="checkmark"></span>
            Publicly Traded Company
          </label>
        </div>

        {/* Radio buttons - 7 */}
        <div className="form-group">
          <label>Listing Exchange</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="exchange"
                value="NYSE"
                onChange={() => setFormData(prev => ({ ...prev, exchange: 'NYSE' }))}
                className="radio-input"
              />
              <span className="radiomark"></span>
              NYSE
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="exchange"
                value="NASDAQ"
                onChange={() => setFormData(prev => ({ ...prev, exchange: 'NASDAQ' }))}
                className="radio-input"
              />
              <span className="radiomark"></span>
              NASDAQ
            </label>
          </div>
        </div>

        {/* Textarea - 8 */}
        <div className="form-group">
          <label>Company Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Brief description of the company..."
            rows="3"
            className="form-control textarea"
          />
        </div>

        {/* Buttons */}
        <div className="form-actions">
          <button type="button" className="btn btn-cancel" onClick={onCancel}>
            <FontAwesomeIcon icon={faTimes} /> Cancel
          </button>
          <button type="submit" className="btn btn-submit">
            <FontAwesomeIcon icon={faSave} /> Save Company
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyForm;