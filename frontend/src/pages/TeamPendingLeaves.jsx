import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, UserIcon, DocumentTextIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function TeamPendingLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeaves(); }, []);

  const loadLeaves = async () => {
    try {
      const res = await api.get('/manager/team/pending-leaves');
      setLeaves(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleAction = async (id, status) => {
    if (!confirm(`Are you sure you want to mark this as ${status.toLowerCase()}?`)) return;
    try {
      await api.put(`/manager/team/leave/${id}`, { status });
      loadLeaves();
    } catch (err) { alert(err.response?.data?.message); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="relative">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-indigo-100 animate-ping"></div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
          <UsersIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Team Approvals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage leave requests from your team</p>
        </div>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <DocumentTextIcon className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">You're all caught up!</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">There are no pending leave requests from your team right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {leaves.map(l => (
            <motion.div 
              key={l.id} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {l.first_name} {l.last_name}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 uppercase tracking-wide">
                            <ClockIcon className="h-3 w-3 mr-1" /> Pending
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {l.leave_type} Request
                        </div>
                      </div>
                    </div>

                    <div className="ml-14 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Duration</span>
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-200 font-medium">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {new Date(l.start_date).toLocaleDateString()} → {new Date(l.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {l.reason && (
                        <div className="flex flex-col col-span-1 sm:col-span-2 mt-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Reason provided</span>
                          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            {l.reason}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-3 w-full md:w-auto ml-14 md:ml-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700 pt-4 md:pt-0">
                    <button onClick={() => handleAction(l.id, 'APPROVED')} className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md">
                      <CheckCircleIcon className="h-5 w-5" /> Approve
                    </button>
                    <button onClick={() => handleAction(l.id, 'REJECTED')} className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50 dark:hover:bg-rose-900/40 transition-all">
                      <XCircleIcon className="h-5 w-5" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}