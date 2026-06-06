import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { motion } from "framer-motion";
import { ScaleIcon } from "@heroicons/react/24/outline";

export default function LeaveBalance() {
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      const response = await api.get("/balances/my-balance");
      setBalances(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const columns = ["Leave Type", "Allocated", "Used", "Balance"];

  const data = balances.map((row) => [
    <span className="font-medium text-gray-900 dark:text-white">
      {row.code} - {row.name}
    </span>,
    <span className="text-gray-600 dark:text-gray-400">{row.entitled_days}</span>,
    <span className="text-gray-600 dark:text-gray-400">{row.used_days}</span>,
    <span className="inline-flex font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
      {row.balance_days}
    </span>,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
          <ScaleIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Leave Balance
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Check your total allocated, used, and remaining time off
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <DataTable columns={columns} data={data} />
      </div>
    </motion.div>
  );
}