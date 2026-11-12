import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  AlertCircle,
  Plus,
  ShoppingBag,
  Clock,
  Wrench,
  ShieldAlert,
  BarChart3,
  Layers,
} from 'lucide-react';

export default function MobileBottomNav() {
  const { role } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItemClass = (path) =>
    `flex-1 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 text-[11px] font-medium transition-colors ${
      isActive(path)
        ? 'text-campus-700 font-semibold'
        : 'text-slate-500 hover:text-slate-800'
    }`;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto h-14">
        {role === 'student' && (
          <>
            <Link to="/" className={navItemClass('/')} aria-label="Student Dashboard">
              <LayoutDashboard className={`w-5 h-5 ${isActive('/') ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Dashboard</span>
            </Link>

            <Link to="/issues" className={navItemClass('/issues')} aria-label="Campus Issues">
              <AlertCircle className={`w-5 h-5 ${isActive('/issues') && location.pathname !== '/issues/report' && location.pathname !== '/issues/my' ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Issues</span>
            </Link>

            {/* Center Elevated Action: Report Issue */}
            <div className="flex-1 flex flex-col items-center justify-center -mt-4">
              <Link
                to="/issues/report"
                className="w-12 h-12 rounded-full bg-campus-700 text-white flex items-center justify-center shadow-lg hover:bg-campus-800 active:scale-95 transition-transform border-4 border-slate-50 focus:outline-none focus:ring-2 focus:ring-campus-600 focus:ring-offset-2"
                aria-label="Report New Campus Issue"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </Link>
              <span className="text-[10px] font-bold text-campus-800 mt-0.5">Report</span>
            </div>

            <Link to="/marketplace" className={navItemClass('/marketplace')} aria-label="Resource Exchange">
              <ShoppingBag className={`w-5 h-5 ${isActive('/marketplace') && location.pathname !== '/marketplace/create' ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Market</span>
            </Link>

            <Link to="/issues/my" className={navItemClass('/issues/my')} aria-label="My Reported Issues">
              <Clock className={`w-5 h-5 ${isActive('/issues/my') ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Activity</span>
            </Link>
          </>
        )}

        {role === 'staff' && (
          <>
            <Link to="/staff" className={navItemClass('/staff')} aria-label="Assigned Maintenance Tasks">
              <Wrench className={`w-5 h-5 ${isActive('/staff') ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">My Work</span>
            </Link>

            <Link to="/issues" className={navItemClass('/issues')} aria-label="All Campus Issues">
              <AlertCircle className={`w-5 h-5 ${isActive('/issues') ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">All Issues</span>
            </Link>

            <Link to="/" className={navItemClass('/')} aria-label="Technician Overview">
              <Layers className={`w-5 h-5 ${isActive('/') && location.pathname === '/' ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Overview</span>
            </Link>
          </>
        )}

        {role === 'admin' && (
          <>
            <Link to="/analytics" className={navItemClass('/analytics')} aria-label="Sustainability Analytics">
              <BarChart3 className={`w-5 h-5 ${isActive('/analytics') ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Analytics</span>
            </Link>

            <Link to="/admin" className={navItemClass('/admin')} aria-label="Administrator Overview">
              <ShieldAlert className={`w-5 h-5 ${isActive('/admin') ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Triage</span>
            </Link>

            <Link to="/issues" className={navItemClass('/issues')} aria-label="Campus Issues">
              <AlertCircle className={`w-5 h-5 ${isActive('/issues') ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Issues</span>
            </Link>

            <Link to="/marketplace" className={navItemClass('/marketplace')} aria-label="Marketplace Audit">
              <ShoppingBag className={`w-5 h-5 ${isActive('/marketplace') ? 'stroke-[2.5]' : ''}`} />
              <span className="mt-0.5 truncate">Market</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
