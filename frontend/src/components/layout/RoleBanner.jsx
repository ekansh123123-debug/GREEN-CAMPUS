import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, User, Wrench } from 'lucide-react';

export default function RoleBanner() {
  const { user, role, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (targetRole) => {
    switchDemoRole(targetRole);
    navigate('/');
  };

  return (
    <aside
      aria-label="Evaluation Persona Switcher"
      className="bg-slate-900 text-slate-200 text-xs py-1.5 px-3 sm:px-4 border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          <span className="font-semibold text-emerald-400 shrink-0">Preview Persona:</span>
          <span className="text-slate-300 font-medium truncate max-w-[180px] sm:max-w-none">
            {user?.name} ({role.toUpperCase()})
          </span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">D. Y. Patil College of Engineering</span>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-0.5 sm:pb-0">
          <span className="text-slate-400 mr-1 hidden lg:inline shrink-0">Switch Role:</span>
          <button
            type="button"
            onClick={() => handleRoleSwitch('student')}
            className={`min-h-[32px] sm:min-h-[26px] px-2.5 py-1 sm:py-0.5 rounded text-[11px] sm:text-xs transition-colors flex items-center gap-1 shrink-0 ${
              role === 'student'
                ? 'bg-emerald-600 text-white font-medium shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:bg-slate-600'
            }`}
          >
            <User className="w-3 h-3 shrink-0" />
            <span>Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('staff')}
            className={`min-h-[32px] sm:min-h-[26px] px-2.5 py-1 sm:py-0.5 rounded text-[11px] sm:text-xs transition-colors flex items-center gap-1 shrink-0 ${
              role === 'staff'
                ? 'bg-amber-600 text-white font-medium shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:bg-slate-600'
            }`}
          >
            <Wrench className="w-3 h-3 shrink-0" />
            <span>Maintenance Staff</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`min-h-[32px] sm:min-h-[26px] px-2.5 py-1 sm:py-0.5 rounded text-[11px] sm:text-xs transition-colors flex items-center gap-1 shrink-0 ${
              role === 'admin'
                ? 'bg-blue-600 text-white font-medium shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:bg-slate-600'
            }`}
          >
            <Shield className="w-3 h-3 shrink-0" />
            <span>Administrator</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
