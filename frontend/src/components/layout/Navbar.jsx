import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Leaf,
  AlertCircle,
  ShoppingBag,
  BarChart3,
  Wrench,
  PlusCircle,
  Menu,
  X,
  LogOut,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItemClass = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
      isActive(path)
        ? 'bg-campus-50 text-campus-800 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-campus-700 flex items-center justify-center text-white shadow-xs group-hover:bg-campus-800 transition-colors">
                <Leaf className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                  GREEN CAMPUS
                </span>
                <span className="text-[11px] text-slate-500 font-normal leading-none">
                  DYPCOE Akurdi, Pune
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {role === 'student' && (
              <>
                <Link to="/" className={navItemClass('/')}>
                  <Layers className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/issues" className={navItemClass('/issues')}>
                  <AlertCircle className="w-4 h-4" />
                  Issues
                </Link>
                <Link to="/issues/report" className={navItemClass('/issues/report')}>
                  <PlusCircle className="w-4 h-4 text-campus-700" />
                  Report Issue
                </Link>
                <Link to="/marketplace" className={navItemClass('/marketplace')}>
                  <ShoppingBag className="w-4 h-4" />
                  Marketplace
                </Link>
                <Link to="/marketplace/create" className={navItemClass('/marketplace/create')}>
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  Post Item
                </Link>
              </>
            )}

            {role === 'staff' && (
              <>
                <Link to="/staff" className={navItemClass('/staff')}>
                  <Wrench className="w-4 h-4 text-amber-600" />
                  Assigned Maintenance Tasks
                </Link>
                <Link to="/issues" className={navItemClass('/issues')}>
                  <AlertCircle className="w-4 h-4" />
                  All Campus Issues
                </Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link to="/admin" className={navItemClass('/admin')}>
                  <ShieldAlert className="w-4 h-4 text-campus-700" />
                  Admin Overview
                </Link>
                <Link to="/issues" className={navItemClass('/issues')}>
                  <AlertCircle className="w-4 h-4" />
                  Triage & Assignment
                </Link>
                <Link to="/marketplace" className={navItemClass('/marketplace')}>
                  <ShoppingBag className="w-4 h-4" />
                  Marketplace Audit
                </Link>
                <Link to="/analytics" className={navItemClass('/analytics')}>
                  <BarChart3 className="w-4 h-4 text-campus-700" />
                  Sustainability Analytics
                </Link>
              </>
            )}
          </nav>

          {/* User profile & actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 text-left">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="text-xs">
                <p className="font-medium text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-slate-500 capitalize">{role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {role === 'student' && (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                to="/issues"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Campus Issues
              </Link>
              <Link
                to="/issues/report"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-campus-700 font-semibold hover:bg-campus-50"
              >
                Report New Issue
              </Link>
              <Link
                to="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Resource Exchange
              </Link>
              <Link
                to="/marketplace/create"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Post Resource Item
              </Link>
            </>
          )}

          {role === 'staff' && (
            <>
              <Link
                to="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-amber-700 font-semibold hover:bg-amber-50"
              >
                Assigned Tasks
              </Link>
              <Link
                to="/issues"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                All Campus Issues
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Admin Overview
              </Link>
              <Link
                to="/issues"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Issue Triage & Assignments
              </Link>
              <Link
                to="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Marketplace Audit
              </Link>
              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-campus-700 font-semibold hover:bg-campus-50"
              >
                Sustainability Analytics
              </Link>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Signed in as <strong>{user?.name}</strong> ({role})
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-rose-600 font-medium hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
