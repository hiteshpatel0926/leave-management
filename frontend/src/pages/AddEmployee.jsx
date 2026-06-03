import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AddEmployee() {

  const navigate = useNavigate();

  const [formData, setFormData] =
    useState({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      department: "",
      designation: "",
      joining_date: ""
    });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value
    });

  };

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        await api.post(
          "/employees",
          formData
        );

        alert(
          "Employee created successfully"
        );

        navigate("/employees");

      } catch(error){

        console.error(error);

        alert(
          error.response?.data?.message ||
          "Failed to create employee"
        );

      }

    };

  return (

    <div
      className="
      bg-white
      p-6
      rounded
      shadow
      "
    >

      <h1
        className="
        text-2xl
        font-semibold
        mb-6
        "
      >
        Add Employee
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        <input
          type="text"
          name="designation"
          placeholder="Designation"
          value={formData.designation}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

        <input
          type="date"
          name="joining_date"
          value={formData.joining_date}
          onChange={handleChange}
          className="border p-2 w-full"
          required
        />

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
          Create Employee
        </button>

      </form>

    </div>

  );

}