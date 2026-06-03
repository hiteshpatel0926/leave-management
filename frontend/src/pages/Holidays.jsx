import { useEffect, useState } from "react";
import api from "../services/api";

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");

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

      alert(
        error.response?.data?.message ||
          "Failed to add holiday"
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow">

      <h1 className="text-2xl font-semibold mb-6">
        Holidays
      </h1>

      <form
        onSubmit={addHoliday}
        className="mb-6 space-y-3"
      >
        <input
          type="text"
          placeholder="Holiday Name"
          value={holidayName}
          onChange={(e) =>
            setHolidayName(e.target.value)
          }
          className="border p-2 w-full"
          required
        />

        <input
          type="date"
          value={holidayDate}
          onChange={(e) =>
            setHolidayDate(e.target.value)
          }
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
          Add Holiday
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">
              Holiday
            </th>

            <th className="border p-2">
              Date
            </th>
          </tr>
        </thead>

        <tbody>
          {holidays.map((holiday) => (
            <tr key={holiday.id}>
              <td className="border p-2">
                {holiday.holiday_name}
              </td>

              <td className="border p-2">
                {new Date(
                  holiday.holiday_date
                ).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}