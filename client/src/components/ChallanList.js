import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Search, Plus, Calendar, Eye, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const ChallanList = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { isLoaded, getToken } = useAuth();
  const navigate = useNavigate();

  const fetchChallans = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const res = await axios.get('/api/challan', config);
      
      if (Array.isArray(res.data)) {
        setChallans(res.data);
      } else {
        setChallans([]);
      }
    } catch (err) {
      console.error('Error fetching challans', err);
      setChallans([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) {
      fetchChallans();
    }
  }, [isLoaded, fetchChallans]);

  const filteredChallans = challans.filter(challan => {
    const matchesSearch = 
      (challan.challanNo?.toLowerCase().includes(search.toLowerCase())) ||
      (challan.toDetails?.clientName?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesDate = !dateFilter || challan.date?.split('T')[0] === dateFilter;

    return matchesSearch && matchesDate;
  });

  const exportToExcel = () => {
    try {
      const dataToExport = [];
      
      filteredChallans.forEach(challan => {
        const items = challan.items && challan.items.length > 0 ? challan.items : [{}];
        
        items.forEach(item => {
          dataToExport.push({
            'Challan No': challan.challanNo,
            'Date': new Date(challan.date).toLocaleDateString('en-IN'),
            'P.O. No': challan.poNo || 'N/A',
            'Client Name': challan.toDetails?.clientName,
            'Client GSTIN': challan.toDetails?.gstin || 'N/A',
            'From Name': challan.fromDetails?.name || 'N/A',
            'From Address': challan.fromDetails?.address || 'N/A',
            
            // Item Details
            'Item Description': item.particulars || 'N/A',
            'Quantity': item.quantity || 0,
            'Rate': item.rate || 0,
            'Per': item.per || 'N/A',
            'Amount': (item.quantity || 0) * (item.rate || 0),

            'Created At': challan.createdAt ? new Date(challan.createdAt).toLocaleString('en-IN') : 'N/A'
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Challans');
      XLSX.writeFile(wb, `Challans_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exporting to Excel', err);
    }
  };

  if (!isLoaded) return <div className="container py-5 text-center"><h3>Loading...</h3></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button onClick={() => navigate("/dashboard")} className="btn btn-sm btn-outline-secondary mb-2 d-flex align-items-center">
            <ArrowLeft size={14} className="me-1" /> Back to Dashboard
          </button>
          <h1 className="h3 mb-0 text-gray-800">Delivery Challans</h1>
          <p className="text-muted small">Manage and track your delivery challans ({filteredChallans.length} total)</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportToExcel} className="btn btn-outline-success d-flex align-items-center">
            <FileSpreadsheet size={18} className="me-2" /> Export Excel
          </button>
          <Link to="/create-challan" className="btn btn-primary d-flex align-items-center">
            <Plus size={18} className="me-2" /> Create Challan
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-7">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Search size={18} className="text-muted" />
            </span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-0" 
              placeholder="Search by challan number or client name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-5">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Calendar size={18} className="text-muted" />
            </span>
            <input 
              type="date" 
              className="form-control border-start-0 ps-0" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {dateFilter && (
              <button className="btn btn-outline-secondary" onClick={() => setDateFilter('')}>Clear</button>
            )}
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3">Challan #</th>
                <th className="py-3">Client Name</th>
                <th className="py-3">Date</th>
                <th className="py-3">GSTIN</th>
                <th className="py-3 text-end">Items</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredChallans.map(challan => (
                    <tr key={challan._id}>
                      <td className="px-4 fw-bold text-primary">{challan.challanNo}</td>
                      <td>
                        <div className="fw-bold">{challan.toDetails?.clientName || 'N/A'}</div>
                      </td>
                      <td>{new Date(challan.date).toLocaleDateString('en-IN')}</td>
                      <td><span className="badge bg-light text-dark border">{challan.toDetails?.gstin || 'N/A'}</span></td>
                      <td className="text-end fw-bold">{challan.items?.length || 0}</td>
                      <td className="px-4 text-center">
                        <div className="btn-group">
                          <Link to={`/challan/${challan._id}`} className="btn btn-outline-primary btn-sm" title="View & Print">
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredChallans.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="text-muted mb-2">No challans found matching your criteria.</div>
                        <Link to="/create-challan" className="btn btn-sm btn-link">Create your first challan</Link>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ChallanList;
