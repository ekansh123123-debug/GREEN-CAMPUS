import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { DEMO_USERS } from '../../data/mockData';
import { Leaf, LogIn, Shield, User, Wrench, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('aarav.sharma@dypcoeakurdi.ac.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      login(res.user, res.access_token);
      if (res.user.role === 'staff') {
        navigate('/staff');
      } else if (res.user.role === 'admin') {
        navigate('/analytics');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (userObj) => {
    login(userObj, `jwt-${userObj.role}-${Date.now()}`);
    if (userObj.role === 'staff') {
      navigate('/staff');
    } else if (userObj.role === 'admin') {
      navigate('/analytics');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-campus-700 text-white flex items-center justify-center mx-auto shadow-md">
            <Leaf className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
            Sign in to GREEN CAMPUS
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            D. Y. Patil College of Engineering, Akurdi, Pune
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <FormField
            label="Institutional Email (@dypcoeakurdi.ac.in)"
            id="login-email"
            required
            helperText="Only verified college domain accounts permitted."
          >
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>

          <FormField label="Password" id="login-password" required>
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>

          <Button type="submit" variant="primary" loading={loading} icon={LogIn} className="w-full mt-2">
            Sign In
          </Button>

          <div className="text-center pt-2 text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-campus-700 hover:underline">
              Register here
            </Link>
          </div>
        </form>

        {/* 1-Click Persona Demo Selector for Evaluators */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
          <p className="font-semibold text-slate-700 mb-2 text-center">
            Demo Evaluator: Instant Sign-In
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoSelect(DEMO_USERS.student)}
              className="p-2 rounded border border-slate-200 bg-white hover:border-campus-400 hover:bg-campus-50/50 text-left transition-all"
            >
              <div className="font-semibold text-slate-900 flex items-center gap-1">
                <User className="w-3 h-3 text-campus-700" /> Student
              </div>
              <div className="text-[10px] text-slate-500">Aarav Sharma</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoSelect(DEMO_USERS.staff)}
              className="p-2 rounded border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/50 text-left transition-all"
            >
              <div className="font-semibold text-slate-900 flex items-center gap-1">
                <Wrench className="w-3 h-3 text-amber-700" /> Staff
              </div>
              <div className="text-[10px] text-slate-500">Rajesh Kulkarni</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoSelect(DEMO_USERS.admin)}
              className="p-2 rounded border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all"
            >
              <div className="font-semibold text-slate-900 flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-700" /> Admin
              </div>
              <div className="text-[10px] text-slate-500">Dr. Suresh Patil</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
