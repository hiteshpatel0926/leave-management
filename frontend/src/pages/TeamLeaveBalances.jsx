// TeamLeaveBalances.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FunnelIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function TeamLeaveBalances() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [allBalances, setAllBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamRes, balancesRes] = await Promise.all([
        api.get('/manager/team'),
        api.get('/manager/team/leave-balances'),
      ]);
      setTeamMembers(teamRes.data);
      setAllBalances(balancesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const years = [...new Set(allBalances.map(b => b.year))].sort((a, b) => b - a);

  const getFilteredBalances = () => {
    let filtered = allBalances;
    if (selectedEmployeeId !== 'all') {
      filtered = filtered.filter(b => b.id === parseInt(selectedEmployeeId));
    }
    if (selectedYear !== 'all') {
      filtered = filtered.filter(b => b.year === parseInt(selectedYear));
    }
    return filtered;
  };

  const groupByEmployee = (balances) => {
    const empMap = new Map();
    balances.forEach(b => {
      const empId = b.id;
      if (!empMap.has(empId)) {
        empMap.set(empId, {
          id: empId,
          name: `${b.first_name} ${b.last_name}`,
          balances: []
        });
      }
      empMap.get(empId).balances.push({
        leave_type: b.leave_type,
        year: b.year,
        entitled: parseFloat(b.entitled_days),
        used: parseFloat(b.used_days),
        balance: parseFloat(b.balance_days),
      });
    });
    for (let emp of empMap.values()) {
      emp.balances.sort((a, b) => b.year - a.year);
    }
    return Array.from(empMap.values());
  };

  const filteredBalances = getFilteredBalances();
  const groupedData = groupByEmployee(filteredBalances);

  // Prefer teamMembers list; fall back to employees derived from balances data
  const derivedMembers = [...new Map(
    allBalances.map(b => [b.id, { id: b.id, first_name: b.first_name, last_name: b.last_name, designation: '' }])
  ).values()];
  const memberList = teamMembers.length > 0 ? teamMembers : derivedMembers;

  const employeesToDisplay = selectedEmployeeId === 'all'
    ? memberList
    : memberList.filter(m => m.id === parseInt(selectedEmployeeId));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Leave Balances</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View leave entitlements and usage by team member</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="pl-10 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Employees</option>
              {memberList.map(m => (
                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="pl-10 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Years</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {employeesToDisplay.map(employee => {
        const empData = groupedData.find(g => g.id === employee.id);
        const balancesList = empData ? empData.balances : [];
        const hasBalances = balancesList.length > 0;

        const totals = balancesList.reduce((acc, b) => {
          acc.entitled += b.entitled;
          acc.used += b.used;
          acc.balance += b.balance;
          return acc;
        }, { entitled: 0, used: 0, balance: 0 });

        return (
          <div key={employee.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{employee.designation}</p>
            </div>
            {!hasBalances ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No leave balance records {selectedYear !== 'all' ? `for year ${selectedYear}` : ''}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entitled</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {balancesList.map((bal, idx) => (
                      <tr key={`${bal.leave_type}-${bal.year}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{bal.leave_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {bal.year}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{bal.entitled.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{bal.used.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                          <span className={
                            bal.balance < 0 ? 'text-red-600' :
                            bal.balance === 0 ? 'text-gray-500' : 'text-green-600'
                          }>
                            {bal.balance.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {balancesList.length > 1 && (
                    <tfoot className="bg-gray-50 dark:bg-gray-800/30">
                      <tr>
                        <td colSpan="2" className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Totals</td>
                        <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900 dark:text-white">{totals.entitled.toFixed(1)}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900 dark:text-white">{totals.used.toFixed(1)}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-right">
                          <span className={totals.balance < 0 ? 'text-red-600' : totals.balance === 0 ? 'text-gray-500' : 'text-green-600'}>
                            {totals.balance.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}