import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, UserIcon, DocumentTextIcon, UsersIcon } from '@heroicons/react/24/outline';
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
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
          <UsersIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Approvals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage leave requests originating from your team</p>
        </div>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">You're all caught up!</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">There are no pending leave requests from your team right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {leaves.map(l => (
            <motion.div 
              key={l.id} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            {l.first_name} {l.last_name}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50 uppercase tracking-wide">
                            Pending
                          </span>
                        </div>
                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
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
                          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            {l.reason}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-3 md:pt-2 w-full md:w-auto ml-14 md:ml-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 pt-4 md:pt-0">
                    <button
                      onClick={() => handleAction(l.id, 'APPROVED')}
                      className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(l.id, 'REJECTED')}
                      className="flex-1 md:flex-none inline-flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Reject
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