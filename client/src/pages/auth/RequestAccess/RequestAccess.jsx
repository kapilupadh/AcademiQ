import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  Mail, 
  User, 
  Phone, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  Send
} from 'lucide-react';
import api from '../../../services/api';
import { Link } from 'react-router-dom';

const RequestAccess = () => {
  const [role, setRole] = useState(3); // 3: Student, 2: Teacher
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'BCA'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/access-request', {
        ...formData,
        role
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: '01', title: 'Submit your info', desc: 'Fill in your name, email & department' },
    { id: '02', title: 'Admin reviews', desc: 'Admin approves & generates your ID' },
    { id: '03', title: 'Get credentials', desc: 'Your ID & password arrive by email' },
    { id: '04', title: 'Activate & login', desc: 'Set your password at /register' }
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 font-['Inter']">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#111] border border-white/10 rounded-2xl p-8 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Request Submitted!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Thank you, <span className="text-white font-medium">{formData.full_name}</span>. 
            Your request for <span className="text-white font-medium">{role === 3 ? 'Student' : 'Teacher'}</span> access has been sent to the Admin. 
            Please keep an eye on your email <span className="text-white font-medium">{formData.email}</span> for your login credentials.
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all"
          >
            Back to Login <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col lg:flex-row font-['Inter'] overflow-hidden">
      {/* Left Section - Branding & Info */}
      <div className="lg:w-1/2 p-12 lg:p-24 flex flex-col justify-between relative z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(50,50,50,0.1)_0%,transparent_50%)] pointer-events-none" />
        
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-6xl lg:text-7xl font-bold mb-8 tracking-tighter leading-[0.9] mt-8">
              Request <br />
              <span className="text-zinc-500 italic">Access.</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md mb-12 leading-relaxed">
              Don't have an account yet? Submit your details — the admin will review and email you a unique ID + temporary password to get started.
            </p>

            <div className="space-y-6">
              {steps.map((step, idx) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <span className="text-xs font-mono bg-white/5 border border-white/10 px-2 py-1 rounded text-zinc-500 group-hover:text-white transition-colors">
                    {step.id}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm mb-1">{step.title}</h4>
                    <p className="text-xs text-zinc-500">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="text-xs text-zinc-600 mt-12">
          &copy; 2026 System. All rights reserved.
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="lg:w-1/2 bg-[#111] lg:m-6 lg:rounded-[2.5rem] border border-white/5 p-8 lg:p-16 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-[#161616] border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl relative z-10"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-2">Apply for Entry</h2>
            <p className="text-zinc-500 text-sm">Fill in your details to send a request to the admin</p>
          </div>

          <div className="flex p-1.5 bg-black/50 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setRole(2)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === 2 ? 'bg-[#222] text-white shadow-xl border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <GraduationCap size={18} /> Teacher
            </button>
            <button 
              onClick={() => setRole(3)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === 3 ? 'bg-[#222] text-white shadow-xl border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Users size={18} /> Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="Your full name"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input 
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                />
              </div>
              <p className="text-[10px] text-zinc-600 italic ml-1">Your credentials will be sent to this email — make sure it's correct!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <input 
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <input 
                    type="text"
                    disabled
                    value="BCA"
                    className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm opacity-50 cursor-not-allowed"
                  />
                </div>
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
                  Submit Request <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
            
            <div className="text-center pt-2">
              <p className="text-xs text-zinc-500">
                Already have credentials? <Link to="/login" className="text-white font-bold hover:underline">Sign in</Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default RequestAccess;
