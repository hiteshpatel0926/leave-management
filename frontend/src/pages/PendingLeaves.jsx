import { useEffect, useState } from "react";
import api from "../services/api";

export default function PendingLeaves() {

  const [leaves, setLeaves] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {

    try {

      const response =
        await api.get(
          "/leaves/pending"
        );

      setLeaves(
        response.data
      );

    } catch(error){

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

  const approveLeave =
    async (id) => {

      try {

        await api.put(
          `/leaves/${id}/approve`
        );

        loadLeaves();

      } catch(error){

        alert(
          error.response?.data?.message
        );

      }

    };

  const rejectLeave =
    async (id) => {

      try {

        await api.put(
          `/leaves/${id}/reject`
        );

        loadLeaves();

      } catch(error){

        alert(
          error.response?.data?.message
        );

      }

    };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (

    <div className="bg-white p-6 rounded shadow">

      <h1 className="text-2xl font-semibold mb-6">
        Pending Leave Requests
      </h1>

      <table className="w-full border">

        <thead>

          <tr className="bg-gray-100">

            <th className="border p-2">
              Employee
            </th>

            <th className="border p-2">
              Leave Type
            </th>

            <th className="border p-2">
              From
            </th>

            <th className="border p-2">
              To
            </th>

            <th className="border p-2">
              Days
            </th>

            <th className="border p-2">
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {leaves.map((leave) => (

            <tr key={leave.id}>

              <td className="border p-2">
                {leave.first_name}
                {" "}
                {leave.last_name}
              </td>

              <td className="border p-2">
                {leave.leave_type}
              </td>

              <td className="border p-2">
                {new Date(
                  leave.start_date
                ).toLocaleDateString()}
              </td>

              <td className="border p-2">
                {new Date(
                  leave.end_date
                ).toLocaleDateString()}
              </td>

              <td className="border p-2">
                {leave.total_days}
              </td>

              <td className="border p-2">

                <button
                  onClick={() =>
                    approveLeave(
                      leave.id
                    )
                  }
                  className="
                  bg-green-600
                  text-white
                  px-3
                  py-1
                  rounded
                  mr-2
                  "
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    rejectLeave(
                      leave.id
                    )
                  }
                  className="
                  bg-red-600
                  text-white
                  px-3
                  py-1
                  rounded
                  "
                >
                  Reject
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );

}