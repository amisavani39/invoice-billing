import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_test_ZmluZXItYWtpdGEtNjIuY2xlcmsuYWNjb3VudHMuZGV2JA";

if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY === "undefined") {
  console.error("Clerk Publishable Key is missing! Please check your .env file.");
}

// Axios configuration
// Priority: 1. Environment variable, 2. Empty (allows proxy to work), 3. Current origin (default)
const API_URL = process.env.REACT_APP_API_URL;
if (API_URL) {
  axios.defaults.baseURL = API_URL;
}
// If API_URL is not set, axios.defaults.baseURL remains undefined/empty, 
// allowing proxy to work in dev and using the current origin in production

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);

reportWebVitals();
