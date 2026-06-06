import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { motion } from "framer-motion";
import { ScaleIcon, FunnelIcon, ChartBarIcon } from "@heroicons/react/24/outline";

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

  const totals = filteredBalances.reduce((acc, row) => {
    acc.entitled += parseFloat(row.entitled_days) || 0;
    acc.used += parseFloat(row.used_days) || 0;
    acc.balance += parseFloat(row.balance_days) || 0;
    return acc;
  }, { entitled: 0, used: 0, balance: 0 });

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
      <span className="font-bold text-gray-900 dark:text-white">Total</span>,
      <span></span>,
      <span className="font-bold text-gray-900 dark:text-white">{totals.entitled.toFixed(2)}</span>,
      <span className="font-bold text-gray-900 dark:text-white">{totals.used.toFixed(2)}</span>,
      <span className="inline-flex font-bold text-indigo-800 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-lg">{totals.balance.toFixed(2)}</span>,
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
      
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <DataTable columns={columns} data={data} />
      </div>
    </motion.div>
  );
}