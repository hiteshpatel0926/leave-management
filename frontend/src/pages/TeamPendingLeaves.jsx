// TeamPendingLeaves.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, UserIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
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
    if (!confirm(`Are you sure?`)) return;
    try {
      await api.put(`/manager/team/leave/${id}`, { status });
      loadLeaves();
    } catch (err) { alert(err.response?.data?.message); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Pending Leaves</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage leave requests from your team</p>
        </div>
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No pending leave requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {leaves.map(l => (
            <div key={l.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition">
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-indigo-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {l.first_name} {l.last_name}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{new Date(l.start_date).toLocaleDateString()} → {new Date(l.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Type:</span> {l.leave_type}
                    </div>
                    {l.reason && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <span className="font-medium">Reason:</span> {l.reason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(l.id, 'APPROVED')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all shadow-sm"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(l.id, 'REJECTED')}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}