import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Search, Plus, Calendar, Eye, FileSpreadsheet, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const ChallanList = () => {
  const { getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();

  // Data State
  const [allChallans, setAllChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter State
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /**
   * HIGH-LIMIT FETCH STRATEGY
   * Ensures we get all records for accurate counting and navigation.
   */
  const fetchAllChallans = useCallback(async (isManual = false) => {
    if (!user?.id) return;

    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      const token = await getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      console.log(`[CHALLANS] Fetching from /api/challans?limit=5000`);
      const res = await api.get(`/api/challans?limit=5000`, config);
      
      const data = Array.isArray(res.data) ? res.data : (res.data.challans || res.data.data || []);
      
      if (Array.isArray(data)) {
        // Sort newest first
        const sortedData = [...data].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        setAllChallans(sortedData);
        
        // Cache management
        localStorage.setItem(`cached_challans_full_${user.id}`, JSON.stringify(sortedData.slice(0, 100)));
      }
    } catch (err) {
      console.error('[CHALLANS] Fetch error:', err.message);
      setError('Unable to sync fresh records. Displaying cached data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, user?.id]);

  // Initial Load
  useEffect(() => {
    if (isUserLoaded && user?.id) {
        const cached = localStorage.getItem(`cached_challans_full_${user.id}`);
        if (cached) {
            setAllChallans(JSON.parse(cached));
            setLoading(false);
        }
        fetchAllChallans();
    }
  }, [isUserLoaded, user?.id, fetchAllChallans]);

  /**
   * DYNAMIC FILTERING
   */
  const filteredChallans = useMemo(() => {
    return allChallans.filter(c => {
      const matchesSearch = !search || 
        c.chNo?.toLowerCase().includes(search.toLowerCase()) ||
        c.toDetails?.companyName?.toLowerCase().includes(search.toLowerCase());
      
      const matchesDate = !dateFilter || 
        new Date(c.date).toISOString().split('T')[0] === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [allChallans, search, dateFilter]);

  /**
   * DYNAMIC PAGINATION
   */
  const totalPages = Math.ceil(filteredChallans.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentChallans = filteredChallans.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteChallan = async (id) => {
    if (window.confirm('Are you sure you want to delete this challan?')) {
      try {
        const token = await getToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await api.delete(`/api/challans/${id}`, config);
        setAllChallans(prev => prev.filter(c => c._id !== id));
      } catch (err) {
        alert('Failed to delete challan.');
      }
    }
  };

  const exportToExcel = () => {
    if (filteredChallans.length === 0) return alert('No data to export');
    
    const dataToExport = [];
    filteredChallans.forEach(challan => {
      const items = challan.items || [{}];
      items.forEach(item => {
        dataToExport.push({
          'Challan No': challan.chNo || '',
          'Date': new Date(challan.date).toLocaleDateString('en-IN'),
          'Client Name': challan.toDetails?.companyName || 'N/A',
          'GSTIN': challan.gstin || 'N/A',
          'Particulars': item.particulars || '',
          'Qty': item.quantity || 0,
          'Created At': new Date(challan.createdAt).toLocaleString('en-IN')
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Challans');
    XLSX.writeFile(wb, `Challans_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isUserLoaded) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-0 fw-bold text-dark">Delivery Challans</h1>
          <p className="text-muted small mb-0">
            Total <span className="fw-bold text-primary">{allChallans.length}</span> records found
          </p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => fetchAllChallans(true)} disabled={refreshing} className="btn btn-outline-secondary btn-sm d-flex align-items-center shadow-sm">
            <RefreshCw size={16} className={`me-2 ${refreshing ? 'animate-spin' : ''}`} /> Sync
          </button>
          <button onClick={exportToExcel} className="btn btn-outline-success btn-sm d-flex align-items-center shadow-sm">
            <FileSpreadsheet size={16} className="me-2" /> Export
          </button>
          <Link to="/create-challan" className="btn btn-primary btn-sm d-flex align-items-center shadow-sm fw-bold">
            <Plus size={16} className="me-1" /> New Challan
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-md-7">
          <div className="input-group shadow-sm border-0">
            <span className="input-group-text bg-white border-0"><Search size={18} className="text-muted" /></span>
            <input 
              type="text" 
              className="form-control border-0 ps-0 shadow-none" 
              placeholder="Search by challan # or client name..." 
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

      {error && <div className="alert alert-soft-warning py-2 mb-4 border-0 shadow-sm small d-flex align-items-center">
        <RefreshCw size={14} className="me-2" /> {error}
      </div>}

      {/* Data Table Card */}
      <div className="card border-0 shadow-sm overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3">Challan #</th>
                <th className="py-3">Client Name</th>
                <th className="py-3">Date</th>
                <th className="py-3">GSTIN</th>
                <th className="py-3 text-end">Items</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && allChallans.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
              ) : (
                <>
                  {currentChallans.map(challan => (
                    <tr key={challan._id}>
                      <td className="px-4 fw-bold text-primary">{challan.chNo}</td>
                      <td>
                        <div className="fw-bold text-dark">{challan.toDetails?.companyName || 'N/A'}</div>
                        <div className="text-muted small">{challan.toDetails?.mobileNumber || ''}</div>
                      </td>
                      <td>{new Date(challan.date).toLocaleDateString('en-IN')}</td>
                      <td><span className="badge bg-light text-dark border px-2 py-1">{challan.gstin || 'N/A'}</span></td>
                      <td className="text-end fw-bold text-dark">{challan.items?.length || 0}</td>
                      <td className="px-4 text-center">
                        <div className="btn-group shadow-sm">
                          <Link to={`/challan/${challan._id}`} className="btn btn-white btn-sm border text-primary" title="View"><Eye size={16} /></Link>
                          <button onClick={() => deleteChallan(challan._id)} className="btn btn-white btn-sm border text-danger" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredChallans.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-5 text-muted">No challans found.</td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {filteredChallans.length > 0 && (
          <div className="card-footer bg-white py-3 border-top border-light d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div className="text-muted small">
              Showing <span className="fw-bold">{indexOfFirstItem + 1}</span> to <span className="fw-bold">{Math.min(indexOfLastItem, filteredChallans.length)}</span> of <span className="fw-bold">{filteredChallans.length}</span> records
            </div>
            
            <div className="d-flex gap-2">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-sm btn-outline-secondary px-3 d-flex align-items-center shadow-sm"
              >
                <ChevronLeft size={16} className="me-1" /> Previous
              </button>
              
              <div className="d-flex gap-1 d-none d-sm-flex">
                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  if (pNum === 1 || pNum === totalPages || (pNum >= currentPage - 1 && pNum <= currentPage + 1)) {
                    return (
                      <button
                        key={i}
                        onClick={() => paginate(pNum)}
                        className={`btn btn-sm ${currentPage === pNum ? 'btn-primary' : 'btn-outline-light text-dark'} px-3 shadow-sm`}
                      >
                        {pNum}
                      </button>
                    );
                  } else if (pNum === currentPage - 2 || pNum === currentPage + 2) {
                    return <span key={i} className="px-1 pt-1 text-muted">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-sm btn-outline-secondary px-3 d-flex align-items-center shadow-sm"
              >
                Next <ChevronRight size={16} className="ms-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChallanList;
