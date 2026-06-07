import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { FileText, PlusCircle, LayoutDashboard, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <div className="logo-wrapper">
            <FileText className="logo-icon" size={24} />
          </div>
          <span className="logo-text">SHREE SHYAM FAB <span className="text-primary"></span></span>
        </Link>

        {/* Desktop Menu */}
        <SignedIn>
          <ul className="nav-menu desktop-only">
            <li className="nav-item">
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/invoices" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"}>
                <FileText size={18} />
                <span>Invoices</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/challans" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"}>
                <FileText size={18} />
                <span>Challans</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/create-challan" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"}>
                <PlusCircle size={18} />
                <span>New Challan</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/create-invoice" className={({ isActive }) => isActive ? "nav-links active" : "nav-links"}>
                <PlusCircle size={18} />
                <span>New Invoice</span>
              </NavLink>
            </li>
          </ul>
          <div className="nav-actions desktop-only">
            <UserButton 
              afterSignOutUrl="/login" 
              appearance={{
                elements: {
                  avatarBox: "user-avatar-box"
                }
              }}
            />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="nav-auth desktop-only">
            <Link to="/login" className="nav-btn-primary">Login</Link>
          </div>
        </SignedOut>

        {/* Mobile Toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <SignedIn>
            <div className="mobile-user-info">
              <UserButton afterSignOutUrl="/login" />
              <span>Account Settings</span>
            </div>
            <ul className="mobile-nav-list">
              <li>
                <NavLink to="/dashboard" className="mobile-nav-link" onClick={closeMobileMenu}>
                  <LayoutDashboard size={20} />
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/invoices" className="mobile-nav-link" onClick={closeMobileMenu}>
                  <FileText size={20} />
                  Invoices
                </NavLink>
              </li>
              <li>
                <NavLink to="/challans" className="mobile-nav-link" onClick={closeMobileMenu}>
                  <FileText size={20} />
                  Challans
                </NavLink>
              </li>
              <li>
                <NavLink to="/create-challan" className="mobile-nav-link" onClick={closeMobileMenu}>
                  <PlusCircle size={20} />
                  New Challan
                </NavLink>
              </li>
              <li>
                <NavLink to="/create-invoice" className="mobile-nav-link" onClick={closeMobileMenu}>
                  <PlusCircle size={20} />
                  New Invoice
                </NavLink>
              </li>
            </ul>
          </SignedIn>
          <SignedOut>
            <div className="mobile-auth-btns">
              <Link to="/login" className="nav-btn-primary full-width" onClick={closeMobileMenu}>Login</Link>
            </div>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
