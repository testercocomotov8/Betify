'use client';
import { useState, useEffect } from 'react';

export default function StatementPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', type: 'all' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    fetchData();
  }, [filters, pagination.page]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      type: filters.type,
      page: pagination.page
    });
    const res = await fetch(`/api/account/statement?${params}`);
    const json = await res.json();
    setData(json.data);
    setPagination(json.pagination);
    setLoading(false);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">📊 Account Statement</h1>
      
      <div className="filters">
        <div className="filter-group">
          <label className="filter-label">From Date</label>
          <input type="date" className="filter-input" 
            value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} />
        </div>
        <div className="filter-group">
          <label className="filter-label">To Date</label>
          <input type="date" className="filter-input"
            value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} />
        </div>
        <div className="filter-group">
          <label className="filter-label">Type</label>
          <select className="filter-select" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
            <option value="all">All</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="empty-state-text">No data available</p>
        </div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Date</th>
                <th>Credit</th>
                <th>Debit</th>
                <th>Balance</th>
                <th>Sport</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={item.id}>
                  <td>{(pagination.page - 1) * 20 + i + 1}</td>
                  <td>{item.date}</td>
                  <td className="credit">{item.credit > 0 ? `+₹${item.credit.toLocaleString()}` : '-'}</td>
                  <td className="debit">{item.debit > 0 ? `-₹${item.debit.toLocaleString()}` : '-'}</td>
                  <td>₹{item.balance.toLocaleString()}</td>
                  <td>{item.sport}</td>
                  <td>{item.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination">
            <button className="pagination-btn" disabled={pagination.page === 1}
              onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</button>
            <span className="pagination-info">Page {pagination.page} of {pagination.totalPages}</span>
            <button className="pagination-btn" disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}