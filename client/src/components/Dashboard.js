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
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { isLoaded: isAuthLoaded, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    recentInvoices: [],
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      console.log("Fetching dashboard stats...");
      // Attempt to fetch from optimized stats endpoint
      const res = await axios.get("/api/invoices/stats", config);
      console.log("Dashboard Stats Response:", res.data);
      
      const statsData = res.data;
      if (statsData && (statsData.recentInvoices || statsData.totalInvoices !== undefined)) {
        setStats({
          totalInvoices: statsData.totalInvoices || 0,
          totalRevenue: statsData.totalRevenue || 0,
          recentInvoices: Array.isArray(statsData.recentInvoices) ? statsData.recentInvoices : [],
        });
        setLoading(false);
        return;
      }
      console.warn("Stats data format mismatch, falling back...");
      throw new Error("Invalid stats data format");
    } catch (err) {
      console.warn("Optimized stats endpoint failed or returned invalid data, falling back to full fetch", err.message || err);
      
      // Fallback: Fetch all invoices and calculate stats locally
      try {
        const token = await getToken();
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        console.log("Fetching all invoices for fallback stats...");
        const res = await axios.get("/api/invoices", config);
        
        const invoicesData = res.data.invoices || (Array.isArray(res.data) ? res.data : []);
        console.log(`Fallback fetch success, found ${invoicesData.length} invoices`);
        
        const revenue = Array.isArray(invoicesData) ? invoicesData.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0) : 0;
        
        setStats({
          totalInvoices: Array.isArray(invoicesData) ? invoicesData.length : 0,
          totalRevenue: revenue,
          recentInvoices: Array.isArray(invoicesData) ? invoicesData.slice(0, 5) : [],
        });
        setError(null);
      } catch (fallbackErr) {
        console.error("Dashboard fallback fetch failed:", fallbackErr.message || fallbackErr);
        setError(`Connection Error: ${fallbackErr.message || "Failed to fetch dashboard data"}. Please check if the server is running.`);
      } finally {
        setLoading(false);
      }
    }
  }, [getToken]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get("/api/user/profile", config);
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
        <h3>Loading Dashboard...</h3>
        <p className="text-muted">Please wait while we fetch your data</p>
      </div>
    );

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger shadow-sm">
          <h4 className="alert-heading">Connection Error</h4>
          <p>{error}</p>
          <hr />
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchDashboardData();
              fetchProfile();
            }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container py-4"
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800">Dashboard Overview</h1>
          <p className="text-muted">Welcome, {user?.firstName || user?.username || 'User'}</p>
          <p className="text-muted small">{profile?.companyDetails?.name ? `Managing ${profile.companyDetails.name}` : ''}</p>
        </div>
        <div className="d-flex gap-2">
           <Link to="/invoices" className="btn btn-outline-primary shadow-sm">
            View All Invoices
          </Link>
          <Link to="/create-invoice" className="btn btn-primary shadow-sm">
            <Plus size={18} className="me-1" /> New Invoice
          </Link>
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 border-start border-primary border-4">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3 text-primary">
                <FileText size={32} />
              </div>
              <div>
                <p className="text-muted small text-uppercase fw-bold mb-1">
                  Total Invoices
                </p>
                <h3 className="mb-0">{stats.totalInvoices}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 border-start border-success border-4">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3 text-success">
                <IndianRupee size={32} />
              </div>
              <div>
                <p className="text-muted small text-uppercase fw-bold mb-1">
                  Total Revenue
                </p>
                <h3 className="mb-0">₹{(stats.totalRevenue || 0).toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 border-start border-warning border-4">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3 text-warning">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-muted small text-uppercase fw-bold mb-1">
                  System Health
                </p>
                <h3 className="mb-0 text-success">Active</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0">
          <h5 className="mb-0 fw-bold text-gray-800">Recent Invoices</h5>
          <Link
            to="/invoices"
            className="btn btn-link btn-sm text-decoration-none d-flex align-items-center"
          >
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
              {(stats.recentInvoices || []).map((invoice) => (
                <tr key={invoice._id}>
                  <td className="px-4 fw-bold">{invoice.invoiceNumber}</td>
                  <td>{invoice.customerDetails?.name || 'N/A'}</td>
                  <td>{invoice.date ? new Date(invoice.date).toLocaleDateString("en-IN") : 'N/A'}</td>
                  <td className="text-end fw-bold">
                    ₹{(invoice.grandTotal || 0).toLocaleString()}
                  </td>
                  <td className="px-4 text-center">
                    <Link
                      to={`/invoice/${invoice._id}`}
                      className="btn btn-outline-primary btn-sm rounded-pill px-3"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(!stats.recentInvoices || stats.recentInvoices.length === 0) && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No recent invoices found.
                  </td>
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
