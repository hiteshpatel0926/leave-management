import { useEffect, useState } from "react";
import api from "../services/api";

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaves();
  }, []);

  const cancelLeave = async (leaveId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this leave?",
    );

    if (!confirmCancel) {
      return;
    }

    try {
      await api.put(`/leaves/${leaveId}/cancel`);

      alert("Leave cancelled successfully");

      loadLeaves();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to cancel leave");
    }
  };

  const loadLeaves = async () => {
    try {
      const response = await api.get("/leaves/my");

      setLeaves(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">My Leave Requests</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Leave Type</th>

            <th className="border p-2">Start Date</th>

            <th className="border p-2">End Date</th>

            <th className="border p-2">Days</th>

            <th className="border p-2">Status</th>

            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id}>
              <td className="border p-2">{leave.leave_type}</td>

              <td className="border p-2">
                {new Date(leave.start_date).toLocaleDateString()}
              </td>

              <td className="border p-2">
                {new Date(leave.end_date).toLocaleDateString()}
              </td>

              <td className="border p-2">{leave.total_days}</td>

              <td className="border p-2">
                <span
                  className={`
                    px-2 py-1 rounded
                    ${getStatusClass(leave.status)}
                  `}
                >
                  {leave.status}
                </span>
              </td>
              <td className="border p-2">
                {leave.status === "PENDING" && (
                  <button
                    onClick={() => cancelLeave(leave.id)}
                    className="
                    bg-red-600
                    text-white
                    px-3
                    py-1
                    rounded
                    "
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
