// ResponsiveTable.jsx - Duomenų rodymas tinklelyje
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown, faEye, faEdit, faTrash, faChartLine } from '@fortawesome/free-solid-svg-icons';
import './ResponsiveTable.css';

const ResponsiveTable = ({ data = [], columns = [], onView, onEdit, onDelete }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Sortavimo funkcija
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Puslapiavimas
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return faSort;
    return sortConfig.direction === 'asc' ? faSortUp : faSortDown;
  };

  // Jei nėra duomenų
  if (data.length === 0) {
    return (
      <div className="table-empty-state">
        <FontAwesomeIcon icon={faChartLine} size="3x" />
        <h3>No Data Available</h3>
        <p>Add some companies or analyses to see them here.</p>
      </div>
    );
  }

  return (
    <div className="responsive-table-container">
      {/* Table Controls */}
      <div className="table-controls">
        <div className="items-per-page">
          <label>Show </label>
          <select 
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="page-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span> entries</span>
        </div>
        
        <div className="table-info">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, data.length)} of {data.length} entries
        </div>
      </div>

      {/* Desktop Table */}
      <div className="table-wrapper">
        <table className="desktop-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  onClick={() => column.sortable && handleSort(column.key)}
                  className={column.sortable ? 'sortable' : ''}
                  style={{ width: column.width }}
                >
                  <div className="th-content">
                    {column.title}
                    {column.sortable && (
                      <FontAwesomeIcon 
                        icon={getSortIcon(column.key)} 
                        className="sort-icon"
                      />
                    )}
                  </div>
                </th>
              ))}
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <tr 
                key={item.id || index} 
                className={index % 2 === 0 ? 'even-row' : 'odd-row'}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
                <td className="actions-cell">
                  <div className="action-buttons">
                    {onView && (
                      <button 
                        onClick={() => onView(item)} 
                        className="btn-action btn-view"
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    )}
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(item)} 
                        className="btn-action btn-edit"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(item)} 
                        className="btn-action btn-delete"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <div className="mobile-cards">
        {currentItems.map((item, index) => (
          <div key={item.id || index} className="mobile-card">
            <div className="card-header">
              <h4>{item.name || item.company_name || `Item ${index + 1}`}</h4>
              <div className="mobile-actions">
                {onView && <button onClick={() => onView(item)}><FontAwesomeIcon icon={faEye} /></button>}
                {onEdit && <button onClick={() => onEdit(item)}><FontAwesomeIcon icon={faEdit} /></button>}
                {onDelete && <button onClick={() => onDelete(item)}><FontAwesomeIcon icon={faTrash} /></button>}
              </div>
            </div>
            <div className="card-body">
              {columns.slice(0, 3).map((column) => (
                <div key={column.key} className="card-field">
                  <span className="field-label">{column.title}:</span>
                  <span className="field-value">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ResponsiveTable;