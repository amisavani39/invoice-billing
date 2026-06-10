import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useUser, useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  FileText,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Plus,
  ClipboardList,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  // State for dashboard data
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalChallans: 0,
    allInvoices: [], // Store all invoices for pagination
    systemStatus: "Connecting..."
  });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (!isAuthLoaded || !isUserLoaded || !user?.id) return;
    
    if (isManual) setRefreshing(true);
    
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed. Please log in again.");

      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      console.log(`[DASHBOARD] ${isManual ? 'Manual refresh' : 'Initial fetch'} starting...`);
      
      let fetchedInvoices = null;
      let endpointUsed = "";
      
      // Fallback Strategy: Stats API (Fast) -> Full List (Manual Calc)
      // We request a high limit (5000) to ensure we get all 39+ records for the dashboard count
      const endpoints = ["/api/dashboard/stats", "/api/invoices?limit=5000", "/api/invoice?limit=5000", "/api/bills?limit=5000"];
      
      for (const url of endpoints) {
        try {
          const res = await api.get(url, config);
          
          if (url.includes("/stats")) {
            // Optimized path: Backend already calculated everything (including real Challan count)
            const data = res.data;
            const freshStats = {
                totalInvoices: data.totalInvoices || 0,
                totalRevenue: data.revenue || data.totalRevenue || 0,
                totalChallans: data.challans || data.totalChallans || 0, // Should be 3 from DB
                allInvoices: Array.isArray(data.recentTransactions) ? data.recentTransactions : (Array.isArray(data.recentInvoices) ? data.recentInvoices : []),
                systemStatus: "Connected"
            };
            setStats(freshStats);
            endpointUsed = url;
            break;
          }

          const data = Array.isArray(res.data) ? res.data : (res.data.invoices || res.data.data || []);
          
          if (Array.isArray(data)) {
            // Fallback path: Calculate dynamically
            fetchedInvoices = data;
            endpointUsed = url;
            
            // SORT: Ensure newest are first
            fetchedInvoices.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

            const totalInvoices = fetchedInvoices.length;
            const revenue = fetchedInvoices.reduce((sum, invoice) => {
                return sum + Number(invoice.grandTotal || invoice.total || invoice.amount || 0);
            }, 0);

            // REAL CHALLAN FETCH (Fallback mode specific)
            let realChallanCount = 0;
            try {
              const challanRes = await api.get("/api/challans", config);
              const challanData = Array.isArray(challanRes.data) ? challanRes.data : (challanRes.data.challans || []);
              realChallanCount = challanData.length;
            } catch (ce) {
              console.warn("Challan fallback fetch failed, using 0");
            }

            const freshStats = {
                totalInvoices,
                totalRevenue: revenue,
                totalChallans: realChallanCount, // REQUIREMENT: Actual count (3)
                allInvoices: fetchedInvoices,
                systemStatus: "Connected"
            };
            setStats(freshStats);
            break;
          }
        } catch (e) {
          console.warn(`[DASHBOARD] Endpoint ${url} skipped: ${e.message}`);
        }
      }

      if (!endpointUsed) {
        throw new Error("No data could be retrieved from any API endpoint.");
      }

      console.log("Endpoint used:", endpointUsed);
      if (fetchedInvoices) {
          console.log("Total records fetched:", fetchedInvoices.length);
      }

      const profileRes = await api.get("/api/user/profile", config).catch(() => null);
      if (profileRes) setProfile(profileRes.data);
      
      setError(null);
    } catch (err) {
      console.error("[DASHBOARD] Fetch failed:", err.message);
      if (isManual) alert("Refresh failed: " + err.message);
      setStats(prev => ({ ...prev, systemStatus: "Error" }));
      setError("Unable to connect to service. Data might be stale.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthLoaded, isUserLoaded, user?.id, getToken]);

  const runDiagnostics = async () => {
    try {
      const token = await getToken();
      if (!token) return alert("Auth token missing");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await api.get("/api/dashboard/debug", config);
      setDebugInfo(res.data);
    } catch (err) {
      alert("Diagnostics failed: " + err.message);
    }
  };

  // Initial Load & Sync
  useEffect(() => {
    if (isUserLoaded && user?.id) {
      const cached = localStorage.getItem(`dashboard_stats_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Data Normalization: Ensure allInvoices exists
          if (!parsed.allInvoices) {
            parsed.allInvoices = parsed.recentInvoices || [];
          }
          setStats(parsed);
          setLoading(false);
        } catch (e) {
          localStorage.removeItem(`dashboard_stats_${user.id}`);
        }
      }
    }

    if (isAuthLoaded && isUserLoaded && user?.id) {
        fetchDashboardData();
    }
  }, [isAuthLoaded, isUserLoaded, user?.id, fetchDashboardData]);

  // Pagination Logic
  const allInvoices = stats.allInvoices || [];
  const totalCount = stats.totalInvoices || allInvoices.length;
  const totalPages = Math.ceil(allInvoices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = allInvoices.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading && !totalCount && !allInvoices.length) {
    return (
      <div className="container py-4 text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-0 fw-bold text-dark">Dashboard</h1>
          <p className="text-muted mb-0">{profile?.companyDetails?.name || 'GST Billing System'}</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            onClick={() => fetchDashboardData(true)} 
            disabled={refreshing}
            className="btn btn-outline-secondary btn-sm px-3 d-flex align-items-center"
          >
            <RefreshCw size={16} className={`me-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
          <button 
            onClick={runDiagnostics}
            className="btn btn-outline-info btn-sm px-3 d-flex align-items-center"
          >
            Diagnostics
          </button>
          <Link to="/create-invoice" className="btn btn-primary btn-sm px-4 fw-bold shadow-sm">
            <Plus size={18} className="me-1" /> New Invoice
          </Link>
        </div>
      </div>

      {debugInfo && (
        <div className="alert alert-info border-0 shadow-sm mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0 fw-bold">Database Diagnostics</h6>
            <button className="btn-close btn-sm" onClick={() => setDebugInfo(null)}></button>
          </div>
          <div className="row g-3 small">
            <div className="col-md-6">
              <p className="mb-1 fw-bold">Invoices:</p>
              <ul className="mb-0">
                <li>Total in DB: {debugInfo.invoices.total}</li>
                <li>Your Invoices: {debugInfo.invoices.withThisUser}</li>
                <li>Missing User ID (Orphan): {debugInfo.invoices.orphan}</li>
              </ul>
            </div>
            <div className="col-md-6">
              <p className="mb-1 fw-bold">Challans:</p>
              <ul className="mb-0">
                <li>Total in DB: {debugInfo.challans.total}</li>
                <li>Your Challans: {debugInfo.challans.withThisUser}</li>
                <li>Missing User ID (Orphan): {debugInfo.challans.orphan}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-soft-warning py-2 mb-4 border-0 shadow-sm small d-flex align-items-center">
          <RefreshCw size={14} className="me-2" /> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-4 mb-5">
        {[
          { label: 'Total Invoices', val: totalCount, icon: <FileText />, color: 'primary' },
          { label: 'Revenue', val: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: <IndianRupee />, color: 'success' },
          { label: 'Challans', val: stats.totalChallans, icon: <ClipboardList />, color: 'info' },
          { 
            label: 'System Status', 
            val: stats.systemStatus, 
            icon: <TrendingUp />, 
            color: stats.systemStatus === 'Connected' ? 'success' : (stats.systemStatus === 'Error' ? 'danger' : 'warning'), 
            isStatus: true 
          },
        ].map((card, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div className={`card border-0 shadow-sm h-100 border-start border-${card.color} border-4 transition-all hover-shadow`}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-2">
                  <div className={`rounded-circle bg-${card.color} bg-opacity-10 p-2 me-2 text-${card.color}`}>
                    {React.cloneElement(card.icon, { size: 20 })}
                  </div>
                  <span className="text-muted small text-uppercase fw-bold">{card.label}</span>
                </div>
                {card.isStatus ? (
                  <span className={`badge bg-${card.color} rounded-pill px-3 py-2 mt-1`}>{card.val}</span>
                ) : (
                  <h2 className="mb-0 fw-bold">{card.val}</h2>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="card border-0 shadow-sm mb-5">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
          <h5 className="mb-0 fw-bold">Recent Transactions</h5>
          <Link to="/invoices" className="btn btn-link btn-sm text-decoration-none fw-bold">
            Full Ledger <ArrowRight size={16} className="ms-1" />
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="py-3">Customer</th>
                <th className="py-3">Date</th>
                <th className="py-3 text-end">Amount</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoices.map((inv) => (
                <tr key={inv._id}>
                  <td className="px-4 fw-bold text-primary">{inv.invoiceNumber}</td>
                  <td>{inv.customerDetails?.name || 'N/A'}</td>
                  <td>{new Date(inv.date).toLocaleDateString("en-IN")}</td>
                  <td className="text-end fw-bold">₹{(inv.grandTotal || 0).toLocaleString()}</td>
                  <td className="px-4 text-center">
                    <Link to={`/invoice/${inv._id}`} className="btn btn-sm btn-outline-primary rounded-pill px-3">View</Link>
                  </td>
                </tr>
              ))}
              {allInvoices.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted small">
                    No recent activity found. Records will appear here as you create them.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {allInvoices.length > 0 && (
          <div className="card-footer bg-white py-3 border-0 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div className="text-muted small">
              Showing <span className="fw-bold">{indexOfFirstItem + 1}</span> to <span className="fw-bold">{Math.min(indexOfLastItem, allInvoices.length)}</span> of <span className="fw-bold">{totalCount}</span> records
            </div>
            
            <div className="d-flex gap-2">
              <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-sm btn-outline-secondary px-3 d-flex align-items-center"
              >
                <ChevronLeft size={16} className="me-1" /> Previous
              </button>
              
              <div className="d-flex gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  if (
                    totalPages <= 5 ||
                    i === 0 ||
                    i === totalPages - 1 ||
                    Math.abs(i + 1 - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-outline-light text-dark'} px-3`}
                      >
                        {i + 1}
                      </button>
                    );
                  } else if (
                    (i === 1 && currentPage > 3) ||
                    (i === totalPages - 2 && currentPage < totalPages - 2)
                  ) {
                    return <span key={i} className="px-1">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-sm btn-outline-secondary px-3 d-flex align-items-center"
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

export default Dashboard;
