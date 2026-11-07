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
      className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 border-b border-slate-800"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">Preview Persona:</span>
          <span className="text-slate-300">
            {user?.name} ({role.toUpperCase()})
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">D. Y. Patil College of Engineering</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1 hidden md:inline">Switch Role:</span>
          <button
            type="button"
            onClick={() => handleRoleSwitch('student')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              role === 'student'
                ? 'bg-emerald-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <User className="w-3 h-3" />
            Student
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('staff')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              role === 'staff'
                ? 'bg-amber-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Wrench className="w-3 h-3" />
            Maintenance Staff
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              role === 'admin'
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Shield className="w-3 h-3" />
            Administrator
          </button>
        </div>
      </div>
    </aside>
  );
}
