import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FunnelIcon, 
  UserGroupIcon, 
  ChartBarSquareIcon, 
  CalendarDaysIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { getImageUrl } from '../utils/imageHelper';
import { useToast } from "../context/ToastContext";

export default function TeamLeaveBalances() {
  const { showToast } = useToast();
  const [teamMembers, setTeamMembers] = useState([]);
  const [allBalances, setAllBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, []);

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
    showToast("Failed to load team leave balances", "error");
  } finally { 
    setLoading(false); 
  }
};

  const years = useMemo(() => [...new Set(allBalances.map(b => b.year))].sort((a, b) => b - a), [allBalances]);

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
          profile_picture: b.profile_picture,
          employee_code: b.employee_code,
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
  
  const derivedMembers = [...new Map(allBalances.map(b => [b.id, { 
    id: b.id, 
    first_name: b.first_name, 
    last_name: b.last_name, 
    designation: '',
    profile_picture: b.profile_picture,
    employee_code: b.employee_code
  }])).values()];
  
  const memberList = teamMembers.length > 0 ? teamMembers : derivedMembers;
  
  const filteredMembers = memberList.filter(member => {
    if (selectedEmployeeId !== 'all' && member.id !== parseInt(selectedEmployeeId)) return false;
    if (searchTerm) {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const code = (member.employee_code || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return fullName.includes(term) || code.includes(term);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary-100 animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto px-4 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-2xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
            <ChartBarSquareIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Team Leave Balances
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              View leave entitlements, usage, and balances by team member
            </p>
          </div>
        </div>
        
        {/* Team Member Count Badge */}
        <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700">
          <UserGroupIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-300">{memberList.length} team members</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px]">
            <UserGroupIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select 
              value={selectedEmployeeId} 
              onChange={(e) => setSelectedEmployeeId(e.target.value)} 
              className="pl-10 pr-8 py-2 text-sm rounded-card border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
            >
              <option value="all">All Employees</option>
              {memberList.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          
          <div className="relative min-w-[130px]">
            <FunnelIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              className="pl-10 pr-8 py-2 text-sm rounded-card border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
            >
              <option value="all">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-sm rounded-card border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {filteredMembers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-card shadow-card border border-gray-100 dark:border-gray-700 p-12 text-center">
              <UserGroupIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No employees match your filters.</p>
            </div>
          ) : (
            filteredMembers.map(employee => {
              const empData = groupedData.find(g => g.id === employee.id);
              const balancesList = empData ? empData.balances : [];
              const hasBalances = balancesList.length > 0;
              const profilePicUrl = employee.profile_picture ? getImageUrl(employee.profile_picture) : null;

              const totals = balancesList.reduce((acc, b) => {
                acc.entitled += b.entitled; acc.used += b.used; acc.balance += b.balance; return acc;
              }, { entitled: 0, used: 0, balance: 0 });

              return (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-card shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-card-hover"
                >
                  {/* Employee Header */}
                  <div className="px-6 py-4 bg-gray-50/60 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                        {profilePicUrl ? (
                          <img src={profilePicUrl} alt="" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span class="text-white text-sm font-medium">${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}</span>`; }} />
                        ) : (
                          <span className="text-white text-sm font-medium">{employee.first_name?.[0]}{employee.last_name?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {employee.first_name} {employee.last_name}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          {employee.employee_code && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{employee.employee_code}</span>
                          )}
                          {employee.designation && (
                            <>
                              <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{employee.designation}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {balancesList.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                        <CheckBadgeIcon className="h-3.5 w-3.5 text-primary-500" />
                        <span>{balancesList.length} leave type{balancesList.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Balances Table */}
                  {!hasBalances ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <CalendarDaysIcon className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>No leave balance records</p>
                      <p className="text-xs mt-1">{selectedYear !== 'all' ? `for year ${selectedYear}` : 'found'}.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Type</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Year</th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Entitled</th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Used</th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {balancesList.map((bal, idx) => (
                            <tr key={`${bal.leave_type}-${bal.year}-${idx}`} className="hover:bg-gray-50/40 dark:hover:bg-gray-700/20 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{bal.leave_type}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
                                  {bal.year}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">{bal.entitled.toFixed(1)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">{bal.used.toFixed(1)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right">
                                <span className={bal.balance < 0 ? 'text-rose-600 dark:text-rose-400' : bal.balance === 0 ? 'text-gray-500' : 'text-primary-600 dark:text-primary-400'}>
                                  {bal.balance.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        {balancesList.length > 1 && (
                          <tfoot className="bg-gray-50/30 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-700">
                            <tr>
                              <td colSpan="2" className="px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300">Total</td>
                              <td className="px-6 py-3.5 text-sm font-semibold text-right text-gray-900 dark:text-white">{totals.entitled.toFixed(1)}</td>
                              <td className="px-6 py-3.5 text-sm font-semibold text-right text-gray-900 dark:text-white">{totals.used.toFixed(1)}</td>
                              <td className="px-6 py-3.5 text-sm font-bold text-right">
                                <span className={totals.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-primary-600 dark:text-primary-400'}>
                                  {totals.balance.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}