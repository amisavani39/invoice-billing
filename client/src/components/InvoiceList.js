import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Search, Eye, Plus, Calendar, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';


const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const { isLoaded, getToken } = useAuth();

  const fetchInvoices = useCallback(async (searchTerm = '', date = '', pageNum = 1) => {
    try {
      setLoading(true);
      // Get token from Clerk
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      // Ensure searchTerm and date are clean
      const q = searchTerm || '';
      const d = date || '';
      const apiUrl = `/api/invoices?search=${q}&date=${d}&page=${pageNum}&limit=10`;
      console.log(`[FETCH] Invoices from: ${apiUrl}`);
      const res = await axios.get(apiUrl, config);
      
      if (res.data && Array.isArray(res.data.invoices)) {
        setInvoices(res.data.invoices);
        setTotalPages(res.data.pages || 1);
        setTotalInvoices(res.data.total || 0);
        setPage(res.data.page || 1);
      } else if (Array.isArray(res.data)) {
        // Fallback for old API format
        setInvoices(res.data);
        setTotalPages(1);
        setTotalInvoices(res.data.length);
        setPage(1);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Error fetching invoices', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) {
      fetchInvoices(search, dateFilter, page);
    }
  }, [isLoaded, fetchInvoices, page, search, dateFilter]);

  const deleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const token = await getToken();
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        await axios.delete(`/api/invoices/${id}`, config);
        
        // Update local state
        setInvoices(invoices.filter(inv => inv._id !== id));
        // You can add a message state here too if needed
      } catch (err) {
        console.error('Error deleting invoice:', err);
        alert('Failed to delete invoice');
      }
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
    if (isLoaded) fetchInvoices(value, dateFilter, 1);
  };

  const handleDateFilter = (e) => {
    const value = e.target.value;
    setDateFilter(value);
    setPage(1);
    if (isLoaded) fetchInvoices(search, value, 1);
  };

  const exportToExcel = async () => {
    try {
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`/api/invoices?search=${search}&date=${dateFilter}&limit=${totalInvoices || 1000}`, config);
      const allMatchingInvoices = res.data.invoices || res.data;

      if (!Array.isArray(allMatchingInvoices)) return;

      const dataToExport = [];
      
      allMatchingInvoices.forEach(inv => {
        const products = inv.products && inv.products.length > 0 ? inv.products : [{}];
        
        products.forEach(prod => {
          dataToExport.push({
            'Invoice No': inv.invoiceNumber,
            'Date': new Date(inv.date).toLocaleDateString('en-IN'),
            'Order No': inv.orderNumber || 'N/A',
            'Order Date': inv.orderDate ? new Date(inv.orderDate).toLocaleDateString('en-IN') : 'N/A',
            'Customer Name': inv.customerDetails.name,
            'GSTIN': inv.customerDetails.gstNumber || 'N/A',
            'Mobile': inv.customerDetails.mobileNumber || 'N/A',
            'Billing Address': inv.customerDetails.billingAddress || 'N/A',
            'Shipping Address': inv.customerDetails.shippingAddress || 'N/A',
            'State': inv.customerDetails.state || 'N/A',
            'State Code': inv.customerDetails.stateCode || 'N/A',
            'Transport': inv.transportName || 'N/A',
            'E-Way Bill': inv.eWayBill || 'N/A',
            'Parcel/Bag': inv.parcelBag || 'N/A',
            
            // Product Details
            'Item Description': prod.description || 'N/A',
            'HSN': prod.hsn || 'N/A',
            'GST %': prod.gstPercent || 0,
            'Quantity': prod.quantity || 0,
            'UOM': prod.uom || 'N/A',
            'Rate': prod.rate || 0,
            'Amount': prod.amount || 0,

            // Totals
            'Sub Total': inv.subTotal || 0,
            'P&F Charges': inv.pandFCharges || 0,
            'Taxable Amount': inv.taxableAmount || 0,
            'CGST': inv.cgst || 0,
            'SGST': inv.sgst || 0,
            'IGST': inv.igst || 0,
            'Round Off': inv.roundOff || 0,
            'Grand Total': inv.grandTotal || 0,
            'Tax In Words': inv.taxAmountInWords || 'N/A',
            'Grand Total In Words': inv.netAmountInWords || 'N/A',
            
            // Company Details
            'Company Name': inv.companyDetails?.name || 'N/A',
            'Company Address': inv.companyDetails?.address || 'N/A',
            'Company GSTIN': inv.companyDetails?.gstNumber || 'N/A',
            'Company Phone': inv.companyDetails?.phone || 'N/A',

            // Other Details
            'Bank Name': inv.bankDetails?.bankName || 'N/A',
            'Account No': inv.bankDetails?.accountNumber || 'N/A',
            'IFSC Code': inv.bankDetails?.ifscCode || 'N/A',
            'Branch': inv.bankDetails?.branchName || 'N/A',
            'Terms': (inv.terms || []).join(' | '),
            'Created At': inv.createdAt ? new Date(inv.createdAt).toLocaleString('en-IN') : 'N/A'
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
      XLSX.writeFile(wb, `Invoices_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exporting to Excel', err);
    }
  };

  if (!isLoaded) return <div className="container py-5 text-center"><h3>Loading...</h3></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">Invoices</h1>
          <p className="text-muted small">Manage and track your GST invoices ({totalInvoices} total)</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportToExcel} className="btn btn-outline-success d-flex align-items-center">
            <FileSpreadsheet size={18} className="me-2" /> Export Excel
          </button>
          <Link to="/create-invoice" className="btn btn-primary d-flex align-items-center">
            <Plus size={18} className="me-2" /> Create Invoice
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
              placeholder="Search by invoice number or customer name..." 
              value={search}
              onChange={handleSearch}
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
              onChange={handleDateFilter}
            />
            {dateFilter && (
              <button className="btn btn-outline-secondary" onClick={() => { setDateFilter(''); fetchInvoices(search, '', 1); }}>Clear</button>
            )}
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="py-3">Customer Name</th>
                <th className="py-3">Date</th>
                <th className="py-3">GSTIN</th>
                <th className="py-3 text-end">Grand Total</th>
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
                  {invoices.map(invoice => (
                    <tr key={invoice._id}>
                      <td className="px-4 fw-bold text-primary">{invoice.invoiceNumber}</td>
                      <td>
                        <div className="fw-bold">{invoice.customerDetails?.name || 'N/A'}</div>
                        <div className="text-muted small">{invoice.customerDetails?.mobileNumber || ''}</div>
                      </td>
                      <td>{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                      <td><span className="badge bg-light text-dark border">{invoice.customerDetails?.gstNumber || 'N/A'}</span></td>
                      <td className="text-end fw-bold">₹{(invoice.grandTotal || 0).toLocaleString()}</td>
                      <td className="px-4 text-center">
                        <div className="btn-group">
                          <Link to={`/invoice/${invoice._id}`} className="btn btn-outline-primary btn-sm" title="View Detail">
                            <Eye size={16} />
                          </Link>
                          <button 
                            onClick={() => deleteInvoice(invoice._id)} 
                            className="btn btn-outline-danger btn-sm" 
                            title="Delete Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="text-muted mb-2">No invoices found matching your criteria.</div>
                        <Link to="/create-invoice" className="btn btn-sm btn-link">Create your first invoice</Link>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="card-footer bg-white py-3 border-0">
            <nav aria-label="Page navigation">
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InvoiceList;
