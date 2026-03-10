import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './CompanyAnalyses.css';
import api from '../services/auth';
import { createChart } from 'lightweight-charts';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function CompanyAnalyses() {
  const { sectorId, companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('15m');

  useEffect(() => {
    const fetchPredictions = async () => {
      if (analyses.length === 0) return;
      try {
        const predictionsRes = await api.get(`/predictions/company/${companyId}`);
        const predictionsMap = {};
        predictionsRes.data.forEach(p => {
          predictionsMap[p.stock_price_id] = p;
        });
        const enrichedData = analyses.map(analysis => ({
          ...analysis,
          predictions: predictionsMap[analysis.id] || null
        }));
        createChartWithData(enrichedData);
      } catch (err) {
        console.error('Error fetching predictions:', err);
      }
    };
    fetchPredictions();
  }, [analyses, companyId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        ///
        ///###if (!token) {
        //  setError('Please login to view analyses');
        //  setLoading(false);
        //  return;
        //}
        ///
        const [companyRes, stockPricesRes] = await Promise.all([
          api.get(`/companies/${companyId}`), 
          api.get(`/companies/${companyId}/stock-prices?timeframe=${timeframe}`)
        ]);
        setCompany(companyRes.data);
        setAnalyses(stockPricesRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sectorId, companyId, timeframe]);

  const createChartWithData = (data) => {
    const chartContainer = document.getElementById('candlestick-chart');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';
    
    // In createChartWithData function, update the chart options:
    const getChartHeight = () => {
      if (window.innerWidth <= 480) return 250;
      if (window.innerWidth <= 768) return 300;
      return 500;
    };

    const chart = createChart(chartContainer, {
      width: chartContainer.clientWidth,
      height: getChartHeight(),
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        timeVisible: true,
        tickMarkFormatter: (time) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        borderVisible: true,
        borderColor: '#d1d5db',
        visible: true,
        secondsVisible: false,
        shiftVisibleRangeOnNewBar: true,
        allowShiftVisibleRangeOnWhitespaceReplacement: true,
      },
    });

    const longSeries = chart.addLineSeries({
      color: '#10b981',
      lineWidth: 1.5,
      priceScaleId: 'left',
      lineStyle: 2,
      lineVisible: true,
      crosshairMarkerVisible: false,
    });

    const shortSeries = chart.addLineSeries({
      color: '#ef4444',
      lineWidth: 1.5,
      priceScaleId: 'left',
      lineStyle: 2,
      lineVisible: true,
      crosshairMarkerVisible: false,
    });

    chart.priceScale('left').applyOptions({
      visible: false,
      scaleMargins: { top: 0.2, bottom: 0.2 },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const chartData = data
      .map(item => ({
        time: new Date(item.date).getTime() / 1000,
        open: item.open_price,
        high: item.high_price,
        low: item.low_price,
        close: item.close_price,
      }))
      .filter((item, index, self) => 
        index === self.findIndex(t => t.time === item.time)
      )
      .sort((a, b) => a.time - b.time);

    candlestickSeries.setData(chartData);

    const longData = data
      .filter(item => item.predictions?.long_probability)
      .map(item => ({
        time: new Date(item.date).getTime() / 1000,
        value: item.predictions.long_probability * 100,
      }))
      .sort((a, b) => a.time - b.time);

    const shortData = data
      .filter(item => item.predictions?.short_probability)
      .map(item => ({
        time: new Date(item.date).getTime() / 1000,
        value: item.predictions.short_probability * 100,
      }))
      .sort((a, b) => a.time - b.time);

    if (longData.length > 0) longSeries.setData(longData);
    if (shortData.length > 0) shortSeries.setData(shortData);

    chartContainer.style.position = 'relative';

    const probabilityDisplay = document.createElement('div');
    probabilityDisplay.style = 'position: absolute; top: 10px; right: 10px; background: white; padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 1000; display: none; color: black;';
    chartContainer.appendChild(probabilityDisplay);

    chart.subscribeCrosshairMove(param => {
      if (!param.time) {
        probabilityDisplay.style.display = 'none';
        return;
      }
      const dataPoint = data.find(item => 
        Math.floor(new Date(item.date).getTime() / 1000) === param.time
      );
      if (dataPoint?.predictions) {
        probabilityDisplay.style.display = 'block';
        probabilityDisplay.innerHTML = `
          <span style="color: #10b981; margin-right: 10px;">L: ${(dataPoint.predictions.long_probability * 100).toFixed(1)}%</span>
          <span style="color: #ef4444;">S: ${(dataPoint.predictions.short_probability * 100).toFixed(1)}%</span>
        `;
      } else {
        probabilityDisplay.style.display = 'none';
      }
    });

    const handleResize = () => {
      const newHeight = getChartHeight();
      chart.applyOptions({ 
        width: chartContainer.clientWidth,
        height: newHeight 
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  };

  if (loading) return <div className="loading">Loading analyses...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="company-analyses-container">
      <div className="controls">
        <h1 className="company-ticker">{company?.symbol}</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select className="timeframe-select" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="30m">30m</option>
            <option value="1h">1h</option>
          </select>
          <span className="live-text">
          <span className="dot"></span>
          Live data with yfinance and predictions with transformer
        </span>
        </div>
      </div>

      {analyses.length > 0 && (
        <div className="chart-wrapper">
          <div id="candlestick-chart" />
        </div>
      )}
    </div>
  );
}