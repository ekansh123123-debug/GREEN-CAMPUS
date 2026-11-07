import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { INSTITUTIONAL_EMAIL_DOMAIN } from '../../lib/constants';
import { Leaf, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Artificial Intelligence & Data Science');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    
    // TC-09 Institutional Email Validation
    if (!email.trim() || !email.toLowerCase().endsWith(INSTITUTIONAL_EMAIL_DOMAIN)) {
      errs.email = `Registration requires an official institutional email ending with ${INSTITUTIONAL_EMAIL_DOMAIN}`;
    }

    if (!studentId.trim()) errs.studentId = 'Student or Staff ID is required.';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        student_id: studentId.trim(),
        department,
        password,
      });

      setRegisteredSuccess(true);
      setTimeout(() => {
        login(res.user, res.access_token);
        navigate('/');
      }, 1500);
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-campus-700 text-white flex items-center justify-center mx-auto shadow-md">
            <Leaf className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
            Create Campus Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            D. Y. Patil College of Engineering, Akurdi, Pune
          </p>
        </div>

        {registeredSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Registration successful! Redirecting to student dashboard...</span>
          </div>
        )}

        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <FormField label="Full Name" id="reg-name" required error={errors.name}>
            <input
              type="text"
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Aarav Sharma"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>

          <FormField
            label="Institutional Email"
            id="reg-email"
            required
            error={errors.email}
            helperText={`Must end in ${INSTITUTIONAL_EMAIL_DOMAIN}`}
          >
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@dypcoeakurdi.ac.in"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="PRN / Roll Number" id="reg-id" required error={errors.studentId}>
              <input
                type="text"
                id="reg-id"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="DYP-2023-AIDS-042"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
              />
            </FormField>

            <FormField label="Department" id="reg-dept" required>
              <select
                id="reg-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="Artificial Intelligence & Data Science">AI & DS</option>
                <option value="Computer Engineering">Computer Engg</option>
                <option value="Information Technology">IT</option>
                <option value="Mechanical Engineering">Mechanical</option>
                <option value="Civil Engineering">Civil</option>
                <option value="Electronics & Telecommunication">E&TC</option>
              </select>
            </FormField>
          </div>

          <FormField label="Password (Min 8 chars)" id="reg-pass" required error={errors.password}>
            <input
              type="password"
              id="reg-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>

          <FormField
            label="Confirm Password"
            id="reg-pass-confirm"
            required
            error={errors.confirmPassword}
          >
            <input
              type="password"
              id="reg-pass-confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={UserPlus}
            className="w-full mt-2"
          >
            Register Institutional Account
          </Button>

          <div className="text-center pt-2 text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-campus-700 hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
