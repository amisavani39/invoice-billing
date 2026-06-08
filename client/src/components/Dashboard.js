import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useUser, useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  FileText,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Plus,
  ClipboardList,
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalChallans: 0,
    recentInvoices: [],
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("--- FRONTEND DATA FETCH START ---");
      const token = await getToken();
      console.log("Clerk Token Obtained:", token ? "YES (first 10 chars: " + token.substring(0, 10) + "...)" : "NO");
      
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Use full URL to be sure during debugging
      const apiUrl = "http://localhost:5000/api/dashboard";
      console.log(`[FETCH] Requesting URL: ${apiUrl}`);
      
      const res = await axios.get(apiUrl, config);
      
      console.log(`[FETCH] Status: ${res.status}`);
      console.log(`[FETCH] Headers:`, res.headers);
      
      // Verify JSON Content-Type
      const contentType = res.headers['content-type'];
      console.log(`[FETCH] Content-Type: ${contentType}`);

      // Inspect response text if it's potentially HTML
      if (typeof res.data === 'string' && (res.data.toLowerCase().includes('<!doctype html>') || res.data.toLowerCase().includes('<html'))) {
        console.error("CRITICAL ERROR: API returned HTML instead of JSON.");
        console.log("[FETCH] Response Snippet:", res.data.substring(0, 200));
        throw new Error("API returned HTML. This usually means the request hit the React dev server or a catch-all route instead of the API.");
      }

      const statsData = res.data;
      console.log("[FETCH] Success - Data Received:", statsData);

      // React State Update
      setStats({
        totalInvoices: statsData.totalInvoices || 0,
        totalRevenue: statsData.totalRevenue || 0,
        totalChallans: statsData.totalChallans || 0,
        recentInvoices: Array.isArray(statsData.recentInvoices) ? statsData.recentInvoices : [],
      });
      
      setLoading(false);
    } catch (err) {
      console.error("--- FRONTEND DATA FETCH FAILURE ---");
      const errorMsg = err.response?.data?.msg || err.message || "Unknown error";
      console.error("Error Detail:", errorMsg);
      setError(`Connection Error: ${errorMsg}. Ensure backend is running on port 5000.`);
      setLoading(false);
    }
  }, [getToken]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get("http://localhost:5000/api/user/profile", config);
      setProfile(res.data);
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  }, [getToken]);

  useEffect(() => {
    if (isAuthLoaded && isUserLoaded) {
      fetchDashboardData();
      fetchProfile();
    }
  }, [isAuthLoaded, isUserLoaded, fetchDashboardData, fetchProfile]);


  if (!isAuthLoaded || !isUserLoaded || loading)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h3>Loading Dashboard Data...</h3>
        <p className="text-muted">Analyzing MongoDB records and calculating statistics</p>
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container py-4"
    >
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">Dashboard Overview</h1>
          <p className="text-muted mb-0">Welcome, {user?.firstName || user?.username || 'User'}</p>
          <p className="text-muted small mb-0">{profile?.companyDetails?.name ? `Managing ${profile.companyDetails.name}` : ''}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
           <Link to="/invoices" className="btn btn-outline-primary shadow-sm btn-sm">
            View All Invoices
          </Link>
          <Link to="/challans" className="btn btn-outline-primary shadow-sm btn-sm">
            View All Challans
          </Link>
          <Link to="/create-invoice" className="btn btn-primary shadow-sm btn-sm">
            <Plus size={18} className="me-1" /> New Invoice
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm mb-4">
          <strong>Backend Connection Failed:</strong> {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchDashboardData}>Retry</button>
        </div>
      )}

      {/* --- LIVE STATS CARDS --- */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 border-start border-primary border-4">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3 text-primary">
                <FileText size={32} />
              </div>
              <div>
                <p className="text-muted small text-uppercase fw-bold mb-1">Total Invoices</p>
                <h3 className="mb-0">{stats.totalInvoices}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 border-start border-success border-4">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success">
                <IndianRupee size={32} />
              </div>
              <div>
                <p className="text-muted small text-uppercase fw-bold mb-1">Total Revenue</p>
                <h3 className="mb-0">₹{(stats.totalRevenue || 0).toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 border-start border-info border-4">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3 text-info">
                <ClipboardList size={32} />
              </div>
              <div>
                <p className="text-muted small text-uppercase fw-bold mb-1">Total Challans</p>
                <h3 className="mb-0">{stats.totalChallans}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 border-start border-warning border-4">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3 text-warning">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-muted small text-uppercase fw-bold mb-1">DB Connection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RECENT INVOICES TABLE --- */}
      <div className="card border-0 shadow-sm mb-5">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
          <h5 className="mb-0 fw-bold text-gray-800">Recent Invoices (MongoDB Live)</h5>
          <Link to="/invoices" className="btn btn-link btn-sm text-decoration-none d-flex align-items-center">
            View All <ArrowRight size={16} className="ms-1" />
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
              {stats.recentInvoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td className="px-4 fw-bold">{invoice.invoiceNumber}</td>
                  <td>{invoice.customerDetails?.name || 'N/A'}</td>
                  <td>{invoice.date ? new Date(invoice.date).toLocaleDateString("en-IN") : 'N/A'}</td>
                  <td className="text-end fw-bold">₹{(invoice.grandTotal || 0).toLocaleString()}</td>
                  <td className="px-4 text-center">
                    <Link to={`/invoice/${invoice._id}`} className="btn btn-outline-primary btn-sm rounded-pill px-3">View</Link>
                  </td>
                </tr>
              ))}
              {stats.recentInvoices.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">No records found in MongoDB.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
