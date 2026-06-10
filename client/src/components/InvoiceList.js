import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Search, Eye, Plus, Calendar, FileSpreadsheet, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const InvoiceList = () => {
  const { getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  // Data State
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter State
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  /**
   * HIGH-LIMIT FETCH (Requirement: Fetch all 39 records for proper counting)
   */
  const fetchAllInvoices = useCallback(async (isManual = false) => {
    if (!user?.id) return;

    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      const token = await getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      console.log(`[INVOICES] Fetching from /api/invoices?limit=5000`);
      const res = await api.get(`/api/invoices?limit=5000`, config);
      
      const data = Array.isArray(res.data) ? res.data : (res.data.invoices || res.data.data || []);
      
      if (Array.isArray(data)) {
        // Sort: Latest first
        const sortedData = [...data].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setAllInvoices(sortedData);
        
        // Local Cache for instant UI
        localStorage.setItem(`cached_invoices_list_${user.id}`, JSON.stringify(sortedData.slice(0, 100)));
      }
    } catch (err) {
      console.error('[INVOICES] Fetch error:', err.message);
      setError('Unable to sync fresh records. Database may be offline.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, user?.id]);

  // Initial Sync
  useEffect(() => {
    if (isUserLoaded && user?.id) {
        const cached = localStorage.getItem(`cached_invoices_list_${user.id}`);
        if (cached) {
            setAllInvoices(JSON.parse(cached));
            setLoading(false);
        }
        fetchAllInvoices();
    }
  }, [isUserLoaded, user?.id, fetchAllInvoices]);

  /**
   * DYNAMIC FILTERING & PAGINATION LOGIC
   */
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const matchesSearch = !search || 
        inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        inv.customerDetails?.name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesDate = !dateFilter || 
        new Date(inv.date).toISOString().split('T')[0] === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [allInvoices, search, dateFilter]);

  const totalRecords = filteredInvoices.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastItem = currentPage * recordsPerPage;
  const indexOfFirstItem = indexOfLastItem - recordsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

  // Handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteInvoice = async (id) => {
    if (window.confirm('Delete this invoice permanent?')) {
      try {
        const token = await getToken();
        await api.delete(`/api/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setAllInvoices(prev => prev.filter(inv => inv._id !== id));
      } catch (err) {
        alert('Delete failed.');
      }
    }
  };

  const exportToExcel = () => {
    if (totalRecords === 0) return alert('No data to export');
    const dataToExport = filteredInvoices.map(inv => ({
      'Invoice No': inv.invoiceNumber,
      'Date': new Date(inv.date).toLocaleDateString('en-IN'),
      'Customer': inv.customerDetails?.name || 'N/A',
      'Amount': inv.grandTotal || 0,
      'Status': inv.status || 'PENDING'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, `Invoices_Export.xlsx`);
  };

  if (!isUserLoaded) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-4">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-0 fw-bold text-dark">Invoices</h1>
          <p className="text-muted small mb-0">Total <span className="fw-bold text-primary">{totalRecords}</span> records found in database</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => fetchAllInvoices(true)} disabled={refreshing} className="btn btn-outline-secondary btn-sm d-flex align-items-center shadow-sm">
            <RefreshCw size={16} className={`me-2 ${refreshing ? 'animate-spin' : ''}`} /> Sync
          </button>
          <button onClick={exportToExcel} className="btn btn-outline-success btn-sm d-flex align-items-center shadow-sm">
            <FileSpreadsheet size={16} className="me-2" /> Export
          </button>
          <Link to="/create-invoice" className="btn btn-primary btn-sm d-flex align-items-center shadow-sm fw-bold">
            <Plus size={16} className="me-1" /> New Invoice
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="row g-3 mb-4">
        <div className="col-md-7">
          <div className="input-group shadow-sm border-0">
            <span className="input-group-text bg-white border-0"><Search size={18} className="text-muted" /></span>
            <input 
              type="text" 
              className="form-control border-0 ps-0 shadow-none" 
              placeholder="Search invoice number or customer..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
        <div className="col-md-5">
          <div className="input-group shadow-sm border-0">
            <span className="input-group-text bg-white border-0"><Calendar size={18} className="text-muted" /></span>
            <input 
              type="date" 
              className="form-control border-0 ps-0 shadow-none" 
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card border-0 shadow-sm overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                <th className="px-4 py-3">Invoice #</th>
                <th className="py-3">Customer Details</th>
                <th className="py-3">Date</th>
                <th className="py-3">GSTIN</th>
                <th className="py-3 text-end">Grand Total</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && allInvoices.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
              ) : (
                <>
                  {currentInvoices.map(inv => (
                    <tr key={inv._id} className="transition-all hover-bg-light">
                      <td className="px-4 fw-bold text-primary">{inv.invoiceNumber}</td>
                      <td>
                        <div className="fw-bold text-dark">{inv.customerDetails?.name || 'N/A'}</div>
                        <div className="text-muted x-small">{inv.customerDetails?.mobileNumber || ''}</div>
                      </td>
                      <td>{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                      <td><span className="badge bg-light text-dark border px-2 py-1 font-monospace">{inv.customerDetails?.gstNumber || 'N/A'}</span></td>
                      <td className="text-end fw-bold text-dark">₹{(inv.grandTotal || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 text-center">
                        <div className="btn-group shadow-sm">
                          <Link to={`/invoice/${inv._id}`} className="btn btn-white btn-sm border text-primary" title="View"><Eye size={16} /></Link>
                          <button onClick={() => deleteInvoice(inv._id)} className="btn btn-white btn-sm border text-danger" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-5 text-muted">No records found matching criteria.</td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Requirement: Professional Bootstrap Pagination Footer */}
        {totalRecords > 0 && (
          <div className="card-footer bg-white py-3 border-top border-light">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              {/* Left Side: Summary */}
              <div className="text-muted small" style={{ fontSize: '13.5px' }}>
                Showing <span className="fw-bold text-dark">{indexOfFirstItem + 1}</span> to{' '}
                <span className="fw-bold text-dark">{Math.min(indexOfLastItem, totalRecords)}</span> of{' '}
                <span className="fw-bold text-dark">{totalRecords}</span> records
              </div>
              
              {/* Right Side: Pagination */}
              <nav aria-label="Invoice Navigation">
                <ul className="pagination pagination-sm mb-0 gap-1 align-items-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                        className="page-link border shadow-sm px-3 py-2 d-flex align-items-center bg-white text-dark rounded"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} className="me-1" /> Previous
                    </button>
                  </li>
                  
                  <div className="d-flex gap-1 mx-2">
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (totalPages > 6 && (p > 3 && p < totalPages - 2 && Math.abs(p - currentPage) > 1)) {
                         if (p === 4 || p === totalPages - 2) return <span key={p} className="px-1 text-muted">...</span>;
                         return null;
                      }
                      return (
                        <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                          <button 
                            className={`page-link border shadow-sm rounded px-3 py-2 fw-medium ${currentPage === p ? 'bg-primary text-white' : 'bg-white text-dark hover-blue'}`}
                            onClick={() => handlePageChange(p)}
                            style={{ minWidth: '40px', textAlign: 'center' }}
                          >
                            {p}
                          </button>
                        </li>
                      );
                    })}
                  </div>

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                        className="page-link border shadow-sm px-3 py-2 d-flex align-items-center bg-white text-dark rounded"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight size={16} className="ms-1" />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .hover-bg-light:hover { background-color: #f8f9fa !important; }
        .page-link { color: #2d3436; transition: all 0.2s; }
        .page-link:focus { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1); }
        .hover-blue:hover { background-color: #f0f7ff !important; color: #0d6efd !important; border-color: #0d6efd !important; }
        .page-item.active .page-link { border-color: #0d6efd !important; }
        .page-item.disabled .page-link { opacity: 0.6; pointer-events: none; background-color: #f8f9fa !important; }
        .btn-white { background: white; }
        .btn-white:hover { background: #f8f9fa; }
        .transition-all { transition: all 0.2s ease-in-out; }
        @media (max-width: 768px) {
            .pagination { font-size: 12px; }
            .page-link { padding: 0.4rem 0.6rem; }
        }
      `}</style>
    </motion.div>
  );
};

export default InvoiceList;
