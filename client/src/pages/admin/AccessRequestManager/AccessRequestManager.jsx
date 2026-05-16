import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  Search, 
  Mail, 
  Phone, 
  Loader2,
  AlertCircle,
  GraduationCap,
  Trash2
} from 'lucide-react';
import api from '../../../services/api';
import socket from '../../../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

const AccessRequestManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();

    // Listen for real-time updates
    const handleNewRequest = (newRequest) => {
      setRequests(prev => [newRequest, ...prev]);
    };

    const handleUpdatedRequest = (updatedRequest) => {
      setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    };

    const handleDeletedRequest = (deletedId) => {
      setRequests(prev => prev.filter(r => r.id !== deletedId));
    };

    socket.on('NEW_ACCESS_REQUEST', handleNewRequest);
    socket.on('ACCESS_REQUEST_UPDATED', handleUpdatedRequest);
    socket.on('ACCESS_REQUEST_DELETED', handleDeletedRequest);

    return () => {
      socket.off('NEW_ACCESS_REQUEST', handleNewRequest);
      socket.off('ACCESS_REQUEST_UPDATED', handleUpdatedRequest);
      socket.off('ACCESS_REQUEST_DELETED', handleDeletedRequest);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/auth/access-requests');
      setRequests(res.data);
    } catch (err) {
      setError('Failed to fetch requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      await api.post(`/auth/access-requests/${id}/action`, { action });
      // Note: We don't strictly need to update local state manually here 
      // because the socket will emit the update back to us.
      // But keeping it for immediate UI feedback.
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request permanently?')) return;
    setProcessingId(id);
    try {
      await api.delete(`/auth/access-requests/${id}`);
      // Socket will handle the removal, but immediate feedback is nice
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => filter === 'ALL' ? true : r.status === filter);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen font-['Inter'] text-white bg-[#09090b]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Access Requests</h1>
          <p className="text-zinc-500 text-sm">Review and manage entrance requests from prospective teachers and students.</p>
        </div>
        
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === t ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
          <p className="text-zinc-500 font-medium">Synchronizing requests...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-red-500/5 border border-red-500/10 rounded-3xl">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-red-400 font-bold">{error}</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-32 text-center bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col items-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
            <Search size={32} className="text-zinc-700" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Requests Found</h3>
          <p className="text-zinc-500 max-w-xs">There are no {filter.toLowerCase()} access requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredRequests.map(request => (
              <motion.div
                layout
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-white/5 rounded-3xl p-6 lg:p-8 hover:border-white/10 transition-all group"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 ${request.role === 2 ? 'bg-violet-500/10 text-violet-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {request.role === 2 ? <Users size={28} /> : <GraduationCap size={28} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{request.full_name}</h3>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mt-1">
                        <span>{request.role === 2 ? 'Teacher' : 'Student'}</span>
                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                        <span>{request.department}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusStyle(request.status)}`}>
                      {request.status}
                    </span>
                    <button 
                      onClick={() => handleDelete(request.id)}
                      disabled={processingId === request.id}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Request"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400">
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Email Address</p>
                      <p className="text-xs font-medium truncate">{request.email}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-400">
                      <Phone size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Phone Number</p>
                      <p className="text-xs font-medium truncate">{request.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 text-zinc-600 text-xs font-medium">
                    <Clock size={14} />
                    Requested on {new Date(request.createdAt).toLocaleDateString()}
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleAction(request.id, 'REJECT')}
                        disabled={processingId === request.id}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleAction(request.id, 'APPROVE')}
                        disabled={processingId === request.id}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
                      >
                        {processingId === request.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                        Approve & Email
                      </button>
                    </div>
                  )}
                  
                  {request.status !== 'PENDING' && (
                    <div className="text-xs text-zinc-500 font-bold flex items-center gap-2">
                      {request.status === 'APPROVED' ? <Check size={14} className="text-emerald-500" /> : <X size={14} className="text-red-500" />}
                      Processed by Admin
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AccessRequestManager;
