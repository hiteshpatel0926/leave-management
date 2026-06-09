import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { motion } from "framer-motion";
import { ScaleIcon, FunnelIcon, ChartBarIcon, CalendarIcon } from "@heroicons/react/24/outline";

export default function LeaveBalance() {
  const [allBalances, setAllBalances] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      const response = await api.get("/balances/my-balance");
      setAllBalances(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const years = [...new Set(allBalances.map(b => b.year))].sort((a, b) => b - a);

  const filteredBalances = selectedYear === "all"
    ? allBalances
    : allBalances.filter(b => b.year === parseInt(selectedYear));

  // Leave codes that count toward active balance (PL, CO)
  const activeBalanceCodes = ['PL', 'CO'];
  const activeBalances = filteredBalances.filter(b => activeBalanceCodes.includes(b.code));

  const activeTotals = activeBalances.reduce((acc, row) => {
    acc.entitled += parseFloat(row.entitled_days) || 0;
    acc.used += parseFloat(row.used_days) || 0;
    acc.balance += parseFloat(row.balance_days) || 0;
    return acc;
  }, { entitled: 0, used: 0, balance: 0 });

  // Totals for all leave types (for the table footer)
  const allTotals = filteredBalances.reduce((acc, row) => {
    acc.entitled += parseFloat(row.entitled_days) || 0;
    acc.used += parseFloat(row.used_days) || 0;
    acc.balance += parseFloat(row.balance_days) || 0;
    return acc;
  }, { entitled: 0, used: 0, balance: 0 });

  // Additional entitlements (ML, PTL, BL, etc.) – these are not summed
  const additionalLeaveCodes = ['ML', 'PTL', 'BL'];
  const additionalEntitlements = filteredBalances.filter(b => additionalLeaveCodes.includes(b.code));

  const columns = ["Leave Type", "Year", "Allocated", "Used", "Balance"];

  const data = filteredBalances.map((row) => [
    <span className="font-semibold text-gray-900 dark:text-white">{row.code} - {row.name}</span>,
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{row.year}</span>,
    <span className="text-gray-600 dark:text-gray-400">{row.entitled_days}</span>,
    <span className="text-gray-600 dark:text-gray-400">{row.used_days}</span>,
    <span className="inline-flex font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">{row.balance_days}</span>,
  ]);

  if (filteredBalances.length > 0) {
    data.push([
      <span className="font-bold text-gray-900 dark:text-white">Total (All Types)</span>,
      <span></span>,
      <span className="font-bold text-gray-900 dark:text-white">{allTotals.entitled.toFixed(2)}</span>,
      <span className="font-bold text-gray-900 dark:text-white">{allTotals.used.toFixed(2)}</span>,
      <span className="inline-flex font-bold text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-lg">{allTotals.balance.toFixed(2)}</span>,
    ]);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-indigo-100 animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
            <ScaleIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">My Leave Balance</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Check your total allocated, used, and remaining time off</p>
          </div>
        </div>
        {years.length > 0 && (
          <div className="relative">
            <FunnelIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="pl-10 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer shadow-sm">
              <option value="all">All Years</option>
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Active Balance Card (PL + CO) */}
      {activeBalances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-5 shadow-sm border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Allocated (PL + CO)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activeTotals.entitled.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">days available for this year</p>
              </div>
              <div className="bg-blue-200 dark:bg-blue-800/50 p-3 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-5 shadow-sm border border-orange-200 dark:border-orange-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Used (PL + CO)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activeTotals.used.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">taken so far</p>
              </div>
              <div className="bg-orange-200 dark:bg-orange-800/50 p-3 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-orange-700 dark:text-orange-300" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-5 shadow-sm border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Remaining (PL + CO)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activeTotals.balance.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">available to take</p>
              </div>
              <div className="bg-emerald-200 dark:bg-emerald-800/50 p-3 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leave Balances Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <DataTable columns={columns} data={data} />
      </div>

      {/* Additional Entitlements Card (ML, PTL, BL) */}
      {additionalEntitlements.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" />
              Other Leave Entitlements
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">One‑time or event‑based leaves – not included in your active balance</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {additionalEntitlements.map((leave) => (
                <div key={leave.code} className="border-l-4 border-indigo-400 pl-4 py-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{leave.name} ({leave.code})</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{leave.entitled_days} days</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {leave.used_days > 0 ? `${leave.used_days} used` : 'Not used yet'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}