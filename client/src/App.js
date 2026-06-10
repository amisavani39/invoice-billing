import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import api from './utils/api';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import InvoiceDetail from './components/InvoiceDetail';
import ChallanForm from './components/ChallanForm';
import ChallanList from './components/ChallanList';
import ChallanDetail from './components/ChallanDetail';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const location = useLocation();

  // WAKE UP BACKEND (Render Cold Start Mitigation)
  useEffect(() => {
    const wakeUp = async () => {
      try {
        console.log('[SYSTEM] Waking up backend...');
        await api.get('/api/health');
        console.log('[SYSTEM] Backend is awake.');
      } catch (err) {
        console.warn('[SYSTEM] Backend wake-up ping failed (expected if cold).');
      }
    };
    wakeUp();
  }, []);

  return (
    <div className="App">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login/*" element={<Login />} />
          <Route path="/register/*" element={<Register />} />
          
          <Route path="/dashboard" element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />
          
          <Route path="/challans" element={
            <>
              <SignedIn>
                <ChallanList />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />

          <Route path="/challan/:id" element={
            <>
              <SignedIn>
                <ChallanDetail />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />

          <Route path="/create-challan" element={
            <>
              <SignedIn>
                <ChallanForm />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />

          <Route path="/create-invoice" element={
            <>
              <SignedIn>
                <InvoiceForm />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />
          
          <Route path="/invoices" element={
            <>
              <SignedIn>
                <InvoiceList />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />
          
          <Route path="/invoice/:id" element={
            <>
              <SignedIn>
                <InvoiceDetail />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
