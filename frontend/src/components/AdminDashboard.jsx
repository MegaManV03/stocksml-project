import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Control Panel</h1>
        <p>Select what you want to manage</p>
      </div>

      <div className="dashboard-buttons">
        <div className="button-row">
          <button onClick={() => navigate('/controlPanel/users')} className="dashboard-btn">
            <div className="btn-icon">👥</div>
            <div className="btn-content">
              <h3>User Management</h3>
              <p>Manage users, roles, and permissions</p>
            </div>
          </button>
          
          <button onClick={() => navigate('/controlPanel/sectors')} className="dashboard-btn">
            <div className="btn-icon">🏢</div>
            <div className="btn-content">
              <h3>Sector Management</h3>
              <p>Manage market sectors</p>
            </div>
          </button>
        </div>

        <div className="button-row">
          <button onClick={() => navigate('/controlPanel/companies')} className="dashboard-btn">
            <div className="btn-icon">📊</div>
            <div className="btn-content">
              <h3>Company Management</h3>
              <p>Add, edit, and delete companies</p>
            </div>
          </button>
          
          <button onClick={() => navigate('/controlPanel/analyses')} className="dashboard-btn">
            <div className="btn-icon">📈</div>
            <div className="btn-content">
              <h3>Analysis Management</h3>
              <p>View and manage financial analyses</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;