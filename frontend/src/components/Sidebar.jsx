import {
  Link
} from "react-router-dom";

export default function Sidebar() {

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  const isAdmin = user?.role === "ADMIN";

  return (

    <div
      className="
      w-64
      bg-gray-900
      text-white
      min-h-screen
      p-4
      "
    >

      <h2
        className="
        text-xl
        font-bold
        mb-6
        "
      >
        LMS
      </h2>

      <nav className="space-y-2">

        <Link
          to="/dashboard"
          className="block"
        >
          Dashboard
        </Link>

        <Link
          to="/apply-leave"
          className="block"
        >
          Apply Leave
        </Link>

        <Link
          to="/my-leaves"
          className="block"
        >
          My Leaves
        </Link>

        {isAdmin && (
          <>
            <Link
              to="/employees"
              className="block"
            >
              Employees
            </Link>

            <Link
              to="/pending-leaves"
              className="block"
            >
              Pending Leaves
            </Link>

            <Link
              to="/leave-balance"
              className="block"
            >
              Leave Balance
            </Link>
          </>
        )}

      </nav>

    </div>
  );
}