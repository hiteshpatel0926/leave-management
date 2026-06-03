import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (search.trim() === "") {
      loadEmployees();
    } else {
      const timeout = setTimeout(() => {
        searchEmployees();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [search]);

  const loadEmployees = async () => {
    try {
      const response = await api.get("/employees");

      setEmployees(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const searchEmployees = async () => {
    try {
      const response = await api.get(`/employees/search?search=${search}`);

      setEmployees(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteEmployee = async (id) => {
    const confirmDelete = window.confirm("Deactivate employee?");

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/employees/${id}`);

      loadEmployees();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between mb-6">
        <h1
          className="
    text-2xl
    font-semibold
    "
        >
          Employees
        </h1>

        <button
          onClick={() => navigate("/employees/new")}
          className="
    bg-green-600
    text-white
    px-4
    py-2
    rounded
    "
        >
          Add Employee
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
    border
    p-2
    w-full
    "
        />
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Code</th>

            <th className="border p-2">Name</th>

            <th className="border p-2">Email</th>

            <th className="border p-2">Department</th>

            <th className="border p-2">Designation</th>

            <th className="border p-2">Status</th>

            <th className="border p-2">Joining Date</th>

            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td className="border p-2">{emp.employee_code}</td>

              <td className="border p-2">
                {emp.first_name} {emp.last_name}
              </td>

              <td className="border p-2">{emp.email}</td>

              <td className="border p-2">{emp.department}</td>

              <td className="border p-2">{emp.designation}</td>

              <td className="border p-2">
                <span
                  className={
                    emp.status === "ACTIVE"
                      ? "bg-green-100 text-green-700 px-2 py-1 rounded"
                      : "bg-red-100 text-red-700 px-2 py-1 rounded"
                  }
                >
                  {emp.status}
                </span>
              </td>

              <td className="border p-2">
                {new Date(emp.joining_date).toLocaleDateString()}
              </td>

              <td className="border p-2">
                <button
                  className="
                      bg-blue-600
                      text-white
                      px-3
                      py-1
                      rounded
                      mr-2
                      "
                  onClick={() => navigate(`/employees/edit/${emp.id}`)}
                >
                  Edit
                </button>

                <button
                  className="
            bg-red-600
            text-white
            px-3
            py-1
            rounded
            "
                  onClick={() => deleteEmployee(emp.id)}
                >
                  Deactivate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
