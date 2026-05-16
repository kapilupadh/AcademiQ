import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(3); // 1: Admin, 2: Teacher, 3: Student
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    login_id: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', {
        login_id: formData.login_id,
        password: formData.password,
        expected_role: role
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Route based on role
      if (role === 1) navigate('/admin/dashboard');
      else if (role === 2) navigate('/teacher/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (r) => {
    switch(r) {
      case 1: return <ShieldCheck size={18} />;
      case 2: return <Users size={18} />;
      default: return <GraduationCap size={18} />;
    }
  };

  const getRoleLabel = (r) => {
    switch(r) {
      case 1: return 'Admin';
      case 2: return 'Teacher';
      default: return 'Student';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-['Inter'] relative overflow-hidden p-6">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,50,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-white/5 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative z-10"
      >
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome back</h2>
          <p className="text-zinc-500 text-sm">Select your role and sign in to continue</p>
        </div>

        {/* Role Switcher */}
        <div className="flex p-1.5 bg-black/50 rounded-2xl mb-8 border border-white/5">
          {[3, 2, 1].map((r) => (
            <button 
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[10px] font-bold transition-all ${role === r ? 'bg-[#222] text-white shadow-xl border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {getRoleIcon(r)}
              {getRoleLabel(r)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
              {getRoleLabel(role)} ID
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type="text"
                required
                placeholder={role === 1 ? 'ADMIN-ID' : role === 2 ? 'TCH-2024-001' : 'STD-2024-001'}
                value={formData.login_id}
                onChange={e => setFormData({...formData, login_id: e.target.value})}
                className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 font-mono"
              />
            </div>
            <p className="text-[10px] text-zinc-600 italic ml-1">
              {role === 1 ? 'Use your system admin ID' : 'Your unique ID was sent to your email by the admin.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <Link 
                to="/forgot-password" 
                className="text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium"
            >
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all group shadow-lg shadow-emerald-500/10"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          <div className="text-center pt-2">
            <p className="text-xs text-zinc-500">
              First time here? <Link to="/request-access" className="text-white font-bold hover:underline">Request access</Link>
            </p>
          </div>
        </form>

        <div className="text-[10px] text-zinc-700 text-center mt-12 uppercase tracking-widest font-bold">
          &copy; 2026 System
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
