import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function EditEmployee() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    loadEmployee();
  }, []);

  const loadEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`);

      setFormData({
        first_name: response.data.first_name,

        last_name: response.data.last_name,

        department: response.data.department,

        designation: response.data.designation,

        status: response.data.status,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/employees/${id}`, formData);

      alert("Employee updated successfully");

      navigate("/employees");
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl mb-6">Edit Employee</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          type="text"
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="ACTIVE">ACTIVE</option>

          <option value="INACTIVE">INACTIVE</option>
        </select>

        <button
          type="submit"
          className="
          bg-blue-600
          text-white
          px-4
          py-2
          rounded
          "
        >
          Update Employee
        </button>
      </form>
    </div>
  );
}
