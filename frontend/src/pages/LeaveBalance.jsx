import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";

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

  // Define columns for DataTable
  const columns = ["Leave Type", "Allocated", "Used", "Balance"];

  // Transform balances into rows for DataTable
  const data = balances.map((row) => [
    `${row.code} - ${row.name}`,
    row.entitled_days,
    row.used_days,
    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
      {row.balance_days}
    </span>,
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        My Leave Balance
      </h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}