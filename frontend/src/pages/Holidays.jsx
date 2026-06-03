import { useEffect, useState } from "react";
import api from "../services/api";

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadHolidays = async () => {
    try {
      const response = await api.get("/holidays");
      setHolidays(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const addHoliday = async (e) => {
    e.preventDefault();

    try {
      await api.post("/holidays", {
        holiday_name: holidayName,
        holiday_date: holidayDate,
      });

      setHolidayName("");
      setHolidayDate("");

      loadHolidays();

      alert("Holiday added successfully");
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to add holiday");
    }
  };

  const updateHoliday = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/holidays/${editingId}`, {
        holiday_name: holidayName,
        holiday_date: holidayDate,
      });

      alert("Holiday updated successfully");

      setEditingId(null);
      setHolidayName("");
      setHolidayDate("");

      loadHolidays();
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to update holiday");
    }
  };

  const deleteHoliday = async (id) => {
    const confirmDelete = window.confirm("Delete this holiday?");

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/holidays/${id}`);

      loadHolidays();

      alert("Holiday deleted successfully");
    } catch (error) {
      console.error(error);

      alert(error.response?.data?.message || "Failed to delete holiday");
    }
  };

  const editHoliday = (holiday) => {
    console.log("Editing holiday:", holiday);

    setEditingId(holiday.id);

    setHolidayName(holiday.holiday_name);

    setHolidayDate(new Date(holiday.holiday_date).toLocaleDateString("en-CA"), // en-CA gives YYYY-MM-DD format
    );
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">Holidays</h1>

      <form
        onSubmit={editingId ? updateHoliday : addHoliday}
        className="mb-6 space-y-3"
      >
        <input
          type="text"
          placeholder="Holiday Name"
          value={holidayName}
          onChange={(e) => setHolidayName(e.target.value)}
          className="border p-2 w-full"
          required
        />

        <input
          type="date"
          value={holidayDate}
          onChange={(e) => setHolidayDate(e.target.value)}
          className="border p-2 w-full"
          required
        />

        <button
          type="submit"
          className="
          bg-green-600
          text-white
          px-4
          py-2
          rounded
          "
        >
          {editingId ? "Update Holiday" : "Add Holiday"}
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Holiday</th>

            <th className="border p-2">Date</th>

            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {holidays.map((holiday) => (
            <tr key={holiday.id}>
              <td className="border p-2">{holiday.holiday_name}</td>
              <td className="border p-2">
                {new Date(holiday.holiday_date).toLocaleDateString()}
              </td>
              <td className="border p-2">
                <button
                  type="button"
                  onClick={() => editHoliday(holiday)}
                  className="
                bg-blue-600
                text-white
                px-3
                py-1
                rounded
                mr-2
                "
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => deleteHoliday(holiday.id)}
                  className="bg-red-600
                  text-white
                  px-3
                  py-1
                  rounded
                  "
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
