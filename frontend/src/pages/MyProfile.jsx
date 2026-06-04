import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";

export default function MyProfile() {

  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {

      const response =
        await api.get("/profile/me");

      setProfile(response.data);

    } catch (error) {

      console.error(error);

    }
  };

  if (!profile) {
    return <p>Loading...</p>;
  }

  return (
    <div className="bg-white p-6 rounded shadow">

      <h1
        className="
        text-2xl
        font-semibold
        mb-6
        "
      >
        My Profile
      </h1>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="font-semibold">
            Employee Code
          </label>

          <p>{profile.employee_code}</p>
        </div>

        <div>
          <label className="font-semibold">
            Full Name
          </label>

          <p>
            {profile.first_name}
            {" "}
            {profile.last_name}
          </p>
        </div>

        <div>
          <label className="font-semibold">
            Email
          </label>

          <p>{profile.email}</p>
        </div>

        <div>
          <label className="font-semibold">
            Gender
          </label>

          <p>{profile.gender}</p>
        </div>

        <div>
          <label className="font-semibold">
            Date of Birth
          </label>

          <p>
            {
              profile.dob
                ? new Date(
                    profile.dob
                  ).toLocaleDateString()
                : "-"
            }
          </p>
        </div>

        <div>
          <label className="font-semibold">
            Department
          </label>

          <p>{profile.department}</p>
        </div>

        <div>
          <label className="font-semibold">
            Designation
          </label>

          <p>{profile.designation}</p>
        </div>

        <div>
          <label className="font-semibold">
            Joining Date
          </label>

          <p>
            {new Date(
              profile.joining_date
            ).toLocaleDateString()}
          </p>
        </div>

        <div>
          <label className="font-semibold">
            Role
          </label>

          <p>{profile.role}</p>
        </div>

        <div>
          <label className="font-semibold">
            Status
          </label>

          <span
            className={
              profile.status === "ACTIVE"
                ? "bg-green-100 text-green-700 px-2 py-1 rounded"
                : "bg-red-100 text-red-700 px-2 py-1 rounded"
            }
          >
            {profile.status}
          </span>
        </div>

      </div>

    </div>
  );
}