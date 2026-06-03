import { useState } from "react";
import api from "../services/api";

export default function ChangePassword() {

  const [formData, setFormData] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
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

        const response =
          await api.put(
            "/auth/change-password",
            formData
          );

        alert(
          response.data.message
        );

        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

      } catch(error){

        alert(
          error.response?.data?.message
        );

      }

    };

  return (

    <div className="bg-white p-6 rounded shadow">

      <h1 className="text-2xl font-semibold mb-6">
        Change Password
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <input
          type="password"
          name="currentPassword"
          placeholder="Current Password"
          value={formData.currentPassword}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          value={formData.newPassword}
          onChange={handleChange}
          className="border p-2 w-full"
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="border p-2 w-full"
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
          Change Password
        </button>

      </form>

    </div>

  );

}